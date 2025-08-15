"""
TCP Socket Server for receiving and uploading exam images directly to Supabase.
"""
import asyncio
import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv


# --- Configuration ---
# Load environment variables to connect to Supabase
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment!")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
HOST = '127.0.0.1'
PORT = 8001

# --- Core Image Handling Logic ---
def handle_image_upload(exam_id: str, file_ext: str, image_bytes: bytes):
    """
    Handles the actual upload process to Supabase Storage and the database.
    This is a synchronous version of the logic from your FastAPI route.
    """
    print(f"Received image for exam_id: {exam_id}, size: {len(image_bytes)} bytes")
    try:
        # 1. Validate UUID
        try:
            uuid.UUID(exam_id)
        except ValueError:
            print(f"Error: Invalid UUID format for exam_id: {exam_id}")
            return False

        # 2. Verify exam exists
        exam_check = supabase.table("exams").select("id").eq("id", exam_id).execute()
        if not exam_check.data:
            print(f"Error: Exam with id {exam_id} not found.")
            return False

        # 3. Generate a unique filename and path
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        storage_file_path = f"{exam_id}/{unique_filename}"

        # 4. Upload to Supabase Storage
        print(f"Uploading to storage at path: {storage_file_path}")
        storage_response = supabase.storage.from_("exam-images").upload(
            storage_file_path, image_bytes
        )

        if storage_response.status_code != 200:
            print(f"Error uploading to storage: {storage_response.text}")
            return False
        
        print("Successfully uploaded to storage.")

        # 5. Save the record in the database
        db_insert = supabase.table("exam_images").insert({
            "exam_id": exam_id,
            "image_path": storage_file_path
        }).execute()

        if not db_insert.data:
            print(f"Error saving to database: {getattr(db_insert, 'error', 'No data returned')}")
            return False

        print(f"Successfully saved database record: {db_insert.data[0]['id']}")
        return True

    except Exception as e:
        print(f"An unexpected error occurred during upload: {e}")
        return False

# --- Async TCP Server Logic ---
async def handle_connection(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    """
    Callback function to handle each client connection.
    """
    addr = writer.get_extra_info('peername')
    print(f"Received connection from {addr}")

    try:
        # Protocol:
        # 1. Read Exam ID (36 bytes, UUID string)
        exam_id_bytes = await reader.readexactly(36)
        exam_id = exam_id_bytes.decode('utf-8')

        # 2. Read file extension (10 bytes, padded with spaces)
        file_ext_bytes = await reader.readexactly(10)
        file_ext = file_ext_bytes.decode('utf-8').strip()

        # 3. Read image size (8 bytes, 64-bit integer)
        size_bytes = await reader.readexactly(8)
        image_size = int.from_bytes(size_bytes, 'big')

        # 4. Read the image data
        image_bytes = await reader.readexactly(image_size)
        
        # Process the upload in a separate thread to avoid blocking the event loop
        loop = asyncio.get_running_loop()
        success = await loop.run_in_executor(
            None, handle_image_upload, exam_id, file_ext, image_bytes
        )

        # 5. Send response back to client
        if success:
            writer.write(b"SUCCESS")
        else:
            writer.write(b"FAILURE")
        await writer.drain()

    except asyncio.IncompleteReadError:
        print(f"Connection from {addr} closed unexpectedly or sent malformed data.")
    except Exception as e:
        print(f"An error occurred with connection {addr}: {e}")
    finally:
        print(f"Closing connection with {addr}")
        writer.close()
        await writer.wait_closed()

async def start_server():
    """
    Starts the asyncio TCP server.
    """
    server = await asyncio.start_server(handle_connection, HOST, PORT)
    print(f"TCP server started, listening on {HOST}:{PORT}")
    async with server:
        await server.serve_forever()

if __name__ == '__main__':
    # This allows running the server standalone for testing
    asyncio.run(start_server())

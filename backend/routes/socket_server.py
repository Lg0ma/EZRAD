# app.py
import asyncio
import struct
from io import BytesIO
import os
from uuid import uuid4
from fastapi import FastAPI, UploadFile, APIRouter
from supabase import create_client
from dotenv import load_dotenv


# ----------------
# FASTAPI APP
# ----------------
router = APIRouter()
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# Shared function to store image
def process_received_image(exam_id: str, file_obj: BytesIO):
    filename = f"{uuid4()}.jpg"
    supabase.storage.from_("exam-images").upload(filename, file_obj.getvalue())
    supabase.table("exam_images").insert({
        "exam_id": exam_id,
        "image_path": filename
    }).execute()
    print(f"✅ Image saved for exam {exam_id} as {filename}")


# HTTP endpoint for browser / API uploads
@router.post("/upload-image/")
async def upload_image(exam_id: str, file: UploadFile):
    file_bytes = await file.read()
    process_received_image(exam_id, BytesIO(file_bytes))
    return {"status": "success"}


# ----------------
# ASYNC TCP SOCKET SERVER
# ----------------
async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    try:
        # Read exam_id length and exam_id
        exam_id_len_data = await reader.readexactly(4)
        exam_id_len = struct.unpack('!I', exam_id_len_data)[0]
        exam_id = (await reader.readexactly(exam_id_len)).decode()

        # Read image size and data
        img_size_data = await reader.readexactly(4)
        img_size = struct.unpack('!I', img_size_data)[0]
        img_data = await reader.readexactly(img_size)

        # Process image
        process_received_image(exam_id, BytesIO(img_data))

        # Respond to client
        writer.write(b"OK")
        await writer.drain()

    except Exception as e:
        print(f"❌ Error handling client: {e}")
    finally:
        writer.close()
        await writer.wait_closed()


async def start_socket_server(host="0.0.0.0", port=5001):
    server = await asyncio.start_server(handle_client, host, port)
    print(f"📡 Socket server running on {host}:{port}")
    async with server:
        await server.serve_forever()


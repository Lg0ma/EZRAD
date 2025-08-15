"""
TCP client to send an image to the socket_server.
"""
import socket
import os
import sys

# --- Configuration ---
HOST = '127.0.0.1'
PORT = 8001

def send_image(exam_id: str, file_path: str):
    """
    Connects to the TCP server and sends the image with its metadata.
    """
    # 1. Validate inputs
    if not os.path.exists(file_path):
        print(f"Error: File not found at '{file_path}'")
        return

    try:
        # 2. Create a socket and connect
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((HOST, PORT))
            print(f"Connected to server at {HOST}:{PORT}")

            # 3. Prepare data according to the protocol
            # a. Exam ID (must be 36 bytes)
            exam_id_bytes = exam_id.encode('utf-8')
            if len(exam_id_bytes) != 36:
                raise ValueError("Exam ID must be a valid UUID string of 36 characters.")

            # b. File extension (padded to 10 bytes)
            file_ext = os.path.splitext(file_path)[1]
            file_ext_bytes = file_ext.ljust(10).encode('utf-8')

            # c. Image data and its size
            with open(file_path, 'rb') as f:
                image_bytes = f.read()
            image_size_bytes = len(image_bytes).to_bytes(8, 'big')

            # 4. Send all data in order
            print(f"Sending Exam ID: {exam_id}")
            s.sendall(exam_id_bytes)
            
            print(f"Sending File Extension: {file_ext}")
            s.sendall(file_ext_bytes)

            print(f"Sending Image Size: {len(image_bytes)} bytes")
            s.sendall(image_size_bytes)
            
            print("Sending Image Data...")
            s.sendall(image_bytes)
            
            print("Data sent successfully.")

            # 5. Wait for a response
            response = s.recv(1024)
            print(f"Server response: {response.decode('utf-8')}")

    except ConnectionRefusedError:
        print("Connection failed. Is the server running?")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    # --- How to run this script ---
    # python tcp_client.py <your_exam_id> <path_to_your_image>
    # python -u "c:\Users\luisg\Downloads\TCPClient.py" "58c19e87-6b60-4c1a-beb9-d60ed3861b4b" "C:\Users\luisg\Downloads\Screenshot 2025-08-04 152403.png"
    # Example: python tcp_client.py 58c19e87-6b60-4c1a-beb9-d60ed3861b4b /path/to/image.png

    if len(sys.argv) != 3:
        print("Usage: python tcp_client.py <exam_id> <file_path>")
        sys.exit(1)
        
    exam_id_arg = sys.argv[1]
    file_path_arg = sys.argv[2]
    
    send_image(exam_id_arg, file_path_arg)

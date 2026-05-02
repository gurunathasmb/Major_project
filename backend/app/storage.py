import os
import uuid
import mimetypes
from dotenv import load_dotenv

load_dotenv()

# ==================================================
# CONFIG
# ==================================================
# STORAGE_MODE can be "local", "s3", or "auto" (tries s3, falls back to local)
STORAGE_MODE = os.getenv("STORAGE_MODE", "auto")

# Remove trailing slash if present
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000").rstrip("/")

LOCAL_STORAGE_DIR = "local_storage"

# S3 Config
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
S3_PUBLIC_URL_BASE = os.getenv("S3_PUBLIC_URL_BASE")

import time

# ==================================================
# MAIN UPLOAD FUNCTION
# ==================================================
def upload_bytes(
    file_bytes: bytes,
    folder: str,
    ext: str,
    content_type: str = None,
    original_name: str = None
):
    """
    Save file to cloud with fallback to local if no internet/credentials.

    Returns:
        Full accessible URL
    """
    start_time = time.time()
    print(f"DEBUG: Starting upload to {folder}...")
    
    if STORAGE_MODE in ["s3", "auto"]:
        try:
            url = _upload_to_s3(file_bytes, folder, ext, content_type, original_name)
            duration = round(time.time() - start_time, 2)
            print(f"DEBUG: Cloud upload to {folder} finished in {duration}s")
            return url
        except Exception as e:
            if STORAGE_MODE == "s3":
                raise e
            print(f"S3 Upload failed: {str(e)}. Falling back to local storage.")

    url = _save_local(file_bytes, folder, ext, original_name)
    duration = round(time.time() - start_time, 2)
    print(f"DEBUG: Local save to {folder} finished in {duration}s")
    return url


_s3_client_cache = None

def _get_s3_client():
    global _s3_client_cache
    if _s3_client_cache is not None:
        return _s3_client_cache

    import boto3
    from botocore.config import Config
    
    if not all([S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]):
        return None

    # Configure for Supabase S3 compatibility
    config = Config(
        region_name=S3_REGION,
        retries={'max_attempts': 3, 'mode': 'standard'},
        connect_timeout=10,
        read_timeout=30,
        s3={'addressing_style': 'path'}
    )

    _s3_client_cache = boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT_URL if S3_ENDPOINT_URL else None,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        config=config
    )
    return _s3_client_cache

# ==================================================
# S3 CLOUD STORAGE
# ==================================================
def _upload_to_s3(file_bytes, folder, ext, content_type, original_name):
    from botocore.exceptions import NoCredentialsError, ClientError

    s3_client = _get_s3_client()
    if not s3_client:
        raise ValueError("S3 credentials are not fully set in the environment.")

    # Generate unique filename
    unique_id = uuid.uuid4().hex
    if original_name:
        base_name = os.path.splitext(original_name)[0].replace(" ", "_")
        filename = f"{base_name}_{unique_id}.{ext}"
    else:
        filename = f"{unique_id}.{ext}"

    s3_key = f"{folder}/{filename}"
    
    if not content_type:
        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            content_type = "application/octet-stream"

    # Upload to S3
    s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type
    )
    
    # Build URL
    if S3_PUBLIC_URL_BASE:
        # e.g., Supabase: https://[ref].supabase.co/storage/v1/object/public
        return f"{S3_PUBLIC_URL_BASE.rstrip('/')}/{S3_BUCKET_NAME}/{s3_key}"
    elif S3_ENDPOINT_URL:
        return f"{S3_ENDPOINT_URL.rstrip('/')}/{S3_BUCKET_NAME}/{s3_key}"
    else:
        return f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{s3_key}"

# ==================================================
# LOCAL STORAGE
# ==================================================
def _save_local(file_bytes, folder, ext, original_name):
    # Create directory
    save_dir = os.path.join(LOCAL_STORAGE_DIR, folder)
    os.makedirs(save_dir, exist_ok=True)

    # Generate unique filename
    unique_id = uuid.uuid4().hex

    if original_name:
        base_name = os.path.splitext(original_name)[0]
        base_name = base_name.replace(" ", "_")  # clean spaces
        filename = f"{base_name}_{unique_id}.{ext}"
    else:
        filename = f"{unique_id}.{ext}"

    file_path = os.path.join(save_dir, filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Build URL (IMPORTANT)
    return f"{BASE_URL}/local_storage/{folder}/{filename}"
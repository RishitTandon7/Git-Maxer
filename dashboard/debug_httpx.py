import sys
import os
import httpx
import inspect
from dotenv import load_dotenv

load_dotenv('.env.local')

print(f"Python Executable: {sys.executable}")
print(f"HTTPX File: {httpx.__file__}")
print(f"HTTPX Version: {httpx.__version__}")
print(f"Client Signature: {inspect.signature(httpx.Client)}")

try:
    c = httpx.Client(proxy="http://test")
    print("SUCCESS: httpx.Client(proxy='...') worked.")
except Exception as e:
    print(f"FAIL: httpx.Client(proxy='...') raised {type(e).__name__}: {e}")

# Check Env Vars
print("\n--- Env Vars ---")
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
has_service_key = bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
has_gemini = bool(os.getenv("GEMINI_API_KEY"))
has_github = bool(os.getenv("GITHUB_ACCESS_TOKEN") or os.getenv("GITHUB_TOKEN"))

print(f"SUPABASE_URL: {supabase_url}")
print(f"Has Service Key: {has_service_key}")
print(f"Has Gemini Key: {has_gemini}")
print(f"Has Github Token: {has_github}")

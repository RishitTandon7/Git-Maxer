import time
import sys
import os
from http.server import BaseHTTPRequestHandler

# Add current dir to path
sys.path.append(os.getcwd())

# Mock request handler helper
class MockRequest:
    def makefile(self, *args, **kwargs):
        return sys.stdout

class MockServer:
    def __init__(self):
        self.wfile = sys.stdout

def run_bot_loop():
    print("🤖 GitMaxer Bot Started locally...")
    print("Press Ctrl+C to stop.")
    
    try:
        from api.cron import handler
    except ImportError as e:
        print(f"Error importing api.cron: {e}")
        print("Make sure you are running this from the 'dashboard' directory.")
        return

    while True:
        print(f"\n[Cron Check] {time.strftime('%Y-%m-%d %H:%M:%S')}")
        try:
            # Instantiate handler with mocks
            # BaseHTTPRequestHandler(request, client_address, server)
            # We mock these to avoid actual network socket requirement
            h = handler(MockRequest(), ('0.0.0.0', 8080), MockServer())
            
            # The handler automatically calls do_GET? No, BaseHTTPRequestHandler calls it in __init__?
            # actually BaseHTTPRequestHandler process the request in __init__ -> handle -> handle_one_request -> do_GET
            # But api/cron.py defines `class handler(BaseHTTPRequestHandler): def do_GET(self):`
            # If we init it, it might hang waiting for request if we don't mock carefully.
            
            # Simpler approach: Just instantiate and call do_GET manually if we subclass differently 
            # or just bypass BaseHTTPRequestHandler init if possible.
            # But api.cron.handler inherits BaseHTTPRequestHandler.
            
            # Let's try to call `do_GET` directly on an uninitialized or partially initialized object
            # This is hacky but effective for serverless function reuse loops.
            
            h.wfile = sys.stdout # Capture output
            h.do_GET()
            
        except Exception as e:
            print(f"Wrapper Error: {e}")
            # If __init__ failed, we might need a better mock.
        
        print("\nSleeping for 15 minutes...")
        time.sleep(15 * 60) # 15 min

# Better Mock approach to avoid BaseHandler internal logic issues
# We will dynamically create a class that bypasses init if needed, or just mock the server properly.
# Actually, since Vercel handlers are often just `def handler(request):`, but `cron.py` uses `BaseHTTPRequestHandler`
# It implies it expects to be run as a server.
# Let's write a small script that actually serves it on localhost:3001 and triggers it via curl loop? 
# Or just run the logic.

if __name__ == "__main__":
    # We need to hack the handler to be callable without a socket
    # Re-import to patch
    from api import cron
    
    class LocalRunner:
        def __init__(self):
            self.wfile = WFileWrapper()
        
        def send_response(self, code):
            print(f"Response Code: {code}")
            
        def end_headers(self):
            pass

    class WFileWrapper:
        def write(self, data):
            if isinstance(data, bytes):
                print(data.decode('utf-8'))
            else:
                print(data)

    # Patch the handler to use our LocalRunner methods instead of BaseHTTPRequestHandler
    # This is safer than mocking socket
    cron.handler.send_response = LocalRunner.send_response
    cron.handler.end_headers = LocalRunner.end_headers
    
    # Run loop
    runner = LocalRunner()
    
    print("🤖 GitMaxer Local Bot Runner v2.0")
    print("Logic: Default 11 PM IST start")
    
    while True:
        print(f"\n--- Cron Job Start: {time.strftime('%H:%M:%S')} ---")
        try:
            # Create instance without calling super().__init__ (which requires socket)
            h = cron.handler.__new__(cron.handler) 
            h.wfile = runner.wfile
            h.do_GET()
        except Exception as e:
            print(f"Execution Error: {e}")
            
        print("--- Job Finished. Waiting 15m ---")
        time.sleep(900)

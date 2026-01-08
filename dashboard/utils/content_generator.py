import google.generativeai as genai
import random
import os
from datetime import datetime

# ============================================
# MULTI-API-KEY & MULTI-MODEL ROTATION SYSTEM
# ============================================

# List of ACTUAL available Gemini models (verified from user's API)
# Ordered by: Speed → Quality → Fallback
GEMINI_MODELS = [
    'gemini-2.5-flash-lite',      # Fastest (10 RPM, 250K TPM) ⚡
    'gemini-2.5-flash',           # Fast & quality (5 RPM, 250K TPM)
    'gemini-3-flash',             # Latest gen 3 (5 RPM, 250K TPM)
    'gemini-2.5-flash-its',       # Multi-modal (3 RPM, 10K TPM)
    'gemma-3-4b',                 # Open model fallback (30 RPM)
    'gemma-3-2b',                 # Lighter fallback (30 RPM)
]

# Realistic project templates for each language
PROJECT_TEMPLATES = {
    'python': [
        {'name': 'web_server', 'prompt': 'Create a complete Flask/FastAPI web server with multiple routes, error handling, and middleware'},
        {'name': 'calculator_gui', 'prompt': 'Build a GUI calculator using Tkinter with advanced functions like sqrt, power, memory'},
        {'name': 'data_analyzer', 'prompt': 'Create a data analysis script using pandas to process CSV files with charts'},
        {'name': 'api_client', 'prompt': 'Build a REST API client with requests library, including authentication and error handling'},
        {'name': 'file_organizer', 'prompt': 'Create a file organizer that sorts files by type/date with progress bar'},
        {'name': 'web_scraper', 'prompt': 'Build a web scraper using BeautifulSoup with pagination and data export'},
        {'name': 'cli_tool', 'prompt': 'Create a CLI tool using argparse with multiple subcommands and colored output'},
        {'name': 'database_manager', 'prompt': 'Build a SQLite database manager with CRUD operations and migrations'},
    ],
    'javascript': [
        {'name': 'todo_app', 'prompt': 'Create a todo list app with localStorage, filters, and animations'},
        {'name': 'weather_widget', 'prompt': 'Build a weather widget fetching from API with geolocation'},
        {'name': 'markdown_parser', 'prompt': 'Create a markdown to HTML parser with syntax highlighting'},
        {'name': 'chat_client', 'prompt': 'Build a real-time chat client using WebSocket'},
        {'name': 'image_gallery', 'prompt': 'Create an image gallery with lightbox, filters, and lazy loading'},
        {'name': 'form_validator', 'prompt': 'Build a comprehensive form validation library with custom rules'},
    ],
    'typescript': [
        {'name': 'api_wrapper', 'prompt': 'Create a typed API wrapper with generics and error handling'},
        {'name': 'state_manager', 'prompt': 'Build a state management library similar to Redux'},
        {'name': 'validation_lib', 'prompt': 'Create a validation library with TypeScript decorators'},
        {'name': 'router', 'prompt': 'Build a client-side router with typed route params'},
    ],
    'java': [
        {'name': 'StudentManagement', 'prompt': 'Create a student management system with CRUD operations'},
        {'name': 'LibrarySystem', 'prompt': 'Build a library management system with book tracking'},
        {'name': 'RestClient', 'prompt': 'Create a REST client using HttpClient with connection pooling'},
        {'name': 'FileProcessor', 'prompt': 'Build a multi-threaded file processor with progress tracking'},
    ],
    'go': [
        {'name': 'http_server', 'prompt': 'Create an HTTP server with middleware, routing, and graceful shutdown'},
        {'name': 'cli_app', 'prompt': 'Build a CLI application using cobra with subcommands'},
        {'name': 'worker_pool', 'prompt': 'Create a worker pool for concurrent task processing'},
        {'name': 'cache_service', 'prompt': 'Build an in-memory cache with TTL and eviction policies'},
    ],
    'rust': [
        {'name': 'file_watcher', 'prompt': 'Create a file watcher with async processing'},
        {'name': 'http_client', 'prompt': 'Build an HTTP client with connection pooling using reqwest'},
        {'name': 'json_parser', 'prompt': 'Create a JSON parser with error handling using serde'},
        {'name': 'cli_tool', 'prompt': 'Build a CLI tool using clap with progress bars'},
    ],
}

# Rotation state (persists across function calls using module-level variables)
_api_key_index = 0
_model_index = 0

def get_api_keys():
    """Get all configured Gemini API keys from environment."""
    keys = []
    
    # Primary key
    if os.environ.get("GEMINI_API_KEY"):
        keys.append(os.environ["GEMINI_API_KEY"])
    
    # Additional keys (GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.)
    for i in range(2, 11):  # Support up to 10 keys
        key = os.environ.get(f"GEMINI_API_KEY_{i}")
        if key:
            keys.append(key)
    
    return keys if keys else None

def get_next_api_key_and_model():
    """
    Rotate through API keys and models in round-robin fashion.
    Returns: (api_key, model_name)
    """
    global _api_key_index, _model_index
    
    api_keys = get_api_keys()
    if not api_keys:
        return None, None
    
    # Get current API key
    api_key = api_keys[_api_key_index % len(api_keys)]
    
    # Get current model
    model_name = GEMINI_MODELS[_model_index % len(GEMINI_MODELS)]
    
    # Rotate for next call: cycle through models first, then API keys
    _model_index += 1
    if _model_index >= len(GEMINI_MODELS):
        _model_index = 0
        _api_key_index += 1
        if _api_key_index >= len(api_keys):
            _api_key_index = 0
    
    return api_key, model_name

def get_project_filename_and_prompt(language):
    """
    Get a realistic project filename and enhanced prompt for the language.
    Returns: (filename, enhanced_prompt)
    """
    # Get templates for this language or use generic
    templates = PROJECT_TEMPLATES.get(language.lower(), [])
    
    if not templates:
        # Generic template for unsupported languages
        templates = [
            {'name': 'app', 'prompt': f'Create a useful application in {language}'},
            {'name': 'utility', 'prompt': f'Build a utility tool in {language}'},
        ]
    
    # Pick a random template
    template = random.choice(templates)
    
    return template['name'], template['prompt']

def get_random_content(api_key=None, language='any', retry_count=0):
    """
    Generate REALISTIC project code using Gemini with automatic fallback.
    
    Args:
        api_key: Specific API key (optional, will auto-rotate if None)
        language: Programming language
        retry_count: Internal retry counter
    """
    
    # If no specific key provided, use rotation system
    if not api_key:
        api_key, model_name = get_next_api_key_and_model()
    else:
        # Use first available model if specific key is provided
        model_name = GEMINI_MODELS[0]
    
    if not api_key:
        return "Error: No GEMINI_API_KEY found. Set GEMINI_API_KEY or GEMINI_API_KEY_2, etc."
    
    # Maximum retry attempts across all keys/models
    max_retries = len(get_api_keys() or [1]) * len(GEMINI_MODELS)
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        
        # Determine actual language
        if language == 'any':
            language = get_random_language()
        
        # Get realistic project name and enhanced prompt
        project_name, project_prompt = get_project_filename_and_prompt(language)
        
        # Enhanced prompt for realistic code
        prompt = (
            f"{project_prompt}. "
            f"Requirements:\n"
            f"1. Write PRODUCTION-QUALITY code, not a basic example\n"
            f"2. Include proper error handling, logging, and documentation\n"
            f"3. Add comments explaining the logic\n"
            f"4. Make it a COMPLETE, working implementation (100+ lines if needed)\n"
            f"5. Use best practices and design patterns for {language}\n"
            f"6. Include main/entry point that demonstrates usage\n"
            f"7. NO markdown formatting - just raw code\n"
            f"8. Make it look like a real project file from an experienced developer\n"
        )
        
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        # Clean markdown formatting
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content
        if content.endswith("```"):
            content = content.rsplit("\n", 1)[0]
        
        # Remove language identifier line if present
        if content.startswith(language.lower()):
            content = "\n".join(content.split("\n")[1:])
        
        return content.strip()
    
    except Exception as e:
        error_msg = str(e)
        
        # Check if we should retry with different API key/model
        if retry_count < max_retries:
            # Specific error handling
            if "404" in error_msg or "not found" in error_msg.lower():
                print(f"⚠️ Model {model_name} not available, trying next...")
            elif "429" in error_msg or "quota" in error_msg.lower():
                print(f"⚠️ API key quota exceeded, rotating to next key...")
            elif "403" in error_msg or "permission" in error_msg.lower():
                print(f"⚠️ API key invalid, trying next...")
            else:
                print(f"⚠️ Error with {model_name}: {error_msg[:100]}")
            
            # Retry with next API key/model combination
            return get_random_content(api_key=None, language=language, retry_count=retry_count + 1)
        
        # All retries exhausted
        return f"Error: All API keys/models failed. Last error: {error_msg}"

def get_extension(language):
    """Returns the file extension for a given language."""
    extensions = {
        'python': 'py',
        'javascript': 'js',
        'typescript': 'ts',
        'java': 'java',
        'cpp': 'cpp',
        'c++': 'cpp',
        'go': 'go',
        'rust': 'rs',
        'ruby': 'rb',
        'swift': 'swift',
        'kotlin': 'kt',
        'php': 'php',
        'html': 'html',
        'css': 'css',
        'sql': 'sql',
        'shell': 'sh',
        'bash': 'sh',
    }
    return extensions.get(language.lower(), 'txt')

def get_realistic_filename(language):
    """
    Get a realistic project filename instead of daily_contribution_*.ext
    Returns: filename without extension
    """
    project_name, _ = get_project_filename_and_prompt(language)
    return project_name

def get_random_language():
    """Returns a random language key from the supported list."""
    languages = [
        'python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust',
        'ruby', 'swift', 'kotlin', 'php', 'html', 'css', 'sql', 'bash'
    ]
    return random.choice(languages)

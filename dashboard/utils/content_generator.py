import google.generativeai as genai
import random
import os

# ============================================
# MULTI-API-KEY & MULTI-MODEL ROTATION SYSTEM
# ============================================

# List of all available Gemini models (in preference order)
GEMINI_MODELS = [
    'gemini-2.0-flash-exp',       # Latest experimental (fastest)
    'gemini-1.5-flash-latest',    # Latest stable flash
    'gemini-1.5-pro-latest',      # Most capable
    'gemini-1.5-flash',            # Fallback
    'gemini-pro',                  # Legacy fallback
]

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

def get_random_content(api_key=None, language='any', retry_count=0):
    """
    Generate code using Gemini with automatic fallback across multiple APIs and models.
    
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
        
        prompt_language = language if language != 'any' else "a RANDOM supported programming language"
        
        prompt = (
            f"Generate a unique, interesting, and medium-level code snippet in {prompt_language}. "
            "Do not repeat common examples like 'Hello World'. "
            "Include a comment at the top stating the language and what the code does. "
            "Provide ONLY the code, no markdown formatting."
        )
        
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        # Clean markdown formatting
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
        if content.endswith("```"):
            content = content.rsplit("\n", 1)[0]
        
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

def get_random_language():
    """Returns a random language key from the supported list."""
    languages = [
        'python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust',
        'ruby', 'swift', 'kotlin', 'php', 'html', 'css', 'sql', 'bash'
    ]
    return random.choice(languages)

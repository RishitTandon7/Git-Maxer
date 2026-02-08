import google.generativeai as genai
import random
import os
from datetime import datetime

# ============================================
# MULTI-API-KEY & MULTI-MODEL ROTATION SYSTEM
# ============================================

# List of ACTUAL available Gemini models (verified working as of 2024)
# Ordered by: Speed → Quality → Fallback
GEMINI_MODELS = [
    'gemini-2.0-flash',           # Latest stable flash model ⚡
    'gemini-2.0-flash-lite',      # Lightweight version
    'gemini-1.5-flash-latest',    # Stable latest flash
    'gemini-1.5-flash-8b',        # 8B parameter version (faster)
    'gemini-1.5-pro-latest',      # Pro model fallback (better quality)
    'gemini-1.0-pro',             # Original pro model (reliable fallback)
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

def generate_creative_idea(language, api_key, model_name):
    """
    Generate a COMPLETELY NEW creative learning idea each time.
    No fixed templates - fully AI-generated topics!
    """
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    
    idea_prompt = (
        f"Generate ONE creative, educational coding tutorial idea for {language}. "
        f"Give me:\n"
        f"1. A short, descriptive filename (2-3 words, snake_case, no extension)\n"
        f"2. A one-line description of what to build\n"
        f"\n"
        f"Requirements:\n"
        f"- Must be a LEARNING example (tutorial-style, educational)\n"
        f"- Should teach a useful concept or technique\n"
        f"- Examples: 'simple_http_server' (Create HTTP server basics), 'responsive_webpage' (Build responsive layout)\n"
        f"- Make it DIFFERENT from common examples\n"
        f"- Be creative and practical\n"
        f"\n"
        f"Format your response EXACTLY as:\n"
        f"FILENAME: your_filename_here\n"
        f"DESCRIPTION: Your description here\n"
    )
    
    try:
        response = model.generate_content(idea_prompt)
        text = response.text.strip()
        
        # Parse the response
        filename = None
        description = None
        
        for line in text.split('\n'):
            if line.startswith('FILENAME:'):
                filename = line.replace('FILENAME:', '').strip()
            elif line.startswith('DESCRIPTION:'):
                description = line.replace('DESCRIPTION:', '').strip()
        
        if filename and description:
            return filename, description
        
        # Fallback if parsing failed
        return f"{language}_tutorial", f"Learn {language} programming concepts"
        
    except Exception as e:
        # Fallback idea
        ideas = [
            ("web_server_basics", "Create a simple web server"),
            ("data_processing", "Process and analyze data"),
            ("api_integration", "Integrate with external APIs"),
            ("file_operations", "Work with files and directories"),
            ("async_patterns", "Learn asynchronous programming"),
        ]
        return random.choice(ideas)

def get_random_content(api_key=None, language='any', retry_count=0):
    """
    Generate EDUCATIONAL code with COMPLETELY NEW IDEAS each time.
    No fixed templates - AI generates fresh topics!
    
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
        # Determine actual language
        if language == 'any':
            language = get_random_language()
        
        # Generate a COMPLETELY NEW creative idea
        filename_idea, description = generate_creative_idea(language, api_key, model_name)
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        
        # Enhanced prompt for educational code
        prompt = (
            f"Create an EDUCATIONAL code tutorial for: {description}\n"
            f"Language: {language}\n"
            f"\n"
            f"Requirements:\n"
            f"1. Write CLEAR, WELL-COMMENTED code that teaches concepts\n"
            f"2. Include comments explaining WHAT and WHY (educational style)\n"
            f"3. Add a header comment explaining the learning objective\n"
            f"4. Make it 80-150 lines (complete but not overwhelming)\n"
            f"5. Use best practices and modern {language} features\n"
            f"6. Include example usage at the end\n"
            f"7. Focus on ONE concept and teach it well\n"
            f"8. NO markdown formatting - just raw code with comments\n"
            f"9. Make it practical and immediately useful for learning\n"
            f"\n"
            f"Write code that a beginner could learn from!"
        )
        
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        # Clean markdown formatting
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:]) if len(lines) > 1 else content
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
    Get a creative filename - now generated fresh each time!
    This will be called but returns a placeholder since we generate in get_random_content
    """
    # Generate a random educational filename
    topics = [
        "tutorial", "example", "guide", "demo", "basics", 
        "advanced", "patterns", "concepts", "learning"
    ]
    return f"{language}_{random.choice(topics)}"

def get_random_language():
    """Returns a random language key from the supported list."""
    languages = [
        'python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust',
        'ruby', 'swift', 'kotlin', 'php', 'html', 'css', 'sql', 'bash'
    ]
    return random.choice(languages)

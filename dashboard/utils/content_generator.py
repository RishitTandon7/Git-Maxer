import google.generativeai as genai
import random

def get_random_content(api_key, language='any'):
    """Returns a random code snippet in user defined language using Gemini API."""
    
    if not api_key:
        return "Error: GEMINI_API_KEY not found."
        
    try:
        genai.configure(api_key=api_key)
        # Use updated model name
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt_language = language if language != 'any' else "a RANDOM supported programming language"

        prompt = (
            f"Generate a unique, interesting, and medium-level code snippet in {prompt_language}. "
            "Do not repeat common examples like 'Hello World'. "
            "Include a comment at the top stating the language and what the code does. "
            "Provide ONLY the code, no markdown formatting."
        )
        
        response = model.generate_content(prompt)
        
        content = response.text.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
        if content.endswith("```"):
            content = content.rsplit("\n", 1)[0]
            
        return content.strip()
        
    except Exception as e:
        return f"Error generating content: {str(e)}"

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
        # 'any' logic handled outside or fallback
    }
    return extensions.get(language.lower(), 'txt')

def get_random_language():
    """Returns a random language key from the supported list."""
    # List of keys from get_extension map, excluding synonyms if desired, but keys are fine
    languages = [
        'python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust',
        'ruby', 'swift', 'kotlin', 'php', 'html', 'css', 'sql', 'bash'
    ]
    return random.choice(languages)

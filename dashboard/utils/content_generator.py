import google.generativeai as genai
import random

def get_random_content(api_key):
    """Returns a random code snippet in ANY language using Gemini API."""
    
    if not api_key:
        return "Error: GEMINI_API_KEY not found."
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        # Broader prompt for any language and uniqueness
        prompt = (
            "Generate a unique, interesting, and medium-level code snippet in a RANDOM programming language "
            "(e.g., Python, Rust, Go, JavaScript, C++, Swift, Kotlin, etc.). "
            "Do not repeat common examples like 'Hello World'. "
            "Include a comment at the top stating the language and what the code does. "
            "Provide ONLY the code, no markdown formatting."
        )
        
        response = model.generate_content(prompt)
        
        # Clean up potential markdown code blocks
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
        'any': 'txt'
    }
    return extensions.get(language.lower(), 'txt')

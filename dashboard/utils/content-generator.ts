const pythonSnippets = [
    'def calculate_sum(a, b):\n    return a + b',
    'class DataProcessor:\n    def __init__(self):\n        self.data = []',
    'import numpy as np\n\ndef process_array(arr):\n    return np.mean(arr)',
    'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)'
]

const javascriptSnippets = [
    'function greet(name) {\n  return `Hello, ${name}!`;\n}',
    'const fetchData = async (url) => {\n  const response = await fetch(url);\n  return response.json();\n};',
    'class User {\n  constructor(name) {\n    this.name = name;\n  }\n}',
    'const sum = (a, b) => a + b;'
]

const javaSnippets = [
    'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}',
    'public int add(int a, int b) {\n    return a + b;\n}',
    'public class Calculator {\n    private int result;\n}'
]

const cppSnippets = [
    '#include <iostream>\nint main() {\n    std::cout << "Hello";\n    return 0;\n}',
    'int add(int a, int b) {\n    return a + b;\n}',
    'class Rectangle {\nprivate:\n    int width, height;\n};'
]

const languageMap: Record<string, { snippets: string[], ext: string }> = {
    'python': { snippets: pythonSnippets, ext: 'py' },
    'javascript': { snippets: javascriptSnippets, ext: 'js' },
    'typescript': { snippets: javascriptSnippets, ext: 'ts' },
    'java': { snippets: javaSnippets, ext: 'java' },
    'cpp': { snippets: cppSnippets, ext: 'cpp' },
    'c++': { snippets: cppSnippets, ext: 'cpp' },
}

export function getRandomContent(language: string = 'any'): string {
    const normalizedLang = language.toLowerCase()

    if (normalizedLang === 'any' || !languageMap[normalizedLang]) {
        const allSnippets = Object.values(languageMap).flatMap(l => l.snippets)
        return allSnippets[Math.floor(Math.random() * allSnippets.length)]
    }

    const snippets = languageMap[normalizedLang].snippets
    return snippets[Math.floor(Math.random() * snippets.length)]
}

export function getExtension(language: string = 'any'): string {
    const normalizedLang = language.toLowerCase()

    if (normalizedLang === 'any' || !languageMap[normalizedLang]) {
        const extensions = Object.values(languageMap).map(l => l.ext)
        return extensions[Math.floor(Math.random() * extensions.length)]
    }

    return languageMap[normalizedLang].ext
}

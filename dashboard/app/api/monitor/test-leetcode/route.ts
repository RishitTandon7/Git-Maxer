import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Models to try in order
const MODELS = [
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro-latest',
    'gemini-1.0-pro'
]

export async function POST(request: Request) {
    const startTime = Date.now()

    try {
        const { problemNumber } = await request.json()
        const problem = problemNumber || Math.floor(Math.random() * 3000) + 1

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({
                error: 'GEMINI_API_KEY not configured'
            }, { status: 500 })
        }

        const prompt = `You are a LeetCode expert. Solve LeetCode Problem #${problem}.

**Instructions:**
1. First, identify the problem title and difficulty
2. Generate a COMPLETE, WORKING Python solution
3. Use the OPTIMAL algorithm (best time/space complexity)
4. Include detailed docstring explaining the approach
5. Add inline comments for key steps
6. Include Time & Space Complexity analysis

**Output Format:**
\`\`\`python
# Problem Title
# Difficulty: [Easy/Medium/Hard]
# Category: [Array/String/DP/etc]

class Solution:
    def methodName(self, params) -> ReturnType:
        """
        [Clear explanation of approach and algorithm]
        """
        # Your optimal solution here
        
# Time Complexity: O(?)
# Space Complexity: O(?)
\`\`\`

Generate production-ready code that passes all test cases!`

        // Try models until one works
        let lastError = ''
        let usedModel = ''

        for (const modelName of MODELS) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }]
                        })
                    }
                )

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error?.message || `HTTP ${response.status}`)
                }

                const data = await response.json()
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

                if (!text) {
                    throw new Error('Empty response from API')
                }

                // Parse the response
                let codePreview = text
                if (text.includes('```python')) {
                    const start = text.indexOf('```python') + 9
                    const end = text.lastIndexOf('```')
                    codePreview = text.substring(start, end).trim()
                }

                // Extract title and difficulty
                let title = 'Unknown Problem'
                let difficulty = 'Unknown'

                const titleMatch = codePreview.match(/^#\s*(.+?)(?:\n|$)/m)
                if (titleMatch) title = titleMatch[1].replace(/Problem/i, '').trim()

                const diffMatch = codePreview.match(/Difficulty:\s*(\w+)/i)
                if (diffMatch) difficulty = diffMatch[1]

                usedModel = modelName

                return NextResponse.json({
                    success: true,
                    problemNumber: problem,
                    title,
                    difficulty,
                    modelUsed: usedModel,
                    generationTime: Date.now() - startTime,
                    codePreview: codePreview.substring(0, 1000) + (codePreview.length > 1000 ? '...' : '')
                })

            } catch (modelError: any) {
                lastError = modelError.message
                console.log(`Model ${modelName} failed:`, lastError)
                continue
            }
        }

        // All models failed
        return NextResponse.json({
            error: `All models failed. Last error: ${lastError}`,
            problemNumber: problem,
            testedModels: MODELS
        }, { status: 500 })

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            generationTime: Date.now() - startTime
        }, { status: 500 })
    }
}

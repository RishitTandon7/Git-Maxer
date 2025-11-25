import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { repo_name, visibility, github_username } = await request.json()
        const token = process.env.GITHUB_ACCESS_TOKEN

        if (!token) {
            return NextResponse.json({ error: 'Server configuration error: Missing GitHub Token' }, { status: 500 })
        }

        // 1. Check if repo exists
        const checkRes = await fetch(`https://api.github.com/repos/${github_username}/${repo_name}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        })

        if (checkRes.status === 200) {
            return NextResponse.json({ status: 'exists', message: 'Repository found!' })
        }

        if (checkRes.status === 404) {
            // 2. Create repo if not found
            console.log(`Repo ${repo_name} not found, creating...`)
            const createRes = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: repo_name,
                    private: visibility === 'private',
                    description: 'Auto-generated contributions by GitMaxer',
                    auto_init: true
                })
            })

            if (createRes.status === 201) {
                return NextResponse.json({ status: 'created', message: 'Repository created successfully!' })
            } else {
                const errorData = await createRes.json()
                return NextResponse.json({ error: `Failed to create repo: ${errorData.message}` }, { status: createRes.status })
            }
        }

        return NextResponse.json({ error: 'Failed to check repository status' }, { status: checkRes.status })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

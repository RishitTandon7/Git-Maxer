// QUICK FIX FOR SUPABASE TIMEOUT
// Replace the checkUser function in dashboard/app/dashboard/page.tsx
// with this optimized version:

const checkUser = async () => {
    // Silent - no console spam
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!sbUrl || sbUrl.includes('placeholder')) {
        showToast('error', 'SETUP ERROR: Supabase URL is missing!')
        setLoading(false)
        return
    }

    try {
        // Try to get user with 3 second timeout
        const timeOutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000)
        )

        const { data: { user }, error } = await Promise.race([
            supabase.auth.getUser(),
            timeOutPromise
        ]) as any

        if (error || !user) {
            setLoading(false)
            router.push('/')
            return
        }

        setUser(user)

        // Try to fetch data with cache fallback
        try {
            await fetchDataWithCache(user.id)
        } catch (fetchError) {
            console.error('Fetch failed, using cache:', fetchError)
            loadFromCache(user.id)
        }

    } catch (error) {
        // Timeout or error - try to load from cache
        const cachedUser = localStorage.getItem('cachedUser')
        if (cachedUser) {
            const parsed = JSON.parse(cachedUser)
            setUser(parsed)
            loadFromCache(parsed.id)
        } else {
            setLoading(false)
            router.push('/')
        }
    }
}

const fetchDataWithCache = async (userId: string) => {
    // Add timeout to fetchData too
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), 5000)
    )

    const dataPromise = (async () => {
        const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', userId)
            .single()

        if (settingsError?.code === 'PGRST116') {
            setLoading(false)
            router.push('/setup')
            return
        }

        if (settingsError) throw new Error(settingsError.message)

        if (!settings || !settings.github_username) {
            setLoading(false)
            router.push('/setup')
            return
        }

        const configData = {
            min_contributions: settings.min_contributions,
            pause_bot: settings.pause_bot,
            github_username: settings.github_username,
            repo_name: settings.repo_name,
            repo_visibility: settings.repo_visibility,
            preferred_language: settings.preferred_language || 'any',
            commit_time: settings.commit_time
        }

        setConfig(configData)
        setOriginalConfig(configData)
        setUserPlan(settings.plan_type || 'free')

        // Cache for next time
        localStorage.setItem('cachedConfig', JSON.stringify(configData))
        localStorage.setItem('userPlan', settings.plan_type || 'free')

        const { data: history } = await supabase
            .from('generated_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)

        if (history) setLogs(history)
        setLoading(false)
    })()

    await Promise.race([dataPromise, timeoutPromise])
}

const loadFromCache = (userId: string) => {
    const cachedConfig = localStorage.getItem('cachedConfig')
    const cachedPlan = localStorage.getItem('userPlan')

    if (cachedConfig) {
        const config = JSON.parse(cachedConfig)
        setConfig(config)
        setOriginalConfig(config)
        setUserPlan(cachedPlan || 'free')
        showToast('error', 'Using cached data - Supabase is slow. Refresh to retry.')
    }

    setLoading(false)
}

// INSTRUCTIONS:
// 1. Open f:\automatic contri\dashboard\app\dashboard\page.tsx
// 2. Find the checkUser function (around line 131)
// 3. Replace it with the checkUser function above
// 4. Add the fetchDataWithCache and loadFromCache functions below the checkUser function
// 5. Save and redeploy

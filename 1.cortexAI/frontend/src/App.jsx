import React, { useEffect, useState } from 'react'
import { getRedirectResult } from 'firebase/auth'
import { auth } from '../utils/firebase'
import api from '../utils/axios'
import Home from './pages/Home'
import getCurrentUser from './features/getCurrentUser'
import { useDispatch } from 'react-redux'
import { setUserdata } from './redux/userSlice'

function App() {
    const dispatch = useDispatch()
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const result = await getRedirectResult(auth)

                if (result?.user) {
                    const token = await result.user.getIdToken()
                    const { data } = await api.post("/api/auth/login", { token })
                    dispatch(setUserdata(data))
                } else {
                    const data = await getCurrentUser()
                    dispatch(setUserdata(data))
                }
            } catch (error) {
                console.error("Authentication initialization error:", error)
                console.error("Error code:", error.code)
                console.error("Backend response:", error.response?.data)
            } finally {
                setAuthLoading(false)
            }
        }

        initializeAuth()
    }, [dispatch])

    if (authLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0d0f14] text-white">
                Loading CortexAI...
            </div>
        )
    }

    return <Home />
}

export default App

import { signInWithPopup } from 'firebase/auth'
import React from 'react'
import { auth, googleProvider } from '../../utils/firebase'
import api from '../../utils/axios'
import { FcGoogle } from "react-icons/fc";
import { useDispatch, useSelector } from 'react-redux';
import { setUserdata } from '../redux/userSlice';
import SideBar from '../components/SideBar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';
function Home() {
    const {userData}=useSelector(state=>state.user)
    const dispatch=useDispatch()
    const handleLogin = async (token) => {
        try {
            console.log("Sending token to backend...")
            const { data } = await api.post("/api/auth/login", { token })
            console.log("Backend login successful:", data)
            dispatch(setUserdata(data))
        } catch (error) {
            console.error("Backend login error:", error)
            console.error("Backend response:", error.response?.data)
        }
    }
    const googleLogin = async () => {
        console.log("Google Login button clicked")
        try {
            console.log("Opening Google popup...")
            const data = await signInWithPopup(auth, googleProvider)
            console.log("Google popup successful:", data.user.email)
            const token = await data.user.getIdToken()
            console.log("Firebase token received")
            await handleLogin(token)
        } catch (error) {
            console.error("GOOGLE LOGIN ERROR:", error)
            console.error("Error code:", error.code)
            console.error("Error message:", error.message)
        }
    }
    return (
        <div className='h-screen flex bg-[#0d0f14] text-white overflow-hidden'>
            <SideBar/>
            <ChatArea/>
            <Artifact/>
            {!userData && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur'>
                    <div className='w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5'>
                        <div className='flex flex-col gap-1'>
                            <h2 className='text-[17px] font-semibold text-slate-100 tracking-tight'>
                                Welcome to CortexAI
                            </h2>
                            <p className='text-[13px] text-slate-500'>
                                Please login to continue using the app.
                            </p>
                        </div>
                        <button
                            className='w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-200 transition-all duration-150 cursor-pointer'
                            onClick={googleLogin}
                        >
                            <FcGoogle size={15} />
                            Continue With Google
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
export default Home

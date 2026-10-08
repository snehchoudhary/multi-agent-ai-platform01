import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cortex-ai-01.firebaseapp.com",
  projectId: "cortex-ai-01",
  storageBucket: "cortex-ai-01.firebasestorage.app",
  messagingSenderId: "915374975878",
  appId: "1:915374975878:web:b636bce66bddbf2a64da07",
  measurementId: "G-2SGMTRFWM3"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;

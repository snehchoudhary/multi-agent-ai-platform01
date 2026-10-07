// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDbh91ogQWRTaHkH7snJ1pl8h4GOYQ20UM",
  authDomain: "cortex-ai-01.firebaseapp.com",
  projectId: "cortex-ai-01",
  storageBucket: "cortex-ai-01.firebasestorage.app",
  messagingSenderId: "915374975878",
  appId: "1:915374975878:web:b636bce66bddbf2a64da07",
  measurementId: "G-2SGMTRFWM3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
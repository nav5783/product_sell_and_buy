// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCehTQCttWTqF9txN1tOmD8GZqoUPYXZ88",
  authDomain: "tourist-management-app.firebaseapp.com",
  projectId: "tourist-management-app",
  storageBucket: "tourist-management-app.firebasestorage.app",
  messagingSenderId: "672464166166",
  appId: "1:672464166166:web:a3492eddb199e6acf00437"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
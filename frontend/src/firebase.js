import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAKivxxAAIc-gpsplZYyk0nSioL9mljUks",
  authDomain: "deepthinkai-2b58f.firebaseapp.com",
  projectId: "deepthinkai-2b58f",
  storageBucket: "deepthinkai-2b58f.firebasestorage.app",
  messagingSenderId: "1048364078135",
  appId: "1:1048364078135:web:cae558a3c38cc68b4a1bb2"
};

// Initialize Firebase using singleton pattern
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Sign In
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Add your domain to the list of authorized domains in Firebase Console
  // and use the Firebase domain for authentication
  authDomain: "deepthinkai-2b58f.firebaseapp.com"
});

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign Out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export { auth };
export default app; 
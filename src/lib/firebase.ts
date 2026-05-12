import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAF0JdipnHGIqgHBOrsj6uqxVyutr2d4r0",
  authDomain: "goaradio-v2.firebaseapp.com",
  projectId: "goaradio-v2",
  storageBucket: "goaradio-v2.firebasestorage.app",
  messagingSenderId: "687233305339",
  appId: "1:687233305339:web:c4258cb7b7228c6f063e5e"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app

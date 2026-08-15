import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// これは「にゅうた動物病院」専用のFirebase接続情報
const firebaseConfig = {
  apiKey: "AIzaSyD37gHOZ7VHd0J15Kru9ods1LuoemyxEoc",
  authDomain: "nyuta-consent-app-3b5a2.firebaseapp.com",
  projectId: "nyuta-consent-app-3b5a2",
  storageBucket: "nyuta-consent-app-3b5a2.firebasestorage.app",
  messagingSenderId: "927121543452",
  appId: "1:927121543452:web:2eaa508d3cdcf5a69e6ad9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

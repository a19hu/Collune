import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBRRuwMzY6ZTJ8k3JQocqHkoojO0SPL0GY",
  authDomain: "schoolmate-c8c97.firebaseapp.com",
  projectId: "schoolmate-c8c97",
  storageBucket: "schoolmate-c8c97.firebasestorage.app",
  messagingSenderId: "654603826575",
  appId: "1:654603826575:web:4b99fa7698e2086a09c7fa",
  measurementId: "G-2V8MGY5005"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
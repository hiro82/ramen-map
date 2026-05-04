import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD1Xsvl-CPgs_KTvBXgy-MFoqsMdmx8SM8",
  authDomain: "ramen-map-268d3.firebaseapp.com",
  projectId: "ramen-map-268d3",
  storageBucket: "ramen-map-268d3.firebasestorage.app",
  messagingSenderId: "288346129144",
  appId: "1:288346129144:web:75f5de3a04fb4f6a33b10d",
  measurementId: "G-WWFZK0RER1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
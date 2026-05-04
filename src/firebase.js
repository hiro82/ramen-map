import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ramen-map-268d3.firebaseapp.com",
  projectId: "ramen-map-268d3",
  storageBucket: "ramen-map-268d3.appspot.com",
  messagingSenderId: "288346129144",
  appId: "1:288346129144:web:..."
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
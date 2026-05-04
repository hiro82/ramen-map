import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "ここに入れる",
  authDomain: "ここに入れる",
  projectId: "ここに入れる",
  storageBucket: "ここに入れる",
  messagingSenderId: "ここに入れる",
  appId: "ここに入れる",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
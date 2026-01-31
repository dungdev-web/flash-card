import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaTl_YlwYVKwYDxxByMVTPx9KT4epkevg",
  authDomain: "fir-b4383.firebaseapp.com",
  projectId: "fir-b4383",
  storageBucket: "fir-b4383.firebasestorage.app",
  messagingSenderId: "691868026276",
  appId: "1:691868026276:web:bb61db5539657c2d4cad31",
  measurementId: "G-KYYEHHF2ET"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

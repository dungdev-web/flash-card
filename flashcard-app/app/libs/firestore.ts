import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Word } from "@/app/types/word";

export const addWord = (word: Word) =>
  addDoc(collection(db, "words"), word);

export const getWordsByUser = async (userId: string) => {
  const q = query(collection(db, "words"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Word[];
};

export const toggleLearned = (id: string, learned: boolean) =>
  updateDoc(doc(db, "words", id), { learned });

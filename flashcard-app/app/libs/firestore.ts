import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  increment,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Word } from "@/app/types/word";

export const addWord = (word: Word) => addDoc(collection(db, "words"), word);
export const getWordCount = async (userId: string): Promise<number> => {
  const q = query(collection(db, "words"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.size;
};
// app/libs/firestore.ts

const getUsageDocRef = (userId: string) => {
  const today = new Date().toISOString().slice(0, 10); // "2025-04-08"
  return doc(db, "usage", `${userId}_${today}`);
};

export async function getExampleGenCount(userId: string): Promise<number> {
  const snap = await getDoc(getUsageDocRef(userId));
  return snap.exists() ? (snap.data().exampleGen ?? 0) : 0;
}

export async function incrementExampleGenCount(userId: string): Promise<number> {
  const ref = getUsageDocRef(userId);
  const today = new Date().toISOString().slice(0, 10);
  
  // Thêm uid và date để Firestore rules có thể check resource.data.uid
  await setDoc(
    ref,
    { 
      exampleGen: increment(1),
      uid: userId,      // ← THIẾU cái này nên rules chặn read
      date: today,
    },
    { merge: true }
  );
  
  const snap = await getDoc(ref);
  return snap.data()?.exampleGen ?? 1;
}
export const getWordsByUser = async (userId: string) => {
  const q = query(collection(db, "words"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Word[];
};

export const toggleLearned = (id: string, learned: boolean) =>
  updateDoc(doc(db, "words", id), { learned });
export const updateWord = (id: string, data: Partial<Word>) =>
  updateDoc(doc(db, "words", id), data);
export const searchWords = async (userId: string, keyword: string) => {
  const q = query(
    collection(db, "words"),
    where("userId", "==", userId),
    where("english", ">=", keyword),
    where("english", "<=", keyword + "\uf8ff")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Word[];
}
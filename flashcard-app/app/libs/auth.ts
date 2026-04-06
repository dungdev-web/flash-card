// src/app/libs/auth.ts
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
// import { seedPresetWordsForUser } from "./seed-preset";

export type UserRole = "admin" | "pro" | "user" | "master";

export interface UserProfile {
  uid:       string;
  email:     string;
  role:      UserRole;
  createdAt: any;
  upgradedAt?: any;
}

const googleProvider = new GoogleAuthProvider();

// ─── Helper: tạo profile nếu chưa có ─────────────────────────────────────────
async function ensureUserProfile(uid: string, email: string): Promise<UserProfile> {
  const ref  = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data() as UserProfile;

  // User mới → role mặc định là "user"
  const profile: UserProfile = {
    uid, email, role: "user", createdAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
  // await seedPresetWordsForUser(uid);
  return profile;
}

// ─── Auth functions ───────────────────────────────────────────────────────────
export const loginWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(cred.user.uid, cred.user.email ?? "");
  return cred;
};

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = async (email: string, password: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user.uid, email);
  return cred;
};

export const logout = () => signOut(auth);

// ─── Role helpers ─────────────────────────────────────────────────────────────
export async function getUserRole(uid: string): Promise<UserRole> {
  const snap = await getDoc(doc(db, "users", uid));
  return (snap.data()?.role as UserRole) ?? "user";
}

export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  await setDoc(doc(db, "users", uid), { role, upgradedAt: serverTimestamp() }, { merge: true });
}
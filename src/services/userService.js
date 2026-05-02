import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export async function ensureUserDocument(user) {
  if (!user?.uid || !user?.email) return;

  const userRef = doc(db, 'users', user.uid);
  const existingSnapshot = await getDoc(userRef);

  if (!existingSnapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email.toLowerCase(),
      username: '',
      photoUrl: '',
    });
    return;
  }

  await setDoc(
    userRef,
    {
      uid: user.uid,
      email: user.email.toLowerCase(),
    },
    { merge: true }
  );
}

export async function getUserDocument(uid) {
  if (!uid) {
    throw new Error('Missing user id.');
  }

  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export function subscribeToUserDocument(uid, callback) {
  if (!uid) {
    return () => {};
  }

  const userRef = doc(db, 'users', uid);

  const unsubscribe = onSnapshot(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snapshot.id,
      ...snapshot.data(),
    });
  });

  return unsubscribe;
}

export async function updateUsername(uid, username) {
  const trimmedUsername = username.trim();

  if (!uid) {
    throw new Error('Missing user id.');
  }

  if (!trimmedUsername) {
    throw new Error('Username cannot be empty.');
  }

  const userRef = doc(db, 'users', uid);

  await updateDoc(userRef, {
    username: trimmedUsername,
  });
}

export async function updateUserEmailInDocument(uid, email) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!uid) {
    throw new Error('Missing user id.');
  }

  if (!normalizedEmail) {
    throw new Error('Email cannot be empty.');
  }

  const userRef = doc(db, 'users', uid);

  await updateDoc(userRef, {
    email: normalizedEmail,
  });
}

export async function deleteUserDocument(uid) {
  if (!uid) {
    throw new Error('Missing user id.');
  }

  const userRef = doc(db, 'users', uid);
  await deleteDoc(userRef);
}

export async function getUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const q = query(
    collection(db, 'users'),
    where('email', '==', normalizedEmail)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const userDoc = querySnapshot.docs[0];

  return {
    id: userDoc.id,
    ...userDoc.data(),
  };
}

export async function getUsersByUids(uids) {
  if (!uids || uids.length === 0) {
    return [];
  }

  const usersRef = collection(db, 'users');
  const results = [];

  for (let i = 0; i < uids.length; i += 10) {
    const chunk = uids.slice(i, i + 10);

    const q = query(usersRef, where(documentId(), 'in', chunk));
    const snapshot = await getDocs(q);

    const chunkUsers = snapshot.docs.map((userDoc) => ({
      id: userDoc.id,
      ...userDoc.data(),
    }));

    results.push(...chunkUsers);
  }

  return results;
}
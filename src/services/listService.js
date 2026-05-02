import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUserByEmail } from './userService';

export async function createList(userId, title) {
  const docRef = await addDoc(collection(db, 'lists'), {
    title,
    ownerId: userId,
    members: [userId],
    createdAt: serverTimestamp(),
  });

  return docRef;
}

export async function getUserLists(userId) {
  const q = query(
    collection(db, 'lists'),
    where('members', 'array-contains', userId)
  );

  const querySnapshot = await getDocs(q);

  const lists = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return lists;
}

export async function hasAnyListsForUser(userId) {
  const q = query(
    collection(db, 'lists'),
    where('members', 'array-contains', userId)
  );

  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

export function subscribeToUserLists(userId, callback) {
  const q = query(
    collection(db, 'lists'),
    where('members', 'array-contains', userId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const lists = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(lists);
  });

  return unsubscribe;
}

export function subscribeToList(listId, callback) {
  const listRef = doc(db, 'lists', listId);

  const unsubscribe = onSnapshot(listRef, (snapshot) => {
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

export async function updateListTitle(listId, newTitle, currentUserId, ownerId) {
  const trimmedTitle = newTitle.trim();

  if (!trimmedTitle) {
    throw new Error('List title cannot be empty.');
  }

  if (currentUserId !== ownerId) {
    throw new Error('Only the list owner can edit the list title.');
  }

  const listRef = doc(db, 'lists', listId);

  await updateDoc(listRef, {
    title: trimmedTitle,
  });
}

export async function shareListWithEmail(listId, email, currentUserId, ownerId) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Please enter an email address.');
  }

  if (currentUserId !== ownerId) {
    throw new Error('Only the list owner can share this list.');
  }

  const userToShareWith = await getUserByEmail(normalizedEmail);

  if (!userToShareWith) {
    throw new Error('No user found with that email.');
  }

  if (userToShareWith.uid === currentUserId) {
    throw new Error('You are already a member of this list.');
  }

  const listRef = doc(db, 'lists', listId);

  await updateDoc(listRef, {
    members: arrayUnion(userToShareWith.uid),
  });

  return userToShareWith;
}

export async function removeMemberFromList(listId, memberUid, currentUserId, ownerId) {
  if (currentUserId !== ownerId) {
    throw new Error('Only the list owner can remove members.');
  }

  if (memberUid === ownerId) {
    throw new Error('Cannot remove the owner from the list.');
  }

  const listRef = doc(db, 'lists', listId);

  await updateDoc(listRef, {
    members: arrayRemove(memberUid),
  });
}

export async function leaveList(listId, currentUserId, ownerId) {
  if (!currentUserId) {
    throw new Error('You must be logged in.');
  }

  if (currentUserId === ownerId) {
    throw new Error('The owner cannot leave their own list.');
  }

  const listRef = doc(db, 'lists', listId);

  await updateDoc(listRef, {
    members: arrayRemove(currentUserId),
  });
}

export async function deleteList(listId, currentUserId, ownerId) {
  if (currentUserId !== ownerId) {
    throw new Error('Only the list owner can delete this list.');
  }

  const batch = writeBatch(db);

  const itemsQuery = query(
    collection(db, 'items'),
    where('listId', '==', listId)
  );

  const itemsSnapshot = await getDocs(itemsQuery);

  itemsSnapshot.forEach((itemDoc) => {
    batch.delete(itemDoc.ref);
  });

  const listRef = doc(db, 'lists', listId);
  batch.delete(listRef);

  await batch.commit();
}
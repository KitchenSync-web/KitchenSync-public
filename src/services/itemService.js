import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Create a new item
export async function createItem(listId, name, quantity = '1', user) {
  const itemsRef = collection(db, 'items');

  await addDoc(itemsRef, {
    listId,
    name,
    quantity: quantity?.trim() || '1',
    completed: false,
    createdAt: new Date(),
    lastEditedByUid: user?.uid || null,
    lastEditedByEmail: user?.email?.toLowerCase() || 'unknown user',
    lastEditedAt: new Date(),
  });
}

// Get items for a list
export async function getItemsForList(listId) {
  const itemsRef = collection(db, 'items');
  const q = query(
    itemsRef,
    where('listId', '==', listId),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    quantity: '1',
    lastEditedByUid: null,
    lastEditedByEmail: '',
    lastEditedAt: null,
    ...doc.data(),
  }));
}

// Realtime listener for items in a list
export function subscribeToItems(listId, callback) {
  const itemsRef = collection(db, 'items');
  const q = query(
    itemsRef,
    where('listId', '==', listId),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      quantity: '1',
      lastEditedByUid: null,
      lastEditedByEmail: '',
      lastEditedAt: null,
      ...doc.data(),
    }));

    callback(items);
  });

  return unsubscribe;
}

// Toggle item completion
export async function toggleItemCompletion(itemId, currentValue, user) {
  const itemRef = doc(db, 'items', itemId);

  await updateDoc(itemRef, {
    completed: !currentValue,
    lastEditedByUid: user?.uid || null,
    lastEditedByEmail: user?.email?.toLowerCase() || 'unknown user',
    lastEditedAt: new Date(),
  });
}

// Update item name and quantity
export async function updateItem(itemId, newName, newQuantity = '1', user) {
  const itemRef = doc(db, 'items', itemId);

  await updateDoc(itemRef, {
    name: newName,
    quantity: newQuantity?.trim() || '1',
    lastEditedByUid: user?.uid || null,
    lastEditedByEmail: user?.email?.toLowerCase() || 'unknown user',
    lastEditedAt: new Date(),
  });
}

// Delete item
export async function deleteItem(itemId) {
  const itemRef = doc(db, 'items', itemId);

  await deleteDoc(itemRef);
}
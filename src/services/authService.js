import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { ensureUserDocument } from './userService';

export async function registerUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );
  const user = userCredential.user;

  await ensureUserDocument(user);
  await sendEmailVerification(user);
  await signOut(auth);

  return user;
}

export async function loginUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  const userCredential = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );
  const user = userCredential.user;

  await user.reload();

  if (!user.emailVerified) {
    await sendEmailVerification(user);
    await signOut(auth);
    throw new Error('EMAIL_NOT_VERIFIED');
  }

  await ensureUserDocument(user);

  return user;
}

export async function resetUserPassword(email) {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function sendCurrentUserPasswordReset() {
  const currentUser = auth.currentUser;

  if (!currentUser?.email) {
    throw new Error('No signed-in user found.');
  }

  await sendPasswordResetEmail(auth, currentUser.email.toLowerCase());
}

export async function updateCurrentUserEmail(currentPassword, newEmail) {
  const currentUser = auth.currentUser;

  if (!currentUser?.email) {
    throw new Error('No signed-in user found.');
  }

  const trimmedPassword = currentPassword.trim();
  const normalizedEmail = newEmail.trim().toLowerCase();

  if (!trimmedPassword) {
    throw new Error('Please enter your current password.');
  }

  if (!normalizedEmail) {
    throw new Error('Please enter a new email address.');
  }

  const credential = EmailAuthProvider.credential(
    currentUser.email,
    trimmedPassword
  );

  await reauthenticateWithCredential(currentUser, credential);
  await updateEmail(currentUser, normalizedEmail);

  return normalizedEmail;
}

export async function deleteCurrentUserAccount(currentPassword) {
  const currentUser = auth.currentUser;

  if (!currentUser?.email) {
    throw new Error('No signed-in user found.');
  }

  const trimmedPassword = currentPassword.trim();

  if (!trimmedPassword) {
    throw new Error('Please enter your current password.');
  }

  const credential = EmailAuthProvider.credential(
    currentUser.email,
    trimmedPassword
  );

  await reauthenticateWithCredential(currentUser, credential);
  await deleteUser(currentUser);
}

export async function logoutUser() {
  await signOut(auth);
}
# KitchenSync

KitchenSync is a senior project mobile app for collaborative grocery lists. The app allows users to create an account, create grocery lists, share lists with other users, and update grocery items in real time.

KitchenSync was built with React Native, Expo, Firebase Authentication, and Firebase Firestore.

Project by: Montserrad Fallas Ruiz, Diego Osorio, and Shenna Tawiah

---
## Demo Video

Watch a short demo of KitchenSync here:

[KitchenSync Demo Video](PASTE-YOUR-DEMO-VIDEO-LINK-HERE)

---
## Features

- Create an account, initial email verification, and log in
- Reset password through email
- Create, edit, and delete grocery lists
- Share grocery lists with other users by email
- View list members
- Remove members from a list as the owner
- Leave a shared list as a member
- Add, edit, delete, and check off grocery items
- Edit item quantities with customizable units of measurement
- Edit grocery list names as the owner
- Real-time list and item updates
- Profile/account page

---

## Required Installations

Before running the app, install the following:

### 1. Node.js

Download and install Node.js from:

https://nodejs.org/

Node.js includes npm, which is needed to install the project dependencies.

To check that Node.js and npm installed correctly, run:

```bash
node -v
npm -v
```

### 2. Git

Download and install Git from:

https://git-scm.com/

To check that Git installed correctly, run:

```bash
git --version
```

### 3. Expo Go

Download the Expo Go app on your phone:

- iPhone: App Store
- Android: Google Play Store

Expo Go lets you scan the QR code from the terminal and run the app on your phone.

### 4. Code Editor

A code editor is recommended for opening and editing the project.

Recommended:

- Visual Studio Code

---

## Project Setup

### 1. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/KitchenSync-web/KitchenSync-public.git
```

Then move into the project folder:

```bash
cd kitchensync-public
```

### 2. Install Dependencies

Run this command inside the project folder:

```bash
npm install
```

This installs all required packages for the app.

---

## Firebase Setup

KitchenSync uses Firebase Authentication for user accounts and Firebase Firestore for storing grocery lists, shared members, and grocery items.

To run the app on your own computer, you need to create your own Firebase project.

### 1. Create a Firebase Project

Go to:

https://console.firebase.google.com/

Then:

1. Click **Add project**
2. Enter a project name
3. Follow the setup steps
4. Open the project when it is created

### 2. Register a Web App

Inside your Firebase project:

1. Click the gear icon next to **Project Overview**
2. Click **Project settings**
3. Scroll down to **Your apps**
4. Click the web icon: `</>`
5. Register the app
6. Firebase will show a `firebaseConfig` object

It will look similar to this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

You will use these values to create your local `.env` file.

### 3. Enable Email/Password Authentication

In Firebase:

1. Go to **Build**
2. Click **Authentication**
3. Click **Get started**
4. Open the **Sign-in method** tab
5. Enable **Email/Password**
6. Save your changes

### 4. Create a Firestore Database

In Firebase:

1. Go to **Build**
2. Click **Firestore Database**
3. Click **Create database**
4. Choose a database location
5. Start in test mode while setting up locally, or use your own secure rules
6. Click **Enable**

---

## Environment Variables Setup

This project uses a `.env` file to store Firebase configuration values on your local computer.

The real `.env` file is not included in this repository. Instead, this repository includes a file called:

```txt
.env.example
```

Use `.env.example` as a template to create your own `.env` file.

### 1. Create a `.env` File

In the root of the project folder, create a new file named:

```txt
.env
```

The `.env` file should be in the same location as `package.json`, `README.md`, and `.env.example`.

Example:

```txt
KitchenSync
├── .env
├── .env.example
├── package.json
├── README.md
└── src
```

### 2. Copy the `.env.example` Format

Open `.env.example`.

It should look like this:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Copy that into your new `.env` file.

### 3. Add Your Firebase Values

Fill in the values from the Firebase `firebaseConfig` object.

Example `.env` file:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Do not put quotation marks around the values.

### 4. Match Firebase Values to `.env` Variables

Use this guide:

```txt
Firebase apiKey              -> EXPO_PUBLIC_FIREBASE_API_KEY
Firebase authDomain          -> EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
Firebase projectId           -> EXPO_PUBLIC_FIREBASE_PROJECT_ID
Firebase storageBucket       -> EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
Firebase messagingSenderId   -> EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Firebase appId               -> EXPO_PUBLIC_FIREBASE_APP_ID
```

You can find these values in:

```txt
Firebase Console > Project Settings > General > Your apps > Firebase SDK snippet > Config
```

---

## Running the App

Start the Expo development server:

```bash
npx expo start
```

If you recently created or changed your `.env` file, clear the Expo cache:

```bash
npx expo start -c
```

After Expo starts:

1. Open Expo Go on your phone
2. Scan the QR code
3. Wait for the app to load

The app should now run on your device.

---

## Important Notes

Do not upload your real `.env` file to GitHub.

This repository includes `.env.example` so other developers know which environment variables are required.

The repository should include:

```txt
.env.example
```

The repository should not include:

```txt
.env
```

---

## Troubleshooting

If the app does not connect to Firebase:

- Make sure the `.env` file is in the root project folder
- Make sure all variable names start with `EXPO_PUBLIC_`
- Make sure there are no quotation marks around the values
- Make sure Firebase Authentication is enabled
- Make sure Firestore Database is created
- Restart Expo with:

```bash
npx expo start -c
```

If the QR code does not load in Expo Go, try:

```bash
npx expo start --tunnel
```

---

## About

KitchenSync was created as a senior project mobile app to make grocery shopping more organized and collaborative. The app helps users share grocery lists, manage list access, and update grocery items in real time.

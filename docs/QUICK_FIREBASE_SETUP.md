# Quick Firebase Setup Guide

Follow these steps to get your Firebase configuration values:

## Step 1: Create/Login to Firebase Account
1. Go to https://console.firebase.google.com
2. Sign in with your Google account

## Step 2: Create a Firebase Project
1. Click "Add project" or select an existing project
2. Enter project name: `ecgroup-instant-polling` (or your preferred name)
3. Follow the setup wizard:
   - Accept/disable Google Analytics (optional)
   - Click "Create project"

## Step 3: Enable Firestore Database
1. In your Firebase project, click on "Build" > "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development) or configure rules
4. Select a location for your database (choose closest to your users)
5. Click "Enable"

## Step 4: Add a Web App
1. In Firebase Console, click the gear icon ⚙️ > "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app:
   - App nickname: "ECGroup Instant Polling" (or any name)
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

## Step 5: Copy Configuration Values
After registering, you'll see your Firebase configuration. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Step 6: Configure Your App

### Option A: Using Environment Variables (Recommended)
1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
   (On Linux/Mac: `cp .env.example .env`)

2. Open `.env` and fill in your Firebase values:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

### Option B: Direct Configuration
Edit `src/utils/firebase.js` and replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",  // Your actual API key
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
}
```

## Step 7: Set Up Security Rules

1. Go to Firestore Database > Rules
2. For development/testing, use:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /polls/{pollId} {
         allow read, write: if true;
       }
       match /poll_sets/{setId} {
         allow read, write: if true;
       }
     }
   }
   ```
3. Click "Publish"

**⚠️ Warning**: The rules above allow public access. For production, implement proper authentication.

## Step 8: Install Firebase SDK

Make sure Firebase is installed:
```bash
npm install firebase
```

## Step 9: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try creating a poll - it should save to Firestore
3. Check Firebase Console > Firestore Database to see your data

## Troubleshooting

- **"FirebaseError: Missing or insufficient permissions"**: Check your Firestore security rules
- **"Firebase App named '[DEFAULT]' already exists"**: This is normal if the app is already initialized
- **Can't see data in Firestore**: Make sure you're looking at the correct project and database

## Need Help?

If you encounter issues:
1. Check browser console for error messages
2. Verify all Firebase config values are correct
3. Ensure Firestore is enabled in your Firebase project
4. Check security rules allow read/write access


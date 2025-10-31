# How to Get Your Firebase Configuration

## Quick Steps:

1. **Go to Firebase Console**: https://console.firebase.google.com

2. **Select/Create Project**: 
   - If you don't have a project named "ecgroup-instant-polling", create one
   - Or select an existing project

3. **Enable Firestore**:
   - Click "Build" → "Firestore Database"
   - Click "Create database" 
   - Choose "Start in test mode"
   - Select location → "Enable"

4. **Get Web App Config**:
   - Click ⚙️ (gear icon) → "Project settings"
   - Scroll to "Your apps" section
   - If no web app exists, click `</>` icon to add one
   - App nickname: "Polling App"
   - Click "Register app"
   - **Copy the config object that appears**

5. **Create .env file** in project root:
   ```
   VITE_FIREBASE_API_KEY=YOUR_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
   VITE_FIREBASE_APP_ID=YOUR_APP_ID
   ```

6. **Update Security Rules**:
   - Go to Firestore Database → Rules
   - Replace with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   - Click "Publish"

## Your Configuration Values Location:

The config looks like this in Firebase Console:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "xxxxx.firebaseapp.com",
  projectId: "xxxxx",
  storageBucket: "xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

Copy each value to your `.env` file (without quotes).

## Test It:

After setting up, run:
```bash
npm run dev
```

Create a poll and check Firebase Console → Firestore Database to see if data appears!


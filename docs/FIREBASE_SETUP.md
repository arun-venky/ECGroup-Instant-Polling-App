# Firebase Setup Instructions

This application now uses Firebase Firestore to store polls and results instead of local memory (localStorage).

## Prerequisites

1. A Firebase account (sign up at https://firebase.google.com)
2. A Firebase project created in the Firebase Console

## Setup Steps

### 1. Install Firebase SDK

```bash
npm install firebase
```

### 2. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard
4. Enable Firestore Database:
   - In your project, go to "Build" > "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (or configure security rules as needed)
   - Select a location for your database

### 3. Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app and copy the Firebase configuration object

### 4. Configure Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

Alternatively, you can edit `src/utils/firebase.js` directly and replace the placeholder values with your Firebase configuration.

### 5. Set Up Firestore Indexes (Optional)

For optimal performance, you may need to create composite indexes in Firestore:

1. Go to Firestore Database > Indexes
2. Create indexes for:
   - Collection: `polls`
     - Fields: `setId` (Ascending), `createdAt` (Ascending)
   - Collection: `polls`
     - Fields: `createdAt` (Ascending)

However, the current implementation handles queries efficiently, and Firestore will prompt you to create indexes if needed.

### 6. Security Rules (Important)

Update your Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to polls
    match /polls/{pollId} {
      allow read, write: if true; // Adjust based on your security needs
    }
    
    // Allow read/write access to poll_sets
    match /poll_sets/{setId} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

**Note**: The rules above allow public read/write access. For production, implement proper authentication and authorization.

## Testing

After setup, test the application:

1. Create a poll
2. Vote on the poll
3. Check that results update in real-time
4. Verify data persists after page refresh

## Troubleshooting

- **"Missing or insufficient permissions"**: Check your Firestore security rules
- **Query errors**: Ensure Firestore indexes are created (Firestore will provide a link)
- **Connection errors**: Verify your Firebase configuration in `.env` or `firebase.js`

## Migration from LocalStorage

If you have existing polls in localStorage, you'll need to manually migrate them or they will start fresh with the new Firestore database.


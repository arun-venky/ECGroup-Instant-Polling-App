# How to Create Firestore Database in Firebase

## Yes, you need to create a Firestore database! Here's how:

### Step-by-Step Instructions:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project: **ecgroup-instant-polling-3183e**

2. **Navigate to Firestore Database**
   - In the left sidebar, click on **"Build"** (or look for the Firestore icon)
   - Click on **"Firestore Database"**

3. **Create the Database**
   - Click the **"Create database"** button
   - Choose your mode:
     - **For testing/development**: Select **"Start in test mode"**
       - This allows read/write access for 30 days (perfect for testing)
     - **For production**: Set up your own security rules
   
4. **Choose Database Location**
   - Select a location closest to your users
   - Examples: `us-central`, `europe-west`, `asia-southeast1`
   - Click **"Enable"**
   - Wait a minute for Firebase to set up your database

5. **Set Up Security Rules** (Important!)
   - While still in Firestore Database, click on the **"Rules"** tab
   - Replace the default rules with:
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
   - Click **"Publish"**

6. **Verify It's Working**
   - Go back to the **"Data"** tab
   - You should see an empty database (no collections yet)
   - When you create your first poll in the app, you'll see the `polls` collection appear here!

## That's It! ✅

Once the database is created, your app will automatically start storing polls and results in Firestore instead of local memory.

## Test It:
1. Run your app: `npm run dev`
2. Create a poll
3. Go back to Firebase Console → Firestore Database → Data
4. You should see your poll data appear in real-time!

## Need Help?
If you see errors like "Missing or insufficient permissions":
- Make sure you created the database
- Check that security rules are published (step 5 above)
- Verify you're looking at the correct Firebase project


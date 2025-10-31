# About Firestore Collections

## What are Collections?

Collections in Firestore are like **folders** or **tables** that hold your data. Think of them as categories for organizing your information.

## Your App Uses 3 Collections:

1. **`polls`** - Stores all the poll questions, options, and vote counts
2. **`poll_sets`** - Stores groups of polls (like "Friday Quiz")
3. **`votes`** - Reserved for future use (currently not used, but defined)

## Do You Need to Create Them?

**NO! ✅** Collections are created **automatically** when you first save data to them.

### How It Works:

1. You create a poll in your app
2. The app writes to the `polls` collection
3. Firestore automatically creates the `polls` collection if it doesn't exist
4. The same happens for `poll_sets` when you create a poll set

## Visual Structure in Firestore:

```
Firestore Database
├── polls (collection)
│   ├── poll-id-1 (document)
│   │   ├── question: "What's your favorite color?"
│   │   ├── options: ["Red", "Blue", "Green"]
│   │   ├── votes: [5, 3, 8]
│   │   └── createdAt: 1234567890
│   ├── poll-id-2 (document)
│   └── ...
│
└── poll_sets (collection)
    ├── set-id-1 (document)
    │   ├── name: "Friday Quiz"
    │   └── createdAt: 1234567890
    └── ...
```

## What You Need to Do:

**Just create the Firestore database itself** - that's it!

The collections will appear automatically when:
- You create your first poll → `polls` collection appears
- You create your first poll set → `poll_sets` collection appears

## Example Timeline:

1. ✅ Create Firestore database (you need to do this)
2. ❌ Don't create collections manually (they auto-create)
3. 🚀 Run your app and create a poll
4. 👀 Check Firebase Console → Firestore → Data tab
5. ✨ See the `polls` collection magically appear!

## Summary:

- **Database**: You must create this (one-time setup)
- **Collections**: Created automatically when needed (no action required)

That's the beauty of Firestore - it's schema-less and creates things on the fly! 🎉


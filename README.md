This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


rules_version = '2';
service firebase.storage {
match /databases/{database}/documents {
match /reports/{documentId} {
allow read, write: if request.auth != null; // Adjust based on your security model
}
}
}


service cloud.firestore {
match /databases/{database}/documents {
// Allow read/write access to users' own data
match /users/{userId} {
allow read, write: if request.auth != null && request.auth.uid == userId;
allow update, delete: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');

    }

    // Admin access (e.g., for admin users to read/write to admin data)
    match /admin/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
     match /reports/{reportId} {
      allow read: if request.auth != null;  // Allow authenticated users to read reports
      allow write: if request.auth != null; // Allow authenticated users to write reports
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null; // Require authentication for read/write
      allow update, delete: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');

    }

}
}
}
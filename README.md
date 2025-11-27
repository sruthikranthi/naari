# Naarimani (Naari)

A women-only social platform built with Next.js and Firebase.

## Features

- Women-Only Verification System
- Safe Chat with AI-powered safety checks
- Community Creation & Management
- Kitty Group Tools
- Women's Business Marketplace
- Professional Hub
- Wellness & Learning Resources
- Contests & Awards

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project with Firestore, Authentication, and Storage enabled

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_or_empty

# Admin Configuration
NEXT_PUBLIC_SUPER_ADMIN_ID=your_super_admin_user_id
```

**Note:** All `NEXT_PUBLIC_*` variables are exposed to the client-side bundle. Do not put sensitive secrets here.

You can find these values in Firebase Console > Project Settings > Your apps.

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

### Bundle Analysis

To analyze bundle size:

```bash
npm run build:analyze
```

This will generate bundle analysis reports showing which packages are taking up the most space.

## Performance Optimizations

- ✅ Image optimization with Next.js Image component
- ✅ Lazy loading for images and heavy components
- ✅ Code splitting with dynamic imports
- ✅ Firestore query optimization with indexes
- ✅ Pagination support for large collections
- ✅ Bundle size optimization

## Security Features

- ✅ Firebase config via environment variables
- ✅ Input validation and sanitization
- ✅ Content Security Policy (CSP)
- ✅ Email verification required
- ✅ Rate limiting utilities
- ✅ XSS protection

## Firestore Indexes

The application uses composite indexes for optimized queries. Deploy indexes using:

```bash
firebase deploy --only firestore:indexes
```

Or manually create them in Firebase Console > Firestore Database > Indexes.

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Firebase App Hosting

1. Configure `apphosting.yaml`
2. Deploy using Firebase CLI

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── firebase/         # Firebase configuration and hooks
│   └── firestore/    # Firestore hooks (use-collection, use-doc, use-paginated-collection)
├── lib/             # Utilities and validation
└── hooks/           # Custom React hooks
```

## License

Private - All rights reserved

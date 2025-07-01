# System Architecture – Catering Platform

## 1. Overview
The catering platform is a modern web application built with Next.js (React), Firebase (Firestore, Auth, Storage), and a CSS variable-driven design system. It supports three user roles: user, admin, and restaurant owner.

## 2. Architecture Diagram

```mermaid
graph TD
  A[User Browser] -- HTTP/HTTPS --> B[Next.js Frontend]
  B -- Firebase SDK --> C[Firestore Database]
  B -- Firebase Auth SDK --> D[Firebase Authentication]
  B -- Firebase Storage SDK --> E[Firebase Storage]
  B -- REST/SDK --> F[Email Service (via Cloud Functions or 3rd party)]
  C -- Triggers --> F
  D -- User Auth Events --> B
```

## 3. Components
- **Frontend (Next.js):**
  - UI/UX, routing, and all user/admin/restaurant owner interactions.
  - Uses Firebase SDK for all data/auth/storage operations.
- **Backend (Firebase):**
  - Firestore: Orders, products, restaurants, users, reviews, etc.
  - Auth: User authentication and role management.
  - Storage: Product/restaurant images.
  - Cloud Functions (optional): For sending emails on order events.
- **Email Notification Service:**
  - Triggered by Firestore events or directly from frontend.
  - Sends emails to users, restaurant owners, and admins.

## 4. Data Flow
- User interacts with frontend (Next.js), which reads/writes to Firestore via Firebase SDK.
- Auth state is managed client-side via Firebase Auth.
- Images are uploaded to Firebase Storage.
- Order events trigger email notifications (via Cloud Functions or direct API call).

## 5. Security
- Firestore security rules enforce role-based access.
- All sensitive actions are logged.

## 6. Deployment
- Frontend deployed on Vercel (or similar).
- Firebase project for backend services.

---

**See the Mermaid diagram above for a visual wireframe of the system architecture.** 
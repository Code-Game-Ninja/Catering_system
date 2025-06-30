# 🍽️ Catering Platform

A modern, full-featured catering service platform for discovering, ordering, and managing authentic Indian cuisine from rural communities—globally! Built with Next.js, Firebase, and Tailwind CSS.

---

![Vercel Deploy](https://vercel.com/button)
![Next.js](https://img.shields.io/badge/Next.js-15-blue?logo=nextdotjs)
![Firebase](https://img.shields.io/badge/Firebase-yellow?logo=firebase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwindcss)

---

## ✨ Features
- 🥘 Browse and order from a diverse menu of traditional Indian dishes
- 👨‍🍳 Restaurant owner dashboard for managing products, orders, and settings
- 🛒 Shopping cart and order management
- ⭐ Product reviews and ratings
- 🔒 Secure authentication (Google, Email/Password)
- 📱 Fully responsive for mobile, tablet, and desktop
- 📦 Admin dashboard for platform management
- 📤 Image upload for products, restaurants, and user profiles

---

## 🚀 Tech Stack
- **Framework:** Next.js 15
- **UI:** Tailwind CSS, Radix UI, Framer Motion
- **Backend:** Firebase (Firestore, Auth, Storage)
- **Deployment:** Vercel

---

## 🖥️ Screenshots
<!-- Add your screenshots here -->
<p align="center">
  <img src="public/placeholder.jpg" alt="Landing Page" width="400"/>
  <img src="public/placeholder-user.jpg" alt="User Profile" width="400"/>
</p>

---

## 🛠️ Getting Started

### 1. **Clone the repository**
```bash
git clone https://github.com/your-username/catering-platform.git
cd catering-platform
```

### 2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

### 3. **Set up environment variables**
Create a `.env.local` file in the root directory and add your Firebase config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 4. **Run the development server**
```bash
pnpm dev
# or
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🌐 Deploying to Vercel
1. Push your code to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com](https://vercel.com/) and import your repo.
3. Add the environment variables from `.env.local` in the Vercel dashboard.
4. Click **Deploy** and get your live URL!

---

## 🔒 Security & Production
- Update your Firebase security rules for production (see `firebase-security-rules.txt` and `firebase-storage-rules.txt`).
- Never commit your `.env.local` file.

---

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License
[MIT](LICENSE)

---

> Made with ❤️ for authentic Indian cuisine and global food lovers! 
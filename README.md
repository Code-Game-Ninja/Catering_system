# 🍽️ Catering Platform

Welcome to **Catering Platform** – your all-in-one, full-featured solution for discovering, ordering, and managing delicious meals from local restaurants and caterers. Whether you're a foodie, a restaurant owner, or an admin, this platform offers powerful tools for everyone involved in the food ordering ecosystem. 🚀

---

## ✨ Key Features

### 🏪 Multi-Restaurant Marketplace

* Browse and search food from multiple verified restaurants and caterers.
* Detailed restaurant pages with menus, descriptions, and ratings.

### 🛒 Smart Cart & Checkout

* Persistent cart with real-time updates.
* Easy and secure checkout flow.
* Multiple payment methods ready for integration.

### 📦 Order Tracking System

* Real-time status updates for users, restaurants, and admins.
* Live notifications for order confirmations and deliveries.

### ⭐ Reviews & Ratings

* Leave reviews and rate meals/restaurants after delivery.
* Browse genuine user feedback before ordering.

### 👤 Dynamic User Profiles

* Manage personal info, order history, saved addresses, and preferences.

### 🧑‍🍳 Restaurant Dashboard

* Restaurant owners can add, edit, and manage dishes.
* View live orders, update status, and handle customer feedback.

### 🛠️ Admin Dashboard

* Monitor platform-wide stats, manage users and restaurants.
* Control over flagged reviews, users, and security settings.

### 🌐 Responsive & Modern Design

* Optimized for mobile, tablet, and desktop.
* Smooth animations, minimal design, and great user experience.

### 🔒 Secure & Scalable

* Firebase Authentication for user security.
* Firestore & Firebase Storage for data management.
* Custom security rules for different user roles (user, owner, admin).

---

## 🛠️ Tech Stack

| Tech             | Description                                               |
| ---------------- | --------------------------------------------------------- |
| **Next.js 15**   | Modern full-stack React framework with App Router support |
| **React 19**     | Latest version with concurrent features                   |
| **Firebase**     | Auth, Firestore, Storage, Hosting                         |
| **Tailwind CSS** | Utility-first CSS framework for modern UI                 |
| **TypeScript**   | Safer, typed JavaScript                                   |
| **Shadcn/UI**    | Prebuilt, elegant, accessible React components            |

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Code-Game-Ninja/Catering_system.git
cd catering-system
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file by copying `.env.example`:

```bash
cp .env.example .env.local
```

Then, fill in your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Start the Development Server

```bash
pnpm dev
# or
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app in development mode.

---

## 🚀 Deploying to Vercel

1. Push your code to GitHub.
2. Go to [Vercel](https://vercel.com/) and import your GitHub repository.
3. Add the same environment variables in Vercel's **Project Settings > Environment Variables**.
4. Click **Deploy**, and you’ll get a live production URL!

---

## 🔐 Security Best Practices

* ❗ Never commit sensitive info or your `.env.local` file.
* ✅ Configure and test **Firebase Firestore** and **Storage rules** for user access control.
* 🔁 Regularly **rotate API keys** and monitor Firestore usage.
* 🛡️ Use role-based checks in both client and Firestore rules (`user`, `restaurant`, `admin`).

---

## 📸 Screenshots

> Add your own here or use the following placeholders:

 | User View                                      |
 | --------------------------------------------------- |
 | Restaurant Dashboard                           |
 | ![image](https://github.com/user-attachments/assets/8af7955a-b4cd-4a2c-8e37-266c409dfa63)
 | ---------------------------------------------------- |
 | ![screencapture-catering-system-59v4n9eav-chirags-projects-5c6a8fe9-vercel-app-restaurant-owner-2025-07-01-17_23_32](https://github.com/user-attachments/assets/851dbbb2-6327-427e-987c-f318742cd265)
 |----------------------------------------------------- |
 | Admin Panel                                     |
 ![image](https://github.com/user-attachments/assets/effd9f36-a0c4-4ee4-a978-01a4e1703d26)
 |----------------------------------------------------- |

---

## 🤝 Contributing

We love contributions from the community!

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -m 'Add awesome feature'`)
4. Push to the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request.

---

## 📃 License

This project is licensed under the [MIT License](LICENSE).

---

## 💌 Connect & Credits

* Made with ❤️ by [Chirag](https://github.com/Code-Game-Ninja)
* Contact: [chiragmishra2511@gmail.com](mailto:chiragmishra2511@gmail.com)

> “Food is the ingredient that binds us together.” 🍜
> Build something people can taste—even on the internet.

---
## 📝Note

* There is several functions are not work in admin. I will update them in next update.
* Stay Tune with Me.

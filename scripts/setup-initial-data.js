// scripts/setup-initial-data.js
// Run this script to set up initial data for testing

import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp } from "firebase/firestore"

async function setupInitialData() {
  console.log("--- Script Execution Started ---")

  // Check if process.env is available
  if (typeof process === "undefined" || !process.env) {
    console.error("Error: process.env is not available in this environment. Cannot access Firebase configuration.")
    return // Exit early if environment variables cannot be accessed
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }

  // Validate Firebase config values
  const requiredKeys = ["apiKey", "authDomain", "projectId", "storageBucket", "appId"]
  for (const key of requiredKeys) {
    if (!firebaseConfig[key]) {
      console.error(`Error: Missing Firebase environment variable for key: ${key}. Value is: ${firebaseConfig[key]}`)
      console.error("Please ensure all NEXT_PUBLIC_FIREBASE_* environment variables are set.")
      return // Exit early if any required config is missing
    }
  }

  try {
    console.log("Starting initial data setup...")
    console.log("Firebase Config being used:", firebaseConfig)

    // Initialize Firebase app
    let app
    try {
      app = initializeApp(firebaseConfig)
      console.log("Firebase app initialized successfully.")
    } catch (initError) {
      console.error("Error initializing Firebase app:", initError)
      throw initError // Re-throw to stop execution if init fails
    }

    const db = getFirestore(app)
    console.log("Firestore instance obtained.")

    // Create sample categories
    const categories = [
      { name: "North Indian", description: "Traditional North Indian cuisine" },
      { name: "South Indian", description: "Authentic South Indian dishes" },
      { name: "Street Food", description: "Popular Indian street food" },
      { name: "Desserts", description: "Traditional Indian sweets and desserts" },
      { name: "Beverages", description: "Traditional Indian drinks" },
    ]

    console.log("Adding categories...")
    for (const category of categories) {
      try {
        await addDoc(collection(db, "categories"), {
          ...category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        console.log(`Added category: ${category.name}`)
      } catch (catError) {
        console.error(`Error adding category ${category.name}:`, catError)
        throw catError // Re-throw to stop execution if a category fails
      }
    }
    console.log("Categories added successfully.")

    // Create sample restaurant
    const restaurantId = "sample-restaurant-1"
    console.log(`Adding restaurant with ID: ${restaurantId}...`)
    try {
      await setDoc(doc(db, "restaurants", restaurantId), {
        name: "Spice Garden",
        description: "Authentic Indian cuisine from the heart of Punjab",
        imageUrl: "/placeholder.svg?height=300&width=400",
        address: "123 Curry Lane, New Delhi, India",
        phone: "+91 98765 43210",
        email: "contact@spicegarden.com",
        cuisine: ["North Indian", "Punjabi", "Vegetarian"],
        rating: 4.5,
        totalReviews: 127,
        isActive: true,
        ownerId: "sample-owner-1",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      console.log("Restaurant added successfully.")
    } catch (restError) {
      console.error("Error adding restaurant:", restError)
      throw restError // Re-throw to stop execution if restaurant fails
    }

    // Create sample products
    const products = [
      {
        name: "Butter Chicken",
        description: "Creamy tomato-based curry with tender chicken pieces",
        price: 18.99,
        imageUrl: "/placeholder.svg?height=300&width=400",
        category: "North Indian",
        restaurantId: restaurantId,
        restaurantName: "Spice Garden",
        isAvailable: true,
        preparationTime: 25,
        ingredients: ["Chicken", "Tomatoes", "Cream", "Butter", "Spices"],
        allergens: ["Dairy"],
        isVegetarian: false,
        isVegan: false,
        spiceLevel: "medium",
      },
      {
        name: "Paneer Tikka Masala",
        description: "Grilled cottage cheese in rich tomato gravy",
        price: 16.99,
        imageUrl: "/placeholder.svg?height=300&width=400",
        category: "North Indian",
        restaurantId: restaurantId,
        restaurantName: "Spice Garden",
        isAvailable: true,
        preparationTime: 20,
        ingredients: ["Paneer", "Tomatoes", "Onions", "Cream", "Spices"],
        allergens: ["Dairy"],
        isVegetarian: true,
        isVegan: false,
        spiceLevel: "medium",
      },
      {
        name: "Biryani",
        description: "Fragrant basmati rice with aromatic spices and meat",
        price: 22.99,
        imageUrl: "/placeholder.svg?height=300&width=400",
        category: "North Indian",
        restaurantId: restaurantId,
        restaurantName: "Spice Garden",
        isAvailable: true,
        preparationTime: 45,
        ingredients: ["Basmati Rice", "Chicken", "Saffron", "Yogurt", "Spices"],
        allergens: ["Dairy"],
        isVegetarian: false,
        isVegan: false,
        spiceLevel: "medium",
      },
    ]

    console.log("Adding products...")
    for (const product of products) {
      try {
        await addDoc(collection(db, "products"), {
          ...product,
          averageRating: 4.2 + Math.random() * 0.8,
          totalReviews: Math.floor(Math.random() * 50) + 10,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        console.log(`Added product: ${product.name}`)
      } catch (prodError) {
        console.error(`Error adding product ${product.name}:`, prodError)
        throw prodError // Re-throw to stop execution if a product fails
      }
    }
    console.log("Products added successfully.")

    console.log("Initial data setup completed successfully!")
    console.log("Created:")
    console.log("- 5 categories")
    console.log("- 1 sample restaurant")
    console.log("- 3 sample products")
    console.log("\nYou can now test the application with this sample data.")
  } catch (error) {
    console.error("An unhandled error occurred during setup:", error)
  }
}

setupInitialData()

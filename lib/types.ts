// lib/types.ts
import type { Timestamp } from "firebase/firestore"

export type UserRole = "user" | "admin" | "restaurant_owner"

export interface UserProfile {
  uid: string
  email: string
  name?: string
  role: UserRole
  isVerified: boolean
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
  restaurantId?: string // Link to the restaurant if the user is a restaurant owner
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string // e.g., "Main Course", "Appetizer", "Dessert"
  restaurantId: string // ID of the restaurant selling this product
  restaurantName: string // Name of the restaurant selling this product
  isAvailable: boolean // Whether the product is currently available
  preparationTime: number // Estimated preparation time in minutes
  ingredients: string | string[] // List of ingredients or comma-separated string
  allergens: string | string[] // List of common allergens or comma-separated string
  isVegetarian: boolean
  isVegan: boolean
  spiceLevel: "mild" | "medium" | "hot" | "very-hot"
  averageRating?: number
  totalReviews?: number
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
}

export interface Restaurant {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  cuisine: string[] // e.g., ["Indian", "Chinese"]
  imageUrl: string
  ownerId: string // User ID of the restaurant owner
  isActive: boolean // Whether the restaurant is approved by admin and active
  rating: number // Average rating of the restaurant
  totalReviews: number // Total number of reviews for the restaurant
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  restaurantId: string
  restaurantName: string
}

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled" | "delivered"

export interface Order {
  id: string
  userId: string
  userName: string
  userEmail: string
  restaurantId: string // The restaurant this order belongs to
  restaurantName: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  orderDate: Date | Timestamp
  deliveryAddress: string
  contactPhone: string
  notes?: string
  updatedAt?: Date | Timestamp
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  userEmail: string
  rating: number // 1-5 stars
  comment: string
  createdAt: Date | Timestamp
  helpful: number // Number of helpful votes
}

// Email notification types for order events
export type OrderEventType = 'order_placed' | 'order_confirmed' | 'order_delivered'

export interface OrderEventEmailPayload {
  eventType: OrderEventType
  orderId: string
  to: string
  subject: string
  html: string
  text?: string
}

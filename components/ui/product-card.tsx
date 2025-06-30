"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Product } from "@/lib/types"
import { ShoppingCart, Edit, Trash2, Store } from "lucide-react"
import { StarRating } from "./star-rating"

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  isAdmin?: boolean
  onEdit?: (product: Product) => void
  onDelete?: (productId: string) => void
}

export function ProductCard({ product, onAddToCart, isAdmin = false, onEdit, onDelete }: ProductCardProps) {
  const handleAddToCartClick = () => {
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(product)
    }
  }

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(product.id)
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <Link href={`/product/${product.id}`} className="relative block h-48 w-full overflow-hidden">
        <Image
          src={product.imageUrl || "/placeholder.svg?height=300&width=400"}
          alt={product.name}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 hover:scale-105"
        />
      </Link>
      <CardHeader className="flex-grow">
        <CardTitle className="text-xl font-semibold line-clamp-2">{product.name}</CardTitle>
        {product.restaurantId && product.restaurantName && (
          <Link
            href={`/restaurants/${product.restaurantId}`}
            className="flex items-center gap-1 text-sm text-gray-600 hover:underline"
          >
            <Store className="h-3 w-3" />
            <span>{product.restaurantName}</span>
          </Link>
        )}
        <CardDescription className="line-clamp-3 text-sm text-gray-500 mt-2">{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
          {product.averageRating !== undefined && product.totalReviews !== undefined && (
            <div className="flex items-center gap-1">
              <StarRating rating={product.averageRating || 0} size="sm" />
              <span className="text-xs text-gray-500">({product.totalReviews || 0})</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        {isAdmin ? (
          <>
            <Button variant="outline" className="flex-1" onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteClick}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </>
        ) : (
          <Button className="w-full" onClick={handleAddToCartClick}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

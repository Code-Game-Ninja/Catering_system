// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { OrderEventType, OrderEventEmailPayload } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Send an email notification (placeholder implementation).
 * Replace with actual integration (e.g., SendGrid, SMTP, etc.).
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html?: string
  text?: string
}): Promise<void> {
  // TODO: Integrate with real email service (e.g., SendGrid, SMTP, etc.)
  console.log('Sending email to', to, 'with subject', subject)
  // Simulate async email sending
  return Promise.resolve()
}

/**
 * Generate email content for order events.
 */
export function generateOrderEventEmail({
  eventType,
  order,
  recipientRole,
}: {
  eventType: OrderEventType
  order: any
  recipientRole: 'user' | 'restaurant_owner' | 'admin'
}): { subject: string; html: string; text: string } {
  let subject = ''
  let html = ''
  let text = ''
  const orderId = order.id?.substring(0, 8) || order.id
  const orderDate = order.orderDate instanceof Date ? order.orderDate.toLocaleString() : String(order.orderDate)
  const customerName = order.userName || order.customerName || 'Customer'
  const restaurantName = order.restaurantName || 'the restaurant'
  const total = order.totalAmount ? `₹${order.totalAmount.toFixed(2)}` : ''

  if (eventType === 'order_placed') {
    if (recipientRole === 'user') {
      subject = `Your order #${orderId} has been placed!`
      html = `<p>Hi ${customerName},</p><p>Your order <b>#${orderId}</b> was placed on <b>${orderDate}</b> for a total of <b>${total}</b>. We'll notify you when it's confirmed and delivered.</p>`
      text = `Hi ${customerName},\nYour order #${orderId} was placed on ${orderDate} for a total of ${total}. We'll notify you when it's confirmed and delivered.`
    } else if (recipientRole === 'restaurant_owner') {
      subject = `New order #${orderId} received!`
      html = `<p>You have received a new order <b>#${orderId}</b> from ${customerName} on <b>${orderDate}</b> for a total of <b>${total}</b>.</p>`
      text = `You have received a new order #${orderId} from ${customerName} on ${orderDate} for a total of ${total}.`
    } else if (recipientRole === 'admin') {
      subject = `Order #${orderId} placed by ${customerName}`
      html = `<p>Order <b>#${orderId}</b> was placed by ${customerName} on <b>${orderDate}</b> for <b>${total}</b>.</p>`
      text = `Order #${orderId} was placed by ${customerName} on ${orderDate} for ${total}.`
    }
  } else if (eventType === 'order_confirmed') {
    if (recipientRole === 'user') {
      subject = `Your order #${orderId} has been confirmed!`
      html = `<p>Hi ${customerName},</p><p>Your order <b>#${orderId}</b> has been confirmed by ${restaurantName}. We'll notify you when it's delivered.</p>`
      text = `Hi ${customerName},\nYour order #${orderId} has been confirmed by ${restaurantName}. We'll notify you when it's delivered.`
    } else if (recipientRole === 'restaurant_owner') {
      subject = `Order #${orderId} payment confirmed`
      html = `<p>Payment for order <b>#${orderId}</b> has been confirmed.</p>`
      text = `Payment for order #${orderId} has been confirmed.`
    } else if (recipientRole === 'admin') {
      subject = `Order #${orderId} confirmed by ${restaurantName}`
      html = `<p>Order <b>#${orderId}</b> has been confirmed by ${restaurantName}.</p>`
      text = `Order #${orderId} has been confirmed by ${restaurantName}.`
    }
  } else if (eventType === 'order_delivered') {
    if (recipientRole === 'user') {
      subject = `Your order #${orderId} has been delivered!`
      html = `<p>Hi ${customerName},</p><p>Your order <b>#${orderId}</b> has been delivered. Enjoy your meal!</p>`
      text = `Hi ${customerName},\nYour order #${orderId} has been delivered. Enjoy your meal!`
    } else if (recipientRole === 'restaurant_owner') {
      subject = `Order #${orderId} delivered to ${customerName}`
      html = `<p>Order <b>#${orderId}</b> has been delivered to ${customerName}.</p>`
      text = `Order #${orderId} has been delivered to ${customerName}.`
    } else if (recipientRole === 'admin') {
      subject = `Order #${orderId} delivered`
      html = `<p>Order <b>#${orderId}</b> has been delivered.</p>`
      text = `Order #${orderId} has been delivered.`
    }
  }
  return { subject, html, text }
}

import { NextResponse } from "next/server"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import crypto from "crypto"

function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64")
  return hash === hmacHeader
}

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const hmacHeader = headersList.get("x-shopify-hmac-sha256")
    const shopDomain = headersList.get("x-shopify-shop-domain")
    const topic = headersList.get("x-shopify-topic")

    if (!hmacHeader || !shopDomain) {
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 400 }
      )
    }

    const body = await request.text()

    // Find tenant by shop domain
    const tenant = await prisma.tenant.findUnique({
      where: { shopifyDomain: shopDomain },
    })

    if (!tenant || !tenant.webhookSecret) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Verify webhook signature
    const isValid = verifyShopifyWebhook(body, hmacHeader, tenant.webhookSecret)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      )
    }

    const data = JSON.parse(body)

    // Handle different webhook topics
    switch (topic) {
      case "customers/create":
      case "customers/update":
        await handleCustomerWebhook(tenant.id, data)
        break

      case "orders/create":
      case "orders/updated":
        await handleOrderWebhook(tenant.id, data)
        break

      case "products/create":
      case "products/update":
        await handleProductWebhook(tenant.id, data)
        break

      default:
        console.log(`Unhandled webhook topic: ${topic}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function handleCustomerWebhook(tenantId: string, customer: any) {
  await prisma.customer.upsert({
    where: {
      tenantId_shopifyCustomerId: {
        tenantId,
        shopifyCustomerId: customer.id.toString(),
      },
    },
    update: {
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      totalSpent: customer.total_spent || 0,
      ordersCount: customer.orders_count || 0,
      state: customer.state,
      shopifyUpdatedAt: customer.updated_at
        ? new Date(customer.updated_at)
        : null,
    },
    create: {
      tenantId,
      shopifyCustomerId: customer.id.toString(),
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      totalSpent: customer.total_spent || 0,
      ordersCount: customer.orders_count || 0,
      state: customer.state,
      shopifyCreatedAt: customer.created_at
        ? new Date(customer.created_at)
        : null,
      shopifyUpdatedAt: customer.updated_at
        ? new Date(customer.updated_at)
        : null,
    },
  })
}

async function handleOrderWebhook(tenantId: string, order: any) {
  // Find or create customer if exists
  let customerId = null
  if (order.customer?.id) {
    const customer = await prisma.customer.findUnique({
      where: {
        tenantId_shopifyCustomerId: {
          tenantId,
          shopifyCustomerId: order.customer.id.toString(),
        },
      },
    })
    customerId = customer?.id || null
  }

  await prisma.order.upsert({
    where: {
      tenantId_shopifyOrderId: {
        tenantId,
        shopifyOrderId: order.id.toString(),
      },
    },
    update: {
      orderNumber: order.order_number?.toString(),
      customerId,
      email: order.email,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      totalPrice: order.total_price || 0,
      subtotalPrice: order.subtotal_price || 0,
      totalTax: order.total_tax || 0,
      currency: order.currency,
      shopifyUpdatedAt: order.updated_at ? new Date(order.updated_at) : null,
    },
    create: {
      tenantId,
      shopifyOrderId: order.id.toString(),
      orderNumber: order.order_number?.toString(),
      customerId,
      email: order.email,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      totalPrice: order.total_price || 0,
      subtotalPrice: order.subtotal_price || 0,
      totalTax: order.total_tax || 0,
      currency: order.currency,
      shopifyCreatedAt: order.created_at ? new Date(order.created_at) : null,
      shopifyUpdatedAt: order.updated_at ? new Date(order.updated_at) : null,
    },
  })
}

async function handleProductWebhook(tenantId: string, product: any) {
  const variant = product.variants?.[0]
  const image = product.images?.[0]

  await prisma.product.upsert({
    where: {
      tenantId_shopifyProductId: {
        tenantId,
        shopifyProductId: product.id.toString(),
      },
    },
    update: {
      title: product.title,
      description: product.body_html,
      vendor: product.vendor,
      productType: product.product_type,
      status: product.status,
      tags: product.tags?.split(", ") || [],
      price: variant?.price || 0,
      compareAtPrice: variant?.compare_at_price || null,
      inventory: variant?.inventory_quantity || 0,
      imageUrl: image?.src || null,
      shopifyUpdatedAt: product.updated_at
        ? new Date(product.updated_at)
        : null,
    },
    create: {
      tenantId,
      shopifyProductId: product.id.toString(),
      title: product.title,
      description: product.body_html,
      vendor: product.vendor,
      productType: product.product_type,
      status: product.status,
      tags: product.tags?.split(", ") || [],
      price: variant?.price || 0,
      compareAtPrice: variant?.compare_at_price || null,
      inventory: variant?.inventory_quantity || 0,
      imageUrl: image?.src || null,
      shopifyCreatedAt: product.created_at
        ? new Date(product.created_at)
        : null,
      shopifyUpdatedAt: product.updated_at
        ? new Date(product.updated_at)
        : null,
    },
  })
}

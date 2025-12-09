import prisma from "./prisma"
import { createShopifyClient } from "./shopify"
import { Tenant } from "@prisma/client"

export class SyncService {
  private tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  async syncCustomers() {
    const syncLog = await prisma.syncLog.create({
      data: {
        tenantId: this.tenantId,
        syncType: "customers",
        status: "pending",
        itemsCount: 0,
      },
    })

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: this.tenantId },
      })

      if (!tenant) {
        throw new Error("Tenant not found")
      }

      const shopify = createShopifyClient(tenant)
      const response = await shopify.getCustomers()
      const customers = response.customers || []

      let synced = 0

      for (const shopifyCustomer of customers) {
        await prisma.customer.upsert({
          where: {
            tenantId_shopifyCustomerId: {
              tenantId: this.tenantId,
              shopifyCustomerId: shopifyCustomer.id.toString(),
            },
          },
          update: {
            email: shopifyCustomer.email,
            firstName: shopifyCustomer.first_name,
            lastName: shopifyCustomer.last_name,
            phone: shopifyCustomer.phone,
            totalSpent: shopifyCustomer.total_spent || 0,
            ordersCount: shopifyCustomer.orders_count || 0,
            state: shopifyCustomer.state,
            shopifyUpdatedAt: shopifyCustomer.updated_at
              ? new Date(shopifyCustomer.updated_at)
              : null,
          },
          create: {
            tenantId: this.tenantId,
            shopifyCustomerId: shopifyCustomer.id.toString(),
            email: shopifyCustomer.email,
            firstName: shopifyCustomer.first_name,
            lastName: shopifyCustomer.last_name,
            phone: shopifyCustomer.phone,
            totalSpent: shopifyCustomer.total_spent || 0,
            ordersCount: shopifyCustomer.orders_count || 0,
            state: shopifyCustomer.state,
            shopifyCreatedAt: shopifyCustomer.created_at
              ? new Date(shopifyCustomer.created_at)
              : null,
            shopifyUpdatedAt: shopifyCustomer.updated_at
              ? new Date(shopifyCustomer.updated_at)
              : null,
          },
        })
        synced++
      }

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "success",
          itemsCount: synced,
          completedAt: new Date(),
        },
      })

      return { success: true, itemsCount: synced }
    } catch (error) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "failure",
          errorMsg: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      })

      throw error
    }
  }

  async syncProducts() {
    const syncLog = await prisma.syncLog.create({
      data: {
        tenantId: this.tenantId,
        syncType: "products",
        status: "pending",
        itemsCount: 0,
      },
    })

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: this.tenantId },
      })

      if (!tenant) {
        throw new Error("Tenant not found")
      }

      const shopify = createShopifyClient(tenant)
      const response = await shopify.getProducts()
      const products = response.products || []

      let synced = 0

      for (const shopifyProduct of products) {
        const variant = shopifyProduct.variants?.[0]
        const image = shopifyProduct.images?.[0]

        await prisma.product.upsert({
          where: {
            tenantId_shopifyProductId: {
              tenantId: this.tenantId,
              shopifyProductId: shopifyProduct.id.toString(),
            },
          },
          update: {
            title: shopifyProduct.title,
            description: shopifyProduct.body_html,
            vendor: shopifyProduct.vendor,
            productType: shopifyProduct.product_type,
            status: shopifyProduct.status,
            tags: shopifyProduct.tags?.split(", ") || [],
            price: variant?.price || 0,
            compareAtPrice: variant?.compare_at_price || null,
            inventory: variant?.inventory_quantity || 0,
            imageUrl: image?.src || null,
            shopifyUpdatedAt: shopifyProduct.updated_at
              ? new Date(shopifyProduct.updated_at)
              : null,
          },
          create: {
            tenantId: this.tenantId,
            shopifyProductId: shopifyProduct.id.toString(),
            title: shopifyProduct.title,
            description: shopifyProduct.body_html,
            vendor: shopifyProduct.vendor,
            productType: shopifyProduct.product_type,
            status: shopifyProduct.status,
            tags: shopifyProduct.tags?.split(", ") || [],
            price: variant?.price || 0,
            compareAtPrice: variant?.compare_at_price || null,
            inventory: variant?.inventory_quantity || 0,
            imageUrl: image?.src || null,
            shopifyCreatedAt: shopifyProduct.created_at
              ? new Date(shopifyProduct.created_at)
              : null,
            shopifyUpdatedAt: shopifyProduct.updated_at
              ? new Date(shopifyProduct.updated_at)
              : null,
          },
        })
        synced++
      }

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "success",
          itemsCount: synced,
          completedAt: new Date(),
        },
      })

      return { success: true, itemsCount: synced }
    } catch (error) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "failure",
          errorMsg: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      })

      throw error
    }
  }

  async syncOrders() {
    const syncLog = await prisma.syncLog.create({
      data: {
        tenantId: this.tenantId,
        syncType: "orders",
        status: "pending",
        itemsCount: 0,
      },
    })

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: this.tenantId },
      })

      if (!tenant) {
        throw new Error("Tenant not found")
      }

      const shopify = createShopifyClient(tenant)
      const response = await shopify.getOrders()
      const orders = response.orders || []

      let synced = 0

      for (const shopifyOrder of orders) {
        // Find or create customer if exists
        let customerId = null
        if (shopifyOrder.customer?.id) {
          const customer = await prisma.customer.findUnique({
            where: {
              tenantId_shopifyCustomerId: {
                tenantId: this.tenantId,
                shopifyCustomerId: shopifyOrder.customer.id.toString(),
              },
            },
          })
          customerId = customer?.id || null
        }

        const order = await prisma.order.upsert({
          where: {
            tenantId_shopifyOrderId: {
              tenantId: this.tenantId,
              shopifyOrderId: shopifyOrder.id.toString(),
            },
          },
          update: {
            orderNumber: shopifyOrder.order_number?.toString(),
            customerId,
            email: shopifyOrder.email,
            financialStatus: shopifyOrder.financial_status,
            fulfillmentStatus: shopifyOrder.fulfillment_status,
            totalPrice: shopifyOrder.total_price || 0,
            subtotalPrice: shopifyOrder.subtotal_price || 0,
            totalTax: shopifyOrder.total_tax || 0,
            currency: shopifyOrder.currency,
            cancelledAt: shopifyOrder.cancelled_at
              ? new Date(shopifyOrder.cancelled_at)
              : null,
            closedAt: shopifyOrder.closed_at
              ? new Date(shopifyOrder.closed_at)
              : null,
            processedAt: shopifyOrder.processed_at
              ? new Date(shopifyOrder.processed_at)
              : null,
            shopifyUpdatedAt: shopifyOrder.updated_at
              ? new Date(shopifyOrder.updated_at)
              : null,
          },
          create: {
            tenantId: this.tenantId,
            shopifyOrderId: shopifyOrder.id.toString(),
            orderNumber: shopifyOrder.order_number?.toString(),
            customerId,
            email: shopifyOrder.email,
            financialStatus: shopifyOrder.financial_status,
            fulfillmentStatus: shopifyOrder.fulfillment_status,
            totalPrice: shopifyOrder.total_price || 0,
            subtotalPrice: shopifyOrder.subtotal_price || 0,
            totalTax: shopifyOrder.total_tax || 0,
            currency: shopifyOrder.currency,
            cancelledAt: shopifyOrder.cancelled_at
              ? new Date(shopifyOrder.cancelled_at)
              : null,
            closedAt: shopifyOrder.closed_at
              ? new Date(shopifyOrder.closed_at)
              : null,
            processedAt: shopifyOrder.processed_at
              ? new Date(shopifyOrder.processed_at)
              : null,
            shopifyCreatedAt: shopifyOrder.created_at
              ? new Date(shopifyOrder.created_at)
              : null,
            shopifyUpdatedAt: shopifyOrder.updated_at
              ? new Date(shopifyOrder.updated_at)
              : null,
          },
        })

        // Sync line items
        if (shopifyOrder.line_items) {
          // Delete existing items and recreate (simpler than upserting)
          await prisma.orderItem.deleteMany({
            where: { orderId: order.id },
          })

          for (const lineItem of shopifyOrder.line_items) {
            const product = await prisma.product.findUnique({
              where: {
                tenantId_shopifyProductId: {
                  tenantId: this.tenantId,
                  shopifyProductId: lineItem.product_id?.toString() || "0",
                },
              },
            })

            await prisma.orderItem.create({
              data: {
                orderId: order.id,
                productId: product?.id,
                title: lineItem.title,
                quantity: lineItem.quantity,
                price: lineItem.price || 0,
                totalPrice:
                  parseFloat(lineItem.price || "0") * lineItem.quantity,
                sku: lineItem.sku,
                variantId: lineItem.variant_id?.toString(),
              },
            })
          }
        }

        synced++
      }

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "success",
          itemsCount: synced,
          completedAt: new Date(),
        },
      })

      // Update tenant last synced time
      await prisma.tenant.update({
        where: { id: this.tenantId },
        data: { lastSyncedAt: new Date() },
      })

      return { success: true, itemsCount: synced }
    } catch (error) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "failure",
          errorMsg: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      })

      throw error
    }
  }

  async syncAll() {
    const results = {
      customers: { success: false, itemsCount: 0, error: null as string | null },
      products: { success: false, itemsCount: 0, error: null as string | null },
      orders: { success: false, itemsCount: 0, error: null as string | null },
    }

    try {
      const customersResult = await this.syncCustomers()
      results.customers = { ...customersResult, error: null }
    } catch (error) {
      results.customers.error = error instanceof Error ? error.message : "Unknown error"
    }

    try {
      const productsResult = await this.syncProducts()
      results.products = { ...productsResult, error: null }
    } catch (error) {
      results.products.error = error instanceof Error ? error.message : "Unknown error"
    }

    try {
      const ordersResult = await this.syncOrders()
      results.orders = { ...ordersResult, error: null }
    } catch (error) {
      results.orders.error = error instanceof Error ? error.message : "Unknown error"
    }

    return results
  }
}

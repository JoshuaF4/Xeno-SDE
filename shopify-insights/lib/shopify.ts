import { Tenant } from "@prisma/client"

interface ShopifyConfig {
  shopDomain: string
  accessToken: string
}

export class ShopifyClient {
  private config: ShopifyConfig

  constructor(config: ShopifyConfig) {
    this.config = config
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `https://${this.config.shopDomain}/admin/api/2024-01/${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': this.config.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getCustomers(limit = 250, pageInfo?: string) {
    let endpoint = `customers.json?limit=${limit}`
    if (pageInfo) {
      endpoint += `&page_info=${pageInfo}`
    }
    return this.makeRequest(endpoint)
  }

  async getOrders(limit = 250, status = 'any', pageInfo?: string) {
    let endpoint = `orders.json?limit=${limit}&status=${status}`
    if (pageInfo) {
      endpoint += `&page_info=${pageInfo}`
    }
    return this.makeRequest(endpoint)
  }

  async getProducts(limit = 250, pageInfo?: string) {
    let endpoint = `products.json?limit=${limit}`
    if (pageInfo) {
      endpoint += `&page_info=${pageInfo}`
    }
    return this.makeRequest(endpoint)
  }

  async getCustomer(customerId: string) {
    return this.makeRequest(`customers/${customerId}.json`)
  }

  async getOrder(orderId: string) {
    return this.makeRequest(`orders/${orderId}.json`)
  }

  async getProduct(productId: string) {
    return this.makeRequest(`products/${productId}.json`)
  }
}

export function createShopifyClient(tenant: Tenant): ShopifyClient {
  if (!tenant.shopifyAccessToken) {
    throw new Error('Tenant does not have Shopify access token')
  }

  return new ShopifyClient({
    shopDomain: tenant.shopifyDomain,
    accessToken: tenant.shopifyAccessToken,
  })
}

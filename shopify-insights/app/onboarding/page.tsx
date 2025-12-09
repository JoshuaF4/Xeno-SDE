"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Store } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    shopifyDomain: "",
    shopifyAccessToken: "",
    shopifyApiKey: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create tenant")
        return
      }

      // Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Store className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Connect Your Shopify Store
            </h1>
            <p className="text-gray-600">
              Enter your Shopify store details to start syncing data
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Store Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="My Awesome Store"
              />
            </div>

            <div>
              <label
                htmlFor="shopifyDomain"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Shopify Domain
              </label>
              <input
                id="shopifyDomain"
                type="text"
                value={formData.shopifyDomain}
                onChange={(e) =>
                  setFormData({ ...formData, shopifyDomain: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="mystore.myshopify.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your Shopify store URL (e.g., mystore.myshopify.com)
              </p>
            </div>

            <div>
              <label
                htmlFor="shopifyAccessToken"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Shopify Access Token (Optional)
              </label>
              <input
                id="shopifyAccessToken"
                type="password"
                value={formData.shopifyAccessToken}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shopifyAccessToken: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="shpat_..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Generate this from your Shopify Admin API settings
              </p>
            </div>

            <div>
              <label
                htmlFor="shopifyApiKey"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Shopify API Key (Optional)
              </label>
              <input
                id="shopifyApiKey"
                type="text"
                value={formData.shopifyApiKey}
                onChange={(e) =>
                  setFormData({ ...formData, shopifyApiKey: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Your API Key"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">
                How to get your Shopify credentials:
              </h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to your Shopify Admin panel</li>
                <li>Navigate to Settings → Apps and sales channels → Develop apps</li>
                <li>Create a new app or use an existing one</li>
                <li>Configure API scopes (read_customers, read_orders, read_products)</li>
                <li>Install the app and copy the Admin API access token</li>
              </ol>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? "Connecting..." : "Connect Store"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

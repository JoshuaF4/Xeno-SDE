"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { LogOut, RefreshCw, Settings } from "lucide-react"
import DashboardStats from "@/components/DashboardStats"
import OrdersChart from "@/components/OrdersChart"
import TopCustomers from "@/components/TopCustomers"
import Link from "next/link"

interface DashboardData {
  overview: {
    totalCustomers: number
    totalOrders: number
    totalProducts: number
    totalRevenue: number
    averageOrderValue: number
  }
  topCustomers: Array<{
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
    totalSpent: number
    ordersCount: number
  }>
  ordersOverTime: Array<{
    date: string
    orders: number
    revenue: number
  }>
}

export default function DashboardClient({ session }: { session: any }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError("")

      const [overviewRes, ordersRes] = await Promise.all([
        fetch("/api/analytics/overview"),
        fetch("/api/analytics/orders-over-time?days=30"),
      ])

      if (!overviewRes.ok || !ordersRes.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const overviewData = await overviewRes.json()
      const ordersData = await ordersRes.json()

      setData({
        overview: overviewData.overview,
        topCustomers: overviewData.topCustomers,
        ordersOverTime: ordersData.data,
      })
    } catch (err) {
      setError("Failed to load dashboard data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (syncType: string) => {
    try {
      setSyncing(true)
      setError("")

      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ syncType }),
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      // Refresh dashboard data after sync
      await fetchDashboardData()
    } catch (err) {
      setError("Sync failed. Please try again.")
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Shopify Insights Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {session.user.name || session.user.email}
              </p>
            </div>
            <div className="flex gap-3">
              {!session.user.tenantId && (
                <Link
                  href="/onboarding"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Settings className="w-4 h-4" />
                  Setup Store
                </Link>
              )}
              <button
                onClick={() => handleSync("all")}
                disabled={syncing || !session.user.tenantId}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Data"}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!session.user.tenantId ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Store Connected
            </h2>
            <p className="text-gray-600 mb-6">
              Connect your Shopify store to start seeing insights
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Settings className="w-5 h-5" />
              Connect Store
            </Link>
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Stats */}
            <DashboardStats
              totalCustomers={data.overview.totalCustomers}
              totalOrders={data.overview.totalOrders}
              totalProducts={data.overview.totalProducts}
              totalRevenue={data.overview.totalRevenue}
              averageOrderValue={data.overview.averageOrderValue}
            />

            {/* Charts and Lists */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <OrdersChart data={data.ordersOverTime} />
              </div>
              <div>
                <TopCustomers customers={data.topCustomers} />
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                Data Sync Information
              </h3>
              <p className="text-blue-800 text-sm">
                Click "Sync Data" to fetch the latest data from your Shopify store.
                Webhooks are configured for real-time updates on new orders, customers, and products.
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

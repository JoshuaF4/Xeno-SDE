"use client"

import { Users, ShoppingCart, Package, DollarSign } from "lucide-react"

interface StatsProps {
  totalCustomers: number
  totalOrders: number
  totalProducts: number
  totalRevenue: number
  averageOrderValue: number
}

export default function DashboardStats({
  totalCustomers,
  totalOrders,
  totalProducts,
  totalRevenue,
  averageOrderValue,
}: StatsProps) {
  const stats = [
    {
      label: "Total Customers",
      value: totalCustomers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Total Products",
      value: totalProducts.toLocaleString(),
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "Avg Order Value",
      value: `$${averageOrderValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`${stat.color} w-6 h-6`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

"use client"

interface Customer {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  totalSpent: number
  ordersCount: number
}

interface TopCustomersProps {
  customers: Customer[]
}

export default function TopCustomers({ customers }: TopCustomersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Top 5 Customers by Spend
      </h3>
      <div className="space-y-4">
        {customers.map((customer, index) => (
          <div
            key={customer.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {customer.firstName || customer.lastName
                    ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
                    : customer.email || "Unknown"}
                </p>
                {customer.email && (customer.firstName || customer.lastName) && (
                  <p className="text-sm text-gray-600">{customer.email}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                ${customer.totalSpent.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-gray-600">
                {customer.ordersCount} {customer.ordersCount === 1 ? "order" : "orders"}
              </p>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-gray-500 text-center py-8">No customer data available</p>
        )}
      </div>
    </div>
  )
}

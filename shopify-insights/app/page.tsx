import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Shopify Insights Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Multi-tenant data ingestion and analytics service for Shopify stores
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/api/auth/signin"
            className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Real-time Sync</h3>
            <p className="text-gray-600">Webhooks and scheduled jobs keep your data up-to-date</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Multi-tenant</h3>
            <p className="text-gray-600">Secure data isolation for multiple Shopify stores</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-gray-600">Powerful insights into customers, orders, and revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
}

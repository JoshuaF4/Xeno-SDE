import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || !session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId

    // Get overview metrics
    const [
      totalCustomers,
      totalOrders,
      totalProducts,
      revenueData,
      topCustomers,
    ] = await Promise.all([
      // Total customers
      prisma.customer.count({
        where: { tenantId },
      }),

      // Total orders
      prisma.order.count({
        where: { tenantId },
      }),

      // Total products
      prisma.product.count({
        where: { tenantId },
      }),

      // Total revenue
      prisma.order.aggregate({
        where: {
          tenantId,
          financialStatus: "paid",
        },
        _sum: {
          totalPrice: true,
        },
        _avg: {
          totalPrice: true,
        },
      }),

      // Top 5 customers by spend
      prisma.customer.findMany({
        where: { tenantId },
        orderBy: {
          totalSpent: "desc",
        },
        take: 5,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          totalSpent: true,
          ordersCount: true,
        },
      }),
    ])

    const totalRevenue = revenueData._sum.totalPrice || 0
    const averageOrderValue = revenueData._avg.totalPrice || 0

    return NextResponse.json({
      overview: {
        totalCustomers,
        totalOrders,
        totalProducts,
        totalRevenue: parseFloat(totalRevenue.toString()),
        averageOrderValue: parseFloat(averageOrderValue.toString()),
      },
      topCustomers: topCustomers.map((customer) => ({
        ...customer,
        totalSpent: parseFloat(customer.totalSpent.toString()),
      })),
    })
  } catch (error) {
    console.error("Analytics overview error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

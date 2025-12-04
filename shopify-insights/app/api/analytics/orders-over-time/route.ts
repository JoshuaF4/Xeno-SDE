import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { subDays, format } from "date-fns"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || !session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")

    const tenantId = session.user.tenantId
    const startDate = subDays(new Date(), days)

    // Get orders grouped by date
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        shopifyCreatedAt: {
          gte: startDate,
        },
      },
      select: {
        shopifyCreatedAt: true,
        totalPrice: true,
        financialStatus: true,
      },
      orderBy: {
        shopifyCreatedAt: "asc",
      },
    })

    // Group orders by date
    const ordersByDate = orders.reduce((acc: any, order) => {
      if (!order.shopifyCreatedAt) return acc

      const dateKey = format(order.shopifyCreatedAt, "yyyy-MM-dd")

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          count: 0,
          revenue: 0,
        }
      }

      acc[dateKey].count += 1
      if (order.financialStatus === "paid") {
        acc[dateKey].revenue += parseFloat(order.totalPrice.toString())
      }

      return acc
    }, {})

    const ordersData = Object.values(ordersByDate).map((item: any) => ({
      date: item.date,
      orders: item.count,
      revenue: Math.round(item.revenue * 100) / 100,
    }))

    return NextResponse.json({ data: ordersData })
  } catch (error) {
    console.error("Orders over time error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

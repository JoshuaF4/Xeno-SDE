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

    // Get top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          tenantId,
        },
        productId: {
          not: null,
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          totalPrice: "desc",
        },
      },
      take: 10,
    })

    // Get product details
    const productIds = topProducts
      .map((p) => p.productId)
      .filter((id): id is string => id !== null)

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        title: true,
        price: true,
        vendor: true,
      },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    const productPerformance = topProducts
      .map((item) => {
        if (!item.productId) return null

        const product = productMap.get(item.productId)
        if (!product) return null

        return {
          productId: item.productId,
          title: product.title,
          vendor: product.vendor,
          unitsSold: item._sum.quantity || 0,
          revenue: parseFloat((item._sum.totalPrice || 0).toString()),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    return NextResponse.json({ data: productPerformance })
  } catch (error) {
    console.error("Product performance error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

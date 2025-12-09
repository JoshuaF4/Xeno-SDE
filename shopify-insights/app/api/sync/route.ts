import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { SyncService } from "@/lib/sync-service"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: "User is not associated with a tenant" },
        { status: 400 }
      )
    }

    const { syncType } = await request.json()

    const syncService = new SyncService(session.user.tenantId)

    let result

    switch (syncType) {
      case "customers":
        result = await syncService.syncCustomers()
        break
      case "products":
        result = await syncService.syncProducts()
        break
      case "orders":
        result = await syncService.syncOrders()
        break
      case "all":
        result = await syncService.syncAll()
        break
      default:
        return NextResponse.json(
          { error: "Invalid sync type" },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    )
  }
}

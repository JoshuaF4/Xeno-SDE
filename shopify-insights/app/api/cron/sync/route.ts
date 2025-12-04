import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { SyncService } from "@/lib/sync-service"

// This endpoint will be called by Vercel Cron or external scheduler
export async function GET(request: Request) {
  try {
    // Verify the request is from a cron job (Vercel Cron or manual trigger)
    const authHeader = request.headers.get("authorization")

    // For production, you should verify this is coming from Vercel Cron
    // using the CRON_SECRET environment variable
    if (process.env.NODE_ENV === "production") {
      const cronSecret = process.env.CRON_SECRET
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        shopifyAccessToken: {
          not: null,
        },
      },
    })

    const results = []

    // Sync data for each tenant
    for (const tenant of tenants) {
      try {
        const syncService = new SyncService(tenant.id)
        const result = await syncService.syncAll()

        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          success: true,
          result,
        })
      } catch (error) {
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      syncedTenants: results.length,
      results,
    })
  } catch (error) {
    console.error("Cron sync error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { randomBytes } from "crypto"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, shopifyDomain, shopifyAccessToken, shopifyApiKey } =
      await request.json()

    // Validate input
    if (!name || !shopifyDomain) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { shopifyDomain },
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: "Tenant with this Shopify domain already exists" },
        { status: 400 }
      )
    }

    // Generate webhook secret
    const webhookSecret = randomBytes(32).toString("hex")

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        shopifyDomain,
        shopifyAccessToken,
        shopifyApiKey,
        webhookSecret,
        isActive: true,
      },
    })

    // Associate user with tenant if they don't have one
    if (!session.user.tenantId) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { tenantId: tenant.id },
      })
    }

    return NextResponse.json(
      {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          shopifyDomain: tenant.shopifyDomain,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Tenant creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId") || session.user.tenantId

    if (!tenantId) {
      return NextResponse.json(
        { error: "No tenant ID provided" },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        shopifyDomain: true,
        isActive: true,
        lastSyncedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({ tenant })
  } catch (error) {
    console.error("Tenant fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

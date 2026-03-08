import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { WebhookEvent } from "@clerk/nextjs/server" // Use official types
import { createUser, updateUserByClerkId, deleteUserByClerkId } from "@/lib/db/queries/users"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  // Next.js 15 uses await headers(). Remove 'await' if on Next.js 14 or below.
  const headerPayload = await headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let event: WebhookEvent // Replaced manual type with official type

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const { type, data } = event

  try {
    switch (type) {
      case "user.created": {
        // Clerk types require checking if email_addresses exists for this event
        const primaryEmail = data.email_addresses?.[0]?.email_address ?? ""

        await createUser({
          clerkId: data.id,
          email: primaryEmail,
          firstName: data.first_name ?? null,
          lastName: data.last_name ?? null,
          imageUrl: data.image_url ?? null,
          role: (data.unsafe_metadata?.role as string) ?? null,
        })

        console.log(`User created in DB: ${data.id}`)
        break
      }

      case "user.updated": {
        const primaryEmail = data.email_addresses?.[0]?.email_address ?? ""

        await updateUserByClerkId(data.id, {
          email: primaryEmail,
          firstName: data.first_name ?? null,
          lastName: data.last_name ?? null,
          imageUrl: data.image_url ?? null,
          role: (data.unsafe_metadata?.role as string) ?? null,
        })

        console.log(`User updated in DB: ${data.id}`)
        break
      }

      case "user.deleted": {
        // Clerk's type for data.id in 'user.deleted' is slightly stricter
        if (data.id) {
          await deleteUserByClerkId(data.id)
          console.log(`User deleted from DB: ${data.id}`)
        }
        break
      }

      default:
        console.log(`Unhandled webhook event: ${type}`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    // If you see this log in your terminal, the issue is in your DB queries!
    console.error(`Error processing DB logic for event ${type}:`, err)
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 })
  }
}

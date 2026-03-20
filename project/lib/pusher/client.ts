/* ============================================
   Pusher Client Instance

   Browser-side Pusher singleton. Connects once
   and reuses the same connection across the app.

   ONLY import this in client components / hooks.
   ============================================ */

import PusherClient from "pusher-js"

let pusherClient: PusherClient | null = null

/**
 * Get or create the client-side Pusher instance.
 * Lazy-initialized so it only connects when first needed.
 */
export function getPusherClient(): PusherClient {
  if (pusherClient) return pusherClient

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

  if (!key || !cluster) {
    throw new Error(
      "Missing Pusher client environment variables. " +
        "Required: NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER"
    )
  }

  pusherClient = new PusherClient(key, {
    cluster,
    authEndpoint: "/api/pusher/auth",
    authTransport: "ajax",
    auth: {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  })

  return pusherClient
}

/**
 * Disconnect the Pusher client.
 * Call on app unmount or sign-out if needed.
 */
export function disconnectPusher(): void {
  if (pusherClient) {
    pusherClient.disconnect()
    pusherClient = null
  }
}

"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import type PusherClient from "pusher-js"
import { getPusherClient, disconnectPusher } from "@/lib/pusher/client"

const PusherContext = createContext<PusherClient | null>(null)

export function usePusher(): PusherClient | null {
  return useContext(PusherContext)
}

export function PusherProvider({ children }: { children: ReactNode }) {
  const client = getPusherClient()

  useEffect(() => {
    return () => {
      disconnectPusher()
    }
  }, [])

  return <PusherContext.Provider value={client}>{children}</PusherContext.Provider>
}

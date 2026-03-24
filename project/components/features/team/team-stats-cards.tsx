"use client"

import { Users, Shield, UserPlus, Eye } from "lucide-react"
import type { MemberCounts } from "@/types/team"

export function TeamStatsCards({ counts }: { counts: MemberCounts }) {
  const stats = [
    { label: "Members", value: counts.total, icon: Users },
    { label: "Admins", value: counts.admins, icon: Shield },
    { label: "Contributors", value: counts.contributors, icon: UserPlus },
    { label: "Viewers", value: counts.viewers, icon: Eye },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
          <p className="text-4xl font-bold text-foreground">{stat.value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

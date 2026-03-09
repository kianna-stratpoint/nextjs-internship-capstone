function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "GOOD MORNING"
  if (hour < 18) return "GOOD AFTERNOON"
  return "GOOD EVENING"
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

interface DashboardGreetingProps {
  firstName?: string
}

export function DashboardGreeting({ firstName = "there" }: DashboardGreetingProps) {
  return (
    <div className="border-l-2 border-border pl-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {getGreeting()}
      </p>

      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        Welcome back, {firstName}
        <span className="text-brand">.</span>
      </h1>

      <p className="mt-0.5 text-sm text-muted-foreground">{getFormattedDate()}</p>
    </div>
  )
}

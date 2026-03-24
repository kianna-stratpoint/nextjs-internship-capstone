"use client"

import { useRef } from "react"
import { CheckSquare, Users, BarChart3, Calendar, ChevronLeft, ChevronRight } from "lucide-react"

const features = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground"
      >
        <rect width="6" height="14" x="2" y="5" rx="1" />
        <rect width="6" height="10" x="16" y="9" rx="1" />
        <rect width="6" height="18" x="9" y="3" rx="1" />
      </svg>
    ),
    title: "Visual Kanban Boards",
    description: "Drag-and-drop boards that actually feel good to use.",
  },
  {
    icon: <CheckSquare size={24} className="text-foreground" />,
    title: "Task Management",
    description: "Assign tasks, track progress, and see who's doing what.",
  },
  {
    icon: <Users size={24} className="text-foreground" />,
    title: "Team Collaboration",
    description: "Invite members. Everyone sees what matters to them, and nothing more.",
  },
  {
    icon: <BarChart3 size={24} className="text-foreground" />,
    title: "Analytics",
    description:
      "Monitor project velocity, team efficiency, and task completion with real-time insights.",
  },
  {
    icon: <Calendar size={24} className="text-foreground" />,
    title: "Calendar",
    description: "See upcoming deadlines, milestones, and events in a unified calendar view.",
  },
]

export function Features() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const gap = 16
    const cardWidth = container.firstElementChild
      ? (container.firstElementChild as HTMLElement).offsetWidth + gap
      : 300
    container.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    })
  }

  return (
    <section id="features" className="px-4 pb-24 pt-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Built for you
        </div>

        {/* Heading row with carousel arrows */}
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Why{" "}
            <span className="font-black">
              FLOE<span className="text-brand">.</span>
            </span>
            ?
          </h2>

          {/* Carousel nav arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Scroll features left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Scroll features right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <p className="mb-8 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
          Designed to fit the way how you actually work. FLOE. keeps your work moving — from idea to
          done — without the chaos of overcomplicated tools.
        </p>

        {/* Carousel — no visible scrollbar */}
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex w-[85vw] max-w-[340px] flex-none snap-start flex-col justify-between rounded-xl border border-border p-6 transition-all hover:border-muted-foreground/20 hover:shadow-sm sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
            >
              {/* Icon — top right */}
              <div className="mb-16 flex justify-end">{feature.icon}</div>

              {/* Title + description — bottom */}
              <div>
                <h3 className="mb-2 font-display text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

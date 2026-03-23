import Image from "next/image"

export function Preview() {
  return (
    <section id="preview" className="relative px-4 pb-24 pt-16 sm:px-6 md:pb-32">
      <div className="mx-auto max-w-7xl">
        {/* Small decorative curve */}
        <svg
          viewBox="0 0 200 60"
          fill="none"
          className="mb-6 h-8 w-auto text-muted-foreground sm:mb-8 sm:h-10 md:h-12"
          aria-hidden="true"
        >
          <path
            d="M267.779 15.2084C152.827 129.8 106.827 -64.6997 0.981466 26.8877"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        <div className="grid items-start gap-8 sm:gap-10 md:grid-cols-[1fr_2fr] md:gap-12">
          {/* Left text */}
          <div>
            <h2 className="mb-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-4xl lg:text-5xl">
              Designed To
              <br />
              Help You Do
              <br />
              More <em className="font-normal italic">With Less</em>
              <br />
              <em className="font-normal italic">Stress</em>
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              A calm, focused interface that gets out of your way. No information overload. No
              feature cemetery. Just the tools your team actually uses.
            </p>
          </div>

          {/* Right — Application Screenshots */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Screenshot 1 */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/50 bg-muted shadow-sm transition-transform hover:scale-[1.02]">
              <Image
                src="/images/preview-1-v2.png"
                alt="Kanban Board View"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>

            {/* Screenshot 2 (Staggered) */}
            <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-xl border border-border/50 bg-muted shadow-sm transition-transform hover:scale-[1.02] sm:mt-8">
              <Image
                src="/images/preview-2-v2.png"
                alt="Task Details Modal"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>

            {/* Screenshot 3 */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/50 bg-muted shadow-sm transition-transform hover:scale-[1.02]">
              <Image
                src="/images/preview-3-v2.png"
                alt="Project Dashboard"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>

            {/* Screenshot 4 (Staggered) */}
            <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-xl border border-border/50 bg-muted shadow-sm transition-transform hover:scale-[1.02] sm:mt-8">
              <Image
                src="/images/preview-4.png"
                alt="Team Activity Feed"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

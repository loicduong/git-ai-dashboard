import Link from "next/link"
import {
  ActivityIcon,
  BarChart3Icon,
  GitBranchIcon,
  LayoutDashboardIcon,
  TrophyIcon,
  UserPlusIcon,
} from "lucide-react"

import { RangeFilter, type RangeValue } from "@/components/range-filter"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Overview", href: "/me", icon: LayoutDashboardIcon },
  { label: "Projects", href: "/projects", icon: GitBranchIcon },
  { label: "Leaderboard", href: "/leaderboard", icon: TrophyIcon },
  { label: "Activity", href: "/activity", icon: ActivityIcon },
  { label: "Onboarding", href: "/onboarding", icon: UserPlusIcon },
]

type AppShellProps = {
  children: React.ReactNode
  range?: RangeValue
  title?: string
  description?: string
  className?: string
}

export function AppShell({
  children,
  range,
  title = "Executive Overview",
  description = "AI contribution intelligence across repositories, teams, and time.",
  className,
}: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      <div className="grid min-h-screen lg:grid-cols-[17rem_1fr]">
        <aside className="border-b bg-card/55 backdrop-blur-xl lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-6 p-4">
            <Link href="/me" className="flex items-center gap-3 rounded-md px-2 py-1.5">
              <span className="flex size-9 items-center justify-center rounded-md border bg-primary text-primary-foreground">
                <BarChart3Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">Git AI Dashboard</span>
                <span className="block truncate text-xs text-muted-foreground">Executive Glass</span>
              </span>
            </Link>

            <Separator />

            <nav aria-label="Primary navigation" className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 border-b bg-background/80 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Git AI Intelligence
                </p>
                <h1 className="mt-1 truncate text-2xl font-semibold">{title}</h1>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
              </div>
              {range ? <RangeFilter range={range} /> : null}
            </div>
          </header>

          <div className="px-4 py-4 lg:px-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

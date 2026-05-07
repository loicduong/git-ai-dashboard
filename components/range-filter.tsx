"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type RangeValue = "7d" | "30d" | "quarter"

const RANGE_OPTIONS: Array<{ value: RangeValue; label: string }> = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "quarter", label: "Quarter" },
]

type RangeFilterProps = {
  range?: RangeValue
  className?: string
}

export function RangeFilter({ range = "30d", className }: RangeFilterProps) {
  const pathname = usePathname() || "/"
  const searchParams = useSearchParams()

  return (
    <nav
      aria-label="Dashboard date range"
      className={cn("flex items-center gap-1 rounded-md border bg-card/70 p-1 backdrop-blur", className)}
    >
      {RANGE_OPTIONS.map((option) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("range", option.value)
        const isActive = option.value === range

        return (
          <Button
            key={option.value}
            asChild
            size="sm"
            variant={isActive ? "secondary" : "ghost"}
            aria-current={isActive ? "page" : undefined}
            className="h-7 px-2.5 text-xs"
          >
            <Link href={`${pathname}?${params.toString()}`}>{option.label}</Link>
          </Button>
        )
      })}
    </nav>
  )
}

import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type KpiCardProps = {
  title: string
  value: string
  icon: LucideIcon
  description?: string
  trend?: string
  className?: string
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("border-border/70 bg-card/70 shadow-xl backdrop-blur-xl", className)}>
      <CardHeader className="gap-1 pb-0">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <CardAction>
          <span className="flex size-8 items-center justify-center rounded-md border bg-secondary text-secondary-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </CardAction>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div className="min-w-0 truncate text-3xl font-semibold tracking-normal">{value}</div>
        {trend ? (
          <Badge variant="secondary" className="shrink-0">
            {trend}
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  )
}

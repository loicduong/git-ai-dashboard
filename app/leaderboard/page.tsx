import { MedalIcon } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getDashboardData } from "@/lib/data/dashboard"
import { formatInteger, formatPercent } from "@/lib/format"
import { parseDashboardRange } from "@/lib/analytics/ranges"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type LeaderboardRow = Record<string, React.ReactNode> & {
  rank: React.ReactNode
  author: React.ReactNode
  aiAdditions: string
  aiShare: string
  reposTouched: string
  estimatedHoursSaved: string
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = (await searchParams) ?? {}
  const range = parseDashboardRange(params.range)
  const data = await getDashboardData(range)
  const rows = data.leaderboard.map((contributor, index): LeaderboardRow => ({
    rank: (
      <span className="inline-flex items-center gap-2">
        <MedalIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        {index + 1}
      </span>
    ),
    author: (
      <span className="flex min-w-[12rem] items-center gap-2">
        <span className="truncate font-medium">{contributor.author}</span>
        {contributor.isLowVolume ? <Badge variant="outline">Low volume</Badge> : null}
      </span>
    ),
    aiAdditions: formatInteger(contributor.aiAdditions),
    aiShare: formatPercent(contributor.aiShare),
    reposTouched: formatInteger(contributor.reposTouched),
    estimatedHoursSaved: formatInteger(contributor.estimatedHoursSaved),
  }))

  return (
    <AppShell
      range={range}
      title="Leaderboard"
      description="Ranked contributors by AI-authored additions and impact."
    >
      <DataTable
        title="Contributor impact"
        description="Low-volume contributors are flagged below 100 total additions."
        columns={leaderboardColumns}
        data={rows}
        getRowKey={(row, index) => `${row.author}-${index}`}
      />
    </AppShell>
  )
}

const leaderboardColumns: Array<DataTableColumn<LeaderboardRow>> = [
  { key: "rank", header: "Rank" },
  { key: "author", header: "Contributor" },
  { key: "aiAdditions", header: "AI additions", className: "text-right" },
  { key: "aiShare", header: "AI share", className: "text-right" },
  { key: "reposTouched", header: "Repos touched", className: "text-right" },
  { key: "estimatedHoursSaved", header: "Hours saved", className: "text-right" },
]

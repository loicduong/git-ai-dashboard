import { AppShell } from "@/components/app-shell"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getDashboardData } from "@/lib/data/dashboard"
import { formatInteger, formatPercent, shortRepoName } from "@/lib/format"
import { parseDashboardRange } from "@/lib/analytics/ranges"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type ActivityRow = Record<string, React.ReactNode> & {
  timestamp: string
  date: string
  repo: string
  author: string
  aiLines: string
  humanLines: string
  aiShare: React.ReactNode
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = (await searchParams) ?? {}
  const range = parseDashboardRange(params.range)
  const data = await getDashboardData(range)
  const rows = data.activity.map((record): ActivityRow => {
    const totalAdditions = record.ai_additions + record.human_additions

    return {
      timestamp: formatTime(record.timestamp),
      date: formatDate(record.timestamp),
      repo: shortRepoName(record.repo_url),
      author: record.author,
      aiLines: formatInteger(record.ai_additions),
      humanLines: formatInteger(record.human_additions),
      aiShare: <Badge variant="secondary">{formatPercent(totalAdditions === 0 ? 0 : record.ai_additions / totalAdditions)}</Badge>,
    }
  })

  return (
    <AppShell
      range={range}
      title="Activity"
      description="Latest ingested Git AI metric records."
    >
      <DataTable
        title="Latest records"
        description="Records are sorted newest first by upload timestamp."
        columns={activityColumns}
        data={rows}
        getRowKey={(row, index) => `${row.date}-${row.timestamp}-${row.repo}-${index}`}
      />
    </AppShell>
  )
}

const activityColumns: Array<DataTableColumn<ActivityRow>> = [
  { key: "timestamp", header: "Time" },
  { key: "date", header: "Date" },
  { key: "repo", header: "Repo" },
  { key: "author", header: "Author" },
  { key: "aiLines", header: "AI lines", className: "text-right" },
  { key: "humanLines", header: "Human lines", className: "text-right" },
  { key: "aiShare", header: "AI share", className: "text-right" },
]

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

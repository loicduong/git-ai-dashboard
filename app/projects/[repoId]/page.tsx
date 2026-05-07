import { notFound } from "next/navigation"
import { ActivityIcon, BotIcon, ClockIcon, UsersIcon } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { KpiCard } from "@/components/kpi-card"
import { MetricLineChart } from "@/components/metric-line-chart"
import { Badge } from "@/components/ui/badge"
import { getDashboardData } from "@/lib/data/dashboard"
import { formatInteger, formatPercent, shortRepoName } from "@/lib/format"
import { parseDashboardRange } from "@/lib/analytics/ranges"

type PageParams = Promise<{ repoId: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

type ActivityRow = Record<string, React.ReactNode> & {
  timestamp: string
  author: string
  aiLines: string
  humanLines: string
  aiShare: React.ReactNode
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: PageParams
  searchParams?: SearchParams
}) {
  const [{ repoId }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const repoUrl = decodeRepoId(repoId)
  const range = parseDashboardRange(resolvedSearchParams?.range)
  const data = await getDashboardData(range)
  const project = data.projects.find((candidate) => candidate.repoUrl === repoUrl)

  if (!project) {
    notFound()
  }

  const activity = data.activity.filter((record) => record.repo_url === repoUrl)
  const activityRows = activity.map((record): ActivityRow => {
    const totalAdditions = record.ai_additions + record.human_additions

    return {
      timestamp: formatDateTime(record.timestamp),
      author: record.author,
      aiLines: formatInteger(record.ai_additions),
      humanLines: formatInteger(record.human_additions),
      aiShare: <Badge variant="secondary">{formatPercent(totalAdditions === 0 ? 0 : record.ai_additions / totalAdditions)}</Badge>,
    }
  })

  return (
    <AppShell
      range={range}
      title={shortRepoName(repoUrl)}
      description="Repository-specific AI and human contribution profile."
    >
      <div className="flex flex-col gap-4">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="AI-written lines"
            value={formatInteger(project.aiAdditions)}
            icon={BotIcon}
            description="AI additions in this repository"
          />
          <KpiCard
            title="AI share"
            value={formatPercent(project.aiShare)}
            icon={ActivityIcon}
            description="Repository additions from AI"
          />
          <KpiCard
            title="Active authors"
            value={formatInteger(project.activeAuthors)}
            icon={UsersIcon}
            description="Contributors active in range"
          />
          <KpiCard
            title="Hours saved"
            value={formatInteger(project.aiAdditions / 50)}
            icon={ClockIcon}
            description="Estimated from repo AI additions"
          />
        </section>

        <MetricLineChart
          title="Repository additions"
          description="Daily AI and human additions derived from this repository's activity records."
          data={buildRepoTrend(activity)}
        />

        <DataTable
          title="Repository activity"
          description="Latest records for this repository."
          columns={activityColumns}
          data={activityRows}
          getRowKey={(row, index) => `${row.timestamp}-${row.author}-${index}`}
        />
      </div>
    </AppShell>
  )
}

const activityColumns: Array<DataTableColumn<ActivityRow>> = [
  { key: "timestamp", header: "Time" },
  { key: "author", header: "Author" },
  { key: "aiLines", header: "AI lines", className: "text-right" },
  { key: "humanLines", header: "Human lines", className: "text-right" },
  { key: "aiShare", header: "AI share", className: "text-right" },
]

function buildRepoTrend(
  activity: Array<{ timestamp: string; ai_additions: number; human_additions: number }>,
) {
  const byDate = new Map<string, { ai: number; human: number }>()

  for (const record of activity) {
    const label = record.timestamp.slice(0, 10)
    const current = byDate.get(label) ?? { ai: 0, human: 0 }
    current.ai += record.ai_additions
    current.human += record.human_additions
    byDate.set(label, current)
  }

  return Array.from(byDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, value]) => ({ label: date.slice(5), ...value }))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function decodeRepoId(repoId: string): string {
  return Buffer.from(repoId, "base64url").toString("utf8")
}

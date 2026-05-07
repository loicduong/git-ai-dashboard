import Link from "next/link"
import { BotIcon, ClockIcon, Code2Icon, UserIcon } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { KpiCard } from "@/components/kpi-card"
import { MetricLineChart } from "@/components/metric-line-chart"
import { getDashboardData } from "@/lib/data/dashboard"
import { formatInteger, formatPercent, shortRepoName } from "@/lib/format"
import { parseDashboardRange } from "@/lib/analytics/ranges"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type ActivityRow = Record<string, React.ReactNode> & {
  timestamp: string
  repo: string
  author: string
  aiLines: string
  humanLines: string
  aiShare: string
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = (await searchParams) ?? {}
  const range = parseDashboardRange(params.range)
  const data = await getDashboardData(range)
  const recentActivity = data.activity.slice(0, 8).map((record): ActivityRow => {
    const totalAdditions = record.ai_additions + record.human_additions

    return {
      timestamp: formatDateTime(record.timestamp),
      repo: shortRepoName(record.repo_url),
      author: record.author,
      aiLines: formatInteger(record.ai_additions),
      humanLines: formatInteger(record.human_additions),
      aiShare: formatPercent(totalAdditions === 0 ? 0 : record.ai_additions / totalAdditions),
    }
  })

  return (
    <AppShell
      range={range}
      title="Executive Overview"
      description="AI-authored contribution trends across all connected repositories."
    >
      <div className="flex flex-col gap-4">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="AI-written lines"
            value={formatInteger(data.kpis.aiAdditions)}
            icon={BotIcon}
            description="Additions attributed to AI assistance"
          />
          <KpiCard
            title="Human-written lines"
            value={formatInteger(data.kpis.humanAdditions)}
            icon={UserIcon}
            description="Manual additions in the selected range"
          />
          <KpiCard
            title="AI share"
            value={formatPercent(data.kpis.aiShare)}
            icon={Code2Icon}
            description="AI additions divided by total additions"
          />
          <KpiCard
            title="Hours saved"
            value={formatInteger(data.kpis.estimatedHoursSaved)}
            icon={ClockIcon}
            description="Estimated at 50 AI lines per hour"
          />
        </section>

        <MetricLineChart
          title="AI vs human share"
          description="Daily share of additions by source."
          data={data.trend.map((point) => ({
            label: point.date.slice(5),
            ai: Math.round(point.aiShare * 1000) / 10,
            human: Math.round(point.humanShare * 1000) / 10,
          }))}
        />

        <DataTable
          title="Recent activity"
          description="Latest metric records across repositories."
          columns={activityColumns}
          data={recentActivity}
          getRowKey={(row, index) => `${row.timestamp}-${row.repo}-${index}`}
        />

        <div className="flex justify-end">
          <Link className="text-sm font-medium text-primary hover:underline" href="/activity">
            View all activity
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

const activityColumns: Array<DataTableColumn<ActivityRow>> = [
  { key: "timestamp", header: "Time" },
  { key: "repo", header: "Repo" },
  { key: "author", header: "Author" },
  { key: "aiLines", header: "AI lines", className: "text-right" },
  { key: "humanLines", header: "Human lines", className: "text-right" },
  { key: "aiShare", header: "AI share", className: "text-right" },
]

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

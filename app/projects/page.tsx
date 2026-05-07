import Link from "next/link"

import { AppShell } from "@/components/app-shell"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getDashboardData } from "@/lib/data/dashboard"
import { formatInteger, formatPercent, shortRepoName } from "@/lib/format"
import { parseDashboardRange } from "@/lib/analytics/ranges"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type ProjectRow = Record<string, React.ReactNode> & {
  repoUrl: string
  repo: React.ReactNode
  aiShare: React.ReactNode
  totalAdditions: string
  activeAuthors: string
  lastActivity: string
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = (await searchParams) ?? {}
  const range = parseDashboardRange(params.range)
  const data = await getDashboardData(range)
  const rows = data.projects.map((project): ProjectRow => ({
    repoUrl: project.repoUrl,
    repo: (
      <Link
        href={`/projects/${encodeURIComponent(project.repoUrl)}?range=${range}`}
        className="block max-w-[24rem] truncate font-medium text-primary hover:underline"
      >
        {shortRepoName(project.repoUrl)}
      </Link>
    ),
    aiShare: <Badge variant="secondary">{formatPercent(project.aiShare)}</Badge>,
    totalAdditions: formatInteger(project.totalAdditions),
    activeAuthors: formatInteger(project.activeAuthors),
    lastActivity: formatDate(project.lastActivity),
  }))

  return (
    <AppShell
      range={range}
      title="Projects"
      description="Repository-level contribution mix, volume, and recency."
    >
      <DataTable
        title="Repository performance"
        description="Ranked by total additions in the selected range."
        columns={projectColumns}
        data={rows}
        getRowKey={(row) => row.repoUrl}
      />
    </AppShell>
  )
}

const projectColumns: Array<DataTableColumn<ProjectRow>> = [
  { key: "repo", header: "Repository" },
  { key: "aiShare", header: "AI share" },
  { key: "totalAdditions", header: "Total additions", className: "text-right" },
  { key: "activeAuthors", header: "Active authors", className: "text-right" },
  { key: "lastActivity", header: "Last activity", className: "text-right" },
]

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

import {
  CheckCircle2Icon,
  DatabaseIcon,
  type LucideIcon,
  ServerIcon,
  TerminalIcon,
} from "lucide-react"

import { AppShell } from "@/components/app-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const apiBaseCommand = 'git-ai config set api_base_url "https://your-dashboard-url.com"'

export default function OnboardingPage() {
  return (
    <AppShell
      title="Onboarding"
      description="Connect Git AI clients to the dashboard ingestion endpoints."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-card/70 shadow-xl backdrop-blur-xl">
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <TerminalIcon className="size-4" aria-hidden="true" />
              Client configuration
            </CardTitle>
            <CardDescription>Run this command in each developer environment.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <pre className="overflow-x-auto rounded-md border bg-background/70 p-4 text-sm">
              <code>{apiBaseCommand}</code>
            </pre>
            <div className="grid gap-3 md:grid-cols-2">
              <EndpointCard
                icon={DatabaseIcon}
                title="Metrics endpoint"
                method="POST"
                path="/worker/metrics/upload"
              />
              <EndpointCard
                icon={ServerIcon}
                title="CAS endpoint"
                method="POST"
                path="/worker/cas/upload"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70 shadow-xl backdrop-blur-xl">
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Readiness checklist</CardTitle>
            <CardDescription>Minimum setup for dashboard ingestion.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {[
                "Dashboard URL is reachable from developer machines.",
                "Supabase environment variables are configured.",
                "Git AI client points to this dashboard base URL.",
                "Metrics and CAS uploads return successful responses.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function EndpointCard({
  icon: Icon,
  title,
  method,
  path,
}: {
  icon: LucideIcon
  title: string
  method: string
  path: string
}) {
  return (
    <section className="rounded-md border border-border/70 bg-background/40 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <Icon className="size-4" aria-hidden="true" />
            <span className="truncate">{title}</span>
          </h2>
          <Badge variant="outline">{method}</Badge>
        </div>
        <code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs">{path}</code>
      </div>
    </section>
  )
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type DataTableColumn<TData> = {
  key: keyof TData | string
  header: React.ReactNode
  cell?: (row: TData) => React.ReactNode
  className?: string
}

type DataTableProps<TData> = {
  title: string
  columns: Array<DataTableColumn<TData>>
  data: TData[]
  description?: string
  getRowKey?: (row: TData, index: number) => React.Key
  emptyLabel?: string
  className?: string
}

export function DataTable<TData extends Record<string, React.ReactNode>>({
  title,
  description,
  columns,
  data,
  getRowKey,
  emptyLabel = "No data available",
  className,
}: DataTableProps<TData>) {
  return (
    <Card className={cn("border-border/70 bg-card/70 shadow-xl backdrop-blur-xl", className)}>
      <CardHeader className="gap-1">
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)} className={cn("h-8 text-xs", column.className)}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <TableRow key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className={cn("py-2 text-xs", column.className)}>
                      {column.cell ? column.cell(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-20 text-center text-sm text-muted-foreground">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

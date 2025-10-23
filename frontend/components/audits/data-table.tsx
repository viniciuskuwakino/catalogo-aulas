"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Calendar, Clock, Mail, MoreHorizontal, Repeat } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BACKEND_URL } from "@/lib/contants"
import { useAuthStore } from "@/store/useAuthStore"
import { DialogUpdateAudit } from "@/components/audits/update"

type AuditStatusKey = "draft" | "pending_review" | "published" | "archived" | "unknown"

type AuditRecord = {
  id: string
  entityTitle: string
  actorName: string
  actorEmail: string
  fromStatusKey: AuditStatusKey
  fromStatusLabel: string
  toStatusKey: AuditStatusKey
  toStatusLabel: string
  reason: string
  createdAt: string | null
}

type RawAuditRecord = {
  id?: number | string
  fromStatus?: string | null
  toStatus?: string | null
  reason?: string | null
  createdAt?: string | null
  created_at?: string | null
  actor?: {
    name?: string | null
    email?: string | null
  } | null
  entity?: {
    title?: string | null
  } | null
  [key: string]: unknown
}

type AuditMeta = {
  total: number
  page: number
  limit: number
  lastPage: number
}

type AuditsResponse = {
  data: RawAuditRecord[]
  meta?: AuditMeta
}

const STATUS_LABELS: Record<AuditStatusKey, string> = {
  draft: "Rascunho",
  pending_review: "Em revisão",
  published: "Publicado",
  archived: "Arquivado",
  unknown: "Indefinido",
}

const STATUS_BADGE_STYLES: Record<AuditStatusKey, string> = {
  draft:
    "bg-slate-100 text-slate-900 border-slate-500 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-400/30",
  pending_review:
    "bg-amber-100 text-amber-900 border-amber-500 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/30",
  published:
    "bg-emerald-100 text-emerald-900 border-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/30",
  archived:
    "bg-purple-100 text-purple-900 border-purple-500 dark:bg-purple-400/10 dark:text-purple-300 dark:border-purple-400/30",
  unknown:
    "bg-muted text-muted-foreground border-transparent dark:bg-muted/40 dark:text-muted-foreground",
}

function parseStatus(value: unknown): AuditStatusKey {
  if (typeof value !== "string") return "unknown"
  const sanitized = value.toLowerCase().trim()
  if (sanitized === "draft") return "draft"
  if (sanitized === "pending_review" || sanitized === "pending-review") return "pending_review"
  if (sanitized === "published") return "published"
  if (sanitized === "archived") return "archived"
  return "unknown"
}

function normalizeAudit(record: RawAuditRecord, index: number): AuditRecord {
  const fromKey = parseStatus(record.fromStatus)
  const toKey = parseStatus(record.toStatus)

  const createdAt =
    typeof record.createdAt === "string"
      ? record.createdAt
      : typeof record.created_at === "string"
      ? record.created_at
      : null

  return {
    id: String(record.id ?? `audit-${index}`),
    entityTitle: record.entity?.title ?? "Entidade desconhecida",
    actorName: record.actor?.name ?? "Usuário desconhecido",
    actorEmail: record.actor?.email ?? "E-mail indisponível",
    fromStatusKey: fromKey,
    fromStatusLabel: STATUS_LABELS[fromKey] ?? STATUS_LABELS.unknown,
    toStatusKey: toKey,
    toStatusLabel: STATUS_LABELS[toKey] ?? STATUS_LABELS.unknown,
    reason: typeof record.reason === "string" ? record.reason : "",
    createdAt,
  }
}

type TableMeta = {
  total: number
  page: number
  limit: number
  lastPage: number
}

function RowActions({ audit }: { audit: AuditRecord }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)

  const canDelete = Boolean(user?.token)

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user?.token) {
        throw new Error("Sessão expirada. Faça login novamente para continuar.")
      }

      const response = await fetch(`${BACKEND_URL}/audits/${audit.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message =
          payload &&
          typeof payload === "object" &&
          "message" in payload &&
          typeof (payload as Record<string, unknown>).message === "string"
            ? (payload as Record<string, string>).message
            : "Não foi possível remover a auditoria. Tente novamente mais tarde."
        throw new Error(message)
      }
    },
    onSuccess: () => {
      toast.success("Auditoria removida", {
        description: "O registro de auditoria foi removido com sucesso.",
      })
      queryClient.invalidateQueries({ queryKey: ["audits"] })
    },
    onError: (error) => {
      toast.error("Erro ao remover auditoria", {
        description:
          error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
      })
    },
  })

  const handleDelete = React.useCallback(() => {
    if (confirmingDelete) {
      deleteMutation.mutate()
      setConfirmingDelete(false)
    } else {
      setConfirmingDelete(true)
    }
  }, [confirmingDelete, deleteMutation])

  const deleteLabel = confirmingDelete ? "Confirmar exclusão" : "Excluir"

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={(event) => {
            event.preventDefault()
            setIsEditOpen(true)
          }}
        >
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            handleDelete()
          }}
          disabled={!canDelete || deleteMutation.isPending}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          {deleteMutation.isPending ? "Removendo..." : deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <DialogUpdateAudit
      audit={{
        id: audit.id,
        toStatus: audit.toStatusKey,
        reason: audit.reason,
      }}
      open={isEditOpen}
      onOpenChange={setIsEditOpen}
    />
    </>
  )
}

export const columns: ColumnDef<AuditRecord>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: "entityTitle",
    header: "Recurso",
    cell: ({ row }) => <span className="font-medium">{row.getValue("entityTitle")}</span>,
  },
  {
    accessorKey: "actorName",
    header: "Responsável",
    cell: ({ row }) => {
      const email = row.original.actorEmail
      return (
        <div className="flex flex-col">
          <span>{row.getValue("actorName")}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="size-3" />
            {email}
          </span>
        </div>
      )
    },
  },
  {
    id: "transition",
    header: "Transição",
    cell: ({ row }) => {
      const { fromStatusKey, fromStatusLabel, toStatusKey, toStatusLabel } = row.original
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`capitalize ${STATUS_BADGE_STYLES[fromStatusKey] ?? STATUS_BADGE_STYLES.unknown}`}
          >
            {fromStatusLabel}
          </Badge>
          <Repeat className="size-4 text-muted-foreground" />
          <Badge
            variant="outline"
            className={`capitalize ${STATUS_BADGE_STYLES[toStatusKey] ?? STATUS_BADGE_STYLES.unknown}`}
          >
            {toStatusLabel}
          </Badge>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "reason",
    header: "Justificativa",
    cell: ({ row }) => (
      <span className="line-clamp-2 text-sm text-muted-foreground">
        {row.original.reason && row.original.reason.trim().length > 0
          ? row.original.reason
          : "Sem justificativa fornecida."}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Registrado em",
    cell: ({ row }) => {
      const value = row.getValue("createdAt") as string | null
      if (!value) return <span className="text-muted-foreground">-</span>

      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return <span>{value}</span>

      const formattedDate = date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })

      const formattedTime = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })

      return (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Calendar className="size-4 text-muted-foreground" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-4 text-muted-foreground" />
            {formattedTime}
          </span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <RowActions audit={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
]

export function AuditsDataTable() {
  const { user } = useAuthStore()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const authToken = user?.token ?? null

  const queryKey = React.useMemo(
    () => [
      "audits",
      {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        token: authToken,
      },
    ],
    [pagination.pageIndex, pagination.pageSize, authToken]
  )

  const auditsQuery = useQuery<{
    data: AuditRecord[]
    meta: TableMeta
  }>({
    queryKey,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
      })

      const response = await fetch(`${BACKEND_URL}/audits?${params.toString()}`, {
        method: "GET",
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : undefined,
        signal,
      })

      const payload = (await response.json().catch(() => null)) as AuditsResponse | null

      if (!response.ok || !payload || !payload.data) {
        let errorMessage = `Erro na requisição: ${response.status}`

        if (payload && typeof payload === "object" && "message" in payload) {
          const extracted = (payload as Record<string, unknown>).message
          if (typeof extracted === "string") {
            errorMessage = extracted
          }
        }

        throw new Error(errorMessage)
      }

      const normalized = payload.data.map(normalizeAudit)

      const meta: TableMeta = {
        total: payload.meta?.total ?? normalized.length,
        page: payload.meta?.page ?? pagination.pageIndex + 1,
        limit: payload.meta?.limit ?? pagination.pageSize,
        lastPage:
          payload.meta?.lastPage ??
          Math.max(1, Math.ceil((payload.meta?.total ?? normalized.length) / ((payload.meta?.limit ?? pagination.pageSize) || 1))),
      }

      return { data: normalized, meta }
    },
    enabled: !!authToken,
    placeholderData: (previousData) =>
      previousData ?? {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: pagination.pageSize,
          lastPage: 1,
        },
      },
  })

  const records = auditsQuery.data?.data ?? []
  const meta = auditsQuery.data?.meta ?? {
    total: 0,
    page: 1,
    limit: pagination.pageSize,
    lastPage: 1,
  }

  const table = useReactTable({
    data: records,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false,
  })

  const isInitialLoading = auditsQuery.isLoading
  const isFetching = auditsQuery.isFetching
  const queryError = auditsQuery.error as Error | null

  const pageSizeOptions = React.useMemo(() => [5, 10, 20, 30, 40, 50], [])

  const startRange =
    records.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1

  const endRange = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    meta.total
  )

  const handlePageSizeChange = React.useCallback(
    (value: string) => {
      const size = Number(value)
      if (!Number.isNaN(size)) {
        setPagination((prev) => ({
          ...prev,
          pageIndex: 0,
          pageSize: size,
        }))
      }
    },
    []
  )

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar por recurso..."
          value={(table.getColumn("entityTitle")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("entityTitle")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isInitialLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Carregando auditorias...
                </TableCell>
              </TableRow>
            ) : queryError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {queryError.message}
                </TableCell>
              </TableRow>
            ) : !authToken ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Faça login para visualizar as auditorias.
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhuma auditoria encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} selecionada(s).{" "}
          Exibindo {startRange ? `${startRange}-${endRange}` : "0"} de {meta.total} registros.
          {isFetching && !isInitialLoading && (
            <span className="ml-2 text-xs italic">Atualizando...</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Itens por página</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={handlePageSizeChange}
            disabled={isFetching}
          >
            <SelectTrigger size="sm" className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isFetching}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isFetching}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  )
}

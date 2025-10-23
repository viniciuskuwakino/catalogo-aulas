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
import { BACKEND_URL } from "@/lib/contants"
import { useAuthStore } from "@/store/useAuthStore"
import { Calendar, Clock, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DialogUpdateCourse } from "@/components/courses/update"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type SupportedLanguage = "pt" | "en" | "es"

type Course = {
  id: string
  title: string
  summary: string
  language: SupportedLanguage
  instructor: string
  statusKey: "draft" | "pending_review" | "published" | "unknown"
  statusLabel: string
  createdAt: string | null
}

type RawCourse = {
  id?: string | number
  title?: string
  name?: string
  summary?: string
  description?: string
  language?: string
  instructor?: { name?: string } | string
  createdBy?: { name?: string } | null
  teacher?: string
  status?: string
  published?: boolean
  createdAt?: string
  created_at?: string
  createdDate?: string
  publishedAt?: string
  [key: string]: unknown
}

type CourseMeta = {
  total: number
  page: number
  limit: number
  lastPage: number
}

type CoursesResponse = {
  data: Course[]
  meta: CourseMeta
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  pending_review: "Em revisão",
  unknown: "Indefinido",
}

const STATUS_BADGE_STYLES: Record<Course["statusKey"], string> = {
  draft:
    "bg-gray-100 text-gray-900 border-gray-500 dark:bg-gray-400/40 dark:text-gray-300 dark:border-gray-400/30",
  pending_review:
    "bg-yellow-100 text-yellow-900 border-yellow-500 dark:bg-yellow-400/10 dark:text-yellow-300 dark:border-yellow-400/30",
  published:
    "bg-emerald-100 text-emerald-900 border-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/30",
  unknown:
    "bg-muted text-muted-foreground border-transparent dark:bg-muted/40 dark:text-muted-foreground",
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["pt", "en", "es"]

export const columns: ColumnDef<Course>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Curso",
    cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "instructor",
    header: "Instrutor",
    cell: ({ row }) => <div>{row.getValue("instructor")}</div>,
  },
  {
    accessorKey: "statusLabel",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue("statusLabel") as string | undefined
      const statusKey = row.original.statusKey
      const className =
        STATUS_BADGE_STYLES[statusKey] ??
        STATUS_BADGE_STYLES.unknown

      return (
        <Badge className={`capitalize ${className}`} variant="outline">
          {value ?? STATUS_LABELS.unknown}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Data de criação",
    cell: ({ row }) => {
      const value = row.getValue("createdAt") as string | null
      if (!value) return <div className="text-muted-foreground">-</div>

      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return <div>{value}</div>
      }

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
        <div className="flex flex-row gap-2">
          <span className="flex items-center gap-1">
            <Calendar className="size-4 text-muted-foreground" />
            <span>{formattedDate}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-4 text-muted-foreground" />
            <span>{formattedTime}</span>
          </span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div>
        <RowActions course={row.original} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

function RowActions({ course }: { course: Course }) {
  const router = useRouter()
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

      const response = await fetch(`${BACKEND_URL}/courses/${course.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message =
          payload?.message ??
          "Não foi possível remover o curso. Tente novamente mais tarde."
        throw new Error(message)
      }
    },
    onSuccess: () => {
      toast.success("Curso removido", {
        description: `"${course.title}" foi removido com sucesso.`,
      })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
    onError: (error) => {
      toast.error("Erro ao remover curso", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado.",
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
            onSelect={(event) => {
              event.preventDefault()
              router.push(`/courses/${course.id}`)
            }}
          >
            Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
      <DialogUpdateCourse
        course={course}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  )
}

export function DataTable() {
  const router = useRouter();
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
      "courses",
      {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        token: authToken,
      },
    ],
    [pagination.pageIndex, pagination.pageSize, authToken]
  )

  const coursesQuery = useQuery<CoursesResponse>({
    queryKey,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
      })

      const response = await fetch(
        `${BACKEND_URL}/courses?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal,
        }
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          payload?.message ?? `Erro na requisição: ${response.status}`
        )
      }

      const metaFromResponse: Partial<CourseMeta> | undefined =
        !Array.isArray(payload) && payload?.meta ? payload.meta : undefined

      const collection = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : []

      const normalized: Course[] = collection.map(
        (course: RawCourse, index: number) => {
          const statusKey: Course["statusKey"] = (() => {
            if (typeof course.status === "string") {
              const normalizedStatus = course.status.toLowerCase()
              if (
                normalizedStatus === "draft" ||
                normalizedStatus === "pending_review" ||
                normalizedStatus === "published"
              ) {
                return normalizedStatus
              }
            }

            if (typeof course.published === "boolean") {
              return course.published ? "published" : "draft"
            }

            return "unknown"
          })()

          const language: SupportedLanguage = (() => {
            if (typeof course.language === "string") {
              const normalized = course.language.toLowerCase()
              if (
                SUPPORTED_LANGUAGES.includes(
                  normalized as SupportedLanguage
                )
              ) {
                return normalized as SupportedLanguage
              }
            }
            return "pt"
          })()

          const summary = typeof course.summary === "string" ? course.summary : ""

          return {
            id: String(course.id ?? `course-${index}`),
            title: course.title ?? course.name ?? "Sem título",
            summary,
            language,
            instructor: course.createdBy?.name ?? "-",
            statusKey,
            statusLabel: STATUS_LABELS[statusKey] ?? STATUS_LABELS.unknown,
            createdAt: course.createdAt ?? null,
          }
        }
      )

      const total = typeof metaFromResponse?.total === "number" ? metaFromResponse.total : normalized.length
      const limitCandidate = typeof metaFromResponse?.limit === "number" ? metaFromResponse.limit : pagination.pageSize
      const safeLimit = typeof limitCandidate === "number" && limitCandidate > 0 ? limitCandidate : pagination.pageSize
      const currentPage = typeof metaFromResponse?.page === "number" ? metaFromResponse.page : pagination.pageIndex + 1
      const lastPage = typeof metaFromResponse?.lastPage === "number" ? metaFromResponse.lastPage : Math.max(1, Math.ceil(total / (safeLimit || 1)))

      return {
        data: normalized,
        meta: {
          total,
          page: currentPage,
          limit: safeLimit,
          lastPage,
        },
      }
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

  const courses = coursesQuery.data?.data ?? []

  const meta = React.useMemo(() => {
    const total = coursesQuery.data?.meta?.total ?? courses.length
    const limit = coursesQuery.data?.meta?.limit ?? pagination.pageSize
    const page = coursesQuery.data?.meta?.page ?? pagination.pageIndex + 1
    const lastPage = coursesQuery.data?.meta?.lastPage ?? Math.max(1, Math.ceil(total / (limit || 1)))

    return {
      total,
      limit,
      page,
      lastPage,
    }
  }, [
    coursesQuery.data?.meta?.total,
    coursesQuery.data?.meta?.limit,
    coursesQuery.data?.meta?.page,
    coursesQuery.data?.meta?.lastPage,
    courses.length,
    pagination.pageIndex,
    pagination.pageSize,
  ])
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: courses,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: meta.lastPage,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  const startRange = courses.length
    ? (meta.page - 1) * meta.limit + 1
    : 0
  const endRange = courses.length ? startRange + courses.length - 1 : 0
  const pageSizeOptions = React.useMemo(() => [5, 10, 20, 50], [])

  const handlePageSizeChange = React.useCallback(
    (value: string) => {
      const nextSize = Number(value)
      if (!Number.isFinite(nextSize) || nextSize <= 0) return
      setPagination({
        pageIndex: 0,
        pageSize: nextSize,
      })
    },
    []
  )

  const isInitialLoading = coursesQuery.isLoading && !coursesQuery.isFetched
  const isFetching = coursesQuery.isFetching
  const queryError = coursesQuery.error as Error | null

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar cursos..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
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
                  Carregando cursos...
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
                  Faça login para visualizar os cursos.
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
                  Nenhum curso encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} selecionado(s).{" "}
          Exibindo {startRange ? `${startRange}-${endRange}` : "0"} de{" "}
          {meta.total} cursos.
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

"use client"

import * as React from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BACKEND_URL } from "@/lib/contants"
import { useAuthStore } from "@/store/useAuthStore"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"

type SupportedLanguage = "pt" | "en" | "es"
type CourseStatus = "draft" | "pending_review" | "published" | "unknown"

type User = {
  id?: string | number
  name?: string
  email?: string
  role?: string
  [key: string]: unknown
}

type RawCourse = {
  id?: string | number
  uuid?: string | number
  slug?: string
  title?: string
  name?: string
  summary?: string
  description?: string
  language?: string
  status?: string
  published?: boolean
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  publishedAt?: string
  published_at?: string
  instructor?: string | User
  createdBy?: User | null
  lessons?: Array<RawLesson>
  enrollments?: Array<RawEnrollment>
  [key: string]: unknown
}

type RawLesson = {
  id?: string | number
  uuid?: string | number
  title?: string
  durationMinutes?: number | null
  isLocked?: boolean
  order?: number | string | null
  videoUrl?: string | null
  [key: string]: unknown
}

type RawEnrollment =
  | {
      id?: string | number
      user?: User
      student?: User
      createdAt?: string
      created_at?: string
      [key: string]: unknown
    }
  | null
  | undefined

type NormalizedLesson = {
  id: string
  title: string
  durationMinutes: number | null
  isLocked: boolean
  order: number | null
  videoUrl: string | null
}

type NormalizedEnrollment = {
  id: string
  userName: string
  userEmail: string
  enrolledAt: string | null
}

type NormalizedCourse = {
  id: string
  title: string
  summary: string
  language: SupportedLanguage
  statusKey: CourseStatus
  statusLabel: string
  statusBadgeClass: string
  instructor: string
  createdAt: string | null
  updatedAt: string | null
  publishedAt: string | null
  lessons: NormalizedLesson[]
  enrollments: NormalizedEnrollment[]
}

type LessonFormInputs = {
  title: string
  durationMinutes: string
  isLocked: boolean
  order: string
  videoUrl: string
}

type LessonPayload = {
  title: string
  durationMinutes: number | null
  isLocked: boolean
  order: number | null
  videoUrl: string | null
  courseId: number
}

const LESSON_FORM_DEFAULTS: LessonFormInputs = {
  title: "",
  durationMinutes: "",
  isLocked: false,
  order: "",
  videoUrl: "",
}

const STATUS_CONFIG: Record<
  CourseStatus,
  { label: string; badgeClass: string }
> = {
  draft: {
    label: "Rascunho",
    badgeClass:
      "border-gray-500 bg-gray-100 text-gray-900 dark:bg-gray-400/40 dark:text-gray-300 dark:border-gray-400/30",
  },
  pending_review: {
    label: "Em revisão",
    badgeClass:
      "border-yellow-500 bg-yellow-100 text-yellow-900 dark:bg-yellow-400/10 dark:text-yellow-300 dark:border-yellow-400/30",
  },
  published: {
    label: "Publicado",
    badgeClass:
      "border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/30",
  },
  unknown: {
    label: "Indefinido",
    badgeClass:
      "border-muted bg-muted text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground",
  },
}

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  pt: "Português",
  en: "Inglês",
  es: "Espanhol",
}

function parseStatus(rawStatus: unknown, publishedFlag: unknown): CourseStatus {
  if (typeof rawStatus === "string") {
    const normalized = rawStatus.toLowerCase()
    if (
      normalized === "draft" ||
      normalized === "pending_review" ||
      normalized === "published"
    ) {
      return normalized
    }
  }

  if (typeof publishedFlag === "boolean") {
    return publishedFlag ? "published" : "draft"
  }

  return "unknown"
}

function parseLanguage(rawLanguage: unknown): SupportedLanguage {
  if (typeof rawLanguage === "string") {
    const normalized = rawLanguage.toLowerCase()
    if (normalized === "pt" || normalized === "en" || normalized === "es") {
      return normalized
    }
  }
  return "pt"
}

function formatDate(value: string | null): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function normalizeCourse(raw: RawCourse): NormalizedCourse {
  const statusKey = parseStatus(raw.status, raw.published)
  const statusConfig = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.unknown

  const lessons: NormalizedLesson[] = Array.isArray(raw.lessons)
    ? raw.lessons.map((lesson, index) => ({
        id: String(lesson.id ?? lesson.uuid ?? `lesson-${index}`),
        title: lesson.title ?? `Aula ${index + 1}`,
        durationMinutes:
          typeof lesson.durationMinutes === "number"
            ? lesson.durationMinutes
            : null,
        isLocked: Boolean(lesson.isLocked),
        order:
          typeof lesson.order === "number"
            ? lesson.order
            : typeof lesson.order === "string" && lesson.order.trim().length > 0
            ? Number.isNaN(Number(lesson.order))
              ? null
              : Number(lesson.order)
            : null,
        videoUrl:
          typeof lesson.videoUrl === "string" && lesson.videoUrl.trim().length > 0
            ? lesson.videoUrl
            : null,
      }))
    : []

  const enrollments = normalizeEnrollments(raw.enrollments)

  return {
    id: String(raw.id ?? raw.uuid ?? raw.slug ?? `course-${Math.random()}`),
    title: raw.title ?? raw.name ?? "Curso sem título",
    summary:
      typeof raw.summary === "string"
        ? raw.summary
        : typeof raw.description === "string"
        ? raw.description
        : "",
    language: parseLanguage(raw.language),
    statusKey,
    statusLabel: statusConfig.label,
    statusBadgeClass: statusConfig.badgeClass,
    instructor:
      (typeof raw.instructor === "string" && raw.instructor) ||
      (raw.instructor && typeof raw.instructor === "object"
        ? raw.instructor.name
        : undefined) ||
      raw.createdBy?.name ||
      "Instrutor não informado",
    createdAt:
      raw.createdAt ??
      raw.created_at ??
      (typeof raw.publishedAt === "string" ? raw.publishedAt : null),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    publishedAt: raw.publishedAt ?? raw.published_at ?? null,
    lessons,
    enrollments,
  }
}

function normalizeEnrollments(
  raw: RawCourse["enrollments"]
): NormalizedEnrollment[] {
  if (!Array.isArray(raw)) return []

  return raw.map((enrollment, index) => {
    const base = enrollment ?? {}
    const user =
      (base as { user?: User }).user ??
      (base as { student?: User }).student ??
      {}

    return {
      id: String(
        (base as { id?: string | number }).id ?? `enrollment-${index}`
      ),
      userName: user.name ?? "Usuário desconhecido",
      userEmail: user.email ?? "E-mail não informado",
      enrolledAt:
        (base as { createdAt?: string }).createdAt ??
        (base as { created_at?: string }).created_at ??
        null,
    }
  })
}

interface CourseByIdProps {
  id: string
}

export function CourseById({ id }: CourseByIdProps) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isLessonDialogOpen, setLessonDialogOpen] = React.useState(false)
  const [editingLesson, setEditingLesson] = React.useState<NormalizedLesson | null>(null)
  const [lessonConfirmingDelete, setLessonConfirmingDelete] = React.useState<string | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = React.useState<string | null>(null)

  const {
    control: lessonControl,
    register: lessonRegister,
    handleSubmit: handleLessonSubmit,
    reset: resetLessonForm,
    formState: { errors: lessonErrors },
  } = useForm<LessonFormInputs>({
    defaultValues: LESSON_FORM_DEFAULTS,
  })

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["course", id, user?.token],
    enabled: Boolean(user?.token),
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/courses/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        router.push("/auth/login")
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      if (response.status === 404) {
        throw new Error("Curso não encontrado.")
      }

      if (!response.ok) {
        throw new Error("Não foi possível carregar o curso solicitado.")
      }

      const rawCourse = (await response.json()) as RawCourse

      return normalizeCourse(rawCourse)
    },
    refetchOnWindowFocus: false,
  })

  React.useEffect(() => {
    if (!isLessonDialogOpen) return

    if (editingLesson) {
      resetLessonForm({
        title: editingLesson.title ?? "",
        durationMinutes:
          editingLesson.durationMinutes !== null
            ? String(editingLesson.durationMinutes)
            : "",
        isLocked: editingLesson.isLocked,
        order:
          editingLesson.order !== null ? String(editingLesson.order) : "",
        videoUrl: editingLesson.videoUrl ?? "",
      })
    } else {
      resetLessonForm(LESSON_FORM_DEFAULTS)
    }
  }, [editingLesson, isLessonDialogOpen, resetLessonForm])

  const handleLessonDialogChange = React.useCallback(
    (value: boolean) => {
      setLessonDialogOpen(value)
      if (!value) {
        setEditingLesson(null)
        resetLessonForm(LESSON_FORM_DEFAULTS)
      }
    },
    [resetLessonForm]
  )

  const createLessonMutation = useMutation({
    mutationFn: async (payload: LessonPayload) => {
      if (!user?.token) {
        throw new Error("Sessão expirada. Faça login novamente para continuar.")
      }

      console.log('payload', payload)

      const response = await fetch(`${BACKEND_URL}/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          (result && typeof result === "object" && "message" in result
            ? (result as { message?: string }).message
            : null) ??
          "Não foi possível criar a aula. Tente novamente."
        throw new Error(message)
      }
    },
    onSuccess: () => {
      toast.success("Aula criada", {
        description: "A aula foi adicionada com sucesso.",
      })
      handleLessonDialogChange(false)
      refetch()
    },
    onError: (error) => {
      toast.error("Erro ao criar aula", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado.",
      })
    },
  })

  const updateLessonMutation = useMutation({
    mutationFn: async ({
      lessonId,
      ...payload
    }: LessonPayload & { lessonId: string }) => {
      if (!user?.token) {
        throw new Error("Sessão expirada. Faça login novamente para continuar.")
      }

      const response = await fetch(`${BACKEND_URL}/lessons/${lessonId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      })

      console.log('payload update', payload)

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          (result && typeof result === "object" && "message" in result
            ? (result as { message?: string }).message
            : null) ??
          "Não foi possível atualizar a aula. Tente novamente."
        throw new Error(message)
      }
    },
    onSuccess: () => {
      toast.success("Aula atualizada", {
        description: "As alterações foram salvas com sucesso.",
      })
      handleLessonDialogChange(false)
      refetch()
    },
    onError: (error) => {
      toast.error("Erro ao atualizar aula", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado.",
      })
    },
  })

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user?.token) {
        throw new Error("Sessão expirada. Faça login novamente para continuar.")
      }

      const response = await fetch(
        `${BACKEND_URL}/lessons/${lessonId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      )

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        const message =
          (result && typeof result === "object" && "message" in result
            ? (result as { message?: string }).message
            : null) ??
          "Não foi possível remover a aula. Tente novamente."
        throw new Error(message)
      }
    },
    onSuccess: () => {
      toast.success("Aula removida", {
        description: "A aula foi excluída com sucesso.",
      })
      setLessonConfirmingDelete(null)
      refetch()
    },
    onError: (error) => {
      toast.error("Erro ao remover aula", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado.",
      })
    },
  })

  const isSavingLesson =
    createLessonMutation.isPending || updateLessonMutation.isPending
  const isDeletingLesson = deleteLessonMutation.isPending

  const handleCreateLesson = React.useCallback(() => {
    setEditingLesson(null)
    setLessonDialogOpen(true)
  }, [])

  const handleEditLesson = React.useCallback((lesson: NormalizedLesson) => {
    setEditingLesson(lesson)
    setLessonDialogOpen(true)
  }, [])

  const handleDeleteLesson = React.useCallback(
    (lessonId: string) => {
      if (lessonConfirmingDelete === lessonId) {
        deleteLessonMutation.mutate(lessonId)
      } else {
        setLessonConfirmingDelete(lessonId)
      }
    },
    [deleteLessonMutation, lessonConfirmingDelete]
  )

  const handleViewLessonVideo = React.useCallback((videoUrl: string | null) => {
    if (!videoUrl) return
    setVideoPreviewUrl(videoUrl)
  }, [])

  const handleVideoDialogChange = React.useCallback((open: boolean) => {
    if (!open) {
      setVideoPreviewUrl(null)
    }
  }, [])

  const handleLessonFormSubmit: SubmitHandler<LessonFormInputs> =
    React.useCallback(
      (values) => {
        const title = values.title.trim()
        if (!title) {
          toast.error("Título obrigatório", {
            description: "Informe um título para a aula.",
          })
          return
        }

        const durationValue = values.durationMinutes.trim()
        let durationMinutes: number | null = null

        if (durationValue !== "") {
          const parsed = Number(durationValue)
          if (Number.isNaN(parsed) || parsed < 0) {
            toast.error("Duração inválida", {
              description: "Informe um valor numérico maior ou igual a zero.",
            })
            return
          }
          durationMinutes = parsed
        }

        const orderValue = values.order.trim()
        let order: number | null = null
        if (orderValue !== "") {
          const parsedOrder = Number(orderValue)
          if (Number.isNaN(parsedOrder) || parsedOrder < 0) {
            toast.error("Ordem inválida", {
              description: "Informe um valor numérico maior ou igual a zero.",
            })
            return
          }
          order = parsedOrder
        }

        const videoUrlValue = values.videoUrl.trim()
        let videoUrl: string | null = null
        if (videoUrlValue !== "") {
          try {
            const parsedUrl = new URL(videoUrlValue)
            videoUrl = parsedUrl.toString()
          } catch {
            toast.error("URL inválida", {
              description: "Informe uma URL válida para o vídeo.",
            })
            return
          }
        }

        const payload: LessonPayload = {
          title,
          durationMinutes,
          isLocked: values.isLocked,
          order,
          videoUrl,
          courseId: Number(id),
        }

        if (editingLesson) {
          updateLessonMutation.mutate({ ...payload, lessonId: editingLesson.id })
        } else {
          createLessonMutation.mutate(payload)
        }
      },
      [createLessonMutation, editingLesson, updateLessonMutation]
    )

  if (!user?.token) {
    return (
      <div className="container mx-auto py-10">
        <p className="text-sm text-muted-foreground">
          Redirecionando para a tela de login...
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <p className="text-sm text-muted-foreground">Carregando curso...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const course = data

  return (
    <div className="container mx-auto py-10 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Curso #{course.id}</p>
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground">
            {course.summary || "Sem descrição disponível para este curso."}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-sm ${course.statusBadgeClass} capitalize`}
        >
          {course.statusLabel}
        </Badge>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Informações gerais</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Instrutor</dt>
              <dd className="font-medium text-right">{course.instructor}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Idioma</dt>
              <dd className="font-medium text-right">
                {LANGUAGE_LABELS[course.language]}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Aulas</dt>
              <dd className="font-medium text-right">
                {course.lessons.length}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border p-6 space-y-3">
          <h2 className="text-lg font-semibold">Linha do tempo</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Criado em</dt>
              <dd className="font-medium text-right">
                {formatDate(course.createdAt)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Atualizado em</dt>
              <dd className="font-medium text-right">
                {formatDate(course.updatedAt)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Publicado em</dt>
              <dd className="font-medium text-right">
                {formatDate(course.publishedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Aulas</h2>
            {isFetching && (
              <span className="text-xs text-muted-foreground">Atualizando…</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleCreateLesson}
            disabled={isSavingLesson}
          >
            Nova aula
          </Button>
        </div>
        {course.lessons.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Este curso ainda não possui aulas cadastradas.
          </p>
        ) : (
          <ul className="space-y-3">
            {[...course.lessons]
              .sort((a, b) => {
                const orderA = a.order ?? Number.POSITIVE_INFINITY
                const orderB = b.order ?? Number.POSITIVE_INFINITY

                if (orderA === orderB) {
                  return a.title.localeCompare(b.title)
                }
                return orderA - orderB
              })
              .map((lesson) => (
              <li
                key={lesson.id}
                className="rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium leading-none">{lesson.title}</p>
                      {lesson.order !== null && (
                        <Badge variant="outline" className="text-[11px]">
                          Ordem {lesson.order}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {lesson.durationMinutes
                        ? `${lesson.durationMinutes} minuto${lesson.durationMinutes === 1 ? "" : "s"}`
                        : "Sem duração definida"}
                    </p>
                    {lesson.videoUrl && (
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs font-medium"
                        onClick={() => handleViewLessonVideo(lesson.videoUrl)}
                      >
                        Assistir vídeo
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        lesson.isLocked
                          ? "border-gray-500 bg-gray-500/10 text-gray-700 dark:bg-gray-400/40 dark:text-gray-300 dark:border-gray-400/30"
                          : "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-400/10 dark:text-emerald-300"
                      }`}
                    >
                      {lesson.isLocked ? "Bloqueada" : "Liberada"}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditLesson(lesson)}
                        disabled={isSavingLesson || isDeletingLesson}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteLesson(lesson.id)}
                        disabled={isDeletingLesson}
                      >
                        {deleteLessonMutation.isPending &&
                        lessonConfirmingDelete === lesson.id
                          ? "Removendo..."
                          : lessonConfirmingDelete === lesson.id
                          ? "Confirmar"
                          : "Excluir"}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Matrículas</h2>
        {course.enrollments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum usuário matriculado neste curso ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {course.enrollments.map((enrollment) => (
              <li
                key={enrollment.id}
                className="rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium leading-none">
                      {enrollment.userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {enrollment.userEmail}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Matriculado em: {formatDate(enrollment.enrolledAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Dialog open={isLessonDialogOpen} onOpenChange={handleLessonDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Editar aula" : "Nova aula"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={handleLessonSubmit(handleLessonFormSubmit)}
          >
            <div className="grid gap-3">
              <Label htmlFor="lesson-title">Título</Label>
              <Input
                id="lesson-title"
                placeholder="Título da aula"
                {...lessonRegister("title", {
                  required: "Informe o título da aula",
                  minLength: {
                    value: 3,
                    message: "Título deve ter pelo menos 3 caracteres",
                  },
                })}
              />
              {lessonErrors.title && (
                <p className="text-sm text-destructive">
                  {lessonErrors.title.message}
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="lesson-duration">Duração (minutos)</Label>
              <Input
                id="lesson-duration"
                type="number"
                min={0}
                placeholder="Ex: 45"
                {...lessonRegister("durationMinutes", {
                  min: {
                    value: 0,
                    message: "Informe um valor maior ou igual a zero",
                  },
                })}
              />
              {lessonErrors.durationMinutes && (
                <p className="text-sm text-destructive">
                  {lessonErrors.durationMinutes.message}
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="lesson-order">Ordem</Label>
              <Input
                id="lesson-order"
                type="number"
                min={0}
                placeholder="Ex: 1"
                {...lessonRegister("order", {
                  min: {
                    value: 0,
                    message: "Informe um valor maior ou igual a zero",
                  },
                })}
              />
              {lessonErrors.order && (
                <p className="text-sm text-destructive">
                  {lessonErrors.order.message}
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="lesson-video">URL do vídeo</Label>
              <Input
                id="lesson-video"
                type="url"
                placeholder="https://..."
                {...lessonRegister("videoUrl")}
              />
              {lessonErrors.videoUrl && (
                <p className="text-sm text-destructive">
                  {lessonErrors.videoUrl.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Aula bloqueada</p>
                <p className="text-xs text-muted-foreground">
                  Defina se a aula deve ficar indisponível para os alunos.
                </p>
              </div>
              <Controller
                control={lessonControl}
                name="isLocked"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleLessonDialogChange(false)}
                disabled={isSavingLesson}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingLesson}>
                {isSavingLesson
                  ? editingLesson
                    ? "Salvando..."
                    : "Cadastrando..."
                  : editingLesson
                  ? "Salvar alterações"
                  : "Cadastrar aula"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={videoPreviewUrl !== null} onOpenChange={handleVideoDialogChange}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Assistir vídeo da aula</DialogTitle>
          </DialogHeader>
          {videoPreviewUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
              <iframe
                src={videoPreviewUrl}
                title="Pré-visualização da aula"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {/* <iframe width="560" height="315" src="https://www.youtube.com/embed/zi8qHEL-Ilk?si=_Auoaun27CbVfTQR" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe> */}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar o vídeo desta aula.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

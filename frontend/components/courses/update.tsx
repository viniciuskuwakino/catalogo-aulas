"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { BACKEND_URL } from "@/lib/contants"
import { useAuthStore } from "@/store/useAuthStore"

type CourseFormValues = {
  id: string
  title: string
  summary?: string | null
  language?: "pt" | "en" | "es" | null
}

type Inputs = {
  title: string
  summary: string
  language: "pt" | "en" | "es"
}

interface DialogUpdateCourseProps {
  course: CourseFormValues
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DEFAULT_VALUES: Inputs = {
  title: "",
  summary: "",
  language: "pt",
}

export function DialogUpdateCourse({
  course,
  trigger,
  open: openProp,
  onOpenChange,
}: DialogUpdateCourseProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<Inputs>({
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (!open) return

    const normalizedLanguage =
      course.language && ["pt", "en", "es"].includes(course.language)
        ? (course.language as Inputs["language"])
        : "pt"

    reset({
      title: course.title ?? "",
      summary: course.summary ?? "",
      language: normalizedLanguage,
    })
  }, [course, open, reset])

  const handleOpenChange = (value: boolean) => {
    if (openProp === undefined) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }

  const updateMutation = useMutation({
    mutationFn: async (input: Inputs) => {
      if (!user?.token) {
        throw new Error("Sessão expirada. Faça login novamente para continuar.")
      }

      const response = await fetch(`${BACKEND_URL}/courses/${course.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(input),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          payload?.message ??
          "Não foi possível atualizar o curso. Tente novamente."
        throw new Error(message)
      }
    },
    onSuccess: () => {
      toast.success("Curso atualizado", {
        description: `"${course.title}" foi atualizado com sucesso.`,
      })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      handleOpenChange(false)
    },
    onError: (error) => {
      toast.error("Erro ao atualizar curso", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado.",
      })
    },
  })

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    updateMutation.mutate(data)
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      Editar curso
    </Button>
  )
  const shouldRenderTrigger =
    trigger !== undefined || (openProp === undefined && onOpenChange === undefined)
  const triggerNode = trigger ?? defaultTrigger

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {shouldRenderTrigger ? (
        <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar curso</DialogTitle>
          <DialogDescription>
            Atualize os campos necessários para editar este curso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="update-course-title">Título</Label>
              <Input
                id="update-course-title"
                placeholder="Nome do curso"
                {...register("title", {
                  required: "Campo Título não pode estar vazio",
                  maxLength: {
                    value: 120,
                    message: "Título não pode ter mais de 120 caracteres",
                  },
                })}
              />
              {errors.title && (
                <p className="text-red-600 text-sm ml-1" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="update-course-summary">Descrição</Label>
              <Textarea
                id="update-course-summary"
                placeholder="Resumo do curso"
                rows={4}
                {...register("summary", {
                  required: "Campo Resumo não pode estar vazio",
                  minLength: {
                    value: 10,
                    message: "Resumo deve conter pelo menos 10 caracteres",
                  },
                })}
              />
              {errors.summary && (
                <p className="text-red-600 text-sm ml-1" role="alert">
                  {errors.summary.message}
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="update-course-language">Idioma</Label>
              <Controller
                control={control}
                name="language"
                rules={{ required: "Selecione um idioma" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="update-course-language">
                      <SelectValue placeholder="Selecione um idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">Inglês</SelectItem>
                      <SelectItem value="es">Espanhol</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.language && (
                <p className="text-red-600 text-sm ml-1" role="alert">
                  {errors.language.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={updateMutation.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

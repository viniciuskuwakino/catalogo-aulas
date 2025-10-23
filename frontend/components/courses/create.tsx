"use client"

import { useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

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

type Inputs = {
  title: string
  summary: string
  language: "pt" | "en" | "es"
}

export function DialogAddCourse() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<Inputs>({
    defaultValues: {
      title: "",
      summary: "",
      language: "pt",
    },
  })

  const createCourseMutation = useMutation({
    mutationFn: async (input: Inputs) => {
      if (!user?.token) {
        throw new Error("Sessão expirada. Faça login novamente para continuar.")
      }

      const response = await fetch(`${BACKEND_URL}/courses`, {
        method: "POST",
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
          "Não foi possível cadastrar o curso. Tente novamente."
        throw new Error(message)
      }

      return { payload, input }
    },
    onSuccess: (_, variables) => {
      toast.success("Curso criado", {
        description: `"${variables.title}" foi cadastrado com sucesso.`,
      })
      reset()
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar curso", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado.",
      })
    },
  })

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    createCourseMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="icon">
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar curso</DialogTitle>
          <DialogDescription>
            Preencha os campos para cadastrar um novo curso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="course-title">Título</Label>
              <Input
                id="course-title"
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
              <Label htmlFor="course-summary">Descrição</Label>
              <Textarea
                id="course-summary"
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
              <Label htmlFor="course-language">Idioma</Label>
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
                    <SelectTrigger id="course-language">
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
              <Button variant="outline" disabled={createCourseMutation.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createCourseMutation.isPending}>
              {createCourseMutation.isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

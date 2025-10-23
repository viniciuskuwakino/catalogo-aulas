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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BACKEND_URL } from "@/lib/contants"
import { useAuthStore } from "@/store/useAuthStore"

type Inputs = {
  fromStatus: AuditStatusOption
  toStatus: AuditStatusOption
  reason: string
}

export type AuditStatusOption = "draft" | "pending_review" | "published"

export const AUDIT_STATUS_OPTIONS: { value: AuditStatusOption; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "pending_review", label: "Em revisão" },
  { value: "published", label: "Publicado" },
]

export function DialogAddAudit() {
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
      fromStatus: "draft",
      toStatus: "published",
      reason: "",
    },
  })

  const createAuditMutation = useMutation({
    mutationFn: async (input: Inputs) => {
      if (!user?.token) {
        throw new Error("Sessão expirada. Faça login novamente para continuar.")
      }

      const response = await fetch(`${BACKEND_URL}/audits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          fromStatus: input.fromStatus,
          toStatus: input.toStatus,
          reason: input.reason,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          payload?.message ??
          "Não foi possível cadastrar a auditoria. Tente novamente."
        throw new Error(message)
      }

      return { payload, input }
    },
    onSuccess: () => {
      toast.success("Auditoria criada", {
        description: "Registro de auditoria cadastrado com sucesso.",
      })
      reset()
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ["audits"] })
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar auditoria", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado.",
      })
    },
  })

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    createAuditMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="icon" aria-label="Adicionar auditoria">
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar auditoria</DialogTitle>
          <DialogDescription>
            Preencha os campos para cadastrar uma nova auditoria.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="audit-from-status">Status anterior</Label>
              <Controller
                control={control}
                name="fromStatus"
                rules={{ required: "Selecione um status" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="audit-from-status">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.fromStatus && (
                <p className="ml-1 text-sm text-red-600" role="alert">
                  {errors.fromStatus.message}
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="audit-to-status">Status atual</Label>
              <Controller
                control={control}
                name="toStatus"
                rules={{ required: "Selecione um status" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="audit-to-status">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.toStatus && (
                <p className="ml-1 text-sm text-red-600" role="alert">
                  {errors.toStatus.message}
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="audit-reason">Justificativa</Label>
              <textarea
                id="audit-reason"
                className="flex h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Descreva a justificativa para esta alteração de status"
                {...register("reason", {
                  required: "Campo Justificativa não pode estar vazio",
                  minLength: {
                    value: 4,
                    message: "Justificativa deve conter pelo menos 4 caracteres",
                  },
                })}
              />
              {errors.reason && (
                <p className="ml-1 text-sm text-red-600" role="alert">
                  {errors.reason.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={createAuditMutation.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createAuditMutation.isPending}>
              {createAuditMutation.isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

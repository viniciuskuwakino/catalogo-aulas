"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

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
import {
  AUDIT_STATUS_OPTIONS,
  type AuditStatusOption,
} from "@/components/audits/create"
import { Button } from "@/components/ui/button"

type AuditFormValues = {
  id: string
  toStatus: string | null | undefined
  reason?: string | null
}

type Inputs = {
  toStatus: AuditStatusOption
  reason: string
}

interface DialogUpdateAuditProps {
  audit: AuditFormValues
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DEFAULT_VALUES: Inputs = {
  toStatus: "published",
  reason: "",
}

function normalizeStatus(status: string | null | undefined): AuditStatusOption {
  if (!status) return "draft"

  const normalized = status.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")

  if (normalized === "draft") return "draft"
  if (normalized === "pending_review" || normalized === "pending-review") return "pending_review"
  if (normalized === "published") return "published"

  return "draft"
}

export function DialogUpdateAudit({
  audit,
  trigger,
  open: openProp,
  onOpenChange,
}: DialogUpdateAuditProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const currentStatus = useMemo(
    () => normalizeStatus(audit.toStatus),
    [audit.toStatus]
  )
  const availableStatuses = useMemo(
    () => AUDIT_STATUS_OPTIONS.filter((option) => option.value !== currentStatus),
    [currentStatus]
  )
  const selectableStatuses =
    availableStatuses.length > 0 ? availableStatuses : AUDIT_STATUS_OPTIONS
  const currentStatusLabel =
    AUDIT_STATUS_OPTIONS.find((option) => option.value === currentStatus)?.label ??
    "Indefinido"

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<Inputs>({
    defaultValues: DEFAULT_VALUES,
  })

  const handleOpenChange = (value: boolean) => {
    if (openProp === undefined) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }

  useEffect(() => {
    if (!open) return
    const defaultNextStatus = selectableStatuses[0]?.value ?? currentStatus
    reset({
      toStatus: defaultNextStatus,
      reason: audit.reason ?? "",
    })
  }, [audit, open, reset, selectableStatuses, currentStatus])

  const updateMutation = useMutation({
    mutationFn: async (input: Inputs) => {
      if (!user?.token) {
        throw new Error("Sessão expirada. Faça login novamente para continuar.")
      }

      const response = await fetch(`${BACKEND_URL}/audits/${audit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          fromStatus: currentStatus,
          toStatus: input.toStatus,
          reason: input.reason,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          payload?.message ??
          "Não foi possível atualizar a auditoria. Tente novamente."
        throw new Error(message)
      }
    },
    onSuccess: () => {
      toast.success("Auditoria atualizada", {
        description: "Registro de auditoria atualizado com sucesso.",
      })
      queryClient.invalidateQueries({ queryKey: ["audits"] })
      handleOpenChange(false)
    },
    onError: (error) => {
      toast.error("Erro ao atualizar auditoria", {
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar auditoria</DialogTitle>
          <DialogDescription>
            Atualize os campos necessários para editar esta auditoria.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <div className="text-sm text-muted-foreground">
              Status atual:{" "}
              <span className="font-medium text-foreground">{currentStatusLabel}</span>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="update-audit-to-status">Próximo status</Label>
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
                    <SelectTrigger id="update-audit-to-status">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableStatuses.map((option) => (
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
              <Label htmlFor="update-audit-reason">Justificativa</Label>
              <textarea
                id="update-audit-reason"
                className="flex h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Atualize a justificativa para esta alteração de status"
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

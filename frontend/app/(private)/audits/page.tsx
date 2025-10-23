import { DialogAddAudit } from "@/components/audits/create"
import { AuditsDataTable } from "@/components/audits/data-table"

export default async function AuditsListPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Auditorias</h1>
        <DialogAddAudit />
      </div>
      <div className="mt-6">
        <AuditsDataTable />
      </div>
    </div>
  )
}


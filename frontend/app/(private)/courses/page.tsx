import { DialogAddCourse } from "@/components/courses/create"
import { DataTable } from "@/components/courses/data-table"
import { getManualToken } from "@/lib/api"

export default async function CoursesListPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Cursos</h1>
        <DialogAddCourse />
      </div>
      <div className="mt-6">
        <DataTable/>
      </div>
    </div>
  )
}

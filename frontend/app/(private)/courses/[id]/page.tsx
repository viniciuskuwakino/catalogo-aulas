import { CourseById } from "@/components/courses/course-by-id"

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CourseById id={id} />
}

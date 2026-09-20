import { HomePage } from "@/components/HomePage"
import { fetchPublishedProjects } from "@/lib/fetchPublishedProjects"

export const revalidate = 60

export default async function Home() {
  const { projects } = await fetchPublishedProjects()
  return <HomePage projects={projects} />
}

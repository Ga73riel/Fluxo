import { getPayloadClient } from '@/lib/payload'
import PlannerApp, { type Curriculum } from './PlannerApp'

export default async function HomePage() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'curricula',
    overrideAccess: false,
    limit: 100,
    pagination: false,
    sort: 'name',
  })

  const curricula = result.docs.map((doc) => ({
    slug: doc.slug,
    name: doc.name,
    shortName: doc.shortName,
    totalHours: doc.totalHours,
    periodCount: doc.periodCount,
    colors: doc.colors,
    subjects: doc.subjects,
  })) as Curriculum[]

  return <PlannerApp curricula={curricula} />
}

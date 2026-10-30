import PlannerApp, { type Curriculum } from './PlannerApp'
import curricula from '@/data/curricula.json'

export default function HomePage() {
  return <PlannerApp curricula={curricula as Curriculum[]} />
}

import { Dumbbell } from "lucide-react"

interface LoadingDumbbellProps {
  size?: number
  className?: string
}

export default function LoadingDumbbell({ size = 24, className = "" }: LoadingDumbbellProps) {
  return (
    <div className={`animate-spin ${className}`}>
      <Dumbbell size={size} />
    </div>
  )
}

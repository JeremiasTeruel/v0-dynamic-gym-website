"use client"

import { Dumbbell } from "lucide-react"
import { useEffect, useState } from "react"

interface LoadingDumbbellProps {
  size?: number
  className?: string
}

export default function LoadingDumbbell({ size = 24, className = "" }: LoadingDumbbellProps) {
  const [animationState, setAnimationState] = useState<"fast" | "slow" | "done">("fast")

  useEffect(() => {
    // Iniciar con giros rápidos
    const fastTimer = setTimeout(() => {
      // Cambiar a giro lento después de 1.5 segundos (tiempo para 2-3 giros rápidos)
      setAnimationState("slow")

      // Detener la animación después del giro lento
      const slowTimer = setTimeout(() => {
        setAnimationState("done")
      }, 1000) // Tiempo para 1 giro lento

      return () => clearTimeout(slowTimer)
    }, 1500)

    return () => clearTimeout(fastTimer)
  }, [])

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Dumbbell
        size={size}
        className={`text-green-600 ${
          animationState === "fast" ? "animate-spin-fast" : animationState === "slow" ? "animate-spin-slow" : ""
        }`}
      />
    </div>
  )
}

"use client"

import { Users } from "lucide-react"
import { useTheme } from "@/context/theme-context"

interface GraficoUsuariosDiaProps {
  cantidad: number
}

export default function GraficoUsuariosDia({ cantidad }: GraficoUsuariosDiaProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="h-64 flex flex-col items-center justify-center">
      <div className="relative">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center ${
            cantidad > 0
              ? "bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700"
              : "bg-gray-200 dark:bg-gray-700"
          } shadow-lg`}
        >
          <div className="text-center">
            <p className="text-4xl font-bold text-white">{cantidad}</p>
            <p className="text-xs text-white/90 uppercase tracking-wide">{cantidad === 1 ? "Usuario" : "Usuarios"}</p>
          </div>
        </div>
        <div
          className={`absolute -top-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center ${
            cantidad > 0 ? "bg-orange-500 dark:bg-orange-600" : "bg-gray-300 dark:bg-gray-600"
          } shadow-md`}
        >
          <Users className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          {cantidad === 0 ? "No hay nuevos usuarios hoy" : "Nuevos usuarios registrados hoy"}
        </p>
        <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  )
}

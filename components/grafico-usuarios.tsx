"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTheme } from "@/context/theme-context"

interface DatoUsuarios {
  mes: string
  usuarios: number
}

interface GraficoUsuariosProps {
  datos: DatoUsuarios[]
}

export default function GraficoUsuarios({ datos }: GraficoUsuariosProps) {
  const { theme } = useTheme()

  if (!datos || datos.length === 0 || datos.every((item) => item.usuarios === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No se han registrado usuarios anteriormente.
      </div>
    )
  }

  const isDark = theme === "dark"

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
          <XAxis
            dataKey="mes"
            tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
            axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
          />
          <YAxis
            tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
            axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
          />
          <Tooltip
            formatter={(value) => [value, "Nuevos usuarios"]}
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              borderRadius: "6px",
              color: isDark ? "#f3f4f6" : "#111827",
            }}
          />
          <Line type="monotone" dataKey="usuarios" stroke={isDark ? "#fb923c" : "#f97316"} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

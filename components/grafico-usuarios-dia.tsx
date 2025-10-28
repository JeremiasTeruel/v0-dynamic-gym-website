"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTheme } from "@/context/theme-context"

interface GraficoUsuariosDiaProps {
  cantidad: number
}

export default function GraficoUsuariosDia({ cantidad }: GraficoUsuariosDiaProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const datos = [
    {
      nombre: "Hoy",
      usuarios: cantidad,
    },
  ]

  return (
    <div className="h-64">
      {cantidad === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          No se han registrado usuarios nuevos hoy.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
            <XAxis
              dataKey="nombre"
              tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
              axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
            />
            <YAxis
              tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
              axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
              allowDecimals={false}
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
            <Bar dataKey="usuarios" fill={isDark ? "#fb923c" : "#f97316"} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      <div className="text-center mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{cantidad}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {cantidad === 1 ? "Usuario nuevo hoy" : "Usuarios nuevos hoy"}
        </p>
      </div>
    </div>
  )
}

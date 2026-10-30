"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useTheme } from "@/context/theme-context"

interface DatoUsuarios {
  mes: string
  usuarios: number
  godoyCruz: number
  maipu: number
  sinSede: number
}

interface GraficoUsuariosProps {
  datos: DatoUsuarios[]
}

const ETIQUETAS: Record<string, string> = {
  godoyCruz: "Godoy Cruz",
  maipu: "Maipú",
  sinSede: "Sin sede",
}

export default function GraficoUsuarios({ datos }: GraficoUsuariosProps) {
  const { theme } = useTheme()

  if (!datos || datos.length === 0 || datos.every((item) => item.usuarios === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No se han registrado usuarios nuevos en los últimos 6 meses.
      </div>
    )
  }

  const isDark = theme === "dark"
  const haySinSede = datos.some((item) => item.sinSede > 0)

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
          <XAxis
            dataKey="mes"
            tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
            axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
          />
          <YAxis
            tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
            axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value, name) => [value, ETIQUETAS[name as string] ?? name]}
            cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              borderRadius: "6px",
              color: isDark ? "#f3f4f6" : "#111827",
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}>{ETIQUETAS[value] ?? value}</span>
            )}
          />
          <Bar dataKey="godoyCruz" stackId="sede" fill="#eab308" />
          <Bar dataKey="maipu" stackId="sede" fill="#dc2626" />
          {haySinSede && <Bar dataKey="sinSede" stackId="sede" fill={isDark ? "#6b7280" : "#9ca3af"} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

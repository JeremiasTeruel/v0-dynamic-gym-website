"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useTheme } from "next-themes" // Import directly from next-themes

interface Usuario {
  id?: string
  nombreApellido: string
  dni: string
  actividad: string
}

interface GraficoUsuariosActividadProps {
  usuarios: Usuario[]
}

// Colores para cada actividad
const COLORES_ACTIVIDADES: Record<string, string> = {
  Normal: "#3b82f6", // blue
  Familiar: "#22c55e", // green
  BJJ: "#f59e0b", // amber
  MMA: "#ef4444", // red
  Boxeo: "#8b5cf6", // violet
  Convenio: "#06b6d4", // cyan
  Dia: "#f97316", // orange
  Referees: "#ec4899", // pink
}

export default function GraficoUsuariosActividad({ usuarios }: GraficoUsuariosActividadProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Contar usuarios por actividad
  const conteoActividades = usuarios.reduce(
    (acc, usuario) => {
      const actividad = usuario.actividad || "Sin actividad"
      acc[actividad] = (acc[actividad] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Convertir a formato para el gráfico y ordenar por cantidad
  const datos = Object.entries(conteoActividades)
    .map(([actividad, cantidad]) => ({
      actividad,
      cantidad,
      color: COLORES_ACTIVIDADES[actividad] || "#6b7280",
    }))
    .sort((a, b) => b.cantidad - a.cantidad)

  const totalUsuarios = usuarios.length

  if (datos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No hay usuarios registrados
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
            <XAxis
              type="number"
              tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
            />
            <YAxis
              type="category"
              dataKey="actividad"
              tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                borderRadius: "8px",
                color: isDark ? "#f3f4f6" : "#111827",
              }}
              formatter={(value: number, name: string, props: any) => {
                const porcentaje = ((value / totalUsuarios) * 100).toFixed(1)
                return [`${value} usuarios (${porcentaje}%)`, props.payload.actividad]
              }}
              labelFormatter={() => ""}
            />
            <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
              {datos.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda con colores y totales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        {datos.map((item) => (
          <div key={item.actividad} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600 dark:text-gray-300 truncate">{item.actividad}</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 ml-auto">{item.cantidad}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-gray-500 dark:text-gray-400">Total de usuarios: </span>
        <span className="font-bold text-gray-900 dark:text-gray-100">{totalUsuarios}</span>
      </div>
    </div>
  )
}

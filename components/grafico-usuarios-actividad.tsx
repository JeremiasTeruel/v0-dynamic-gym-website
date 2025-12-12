"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useTheme } from "next-themes"

interface Usuario {
  id?: string
  nombreApellido: string
  dni: string
  actividad: string
  fechaCreacion?: string // Agregado para identificar usuarios nuevos
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

const esUsuarioNuevo = (fechaCreacion?: string): boolean => {
  if (!fechaCreacion) return false
  const fecha = new Date(fechaCreacion)
  const ahora = new Date()
  return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
}

export default function GraficoUsuariosActividad({ usuarios }: GraficoUsuariosActividadProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const conteoActividades = usuarios.reduce(
    (acc, usuario) => {
      const actividad = usuario.actividad || "Sin actividad"
      if (!acc[actividad]) {
        acc[actividad] = { total: 0, nuevos: 0 }
      }
      acc[actividad].total += 1
      if (esUsuarioNuevo(usuario.fechaCreacion)) {
        acc[actividad].nuevos += 1
      }
      return acc
    },
    {} as Record<string, { total: number; nuevos: number }>,
  )

  // Convertir a formato para el gráfico y ordenar por cantidad
  const datos = Object.entries(conteoActividades)
    .map(([actividad, { total, nuevos }]) => ({
      actividad,
      cantidad: total,
      nuevos,
      color: COLORES_ACTIVIDADES[actividad] || "#6b7280",
    }))
    .sort((a, b) => b.cantidad - a.cantidad)

  const totalUsuarios = usuarios.length
  const totalNuevos = datos.reduce((acc, item) => acc + item.nuevos, 0)

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
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  const porcentaje = ((data.cantidad / totalUsuarios) * 100).toFixed(1)
                  return (
                    <div
                      className="p-3 rounded-lg shadow-lg"
                      style={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                      }}
                    >
                      <p className="font-semibold" style={{ color: data.color }}>
                        {data.actividad}
                      </p>
                      <p className="text-sm" style={{ color: isDark ? "#d1d5db" : "#4b5563" }}>
                        Total: {data.cantidad} usuarios ({porcentaje}%)
                      </p>
                      <p className="text-sm text-green-500">Nuevos este mes: {data.nuevos}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
              {datos.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        {datos.map((item) => (
          <div key={item.actividad} className="flex flex-col p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600 dark:text-gray-300 truncate">{item.actividad}</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 ml-auto">{item.cantidad}</span>
            </div>
            {item.nuevos > 0 && (
              <span className="text-xs text-green-600 dark:text-green-400 ml-5">
                +{item.nuevos} nuevo{item.nuevos > 1 ? "s" : ""} este mes
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Total de usuarios: </span>
          <span className="font-bold text-gray-900 dark:text-gray-100">{totalUsuarios}</span>
        </div>
        {totalNuevos > 0 && (
          <div className="text-sm">
            <span className="text-green-600 dark:text-green-400">
              +{totalNuevos} usuario{totalNuevos > 1 ? "s" : ""} nuevo{totalNuevos > 1 ? "s" : ""} este mes
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts"
import { useTheme } from "next-themes"

interface Usuario {
  id?: string
  nombreApellido: string
  dni: string
  actividad: string
  fechaVencimiento?: string
}

interface GraficoUsuariosActivosProps {
  usuarios: Usuario[]
}

export default function GraficoUsuariosActivos({ usuarios }: GraficoUsuariosActivosProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Filtrar usuarios que NO sean "Referees"
  const usuariosFiltrados = usuarios.filter(
    (usuario) => usuario.actividad?.toLowerCase() !== "referees"
  )

  // Calcular usuarios al dia y vencidos
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  let alDia = 0
  let vencidos = 0

  usuariosFiltrados.forEach((usuario) => {
    if (!usuario.fechaVencimiento) {
      vencidos += 1
      return
    }

    const fechaVencimiento = new Date(usuario.fechaVencimiento)
    fechaVencimiento.setHours(0, 0, 0, 0)

    if (fechaVencimiento >= hoy) {
      alDia += 1
    } else {
      vencidos += 1
    }
  })

  const datos = [
    {
      nombre: "Al día",
      cantidad: alDia,
      color: "#22c55e", // green-500
    },
    {
      nombre: "Vencidos",
      cantidad: vencidos,
      color: "#ef4444", // red-500
    },
  ]

  const totalUsuarios = usuariosFiltrados.length
  const porcentajeAlDia = totalUsuarios > 0 ? ((alDia / totalUsuarios) * 100).toFixed(1) : "0"
  const porcentajeVencidos = totalUsuarios > 0 ? ((vencidos / totalUsuarios) * 100).toFixed(1) : "0"

  if (usuariosFiltrados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No hay usuarios registrados
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
            <XAxis
              dataKey="nombre"
              tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
            />
            <YAxis
              tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
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
                  const porcentaje = totalUsuarios > 0 ? ((data.cantidad / totalUsuarios) * 100).toFixed(1) : "0"
                  return (
                    <div
                      className="p-3 rounded-lg shadow-lg"
                      style={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                      }}
                    >
                      <p className="font-semibold" style={{ color: data.color }}>
                        {data.nombre}
                      </p>
                      <p className="text-sm" style={{ color: isDark ? "#d1d5db" : "#4b5563" }}>
                        {data.cantidad} usuarios ({porcentaje}%)
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
              {datos.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen visual */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Al día</span>
          </div>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{alDia}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{porcentajeAlDia}%</span>
        </div>

        <div className="flex flex-col items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Vencidos</span>
          </div>
          <span className="text-2xl font-bold text-red-600 dark:text-red-400">{vencidos}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{porcentajeVencidos}%</span>
        </div>
      </div>

      <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-gray-500 dark:text-gray-400 text-sm">Total usuarios (sin Referees): </span>
        <span className="font-bold text-gray-900 dark:text-gray-100">{totalUsuarios}</span>
      </div>
    </div>
  )
}

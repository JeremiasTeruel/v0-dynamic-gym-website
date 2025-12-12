"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useTheme } from "@/context/theme-context"

interface DatosMes {
  mes: string
  efectivo: number
  mercadoPago: number
}

interface GraficoMetodosMensualProps {
  datos: DatosMes[]
}

export default function GraficoMetodosMensual({ datos = [] }: GraficoMetodosMensualProps) {
  const { theme } = useTheme()

  // Verificar si hay datos para evitar errores de renderizado
  if (!datos || datos.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No se han registrado pagos anteriormente.
      </div>
    )
  }

  const isDark = theme === "dark"

  // Colores para modo claro y oscuro
  const colores = {
    efectivo: isDark ? "#10b981" : "#4ade80",
    mercadoPago: isDark ? "#2563eb" : "#3b82f6",
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 rounded-lg shadow-lg border ${
            isDark ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
          }`}
        >
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ${entry.value.toLocaleString("es-AR")}
            </p>
          ))}
          <p className={`text-sm font-semibold mt-2 pt-2 border-t ${isDark ? "border-gray-600" : "border-gray-200"}`}>
            Total: ${payload.reduce((sum: number, entry: any) => sum + entry.value, 0).toLocaleString("es-AR")}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
          <XAxis
            dataKey="mes"
            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
            axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
          />
          <YAxis
            tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
            axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
            tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              color: isDark ? "#f3f4f6" : "#111827",
            }}
          />
          <Bar dataKey="efectivo" name="Efectivo" fill={colores.efectivo} radius={[4, 4, 0, 0]} />
          <Bar dataKey="mercadoPago" name="Mercado Pago" fill={colores.mercadoPago} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

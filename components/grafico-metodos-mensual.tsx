"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "@/context/theme-context"

interface DatoMetodoMensual {
  mes: string
  efectivo: number
  mercadoPago: number
}

interface GraficoMetodosMensualProps {
  datos: DatoMetodoMensual[]
}

export default function GraficoMetodosMensual({ datos = [] }: GraficoMetodosMensualProps) {
  const { theme } = useTheme()

  const formatMonto = (value: number) => {
    return `$${value.toLocaleString("es-AR")}`
  }

  // Verificar si hay datos para evitar errores de renderizado
  if (!datos || datos.length === 0 || datos.every((item) => item.efectivo === 0 && item.mercadoPago === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No se han registrado pagos anteriormente.
      </div>
    )
  }

  const isDark = theme === "dark"

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
          <XAxis
            dataKey="mes"
            tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
            axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
          />
          <YAxis
            tickFormatter={formatMonto}
            tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
            axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString("es-AR")}`,
              name === "efectivo" ? "Efectivo" : "Mercado Pago",
            ]}
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              borderRadius: "6px",
              color: isDark ? "#f3f4f6" : "#111827",
            }}
          />
          <Legend
            wrapperStyle={{
              color: isDark ? "#f3f4f6" : "#111827",
            }}
          />
          <Bar dataKey="efectivo" fill={isDark ? "#10b981" : "#4ade80"} name="Efectivo" />
          <Bar dataKey="mercadoPago" fill={isDark ? "#2563eb" : "#3b82f6"} name="Mercado Pago" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

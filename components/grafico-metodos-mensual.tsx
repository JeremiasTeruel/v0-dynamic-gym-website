"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useTheme } from "@/context/theme-context"

export default function GraficoMetodosMensual({ datos = [] }) {
  const { theme } = useTheme()

  // Verificar si hay datos para evitar errores de renderizado
  if (!datos || datos.length === 0 || datos.every((item) => item.value === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No se han registrado pagos anteriormente.
      </div>
    )
  }

  const isDark = theme === "dark"

  // Ajustar colores para modo oscuro
  const datosConColores = datos.map((item) => ({
    ...item,
    fill: item.name === "Efectivo" ? (isDark ? "#10b981" : "#4ade80") : isDark ? "#2563eb" : "#3b82f6",
  }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={datosConColores}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {datosConColores.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value}%`, "Porcentaje"]}
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

export default function GraficoMetodosMensual({ datos = [] }) {
  // Verificar si hay datos para evitar errores de renderizado
  if (!datos || datos.length === 0 || datos.every((item) => item.value === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No se han registrado pagos anteriormente.
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={datos}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {datos.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}%`, "Porcentaje"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

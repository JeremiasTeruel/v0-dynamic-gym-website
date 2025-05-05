"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

export default function GraficoMetodosMensual() {
  // Datos de ejemplo para métodos de pago mensuales
  const datos = [
    { name: "Efectivo", value: 65, fill: "#4ade80" },
    { name: "Mercado Pago", value: 35, fill: "#3b82f6" },
  ]

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

"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface DatoMetodoPago {
  name: string
  value: number
  fill: string
}

interface GraficoMetodosPagoProps {
  datos: DatoMetodoPago[]
}

export default function GraficoMetodosPago({ datos }: GraficoMetodosPagoProps) {
  // Verificar si hay datos para evitar errores de renderizado
  if (!datos || datos.length === 0 || datos.every((item) => item.value === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No han ingresado pagos el día de la fecha.
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
          <Tooltip formatter={(value) => [value, "Cantidad"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

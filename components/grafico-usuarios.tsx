"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DatoUsuarios {
  mes: string
  usuarios: number
}

interface GraficoUsuariosProps {
  datos: DatoUsuarios[]
}

export default function GraficoUsuarios({ datos }: GraficoUsuariosProps) {
  // Verificar si hay datos para evitar errores de renderizado
  if (!datos || datos.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-500">No hay datos disponibles</div>
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip formatter={(value) => [value, "Nuevos usuarios"]} />
          <Line type="monotone" dataKey="usuarios" stroke="#f97316" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

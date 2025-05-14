"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DatoMensual {
  mes: string
  monto: number
}

interface GraficoMensualProps {
  datos: DatoMensual[]
}

export default function GraficoMensual({ datos }: GraficoMensualProps) {
  const formatMonto = (value: number) => {
    return `$${value.toLocaleString("es-AR")}`
  }

  // Verificar si hay datos para evitar errores de renderizado
  if (!datos || datos.length === 0 || datos.every((item) => item.monto === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No se han registrado pagos anteriormente.
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis tickFormatter={formatMonto} />
          <Tooltip formatter={(value) => [`$${value.toLocaleString("es-AR")}`, "Ingresos"]} />
          <Bar dataKey="monto" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { useTheme } from "@/context/theme-context"

interface DatoMetodoPago {
  name: string
  cuotas: number
  bebidas: number
  total: number
  fill: string
}

interface GraficoMetodosDetalladoProps {
  pagosCuotas: any[]
  ventasBebidas: any[]
  titulo: string
}

export default function GraficoMetodosDetallado({ pagosCuotas, ventasBebidas, titulo }: GraficoMetodosDetalladoProps) {
  const { theme } = useTheme()

  // Calcular totales por método de pago
  const efectivoCuotas = pagosCuotas
    .filter((pago) => pago.metodoPago === "Efectivo")
    .reduce((sum, pago) => sum + pago.monto, 0)
  const mercadoPagoCuotas = pagosCuotas
    .filter((pago) => pago.metodoPago === "Mercado Pago")
    .reduce((sum, pago) => sum + pago.monto, 0)

  const efectivoBebidas = ventasBebidas
    .filter((venta) => venta.metodoPago === "Efectivo")
    .reduce((sum, venta) => sum + venta.precioTotal, 0)
  const mercadoPagoBebidas = ventasBebidas
    .filter((venta) => venta.metodoPago === "Mercado Pago")
    .reduce((sum, venta) => sum + venta.precioTotal, 0)

  const datos: DatoMetodoPago[] = [
    {
      name: "Efectivo",
      cuotas: efectivoCuotas,
      bebidas: efectivoBebidas,
      total: efectivoCuotas + efectivoBebidas,
      fill: "#10b981",
    },
    {
      name: "Mercado Pago",
      cuotas: mercadoPagoCuotas,
      bebidas: mercadoPagoBebidas,
      total: mercadoPagoCuotas + mercadoPagoBebidas,
      fill: "#3b82f6",
    },
  ]

  const totalGeneral = datos.reduce((sum, item) => sum + item.total, 0)

  // Verificar si hay datos
  if (totalGeneral === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No hay ingresos registrados para mostrar.
      </div>
    )
  }

  const isDark = theme === "dark"

  const formatMonto = (value: number) => {
    return `$${value.toLocaleString("es-AR")}`
  }

  // Datos para el gráfico de barras apiladas
  const datosBarras = datos.map((item) => ({
    metodo: item.name,
    cuotas: item.cuotas,
    bebidas: item.bebidas,
  }))

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{titulo}</h3>

      {/* Gráfico de barras apiladas */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datosBarras} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
            <XAxis
              dataKey="metodo"
              tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 11 }}
              axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
            />
            <YAxis
              tickFormatter={formatMonto}
              tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 11 }}
              axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
            />
            <Tooltip
              formatter={(value, name) => [formatMonto(Number(value)), name === "cuotas" ? "Cuotas" : "Productos"]}
              contentStyle={{
                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                borderRadius: "6px",
                color: isDark ? "#f3f4f6" : "#111827",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="cuotas" stackId="ingresos" fill={isDark ? "#3b82f6" : "#2563eb"} name="Cuotas" />
            <Bar dataKey="bebidas" stackId="ingresos" fill={isDark ? "#10b981" : "#059669"} name="Productos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen en texto */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {datos.map((item) => (
          <div key={item.name} className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
            <div className="text-gray-600 dark:text-gray-400">Cuotas: {formatMonto(item.cuotas)}</div>
            <div className="text-gray-600 dark:text-gray-400">Productos: {formatMonto(item.bebidas)}</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">Total: {formatMonto(item.total)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {totalGeneral > 0 ? Math.round((item.total / totalGeneral) * 100) : 0}% del total
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

"use client"

import { DollarSign, TrendingUp, BarChart3, PieChart } from "lucide-react"

interface ResumenIngresosProps {
  pagosCuotas: any[]
  ventasBebidas: any[]
  periodo: string
}

export default function ResumenIngresos({ pagosCuotas, ventasBebidas, periodo }: ResumenIngresosProps) {
  // Calcular totales
  const totalCuotas = pagosCuotas.reduce((sum, pago) => sum + pago.monto, 0)
  const totalBebidas = ventasBebidas.reduce((sum, venta) => sum + venta.precioTotal, 0)
  const totalGeneral = totalCuotas + totalBebidas

  // Calcular por método de pago
  const efectivoCuotas = pagosCuotas.filter((p) => p.metodoPago === "Efectivo").reduce((sum, p) => sum + p.monto, 0)
  const mercadoPagoCuotas = pagosCuotas
    .filter((p) => p.metodoPago === "Mercado Pago")
    .reduce((sum, p) => sum + p.monto, 0)

  const efectivoBebidas = ventasBebidas
    .filter((v) => v.metodoPago === "Efectivo")
    .reduce((sum, v) => sum + v.precioTotal, 0)
  const mercadoPagoBebidas = ventasBebidas
    .filter((v) => v.metodoPago === "Mercado Pago")
    .reduce((sum, v) => sum + v.precioTotal, 0)

  const totalEfectivo = efectivoCuotas + efectivoBebidas
  const totalMercadoPago = mercadoPagoCuotas + mercadoPagoBebidas

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
  }

  const calcularPorcentaje = (parte: number, total: number) => {
    return total > 0 ? Math.round((parte / total) * 100) : 0
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resumen de Ingresos - {periodo}</h3>
        <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>

      {/* Total General */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{formatMonto(totalGeneral)}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {pagosCuotas.length + ventasBebidas.length} transacciones totales
        </div>
      </div>

      {/* Desglose por tipo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {calcularPorcentaje(totalCuotas, totalGeneral)}%
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatMonto(totalCuotas)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Cuotas ({pagosCuotas.length})</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {calcularPorcentaje(totalBebidas, totalGeneral)}%
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatMonto(totalBebidas)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Bebidas ({ventasBebidas.length})</div>
        </div>
      </div>

      {/* Desglose por método de pago */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <PieChart className="h-4 w-4 mr-2" />
          Por método de pago
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded p-3 border">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">💵 Efectivo</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatMonto(totalEfectivo)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Cuotas: {formatMonto(efectivoCuotas)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Bebidas: {formatMonto(efectivoBebidas)}</div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
              {calcularPorcentaje(totalEfectivo, totalGeneral)}% del total
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded p-3 border">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">💳 Mercado Pago</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatMonto(totalMercadoPago)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Cuotas: {formatMonto(mercadoPagoCuotas)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Bebidas: {formatMonto(mercadoPagoBebidas)}</div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
              {calcularPorcentaje(totalMercadoPago, totalGeneral)}% del total
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

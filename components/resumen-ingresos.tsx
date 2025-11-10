"use client"

import { DollarSign, TrendingUp, BarChart3, PieChart, TrendingDown } from "lucide-react"

interface ResumenIngresosProps {
  pagosCuotas: any[]
  ventasBebidas: any[]
  egresos?: any[]
  periodo: string
  cajaAbierta?: boolean
  onAbrirCaja?: () => void
}

export default function ResumenIngresos({
  pagosCuotas,
  ventasBebidas,
  egresos = [],
  periodo,
  cajaAbierta = true,
  onAbrirCaja,
}: ResumenIngresosProps) {
  // Calcular totales de ingresos
  const totalCuotas = pagosCuotas.reduce((sum, pago) => sum + pago.monto, 0)
  const totalBebidas = ventasBebidas.reduce((sum, venta) => sum + venta.precioTotal, 0)
  const totalIngresos = totalCuotas + totalBebidas

  const totalEgresos = egresos.reduce((sum, egreso) => sum + egreso.monto, 0)

  const totalGeneral = totalIngresos - totalEgresos

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

  const efectivoEgresos = egresos.filter((e) => e.metodoPago === "Efectivo").reduce((sum, e) => sum + e.monto, 0)
  const mercadoPagoEgresos = egresos.filter((e) => e.metodoPago === "Mercado Pago").reduce((sum, e) => sum + e.monto, 0)

  const totalEfectivo = efectivoCuotas + efectivoBebidas - efectivoEgresos
  const totalMercadoPago = mercadoPagoCuotas + mercadoPagoBebidas - mercadoPagoEgresos

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
  }

  const calcularPorcentaje = (parte: number, total: number) => {
    return total > 0 ? Math.round((parte / total) * 100) : 0
  }

  if (!cajaAbierta) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8 border border-gray-200 dark:border-gray-600">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <DollarSign className="h-16 w-16 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No hay ingresos registrados</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            La caja se encuentra cerrada. Debe abrir la caja para comenzar a registrar ventas y pagos.
          </p>
          {onAbrirCaja && (
            <button
              onClick={onAbrirCaja}
              className="px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium"
            >
              Abrir Caja
            </button>
          )}
        </div>
      </div>
    )
  }

  if (totalIngresos === 0 && pagosCuotas.length === 0 && ventasBebidas.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8 border border-gray-200 dark:border-gray-600">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <DollarSign className="h-16 w-16 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No hay ingresos registrados {periodo.toLowerCase()}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Los pagos de cuotas y ventas de bebidas aparecerán aquí cuando se registren.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resumen de Ingresos - {periodo}</h3>
        <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>

      <div className="text-center mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ingresos Brutos</div>
        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">{formatMonto(totalIngresos)}</div>

        {totalEgresos > 0 && (
          <>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Egresos</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">-{formatMonto(totalEgresos)}</span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Neto</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatMonto(totalGeneral)}</div>
            </div>
          </>
        )}

        {totalEgresos === 0 && (
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{formatMonto(totalGeneral)}</div>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {pagosCuotas.length + ventasBebidas.length} transacciones
          {egresos.length > 0 && ` • ${egresos.length} egresos`}
        </div>
      </div>

      {/* Desglose por tipo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {calcularPorcentaje(totalCuotas, totalIngresos)}%
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatMonto(totalCuotas)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Cuotas ({pagosCuotas.length})</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {calcularPorcentaje(totalBebidas, totalIngresos)}%
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
          Por método de pago {totalEgresos > 0 && "(neto después de egresos)"}
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded p-3 border">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">💵 Efectivo</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatMonto(totalEfectivo)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Cuotas: {formatMonto(efectivoCuotas)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Bebidas: {formatMonto(efectivoBebidas)}</div>
            {efectivoEgresos > 0 && (
              <div className="text-xs text-red-500 dark:text-red-400">Egresos: -{formatMonto(efectivoEgresos)}</div>
            )}
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
              {calcularPorcentaje(totalEfectivo, totalGeneral)}% del total neto
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded p-3 border">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">💳 Mercado Pago</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatMonto(totalMercadoPago)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Cuotas: {formatMonto(mercadoPagoCuotas)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Bebidas: {formatMonto(mercadoPagoBebidas)}</div>
            {mercadoPagoEgresos > 0 && (
              <div className="text-xs text-red-500 dark:text-red-400">Egresos: -{formatMonto(mercadoPagoEgresos)}</div>
            )}
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
              {calcularPorcentaje(totalMercadoPago, totalGeneral)}% del total neto
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

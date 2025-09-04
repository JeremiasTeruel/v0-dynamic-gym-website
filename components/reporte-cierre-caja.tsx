"use client"

import { useState, useEffect } from "react"
import { FileText, Download } from "lucide-react"
import { useTheme } from "@/context/theme-context"

interface CierreCaja {
  id: string
  fecha: string
  totalGeneral: number
  totalEfectivo: number
  totalMercadoPago: number
  totalCuotas: number
  totalCuotasEfectivo: number
  totalCuotasMercadoPago: number
  totalBebidas: number
  totalBebidasEfectivo: number
  totalBebidasMercadoPago: number
  cantidadPagos: number
  cantidadVentasBebidas: number
  detalleVentasBebidas?: any[]
  fechaCierre: string
}

interface ReporteCierreCajaProps {
  isOpen: boolean
  onClose: () => void
}

export default function ReporteCierreCaja({ isOpen, onClose }: ReporteCierreCajaProps) {
  const { theme } = useTheme()
  const [cierres, setCierres] = useState<CierreCaja[]>([])
  const [cargando, setCargando] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState("")
  const [cierreSeleccionado, setCierreSeleccionado] = useState<CierreCaja | null>(null)

  useEffect(() => {
    if (isOpen) {
      cargarCierres()
    }
  }, [isOpen])

  const cargarCierres = async () => {
    try {
      setCargando(true)
      const response = await fetch("/api/caja/cerrar")

      if (response.ok) {
        const data = await response.json()
        setCierres(data)
      }
    } catch (error) {
      console.error("Error al cargar cierres:", error)
    } finally {
      setCargando(false)
    }
  }

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calcularPorcentaje = (parte: number, total: number) => {
    return total > 0 ? Math.round((parte / total) * 100) : 0
  }

  const exportarReporte = (cierre: CierreCaja) => {
    const contenido = `
REPORTE DE CIERRE DE CAJA
High Performance Gym
========================

Fecha: ${formatFecha(cierre.fecha)}
Hora de cierre: ${new Date(cierre.fechaCierre).toLocaleString("es-ES")}

RESUMEN GENERAL
===============
Total del día: ${formatMonto(cierre.totalGeneral)}
Total transacciones: ${cierre.cantidadPagos + cierre.cantidadVentasBebidas}

DESGLOSE POR TIPO DE INGRESO
============================
Cuotas de membresía: ${formatMonto(cierre.totalCuotas)} (${calcularPorcentaje(cierre.totalCuotas, cierre.totalGeneral)}%)
- Cantidad de pagos: ${cierre.cantidadPagos}
- Efectivo: ${formatMonto(cierre.totalCuotasEfectivo)}
- Mercado Pago: ${formatMonto(cierre.totalCuotasMercadoPago)}

Ventas de bebidas: ${formatMonto(cierre.totalBebidas)} (${calcularPorcentaje(cierre.totalBebidas, cierre.totalGeneral)}%)
- Cantidad de ventas: ${cierre.cantidadVentasBebidas}
- Efectivo: ${formatMonto(cierre.totalBebidasEfectivo)}
- Mercado Pago: ${formatMonto(cierre.totalBebidasMercadoPago)}

DESGLOSE POR MÉTODO DE PAGO
===========================
Efectivo: ${formatMonto(cierre.totalEfectivo)} (${calcularPorcentaje(cierre.totalEfectivo, cierre.totalGeneral)}%)
- Cuotas: ${formatMonto(cierre.totalCuotasEfectivo)}
- Bebidas: ${formatMonto(cierre.totalBebidasEfectivo)}

Mercado Pago: ${formatMonto(cierre.totalMercadoPago)} (${calcularPorcentaje(cierre.totalMercadoPago, cierre.totalGeneral)}%)
- Cuotas: ${formatMonto(cierre.totalCuotasMercadoPago)}
- Bebidas: ${formatMonto(cierre.totalBebidasMercadoPago)}

${
  cierre.detalleVentasBebidas && cierre.detalleVentasBebidas.length > 0
    ? `
DETALLE DE VENTAS DE BEBIDAS
============================
${cierre.detalleVentasBebidas
  .map((venta) => `${venta.nombreBebida} x${venta.cantidad} - ${formatMonto(venta.precioTotal)} (${venta.metodoPago})`)
  .join("\n")}
`
    : ""
}

Reporte generado automáticamente por el sistema de gestión.
    `.trim()

    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cierre-caja-${cierre.fecha}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-green-600 dark:text-green-400" />
            Reportes de Cierre de Caja
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {cargando ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando reportes...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lista de cierres */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Historial de Cierres ({cierres.length})
                </h3>

                {cierres.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No hay cierres de caja registrados
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {cierres.map((cierre) => (
                      <div
                        key={cierre.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatFecha(cierre.fecha)}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Cerrado el {new Date(cierre.fechaCierre).toLocaleString("es-ES")}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {formatMonto(cierre.totalGeneral)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {cierre.cantidadPagos + cierre.cantidadVentasBebidas} transacciones
                            </div>
                          </div>
                        </div>

                        {/* Desglose rápido */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Cuotas</div>
                            <div className="font-semibold text-blue-600 dark:text-blue-400">
                              {formatMonto(cierre.totalCuotas)}
                            </div>
                            <div className="text-xs text-gray-500">{cierre.cantidadPagos} pagos</div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Bebidas</div>
                            <div className="font-semibold text-green-600 dark:text-green-400">
                              {formatMonto(cierre.totalBebidas)}
                            </div>
                            <div className="text-xs text-gray-500">{cierre.cantidadVentasBebidas} ventas</div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Efectivo</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatMonto(cierre.totalEfectivo)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {calcularPorcentaje(cierre.totalEfectivo, cierre.totalGeneral)}%
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Mercado Pago</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatMonto(cierre.totalMercadoPago)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {calcularPorcentaje(cierre.totalMercadoPago, cierre.totalGeneral)}%
                            </div>
                          </div>
                        </div>

                        {/* Desglose detallado por método de pago */}
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">💵 Efectivo</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span>Cuotas:</span>
                                  <span>{formatMonto(cierre.totalCuotasEfectivo)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Bebidas:</span>
                                  <span>{formatMonto(cierre.totalBebidasEfectivo)}</span>
                                </div>
                                <div className="flex justify-between font-medium border-t pt-1">
                                  <span>Total:</span>
                                  <span>{formatMonto(cierre.totalEfectivo)}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">💳 Mercado Pago</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span>Cuotas:</span>
                                  <span>{formatMonto(cierre.totalCuotasMercadoPago)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Bebidas:</span>
                                  <span>{formatMonto(cierre.totalBebidasMercadoPago)}</span>
                                </div>
                                <div className="flex justify-between font-medium border-t pt-1">
                                  <span>Total:</span>
                                  <span>{formatMonto(cierre.totalMercadoPago)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botón de exportar */}
                        <div className="flex justify-end mt-4">
                          <button
                            onClick={() => exportarReporte(cierre)}
                            className="flex items-center px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Exportar Reporte
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import {
  X,
  FileText,
  Download,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  ShoppingCart,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"
import Alert from "@/components/alert"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"

interface DetallePagoCuota {
  nombreApellido: string
  dni: string
  monto: number
  metodoPago: string
  fecha: string
  actividad: string
}

interface DetalleVentaBebida {
  nombreBebida: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  metodoPago: string
  fecha: string
}

interface DetalleNuevoUsuario {
  nombreApellido: string
  dni: string
  actividad: string
  metodoPago: string
  fechaInicio: string
  fechaVencimiento: string
  fechaCreacion: string
}

interface CierreCaja {
  id: string
  fecha: string
  tipoCierre: "parcial" | "completo"
  totalGeneral: number
  totalEfectivo: number
  totalMercadoPago: number
  totalCuotas: number
  totalCuotasEfectivo: number
  totalCuotasMercadoPago: number
  cantidadPagos: number
  totalBebidas: number
  totalBebidasEfectivo: number
  totalBebidasMercadoPago: number
  cantidadVentasBebidas: number
  detalleVentasBebidas: DetalleVentaBebida[]
  detallePagosCuotas: DetallePagoCuota[]
  detalleNuevosUsuarios: DetalleNuevoUsuario[]
  fechaCierre: string
}

interface ReporteCierreCajaProps {
  isOpen: boolean
  onClose: () => void
}

export default function ReporteCierreCaja({ isOpen, onClose }: ReporteCierreCajaProps) {
  const [cierres, setCierres] = useState<CierreCaja[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fechaFiltro, setFechaFiltro] = useState("")
  const [seccionesExpandidas, setSeccionesExpandidas] = useState<{
    [key: string]: { pagos: boolean; ventas: boolean; usuarios: boolean }
  }>({})
  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })
  const { getSoundEnabled } = useSoundPreferences()

  useEffect(() => {
    if (isOpen) {
      cargarCierres()
    }
  }, [isOpen])

  const cargarCierres = async () => {
    try {
      setCargando(true)
      setError(null)

      const response = await fetch("/api/caja/cerrar")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al cargar reportes de caja")
      }

      const data = await response.json()
      setCierres(data)

      if (getSoundEnabled()) {
        await soundGenerator.playSuccessSound()
      }
    } catch (error) {
      console.error("Error al cargar cierres:", error)
      setError(error instanceof Error ? error.message : "Error al cargar los reportes de caja")

      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }
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

  const formatFechaHora = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calcularPorcentaje = (parte: number, total: number) => {
    return total > 0 ? Math.round((parte / total) * 100) : 0
  }

  const toggleSeccion = (cierreId: string, seccion: "pagos" | "ventas" | "usuarios") => {
    setSeccionesExpandidas((prev) => ({
      ...prev,
      [cierreId]: {
        ...prev[cierreId],
        [seccion]: !prev[cierreId]?.[seccion],
      },
    }))
  }

  const exportarReporte = (cierre: CierreCaja) => {
    const contenido = `
REPORTE DE CIERRE DE CAJA ${cierre.tipoCierre === "parcial" ? "(PARCIAL)" : "(COMPLETO)"}
High Performance Gym
========================

Fecha: ${formatFecha(cierre.fecha)}
Fecha de cierre: ${new Date(cierre.fechaCierre).toLocaleString("es-ES")}
Tipo de cierre: ${cierre.tipoCierre === "parcial" ? "Parcial" : "Completo"}

RESUMEN GENERAL
===============
Total del día: ${formatMonto(cierre.totalGeneral)}
Total Efectivo: ${formatMonto(cierre.totalEfectivo)} (${calcularPorcentaje(cierre.totalEfectivo, cierre.totalGeneral)}%)
Total Mercado Pago: ${formatMonto(cierre.totalMercadoPago)} (${calcularPorcentaje(cierre.totalMercadoPago, cierre.totalGeneral)}%)

CUOTAS DE MEMBRESÍA
==================
Total cuotas: ${formatMonto(cierre.totalCuotas)}
Efectivo: ${formatMonto(cierre.totalCuotasEfectivo)}
Mercado Pago: ${formatMonto(cierre.totalCuotasMercadoPago)}
Cantidad de pagos: ${cierre.cantidadPagos}

${
  cierre.detallePagosCuotas && cierre.detallePagosCuotas.length > 0
    ? `
DETALLE DE PAGOS DE CUOTAS
===========================
${cierre.detallePagosCuotas
  .map(
    (pago, index) =>
      `${index + 1}. ${pago.nombreApellido} (DNI: ${pago.dni})
   Actividad: ${pago.actividad}
   Monto: ${formatMonto(pago.monto)}
   Método de pago: ${pago.metodoPago}
   Fecha: ${formatFechaHora(pago.fecha)}
`,
  )
  .join("\n")}
`
    : ""
}

VENTAS DE BEBIDAS
================
Total bebidas: ${formatMonto(cierre.totalBebidas)}
Efectivo: ${formatMonto(cierre.totalBebidasEfectivo)}
Mercado Pago: ${formatMonto(cierre.totalBebidasMercadoPago)}
Cantidad de ventas: ${cierre.cantidadVentasBebidas}

${
  cierre.detalleVentasBebidas && cierre.detalleVentasBebidas.length > 0
    ? `
DETALLE DE VENTAS DE BEBIDAS
===========================
${cierre.detalleVentasBebidas
  .map(
    (venta, index) =>
      `${index + 1}. ${venta.nombreBebida} x${venta.cantidad}
   Precio unitario: ${formatMonto(venta.precioUnitario)}
   Total: ${formatMonto(venta.precioTotal)}
   Método de pago: ${venta.metodoPago}
   Fecha: ${formatFechaHora(venta.fecha)}
`,
  )
  .join("\n")}
`
    : ""
}

${
  cierre.detalleNuevosUsuarios && cierre.detalleNuevosUsuarios.length > 0
    ? `
NUEVOS USUARIOS AGREGADOS
=========================
Total de nuevos usuarios: ${cierre.detalleNuevosUsuarios.length}

${cierre.detalleNuevosUsuarios
  .map(
    (usuario, index) =>
      `${index + 1}. ${usuario.nombreApellido} (DNI: ${usuario.dni})
   Actividad: ${usuario.actividad}
   Método de pago: ${usuario.metodoPago}
   Fecha inicio: ${new Date(usuario.fechaInicio).toLocaleDateString("es-ES")}
   Fecha vencimiento: ${new Date(usuario.fechaVencimiento).toLocaleDateString("es-ES")}
   Registrado el: ${formatFechaHora(usuario.fechaCreacion)}
`,
  )
  .join("\n")}
`
    : ""
}

${
  cierre.tipoCierre === "parcial"
    ? "NOTA: Este es un cierre parcial. Los ingresos del día no fueron reseteados."
    : "NOTA: Este es un cierre completo. Los ingresos del día fueron reseteados."
}

Reporte generado el ${new Date().toLocaleString("es-ES")}
    `.trim()

    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cierre-caja-${cierre.tipoCierre}-${cierre.fecha}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    if (getSoundEnabled()) {
      soundGenerator.playSuccessSound()
    }

    setAlertaInfo({
      mensaje: "Reporte exportado exitosamente",
      visible: true,
      tipo: "success",
    })
  }

  const cierresFiltrados = fechaFiltro ? cierres.filter((cierre) => cierre.fecha === fechaFiltro) : cierres

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-purple-600 dark:text-purple-400" />
              Reportes de Cierre de Caja
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Filtros */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por fecha:</label>
                </div>
                <input
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                {fechaFiltro && (
                  <button
                    onClick={() => setFechaFiltro("")}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Limpiar filtro
                  </button>
                )}
              </div>

              <button
                onClick={cargarCierres}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
                disabled={cargando}
              >
                {cargando ? <LoadingDumbbell size={16} /> : <FileText className="h-4 w-4" />}
                {cargando ? "Cargando..." : "Actualizar"}
              </button>
            </div>

            {/* Lista de cierres */}
            {cargando ? (
              <div className="flex justify-center py-8">
                <LoadingDumbbell size={32} className="text-purple-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando reportes...</span>
              </div>
            ) : cierresFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {fechaFiltro ? "No hay cierres para la fecha seleccionada" : "No hay reportes de caja disponibles"}
                </p>
                {!fechaFiltro && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Los reportes aparecerán aquí después de realizar el primer cierre de caja
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Mostrando {cierresFiltrados.length} de {cierres.length} reportes
                </div>

                {cierresFiltrados.map((cierre) => (
                  <div
                    key={cierre.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
                  >
                    {/* Header del cierre */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {formatFecha(cierre.fecha)}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              cierre.tipoCierre === "parcial"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            }`}
                          >
                            {cierre.tipoCierre === "parcial" ? "Parcial" : "Completo"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Cerrado el {new Date(cierre.fechaCierre).toLocaleString("es-ES")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatMonto(cierre.totalGeneral)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {cierre.cantidadPagos + cierre.cantidadVentasBebidas} transacciones
                          </p>
                        </div>
                        <button
                          onClick={() => exportarReporte(cierre)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                          title="Exportar reporte"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden md:inline">Exportar</span>
                        </button>
                      </div>
                    </div>

                    {/* Desglose detallado */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Resumen por método de pago */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Métodos de pago</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Efectivo</span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatMonto(cierre.totalEfectivo)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Mercado Pago</span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatMonto(cierre.totalMercadoPago)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cuotas */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          Cuotas ({cierre.cantidadPagos})
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatMonto(cierre.totalCuotas)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Efectivo:</span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {formatMonto(cierre.totalCuotasEfectivo)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">MP:</span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {formatMonto(cierre.totalCuotasMercadoPago)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bebidas */}
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                          Bebidas ({cierre.cantidadVentasBebidas})
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatMonto(cierre.totalBebidas)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Efectivo:</span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {formatMonto(cierre.totalBebidasEfectivo)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">MP:</span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {formatMonto(cierre.totalBebidasMercadoPago)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      {/* Detalle de Pagos de Cuotas */}
                      {cierre.detallePagosCuotas && cierre.detallePagosCuotas.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSeccion(cierre.id, "pagos")}
                            className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                Detalle de Pagos de Cuotas ({cierre.detallePagosCuotas.length})
                              </span>
                            </div>
                            {seccionesExpandidas[cierre.id]?.pagos ? (
                              <ChevronUp className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-600" />
                            )}
                          </button>
                          {seccionesExpandidas[cierre.id]?.pagos && (
                            <div className="p-4 bg-white dark:bg-gray-800 max-h-96 overflow-y-auto">
                              <div className="space-y-3">
                                {cierre.detallePagosCuotas.map((pago, index) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                          {pago.nombreApellido}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">DNI: {pago.dni}</p>
                                      </div>
                                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {formatMonto(pago.monto)}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Actividad:</span>
                                        <span className="ml-2 text-gray-900 dark:text-gray-100">{pago.actividad}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Método:</span>
                                        <span className="ml-2 text-gray-900 dark:text-gray-100">{pago.metodoPago}</span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                                          {formatFechaHora(pago.fecha)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Detalle de Ventas de Bebidas */}
                      {cierre.detalleVentasBebidas && cierre.detalleVentasBebidas.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSeccion(cierre.id, "ventas")}
                            className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-5 w-5 text-green-600" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                Detalle de Ventas de Bebidas ({cierre.detalleVentasBebidas.length})
                              </span>
                            </div>
                            {seccionesExpandidas[cierre.id]?.ventas ? (
                              <ChevronUp className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-600" />
                            )}
                          </button>
                          {seccionesExpandidas[cierre.id]?.ventas && (
                            <div className="p-4 bg-white dark:bg-gray-800 max-h-96 overflow-y-auto">
                              <div className="space-y-3">
                                {cierre.detalleVentasBebidas.map((venta, index) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                          {venta.nombreBebida}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          Cantidad: {venta.cantidad} x {formatMonto(venta.precioUnitario)}
                                        </p>
                                      </div>
                                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                        {formatMonto(venta.precioTotal)}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Método:</span>
                                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                                          {venta.metodoPago}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                                          {formatFechaHora(venta.fecha)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Detalle de Nuevos Usuarios */}
                      {cierre.detalleNuevosUsuarios && cierre.detalleNuevosUsuarios.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSeccion(cierre.id, "usuarios")}
                            className="w-full flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-purple-600" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                Nuevos Usuarios Agregados ({cierre.detalleNuevosUsuarios.length})
                              </span>
                            </div>
                            {seccionesExpandidas[cierre.id]?.usuarios ? (
                              <ChevronUp className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-600" />
                            )}
                          </button>
                          {seccionesExpandidas[cierre.id]?.usuarios && (
                            <div className="p-4 bg-white dark:bg-gray-800 max-h-96 overflow-y-auto">
                              <div className="space-y-3">
                                {cierre.detalleNuevosUsuarios.map((usuario, index) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                  >
                                    <div className="mb-2">
                                      <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {usuario.nombreApellido}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">DNI: {usuario.dni}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Actividad:</span>
                                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                                          {usuario.actividad}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Método de pago:</span>
                                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                                          {usuario.metodoPago}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Inicio:</span>
                                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                                          {new Date(usuario.fechaInicio).toLocaleDateString("es-ES")}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Vencimiento:</span>
                                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                                          {new Date(usuario.fechaVencimiento).toLocaleDateString("es-ES")}
                                        </span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-gray-600 dark:text-gray-400">Registrado:</span>
                                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                                          {formatFechaHora(usuario.fechaCreacion)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerta */}
      <Alert
        message={alertaInfo.mensaje}
        isOpen={alertaInfo.visible}
        onClose={() => setAlertaInfo((prev) => ({ ...prev, visible: false }))}
        type={alertaInfo.tipo}
      />
    </>
  )
}

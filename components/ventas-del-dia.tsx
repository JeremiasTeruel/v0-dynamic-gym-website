"use client"

import { useState, useMemo } from "react"
import { DollarSign, ShoppingCart, Pencil, Check, X } from "lucide-react"
import CerrarCajaModal from "@/components/cerrar-caja-modal"
import PinModal from "@/components/pin-modal"
import Alert from "@/components/alert"
import type { RegistroPago } from "@/context/gym-context"

interface VentaBebida {
  id: string
  nombreBebida: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  metodoPago: string
  fecha: string
  editado?: boolean
}

interface VentasDelDiaProps {
  pagos: RegistroPago[]
  ventasBebidas: VentaBebida[]
  onCerrarCaja?: (tipoCierre: "parcial" | "completo") => Promise<void>
  onPagoEditado?: (pagoActualizado: RegistroPago) => void
  onVentaEditada?: (ventaActualizada: VentaBebida) => void
}

export default function VentasDelDia({
  pagos = [],
  ventasBebidas = [],
  onCerrarCaja,
  onPagoEditado,
  onVentaEditada,
}: VentasDelDiaProps) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })

  // Estado de edicion para pagos de cuotas
  const [editandoPagoId, setEditandoPagoId] = useState<string | null>(null)
  const [editPagoData, setEditPagoData] = useState<{ tipoPago: string; monto: string; metodoPago: string }>({
    tipoPago: "",
    monto: "",
    metodoPago: "",
  })

  // Estado de edicion para ventas de productos
  const [editandoVentaId, setEditandoVentaId] = useState<string | null>(null)
  const [editVentaData, setEditVentaData] = useState<{ cantidad: string; precioTotal: string; metodoPago: string }>({
    cantidad: "",
    precioTotal: "",
    metodoPago: "",
  })

  // PIN modal
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)

  const totalPagos = useMemo(() => {
    return pagos.reduce((sum, pago) => sum + pago.monto, 0)
  }, [pagos])

  const totalBebidas = useMemo(() => {
    return ventasBebidas.reduce((sum, venta) => sum + venta.precioTotal, 0)
  }, [ventasBebidas])

  const totalDelDia = totalPagos + totalBebidas

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
  }

  // --- Edicion de Pagos de Cuotas ---
  const iniciarEdicionPago = (pago: RegistroPago) => {
    setEditandoPagoId(pago.id || null)
    setEditPagoData({
      tipoPago: pago.tipoPago || "Pago de cuota",
      monto: pago.monto.toString(),
      metodoPago: pago.metodoPago,
    })
  }

  const cancelarEdicionPago = () => {
    setEditandoPagoId(null)
    setEditPagoData({ tipoPago: "", monto: "", metodoPago: "" })
  }

  const confirmarEdicionPago = () => {
    const action = async () => {
      try {
        const response = await fetch(`/api/pagos/${editandoPagoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipoPago: editPagoData.tipoPago,
            monto: editPagoData.monto,
            metodoPago: editPagoData.metodoPago,
          }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || "Error al actualizar pago")
        }

        const pagoActualizado = await response.json()
        if (onPagoEditado) {
          onPagoEditado(pagoActualizado)
        }

        setAlertaInfo({ mensaje: "Pago actualizado correctamente", visible: true, tipo: "success" })
        cancelarEdicionPago()
      } catch (error: any) {
        setAlertaInfo({ mensaje: error.message || "Error al actualizar", visible: true, tipo: "error" })
      }
    }

    setPendingAction(() => action)
    setPinModalOpen(true)
  }

  // --- Edicion de Ventas de Productos ---
  const iniciarEdicionVenta = (venta: VentaBebida) => {
    setEditandoVentaId(venta.id)
    setEditVentaData({
      cantidad: venta.cantidad.toString(),
      precioTotal: venta.precioTotal.toString(),
      metodoPago: venta.metodoPago,
    })
  }

  const cancelarEdicionVenta = () => {
    setEditandoVentaId(null)
    setEditVentaData({ cantidad: "", precioTotal: "", metodoPago: "" })
  }

  const confirmarEdicionVenta = () => {
    const action = async () => {
      try {
        const response = await fetch(`/api/ventas-bebidas/${editandoVentaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cantidad: editVentaData.cantidad,
            precioTotal: editVentaData.precioTotal,
            metodoPago: editVentaData.metodoPago,
          }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || "Error al actualizar venta")
        }

        const ventaActualizada = await response.json()
        if (onVentaEditada) {
          onVentaEditada(ventaActualizada)
        }

        setAlertaInfo({ mensaje: "Venta actualizada correctamente", visible: true, tipo: "success" })
        cancelarEdicionVenta()
      } catch (error: any) {
        setAlertaInfo({ mensaje: error.message || "Error al actualizar", visible: true, tipo: "error" })
      }
    }

    setPendingAction(() => action)
    setPinModalOpen(true)
  }

  const handlePinSuccess = async () => {
    if (pendingAction) {
      await pendingAction()
      setPendingAction(null)
    }
  }

  const handleCerrarCaja = async (tipoCierre: "parcial" | "completo") => {
    try {
      if (onCerrarCaja) {
        await onCerrarCaja(tipoCierre)
        setAlertaInfo({
          mensaje:
            tipoCierre === "parcial"
              ? "Reporte parcial generado correctamente. Los ingresos del dia se mantienen activos."
              : "Caja cerrada correctamente. Los ingresos se han registrado en los reportes y el dia se ha reseteado.",
          visible: true,
          tipo: "success",
        })
      }
    } catch (error) {
      console.error("Error al cerrar caja:", error)
      setAlertaInfo({
        mensaje: "Error al cerrar la caja. Por favor, intenta de nuevo.",
        visible: true,
        tipo: "error",
      })
    }
  }

  if (pagos.length === 0 && ventasBebidas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No han ingresado pagos ni ventas el dia de la fecha.
      </div>
    )
  }

  return (
    <div>
      {/* Resumen de ingresos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Cuotas</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatMonto(totalPagos)}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">{pagos.length} pagos</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Productos</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatMonto(totalBebidas)}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{ventasBebidas.length} ventas</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatMonto(totalDelDia)}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {pagos.length + ventasBebidas.length} transacciones
              </p>
            </div>
            <div className="flex flex-col items-center">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400 -mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Tablas de transacciones */}
      <div className="space-y-6">
        {/* Tabla de Pagos de Cuotas */}
        {pagos.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Pagos de Cuotas ({pagos.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Metodo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {pagos.map((pago) => {
                    const isEditing = editandoPagoId === pago.id
                    const isEditado = (pago as any).editado

                    return (
                      <tr key={pago.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {isEditado && (
                            <span className="inline-block bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-1.5 py-0.5 rounded mr-1.5">
                              e
                            </span>
                          )}
                          {pago.userNombre}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {pago.userDni}
                        </td>

                        {/* Tipo */}
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {isEditing ? (
                            <select
                              value={editPagoData.tipoPago}
                              onChange={(e) => setEditPagoData((prev) => ({ ...prev, tipoPago: e.target.value }))}
                              className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="Nuevo">Nuevo</option>
                              <option value="Pago de cuota">Pago de cuota</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                pago.tipoPago === "Nuevo"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}
                            >
                              {pago.tipoPago || "Pago de cuota"}
                            </span>
                          )}
                        </td>

                        {/* Monto */}
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editPagoData.monto}
                              onChange={(e) => setEditPagoData((prev) => ({ ...prev, monto: e.target.value }))}
                              className="w-24 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              min="0"
                            />
                          ) : (
                            formatMonto(pago.monto)
                          )}
                        </td>

                        {/* Metodo */}
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {isEditing ? (
                            <select
                              value={editPagoData.metodoPago}
                              onChange={(e) => setEditPagoData((prev) => ({ ...prev, metodoPago: e.target.value }))}
                              className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="Efectivo">Efectivo</option>
                              <option value="Mercado Pago">Mercado Pago</option>
                              <option value="Mixto">Mixto</option>
                            </select>
                          ) : (
                            <div>
                              <span>{pago.metodoPago}</span>
                              {pago.metodoPago === "Mixto" && (pago as any).montoEfectivo !== undefined && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                  Ef: {formatMonto((pago as any).montoEfectivo)} / MP: {formatMonto((pago as any).montoMercadoPago)}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={confirmarEdicionPago}
                                className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                title="Confirmar"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelarEdicionPago}
                                className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                title="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => iniciarEdicionPago(pago)}
                              disabled={editandoPagoId !== null || editandoVentaId !== null}
                              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabla de Ventas de Productos */}
        {ventasBebidas.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Ventas de Productos ({ventasBebidas.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Metodo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {ventasBebidas.map((venta) => {
                    const isEditing = editandoVentaId === venta.id
                    const isEditado = venta.editado

                    return (
                      <tr key={venta.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {isEditado && (
                            <span className="inline-block bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-1.5 py-0.5 rounded mr-1.5">
                              e
                            </span>
                          )}
                          {venta.nombreBebida}
                        </td>

                        {/* Cantidad */}
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editVentaData.cantidad}
                              onChange={(e) => setEditVentaData((prev) => ({ ...prev, cantidad: e.target.value }))}
                              className="w-16 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              min="1"
                            />
                          ) : (
                            venta.cantidad
                          )}
                        </td>

                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatMonto(venta.precioUnitario)}
                        </td>

                        {/* Total */}
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editVentaData.precioTotal}
                              onChange={(e) => setEditVentaData((prev) => ({ ...prev, precioTotal: e.target.value }))}
                              className="w-24 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              min="0"
                            />
                          ) : (
                            formatMonto(venta.precioTotal)
                          )}
                        </td>

                        {/* Metodo */}
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {isEditing ? (
                            <select
                              value={editVentaData.metodoPago}
                              onChange={(e) => setEditVentaData((prev) => ({ ...prev, metodoPago: e.target.value }))}
                              className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="Efectivo">Efectivo</option>
                              <option value="Mercado Pago">Mercado Pago</option>
                              <option value="Mixto">Mixto</option>
                            </select>
                          ) : (
                            <div>
                              <span>{venta.metodoPago}</span>
                              {venta.metodoPago === "Mixto" && (venta as any).montoEfectivo !== undefined && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                  Ef: {formatMonto((venta as any).montoEfectivo)} / MP: {formatMonto((venta as any).montoMercadoPago)}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={confirmarEdicionVenta}
                                className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                title="Confirmar"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelarEdicionVenta}
                                className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                title="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => iniciarEdicionVenta(venta)}
                              disabled={editandoPagoId !== null || editandoVentaId !== null}
                              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Boton Cerrar Caja */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-center">
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Cerrar Caja
          </button>
        </div>
      </div>

      {/* Modal de Cerrar Caja */}
      <CerrarCajaModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onConfirm={handleCerrarCaja}
        pagosDia={pagos}
        ventasBebidas={ventasBebidas}
        totalDia={totalDelDia}
      />

      {/* PIN Modal */}
      <PinModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false)
          setPendingAction(null)
        }}
        onSuccess={handlePinSuccess}
        title="Editar transaccion"
        description="Ingrese el PIN de seguridad para confirmar la edicion de esta transaccion."
      />

      {/* Alerta */}
      <Alert
        message={alertaInfo.mensaje}
        isOpen={alertaInfo.visible}
        onClose={() => setAlertaInfo((prev) => ({ ...prev, visible: false }))}
        type={alertaInfo.tipo}
      />
    </div>
  )
}

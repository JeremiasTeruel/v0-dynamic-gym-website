"use client"

import { useState } from "react"
import { X, DollarSign, CreditCard, Banknote, ShoppingCart } from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"
import PinModal from "@/components/pin-modal"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"
import type { RegistroPago } from "@/context/gym-context"

interface VentaBebida {
  id: string
  nombreBebida: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  metodoPago: string
  fecha: string
}

interface CerrarCajaModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (tipoCierre: "parcial" | "completo") => Promise<void>
  pagosDia: RegistroPago[]
  ventasBebidas?: VentaBebida[]
  totalDia: number
}

export default function CerrarCajaModal({
  isOpen,
  onClose,
  onConfirm,
  pagosDia,
  ventasBebidas = [],
  totalDia,
}: CerrarCajaModalProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [tipoCierre, setTipoCierre] = useState<"parcial" | "completo">("completo")
  const { getSoundEnabled } = useSoundPreferences()

  if (!isOpen) return null

  // Calcular totales por método de pago (cuotas)
  const totalEfectivoCuotas = pagosDia
    .filter((pago) => pago.metodoPago === "Efectivo")
    .reduce((sum, pago) => sum + pago.monto, 0)

  const totalMercadoPagoCuotas = pagosDia
    .filter((pago) => pago.metodoPago === "Mercado Pago")
    .reduce((sum, pago) => sum + pago.monto, 0)

  // Calcular totales por método de pago (bebidas)
  const totalEfectivoBebidas = ventasBebidas
    .filter((venta) => venta.metodoPago === "Efectivo")
    .reduce((sum, venta) => sum + venta.precioTotal, 0)

  const totalMercadoPagoBebidas = ventasBebidas
    .filter((venta) => venta.metodoPago === "Mercado Pago")
    .reduce((sum, venta) => sum + venta.precioTotal, 0)

  // Totales combinados por método de pago
  const totalEfectivoFinal = totalEfectivoCuotas + totalEfectivoBebidas
  const totalMercadoPagoFinal = totalMercadoPagoCuotas + totalMercadoPagoBebidas

  // Totales por tipo de ingreso
  const totalCuotas = totalEfectivoCuotas + totalMercadoPagoCuotas
  const totalBebidas = totalEfectivoBebidas + totalMercadoPagoBebidas

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
  }

  const handleConfirmClick = () => {
    setShowPinModal(true)
  }

  const handlePinSuccess = async () => {
    try {
      setIsClosing(true)
      await onConfirm(tipoCierre)

      // Reproducir sonido de operación completada si está habilitado
      if (getSoundEnabled()) {
        await soundGenerator.playOperationCompleteSound()
      }

      onClose()
    } catch (error) {
      console.error("Error al cerrar caja:", error)

      // Reproducir sonido de error si está habilitado
      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }
    } finally {
      setIsClosing(false)
    }
  }

  const handlePinClose = () => {
    setShowPinModal(false)
  }

  const fechaHoy = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <DollarSign className="h-6 w-6 mr-2 text-red-600 dark:text-red-400" />
              Cerrar Caja
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isClosing}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Fecha */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{fechaHoy}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tipo de cierre</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTipoCierre("parcial")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    tipoCierre === "parcial"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                  disabled={isClosing}
                >
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Cierre Parcial</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Genera reporte sin cerrar el día</p>
                  </div>
                </button>
                <button
                  onClick={() => setTipoCierre("completo")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    tipoCierre === "completo"
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-red-300"
                  }`}
                  disabled={isClosing}
                >
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Cierre Completo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cierra el día definitivamente</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Resumen total */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total del día</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatMonto(totalDia)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {pagosDia.length + ventasBebidas.length}{" "}
                  {pagosDia.length + ventasBebidas.length === 1 ? "transacción" : "transacciones"}
                </p>
              </div>
            </div>

            {/* Desglose por tipo de ingreso */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Desglose de ingresos</h3>

              {/* Cuotas */}
              {totalCuotas > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Cuotas</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {pagosDia.length} {pagosDia.length === 1 ? "pago" : "pagos"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatMonto(totalCuotas)}</p>
                    </div>
                  </div>

                  {/* Desglose por método de pago de cuotas */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Efectivo:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatMonto(totalEfectivoCuotas)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Mercado Pago:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatMonto(totalMercadoPagoCuotas)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bebidas */}
              {totalBebidas > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Bebidas</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {ventasBebidas.length} {ventasBebidas.length === 1 ? "venta" : "ventas"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">
                        {formatMonto(totalBebidas)}
                      </p>
                    </div>
                  </div>

                  {/* Desglose por método de pago de bebidas */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Efectivo:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatMonto(totalEfectivoBebidas)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Mercado Pago:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatMonto(totalMercadoPagoBebidas)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen final por método de pago */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Resumen por método de pago</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <Banknote className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Efectivo</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700 dark:text-green-300">{formatMonto(totalEfectivoFinal)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {totalDia > 0 ? Math.round((totalEfectivoFinal / totalDia) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Mercado Pago</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-700 dark:text-blue-300">{formatMonto(totalMercadoPagoFinal)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {totalDia > 0 ? Math.round((totalMercadoPagoFinal / totalDia) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`border rounded-lg p-4 mb-6 ${
                tipoCierre === "parcial"
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
              }`}
            >
              <p
                className={`text-sm ${
                  tipoCierre === "parcial" ? "text-blue-800 dark:text-blue-300" : "text-yellow-800 dark:text-yellow-300"
                }`}
              >
                {tipoCierre === "parcial" ? (
                  <>
                    <strong>ℹ️ Cierre Parcial:</strong> Se generará un reporte con los datos actuales, pero los ingresos
                    del día NO se resetearán. Podrás seguir registrando pagos y ventas normalmente.
                  </>
                ) : (
                  <>
                    <strong>⚠️ Cierre Completo:</strong> Al cerrar la caja, estos ingresos se registrarán definitivamente
                    en los reportes semanales y mensuales. Los datos del día se resetearán para comenzar un nuevo día.
                    Esta acción no se puede deshacer.
                  </>
                )}
              </p>
            </div>

            {/* Botones */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                disabled={isClosing}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClick}
                className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center ${
                  tipoCierre === "parcial"
                    ? "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600"
                    : "bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600"
                }`}
                disabled={isClosing || totalDia === 0}
              >
                {isClosing ? (
                  <>
                    <LoadingDumbbell size={20} className="mr-2" />
                    Procesando...
                  </>
                ) : (
                  `Confirmar ${tipoCierre === "parcial" ? "Reporte" : "Cierre"}`
                )}
              </button>
            </div>

            {totalDia === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                No hay ingresos para cerrar la caja
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de PIN */}
      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        title={tipoCierre === "parcial" ? "Generar Reporte Parcial" : "Cerrar Caja"}
        description={`${
          tipoCierre === "parcial"
            ? "Se generará un reporte con los datos actuales sin cerrar el día."
            : "Esta acción cerrará la caja del día y reseteará los ingresos."
        } Total: ${formatMonto(totalDia)}. Desglose: Cuotas ${formatMonto(totalCuotas)} (Efectivo: ${formatMonto(totalEfectivoCuotas)}, MP: ${formatMonto(totalMercadoPagoCuotas)}), Bebidas ${formatMonto(totalBebidas)} (Efectivo: ${formatMonto(totalEfectivoBebidas)}, MP: ${formatMonto(totalMercadoPagoBebidas)}). Ingrese el PIN de seguridad para continuar.`}
      />
    </>
  )
}

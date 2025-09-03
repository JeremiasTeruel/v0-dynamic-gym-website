"use client"

import { useState } from "react"
import { X, DollarSign, CreditCard, Banknote } from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"
import PinModal from "@/components/pin-modal"
import type { RegistroPago } from "@/context/gym-context"

interface CerrarCajaModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  pagosDia: RegistroPago[]
  totalDia: number
}

export default function CerrarCajaModal({ isOpen, onClose, onConfirm, pagosDia, totalDia }: CerrarCajaModalProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)

  if (!isOpen) return null

  // Calcular totales por método de pago
  const totalEfectivo = pagosDia
    .filter((pago) => pago.metodoPago === "Efectivo")
    .reduce((sum, pago) => sum + pago.monto, 0)

  const totalMercadoPago = pagosDia
    .filter((pago) => pago.metodoPago === "Mercado Pago")
    .reduce((sum, pago) => sum + pago.monto, 0)

  const cantidadEfectivo = pagosDia.filter((pago) => pago.metodoPago === "Efectivo").length
  const cantidadMercadoPago = pagosDia.filter((pago) => pago.metodoPago === "Mercado Pago").length

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
  }

  const handleConfirmClick = () => {
    setShowPinModal(true)
  }

  const handlePinSuccess = async () => {
    try {
      setIsClosing(true)
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Error al cerrar caja:", error)
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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

            {/* Resumen total */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total del día</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatMonto(totalDia)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {pagosDia.length} {pagosDia.length === 1 ? "transacción" : "transacciones"}
                </p>
              </div>
            </div>

            {/* Desglose por método de pago */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Desglose por método de pago</h3>

              {/* Efectivo */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center">
                  <Banknote className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Efectivo</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cantidadEfectivo} {cantidadEfectivo === 1 ? "pago" : "pagos"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatMonto(totalEfectivo)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {totalDia > 0 ? Math.round((totalEfectivo / totalDia) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Mercado Pago */}
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Mercado Pago</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cantidadMercadoPago} {cantidadMercadoPago === 1 ? "pago" : "pagos"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatMonto(totalMercadoPago)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {totalDia > 0 ? Math.round((totalMercadoPago / totalDia) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Advertencia */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>⚠️ Atención:</strong> Al cerrar la caja, estos ingresos se registrarán definitivamente en los
                reportes semanales y mensuales. Esta acción no se puede deshacer.
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
                className="flex-1 px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                disabled={isClosing || totalDia === 0}
              >
                {isClosing ? (
                  <>
                    <LoadingDumbbell size={20} className="mr-2" />
                    Cerrando...
                  </>
                ) : (
                  "Confirmar Cierre"
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
        title="Cerrar Caja"
        description={`Esta acción cerrará la caja del día con un total de ${formatMonto(totalDia)}. Los ingresos se registrarán en los reportes. Ingrese el PIN de seguridad para continuar.`}
      />
    </>
  )
}

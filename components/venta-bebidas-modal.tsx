"use client"

import { useState } from "react"
import { X, DollarSign, CreditCard, Shuffle } from "lucide-react"
import LoadingDumbbell from "./loading-dumbbell"
import PinModal from "./pin-modal"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"

interface VentaBebidasModalProps {
  isOpen: boolean
  onClose: () => void
  bebidas: Array<{
    _id: string
    nombre: string
    precio: number
    stock: number
  }>
  onVentaExitosa: () => void
}

export default function VentaBebidasModal({ isOpen, onClose, bebidas, onVentaExitosa }: VentaBebidasModalProps) {
  const [selectedBebida, setSelectedBebida] = useState("")
  const [cantidad, setCantidad] = useState(1)
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "Mercado Pago" | "Mixto">("Efectivo")
  const [montoEfectivo, setMontoEfectivo] = useState("0")
  const [montoMercadoPago, setMontoMercadoPago] = useState("0")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingVenta, setPendingVenta] = useState(null)
  const { getSoundEnabled } = useSoundPreferences()

  const bebidaSeleccionada = bebidas.find((b) => b._id === selectedBebida)
  const totalVenta = bebidaSeleccionada ? bebidaSeleccionada.precio * cantidad : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!selectedBebida || cantidad <= 0) {
      setError("Por favor seleccione una bebida y cantidad válida")
      return
    }

    if (!bebidaSeleccionada) {
      setError("Bebida no encontrada")
      return
    }

    if (cantidad > bebidaSeleccionada.stock) {
      setError(`Stock insuficiente. Disponible: ${bebidaSeleccionada.stock}`)
      return
    }

    // Validar montos mixtos si el método de pago es Mixto
    if (metodoPago === "Mixto") {
      const efectivo = Number.parseFloat(montoEfectivo) || 0
      const mercadoPago = Number.parseFloat(montoMercadoPago) || 0

      if (efectivo <= 0 && mercadoPago <= 0) {
        setError("Debe especificar al menos un monto en efectivo o Mercado Pago")
        return
      }

      if (efectivo + mercadoPago !== totalVenta) {
        setError(`La suma debe ser igual al total ($${totalVenta})`)
        return
      }
    }

    // Guardar la venta pendiente y mostrar modal de PIN
    setPendingVenta({
      bebidaId: selectedBebida,
      cantidad,
      metodoPago,
      total: totalVenta,
      montoEfectivo: metodoPago === "Mixto" ? Number.parseFloat(montoEfectivo) : undefined,
      montoMercadoPago: metodoPago === "Mixto" ? Number.parseFloat(montoMercadoPago) : undefined,
    })
    setShowPinModal(true)
  }

  const handlePinSuccess = async () => {
    if (!pendingVenta) return

    try {
      setIsSubmitting(true)

      const ventaData = {
        bebidaId: pendingVenta.bebidaId,
        cantidad: pendingVenta.cantidad,
        metodoPago: pendingVenta.metodoPago,
        total: pendingVenta.total,
        fecha: new Date().toISOString(),
        ...(pendingVenta.metodoPago === "Mixto" && {
          montoEfectivo: pendingVenta.montoEfectivo,
          montoMercadoPago: pendingVenta.montoMercadoPago,
        }),
      }

      const response = await fetch("/api/ventas-bebidas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ventaData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al registrar la venta")
      }

      // Reproducir sonido de éxito si está habilitado
      if (getSoundEnabled()) {
        await soundGenerator.playSuccessSound()
      }

      // Resetear formulario
      setSelectedBebida("")
      setCantidad(1)
      setMetodoPago("Efectivo")
      setMontoEfectivo("0")
      setMontoMercadoPago("0")
      onVentaExitosa()
      onClose()
    } catch (err) {
      console.error("Error al registrar venta:", err)
      setError(err.message || "Error al registrar la venta")

      // Reproducir sonido de error si está habilitado
      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }
    } finally {
      setIsSubmitting(false)
      setPendingVenta(null)
    }
  }

  const handlePinClose = () => {
    setShowPinModal(false)
    setPendingVenta(null)
  }

  const handleMontoMixtoChange = (tipo: "efectivo" | "mercadoPago", value: string) => {
    if (tipo === "efectivo") {
      setMontoEfectivo(value)
    } else {
      setMontoMercadoPago(value)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Registrar Venta</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Bebida</label>
              <select
                value={selectedBebida}
                onChange={(e) => setSelectedBebida(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                disabled={isSubmitting}
              >
                <option value="">Seleccione una bebida</option>
                {bebidas.map((bebida) => (
                  <option key={bebida._id} value={bebida._id} disabled={bebida.stock === 0}>
                    {bebida.nombre} - ${bebida.precio} {bebida.stock === 0 ? "(Sin stock)" : `(Stock: ${bebida.stock})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Number.parseInt(e.target.value))}
                min="1"
                max={bebidaSeleccionada?.stock || 1}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                disabled={isSubmitting}
              />
              {bebidaSeleccionada && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Stock disponible: {bebidaSeleccionada.stock}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Método de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMetodoPago("Efectivo")
                    setMontoEfectivo("0")
                    setMontoMercadoPago("0")
                  }}
                  className={`p-3 rounded-md border-2 transition-all flex flex-col items-center gap-1 ${
                    metodoPago === "Efectivo"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700"
                  }`}
                  disabled={isSubmitting}
                >
                  <DollarSign size={20} />
                  <span className="text-xs font-medium">Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMetodoPago("Mercado Pago")
                    setMontoEfectivo("0")
                    setMontoMercadoPago("0")
                  }}
                  className={`p-3 rounded-md border-2 transition-all flex flex-col items-center gap-1 ${
                    metodoPago === "Mercado Pago"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                  disabled={isSubmitting}
                >
                  <CreditCard size={20} />
                  <span className="text-xs font-medium">M. Pago</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMetodoPago("Mixto")
                    setMontoEfectivo("0")
                    setMontoMercadoPago("0")
                  }}
                  className={`p-3 rounded-md border-2 transition-all flex flex-col items-center gap-1 ${
                    metodoPago === "Mixto"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : "border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700"
                  }`}
                  disabled={isSubmitting}
                >
                  <Shuffle size={20} />
                  <span className="text-xs font-medium">Mixto</span>
                </button>
              </div>
            </div>

            {/* Inputs para pago mixto */}
            {metodoPago === "Mixto" && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 space-y-3">
                <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">Desglose de Pago Mixto</h3>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Monto en Efectivo
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      value={montoEfectivo}
                      onChange={(e) => handleMontoMixtoChange("efectivo", e.target.value)}
                      className="w-full p-3 pl-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                      step="1"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Monto en Mercado Pago
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      value={montoMercadoPago}
                      onChange={(e) => handleMontoMixtoChange("mercadoPago", e.target.value)}
                      className="w-full p-3 pl-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                      step="1"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-300 dark:border-purple-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
                    <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      ${(Number.parseFloat(montoEfectivo) || 0) + (Number.parseFloat(montoMercadoPago) || 0)}
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Debe ser igual a: ${totalVenta}</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total:</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">${totalVenta}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700 dark:hover:bg-blue-600"
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingDumbbell size={20} className="mr-2" />
                    Procesando...
                  </>
                ) : (
                  "Registrar Venta"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de PIN */}
      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        title="Registrar Venta de Bebida"
        description={`Esta acción registrará la venta de ${cantidad} ${bebidaSeleccionada?.nombre || "bebida(s)"} por un total de $${totalVenta}. ${
          metodoPago === "Mixto" ? `Efectivo: $${montoEfectivo}, Mercado Pago: $${montoMercadoPago}.` : ""
        } Ingrese el PIN de seguridad para continuar.`}
      />
    </>
  )
}

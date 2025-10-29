"use client"

import { useState, useEffect } from "react"
import { X, ShoppingCart, Minus, Plus, CreditCard, Banknote, Split } from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"
import PinModal from "@/components/pin-modal"
import Alert from "@/components/alert"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"

interface Bebida {
  id: string
  nombre: string
  precio: number
  stock: number
  categoria: string
  activo: boolean
}

interface VentaBebidasModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function VentaBebidasModal({ isOpen, onClose }: VentaBebidasModalProps) {
  const [bebidas, setBebidas] = useState<Bebida[]>([])
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState<string>("")
  const [cantidad, setCantidad] = useState(1)
  const [metodoPago, setMetodoPago] = useState("Efectivo")
  const [montoEfectivo, setMontoEfectivo] = useState("0")
  const [montoMercadoPago, setMontoMercadoPago] = useState("0")
  const [cargandoBebidas, setCargandoBebidas] = useState(false)
  const [procesandoVenta, setProcesandoVenta] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })
  const { getSoundEnabled } = useSoundPreferences()

  // Cargar bebidas cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarBebidas()
      // Reset form
      setBebidaSeleccionada("")
      setCantidad(1)
      setMetodoPago("Efectivo")
      setMontoEfectivo("0")
      setMontoMercadoPago("0")
      setError(null)
    }
  }, [isOpen])

  const cargarBebidas = async () => {
    try {
      setCargandoBebidas(true)
      const response = await fetch("/api/bebidas")

      if (!response.ok) {
        throw new Error("Error al cargar bebidas")
      }

      const bebidasData = await response.json()
      setBebidas(bebidasData)
    } catch (error) {
      console.error("Error al cargar bebidas:", error)
      setError("Error al cargar las bebidas disponibles")
    } finally {
      setCargandoBebidas(false)
    }
  }

  const bebidaActual = bebidas.find((b) => b.id === bebidaSeleccionada)
  const precioTotal = bebidaActual ? bebidaActual.precio * cantidad : 0
  const stockDisponible = bebidaActual ? bebidaActual.stock : 0

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
  }

  const handleCantidadChange = (nuevaCantidad: number) => {
    if (nuevaCantidad >= 1 && nuevaCantidad <= stockDisponible) {
      setCantidad(nuevaCantidad)
    }
  }

  const handleMontoMixtoChange = (tipo: "efectivo" | "mercadoPago", valor: string) => {
    if (tipo === "efectivo") {
      setMontoEfectivo(valor)
    } else {
      setMontoMercadoPago(valor)
    }
  }

  const calcularTotalMixto = () => {
    return (Number.parseFloat(montoEfectivo) || 0) + (Number.parseFloat(montoMercadoPago) || 0)
  }

  const handleConfirmarVenta = () => {
    setError(null)

    if (!bebidaSeleccionada) {
      setError("Seleccione una bebida")
      return
    }

    if (cantidad < 1) {
      setError("La cantidad debe ser mayor a 0")
      return
    }

    if (cantidad > stockDisponible) {
      setError("Cantidad superior al stock disponible")
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

      const totalMixto = efectivo + mercadoPago
      if (Math.abs(totalMixto - precioTotal) > 0.01) {
        setError(
          `La suma de los montos (${formatMonto(totalMixto)}) debe ser igual al total (${formatMonto(precioTotal)})`,
        )
        return
      }
    }

    setShowPinModal(true)
  }

  const handlePinSuccess = async () => {
    try {
      setProcesandoVenta(true)

      const response = await fetch("/api/bebidas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bebidaId: bebidaSeleccionada,
          cantidad: cantidad,
          precioTotal: precioTotal,
          metodoPago: metodoPago,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la venta")
      }

      // Actualizar el stock local
      setBebidas((prev) =>
        prev.map((bebida) => (bebida.id === bebidaSeleccionada ? { ...bebida, stock: data.stockNuevo } : bebida)),
      )

      // Reproducir sonido de éxito si está habilitado
      if (getSoundEnabled()) {
        await soundGenerator.playSuccessSound()
      }

      let mensajeVenta = `Venta realizada exitosamente. ${bebidaActual?.nombre} x${cantidad} - ${formatMonto(precioTotal)}`

      if (metodoPago === "Mixto") {
        mensajeVenta += ` (Efectivo: ${formatMonto(Number.parseFloat(montoEfectivo) || 0)}, Mercado Pago: ${formatMonto(Number.parseFloat(montoMercadoPago) || 0)})`
      } else {
        mensajeVenta += ` (${metodoPago})`
      }

      setAlertaInfo({
        mensaje: mensajeVenta,
        visible: true,
        tipo: "success",
      })

      // Reset form
      setBebidaSeleccionada("")
      setCantidad(1)
      setMetodoPago("Efectivo")
      setMontoEfectivo("0")
      setMontoMercadoPago("0")

      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error al procesar venta:", error)
      setError(error.message || "Error al procesar la venta")

      // Reproducir sonido de error si está habilitado
      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }
    } finally {
      setProcesandoVenta(false)
    }
  }

  const handlePinClose = () => {
    setShowPinModal(false)
  }

  const handleClose = () => {
    if (!procesandoVenta) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <ShoppingCart className="h-6 w-6 mr-2 text-green-600 dark:text-green-400" />
              Venta de Bebidas
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={procesandoVenta}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}

            {cargandoBebidas ? (
              <div className="flex justify-center py-8">
                <LoadingDumbbell size={32} className="text-green-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando bebidas...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selección de bebida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seleccionar Bebida
                  </label>
                  <select
                    value={bebidaSeleccionada}
                    onChange={(e) => {
                      setBebidaSeleccionada(e.target.value)
                      setCantidad(1) // Reset cantidad al cambiar bebida
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={procesandoVenta}
                  >
                    <option value="">-- Seleccione una bebida --</option>
                    {bebidas.map((bebida) => (
                      <option key={bebida.id} value={bebida.id}>
                        {bebida.nombre} - {formatMonto(bebida.precio)} (Stock: {bebida.stock})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Información de la bebida seleccionada */}
                {bebidaActual && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Categoría:</span>
                        <p className="text-gray-900 dark:text-gray-100">{bebidaActual.categoria}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Precio unitario:</span>
                        <p className="text-gray-900 dark:text-gray-100">{formatMonto(bebidaActual.precio)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Stock disponible:</span>
                        <p className="text-gray-900 dark:text-gray-100">{bebidaActual.stock} unidades</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selección de cantidad */}
                {bebidaActual && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cantidad</label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleCantidadChange(cantidad - 1)}
                        className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                        disabled={cantidad <= 1 || procesandoVenta}
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <input
                        type="number"
                        value={cantidad}
                        onChange={(e) => handleCantidadChange(Number.parseInt(e.target.value) || 1)}
                        min="1"
                        max={stockDisponible}
                        className="w-20 p-2 text-center border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        disabled={procesandoVenta}
                      />

                      <button
                        onClick={() => handleCantidadChange(cantidad + 1)}
                        className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                        disabled={cantidad >= stockDisponible || procesandoVenta}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Máximo disponible: {stockDisponible} unidades
                    </p>
                  </div>
                )}

                {/* Selección de método de pago */}
                {bebidaActual && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Método de Pago
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setMetodoPago("Efectivo")}
                        className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
                          metodoPago === "Efectivo"
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-600"
                        }`}
                        disabled={procesandoVenta}
                      >
                        <Banknote className="h-5 w-5 mb-1" />
                        <span className="text-xs font-medium">Efectivo</span>
                      </button>

                      <button
                        onClick={() => setMetodoPago("Mercado Pago")}
                        className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
                          metodoPago === "Mercado Pago"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600"
                        }`}
                        disabled={procesandoVenta}
                      >
                        <CreditCard className="h-5 w-5 mb-1" />
                        <span className="text-xs font-medium">Mercado Pago</span>
                      </button>

                      <button
                        onClick={() => setMetodoPago("Mixto")}
                        className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
                          metodoPago === "Mixto"
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600"
                        }`}
                        disabled={procesandoVenta}
                      >
                        <Split className="h-5 w-5 mb-1" />
                        <span className="text-xs font-medium">Mixto</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Inputs para pago mixto */}
                {bebidaActual && metodoPago === "Mixto" && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg shadow-sm p-4 border border-purple-200 dark:border-purple-800">
                    <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-3">
                      Desglose de Pago Mixto
                    </h3>

                    <div className="space-y-3">
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
                            disabled={procesandoVenta}
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
                            disabled={procesandoVenta}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-purple-300 dark:border-purple-700">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total ingresado:</span>
                          <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                            {formatMonto(calcularTotalMixto())}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total requerido:</span>
                          <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                            {formatMonto(precioTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Precio total */}
                {bebidaActual && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total a pagar</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                        {formatMonto(precioTotal)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cantidad} x {formatMonto(bebidaActual.precio)}
                      </p>
                      <div className="flex items-center justify-center mt-2">
                        {metodoPago === "Efectivo" ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <Banknote className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">Efectivo</span>
                          </div>
                        ) : metodoPago === "Mercado Pago" ? (
                          <div className="flex items-center text-blue-600 dark:text-blue-400">
                            <CreditCard className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">Mercado Pago</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-purple-600 dark:text-purple-400">
                            <Split className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">Pago Mixto</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    disabled={procesandoVenta}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarVenta}
                    className="flex-1 px-4 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                    disabled={procesandoVenta || !bebidaActual || cantidad < 1}
                  >
                    {procesandoVenta ? (
                      <>
                        <LoadingDumbbell size={20} className="mr-2" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar Venta"
                    )}
                  </button>
                </div>

                {!bebidaActual && bebidas.length === 0 && !cargandoBebidas && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">No hay bebidas disponibles en stock</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de PIN */}
      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        title="Confirmar Venta de Bebida"
        description={`Esta acción registrará la venta de ${bebidaActual?.nombre} x${cantidad} por un total de ${formatMonto(precioTotal)}${metodoPago === "Mixto" ? ` (Efectivo: ${formatMonto(Number.parseFloat(montoEfectivo) || 0)}, Mercado Pago: ${formatMonto(Number.parseFloat(montoMercadoPago) || 0)})` : ` (${metodoPago})`}. Ingrese el PIN de seguridad para continuar.`}
      />

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

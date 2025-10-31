"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { useMobile } from "@/hooks/use-mobile"
import Alert from "@/components/alert"
import LoadingDumbbell from "@/components/loading-dumbbell"
import ThemeToggle from "@/components/theme-toggle"
import PinModal from "@/components/pin-modal"
import CajaCerradaModal from "@/components/caja-cerrada-modal"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"

// Función para calcular el monto según actividad y método de pago
const calcularMontoPorActividad = (actividad: string, metodoPago: string): string => {
  if (actividad === "Normal") {
    return metodoPago === "Efectivo" ? "32000" : "40000"
  } else if (actividad === "Familiar") {
    return metodoPago === "Efectivo" ? "30000" : "38000"
  } else if (actividad === "Referees") {
    return "0"
  } else {
    // BJJ, MMA, Boxeo, Convenio
    return metodoPago === "Efectivo" ? "28000" : "36000"
  }
}

export default function PagarCuota() {
  const router = useRouter()
  const { buscarUsuario, actualizarPago, error } = useGymContext()
  const [showAlert, setShowAlert] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingPaymentData, setPendingPaymentData] = useState(null)
  const isMobile = useMobile()
  const { getSoundEnabled } = useSoundPreferences()
  const [cajaAbierta, setCajaAbierta] = useState(true)
  const [showCajaCerradaModal, setShowCajaCerradaModal] = useState(false)
  const [verificandoCaja, setVerificandoCaja] = useState(true)

  const [formData, setFormData] = useState({
    dni: "",
    fechaPago: new Date().toISOString().split("T")[0],
    metodoPago: "Efectivo",
    montoPago: "32000", // Valor predeterminado para Normal + Efectivo
    montoEfectivo: "0",
    montoMercadoPago: "0",
  })

  const [userFound, setUserFound] = useState(null)

  // Efecto para actualizar el monto cuando cambia la actividad del usuario o método de pago
  useEffect(() => {
    if (userFound && userFound.actividad) {
      const nuevoMonto = calcularMontoPorActividad(userFound.actividad, formData.metodoPago)
      setFormData((prev) => ({
        ...prev,
        montoPago: nuevoMonto,
      }))
    }
  }, [userFound, formData.metodoPago])

  useEffect(() => {
    verificarCajaAbierta()
  }, [])

  const verificarCajaAbierta = async () => {
    try {
      setVerificandoCaja(true)
      const hoy = new Date()
      const fechaHoy = hoy.toISOString().split("T")[0]

      const response = await fetch(`/api/caja/actual?fecha=${fechaHoy}`)
      const data = await response.json()

      setCajaAbierta(data.cajaAbierta)

      if (!data.cajaAbierta) {
        setShowCajaCerradaModal(true)
      }
    } catch (error) {
      console.error("[v0] Error al verificar caja:", error)
      setCajaAbierta(false)
      setShowCajaCerradaModal(true)
    } finally {
      setVerificandoCaja(false)
    }
  }

  const abrirCaja = async () => {
    try {
      const hoy = new Date()
      const fechaHoy = hoy.toISOString().split("T")[0]

      const response = await fetch("/api/caja/abrir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fecha: fechaHoy }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al abrir caja")
      }

      setCajaAbierta(true)
      setShowCajaCerradaModal(false)
      // Mostrar mensaje de éxito
      setErrorLocal(null)
    } catch (error) {
      console.error("[v0] Error al abrir caja:", error)
      setErrorLocal("Error al abrir caja: " + error.message)
    }
  }

  const handleChange = async (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === "dni" && value.length > 5) {
      setIsSearching(true)
      try {
        const usuario = await buscarUsuario(value)
        setUserFound(usuario)

        // Actualizar el monto según la actividad del usuario encontrado
        if (usuario && usuario.actividad) {
          const nuevoMonto = calcularMontoPorActividad(usuario.actividad, formData.metodoPago)
          setFormData((prev) => ({
            ...prev,
            montoPago: nuevoMonto,
          }))
        }
      } catch (error) {
        console.error("Error al buscar usuario:", error)
        setUserFound(null)
      } finally {
        setIsSearching(false)
      }
    }
  }

  const handleMontoMixtoChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }

      // Calcular el total de montos mixtos
      const efectivo = Number.parseFloat(newData.montoEfectivo) || 0
      const mercadoPago = Number.parseFloat(newData.montoMercadoPago) || 0
      const totalMixto = efectivo + mercadoPago

      return {
        ...newData,
        montoPago: totalMixto.toString(),
      }
    })
  }

  const calculateNewDueDate = (paymentDate) => {
    const date = new Date(paymentDate)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().split("T")[0]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorLocal(null)

    if (!cajaAbierta) {
      setShowCajaCerradaModal(true)
      return
    }

    if (!formData.dni || !formData.fechaPago || !formData.montoPago) {
      setErrorLocal("Por favor complete todos los campos")
      return
    }

    if (!userFound) {
      setErrorLocal("Usuario no encontrado")
      return
    }

    // Validar que el monto sea un número positivo
    const monto = Number.parseFloat(formData.montoPago)
    if (isNaN(monto) || monto <= 0) {
      setErrorLocal("El monto debe ser un número positivo")
      return
    }

    // Validar montos mixtos si el método de pago es Mixto
    if (formData.metodoPago === "Mixto") {
      const efectivo = Number.parseFloat(formData.montoEfectivo) || 0
      const mercadoPago = Number.parseFloat(formData.montoMercadoPago) || 0

      if (efectivo <= 0 && mercadoPago <= 0) {
        setErrorLocal("Debe especificar al menos un monto en efectivo o Mercado Pago")
        return
      }

      if (efectivo + mercadoPago !== monto) {
        setErrorLocal("La suma de los montos debe ser igual al total")
        return
      }
    }

    // Guardar los datos del pago y mostrar modal de PIN
    const newDueDate = calculateNewDueDate(formData.fechaPago)
    setPendingPaymentData({
      dni: formData.dni,
      newDueDate,
      metodoPago: formData.metodoPago,
      monto,
    })
    setShowPinModal(true)
  }

  const handlePinSuccess = async () => {
    if (!pendingPaymentData) return

    try {
      setIsSubmitting(true)

      const cajaResponse = await fetch("/api/caja/actual")
      const cajaData = await cajaResponse.json()

      if (!cajaData.cajaAbierta || !cajaData.caja?.id) {
        throw new Error("No hay caja abierta")
      }

      const cajaId = cajaData.caja.id

      // Actualizar el pago usando la función del contexto con cajaId
      await actualizarPago(
        pendingPaymentData.dni,
        pendingPaymentData.newDueDate,
        pendingPaymentData.metodoPago,
        pendingPaymentData.monto,
        cajaId, // Pasar cajaId
      )

      // Reproducir sonido de éxito si está habilitado
      if (getSoundEnabled()) {
        await soundGenerator.playSuccessSound()
      }

      // Mostrar la alerta de éxito
      setShowAlert(true)

      console.log("Pago actualizado para:", userFound.nombreApellido)
    } catch (error) {
      console.error("Error al actualizar pago:", error)
      setErrorLocal("Error al actualizar pago. Por favor, intenta de nuevo.")

      // Reproducir sonido de error si está habilitado
      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }
    } finally {
      setIsSubmitting(false)
      setPendingPaymentData(null)
    }
  }

  const handlePinClose = () => {
    setShowPinModal(false)
    setPendingPaymentData(null)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-400">Pagar Cuota</h1>
        <ThemeToggle />
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 md:space-y-6">
        {(errorLocal || error) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-300">
            {errorLocal || error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">DNI</label>
          <div className="flex">
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
              disabled={isSubmitting}
              style={{ fontSize: "16px" }}
            />
            {isSearching && (
              <div className="ml-2 flex items-center">
                <LoadingDumbbell size={20} className="text-yellow-500 dark:text-yellow-400" />
              </div>
            )}
          </div>
          {userFound && (
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Usuario encontrado: {userFound.nombreApellido}
              </p>
              <div className="text-xs text-green-700 dark:text-green-400 mt-1 grid grid-cols-2 gap-2">
                <div>Actividad: {userFound.actividad || "Normal"}</div>
              </div>
            </div>
          )}
          {formData.dni.length > 5 && !userFound && !isSearching && (
            <p className="text-sm text-red-500 mt-1 dark:text-red-400">Usuario no encontrado</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Método de Pago</label>
          <select
            name="metodoPago"
            value={formData.metodoPago}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Mercado Pago">Mercado Pago</option>
            <option value="Mixto">Mixto (Efectivo + Mercado Pago)</option>
          </select>
        </div>

        {/* Inputs para pago mixto */}
        {formData.metodoPago === "Mixto" && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">Desglose de Pago Mixto</h3>

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
                    name="montoEfectivo"
                    value={formData.montoEfectivo}
                    onChange={handleMontoMixtoChange}
                    className="w-full p-3 pl-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="0"
                    step="1"
                    disabled={isSubmitting}
                    style={{ fontSize: "16px" }}
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
                    name="montoMercadoPago"
                    value={formData.montoMercadoPago}
                    onChange={handleMontoMixtoChange}
                    className="w-full p-3 pl-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="0"
                    step="1"
                    disabled={isSubmitting}
                    style={{ fontSize: "16px" }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-blue-300 dark:border-blue-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    $
                    {(Number.parseFloat(formData.montoEfectivo) || 0) +
                      (Number.parseFloat(formData.montoMercadoPago) || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fecha de Pago</label>
          <input
            type="date"
            name="fechaPago"
            value={formData.fechaPago}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            required
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Nueva Fecha de Vencimiento
          </label>
          <input
            type="date"
            value={calculateNewDueDate(formData.fechaPago)}
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            disabled
            style={{ fontSize: "16px" }}
          />
          <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
            Se calcula automáticamente (1 mes después de la fecha de pago)
          </p>
        </div>

        {formData.metodoPago !== "Mixto" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-0 md:shadow-none border border-gray-200 dark:border-gray-700 md:border-0">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Monto de Pago</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">
                $
              </span>
              <input
                type="number"
                name="montoPago"
                value={formData.montoPago}
                onChange={handleChange}
                className="w-full p-3 pl-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                required
                min="1"
                step="1"
                disabled={isSubmitting}
                style={{ fontSize: "16px" }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monto sugerido según actividad y método de pago
            </p>
          </div>
        )}

        {/* Botones fijos en la parte inferior para móviles */}
        {isMobile ? (
          <div className="fixed bottom-20 left-0 right-0 bg-white border-t p-4 flex justify-between z-10 dark:bg-gray-800 dark:border-gray-700">
            <Link
              href="/"
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md w-5/12 flex items-center justify-center dark:bg-gray-700 dark:text-gray-300"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className={`bg-green-600 text-white px-6 py-3 rounded-md w-5/12 flex items-center justify-center ${
                isSubmitting || !userFound ? "opacity-70 cursor-not-allowed" : ""
              } dark:bg-green-500 dark:text-gray-900`}
              disabled={isSubmitting || !userFound}
            >
              {isSubmitting ? <LoadingDumbbell size={20} className="mr-2" /> : null}
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        ) : (
          <div className="flex justify-between pt-4">
            <Link
              href="/"
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:scale-105 transition-transform dark:bg-gray-700 dark:text-gray-300"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className={`bg-green-600 text-white px-6 py-2 rounded-md transition-transform ${
                isSubmitting || !userFound ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
              } dark:bg-green-500 dark:text-gray-900`}
              disabled={isSubmitting || !userFound}
            >
              {isSubmitting ? <LoadingDumbbell size={20} className="mr-2 inline" /> : null}
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}

        {/* Espacio adicional en la parte inferior para móviles */}
        {isMobile && <div className="h-24"></div>}
      </form>

      {/* Modal de PIN */}
      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        title="Procesar Pago de Cuota"
        description={`Esta acción actualizará el pago de cuota para ${userFound?.nombreApellido || "el usuario"}. Ingrese el PIN de seguridad para continuar.`}
      />

      <Alert
        message="Listo! Datos actualizados."
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        autoRedirect={true}
      />

      <CajaCerradaModal
        isOpen={showCajaCerradaModal}
        onClose={() => setShowCajaCerradaModal(false)}
        onAbrirCaja={abrirCaja}
      />
    </main>
  )
}

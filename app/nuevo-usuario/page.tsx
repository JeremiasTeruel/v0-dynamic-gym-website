"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { useMobile } from "@/hooks/use-mobile"
import { ACTIVIDADES_OPCIONES } from "@/data/usuarios"
import Alert from "@/components/alert"
import LoadingDumbbell from "@/components/loading-dumbbell"
import ThemeToggle from "@/components/theme-toggle"
import PinModal from "@/components/pin-modal"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"

const calcularMontoPorActividad = (actividad: string, metodoPago: string): string => {
  if (actividad === "Normal") {
    return metodoPago === "Efectivo" ? "32000" : "40000"
  } else if (actividad === "Familiar") {
    return metodoPago === "Efectivo" ? "30000" : "38000"
  } else if (actividad === "Dia") {
    return "5000"
  } else {
    // BJJ, MMA, Boxeo, Convenio
    return metodoPago === "Efectivo" ? "28000" : "36000"
  }
}

export default function NuevoUsuario() {
  const router = useRouter()
  const { agregarNuevoUsuario, registrarPago, error: contextError } = useGymContext()
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("Listo! Ya sos parte del gimnasio.")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingFormData, setPendingFormData] = useState(null)
  const isMobile = useMobile()
  const { getSoundEnabled } = useSoundPreferences()

  const [formData, setFormData] = useState({
    nombreApellido: "",
    dni: "",
    fechaInicio: "",
    metodoPago: "Efectivo",
    actividad: "Normal",
    montoPago: "32000",
    montoEfectivo: "0",
    montoMercadoPago: "0",
  })

  // Efecto para actualizar el monto cuando cambia la actividad o método de pago
  useEffect(() => {
    const nuevoMonto = calcularMontoPorActividad(formData.actividad, formData.metodoPago)
    setFormData((prev) => ({
      ...prev,
      montoPago: nuevoMonto,
    }))
  }, [formData.actividad, formData.metodoPago])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMontoMixtoChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }

      const efectivo = Number.parseFloat(newData.montoEfectivo) || 0
      const mercadoPago = Number.parseFloat(newData.montoMercadoPago) || 0
      const totalMixto = efectivo + mercadoPago

      return {
        ...newData,
        montoPago: totalMixto.toString(),
      }
    })
  }

  const calculateDueDate = (startDate) => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().split("T")[0]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.nombreApellido || !formData.dni || !formData.fechaInicio || !formData.montoPago) {
      setError("Por favor complete todos los campos")
      return
    }

    const monto = Number.parseFloat(formData.montoPago)
    if (isNaN(monto) || monto <= 0) {
      setError("El monto debe ser un número positivo")
      return
    }

    if (formData.metodoPago === "Mixto") {
      const efectivo = Number.parseFloat(formData.montoEfectivo) || 0
      const mercadoPago = Number.parseFloat(formData.montoMercadoPago) || 0

      if (efectivo <= 0 && mercadoPago <= 0) {
        setError("Debe especificar al menos un monto en efectivo o Mercado Pago")
        return
      }

      if (efectivo + mercadoPago !== monto) {
        setError("La suma de los montos debe ser igual al total")
        return
      }
    }

    setPendingFormData({ formData, monto })
    setShowPinModal(true)
  }

  const handlePinSuccess = async () => {
    if (!pendingFormData) return

    try {
      setIsSubmitting(true)

      // Si la actividad es "Dia", solo registrar el pago sin crear usuario
      if (pendingFormData.formData.actividad === "Dia") {
        console.log("Registrando pago de día sin crear usuario")

        // Registrar solo el pago
        await registrarPago({
          userNombre: pendingFormData.formData.nombreApellido,
          userDni: pendingFormData.formData.dni,
          monto: pendingFormData.monto,
          fecha: pendingFormData.formData.fechaInicio,
          metodoPago: pendingFormData.formData.metodoPago,
        })

        if (getSoundEnabled()) {
          await soundGenerator.playOperationCompleteSound()
        }

        setAlertMessage("Pago de día registrado exitosamente!")
        setShowAlert(true)

        console.log("Pago de día registrado:", {
          nombre: pendingFormData.formData.nombreApellido,
          dni: pendingFormData.formData.dni,
          monto: pendingFormData.monto,
        })
      } else {
        // Para otras actividades, crear el usuario normalmente
        const { montoPago, ...datosUsuario } = pendingFormData.formData
        const nuevoUsuario = {
          ...datosUsuario,
          edad: "",
          telefono: "",
          fechaVencimiento: calculateDueDate(pendingFormData.formData.fechaInicio),
        }

        console.log("Enviando datos de nuevo usuario:", nuevoUsuario)

        await agregarNuevoUsuario(nuevoUsuario, pendingFormData.monto)

        if (getSoundEnabled()) {
          await soundGenerator.playOperationCompleteSound()
        }

        setAlertMessage("Listo! Ya sos parte del gimnasio.")
        setShowAlert(true)

        console.log("Usuario creado:", nuevoUsuario)
      }
    } catch (err) {
      console.error("Error al procesar:", err)
      setError(err.message || "Error al procesar. Por favor, intenta de nuevo.")
      setAlertMessage("Error: " + err.message)

      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }

      setShowAlert(true)
    } finally {
      setIsSubmitting(false)
      setPendingFormData(null)
    }
  }

  const handlePinClose = () => {
    setShowPinModal(false)
    setPendingFormData(null)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-400">Nuevo Usuario</h1>
        <ThemeToggle />
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 md:space-y-6">
        {(error || contextError) && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
            {error || contextError}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-0 md:shadow-none border border-gray-200 dark:border-gray-700 md:border-0">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre y Apellido</label>
          <input
            type="text"
            name="nombreApellido"
            value={formData.nombreApellido}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            required
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-0 md:shadow-none border border-gray-200 dark:border-gray-700 md:border-0">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">DNI</label>
          <input
            type="text"
            name="dni"
            value={formData.dni}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            required
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-0 md:shadow-none border border-gray-200 dark:border-gray-700 md:border-0">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Actividad</label>
          <select
            name="actividad"
            value={formData.actividad}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          >
            {ACTIVIDADES_OPCIONES.map((actividad) => (
              <option key={actividad} value={actividad}>
                {actividad}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-0 md:shadow-none border border-gray-200 dark:border-gray-700 md:border-0">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Método de Pago</label>
          <select
            name="metodoPago"
            value={formData.metodoPago}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Mercado Pago">Mercado Pago</option>
            <option value="Mixto">Mixto (Efectivo + Mercado Pago)</option>
          </select>
        </div>

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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-0 md:shadow-none border border-gray-200 dark:border-gray-700 md:border-0">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {formData.actividad === "Dia" ? "Fecha del Día" : "Fecha de Inicio"}
          </label>
          <input
            type="date"
            name="fechaInicio"
            value={formData.fechaInicio}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          />
        </div>

        {formData.actividad !== "Dia" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-0 md:shadow-none border border-gray-200 dark:border-gray-700 md:border-0">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Fecha de Vencimiento de Cuota
            </label>
            <input
              type="date"
              value={formData.fechaInicio ? calculateDueDate(formData.fechaInicio) : ""}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
              disabled
              style={{ fontSize: "16px" }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Se calcula automáticamente (1 mes después de la fecha de inicio)
            </p>
          </div>
        )}

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
                className="w-full p-3 pl-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
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

        {isMobile ? (
          <div className="fixed bottom-20 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between z-10">
            <Link
              href="/"
              className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-md w-5/12 flex items-center justify-center hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className={`bg-green-600 dark:bg-green-700 text-white px-6 py-3 rounded-md w-5/12 flex items-center justify-center transition-colors ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700 dark:hover:bg-green-600"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingDumbbell size={20} className="mr-2" /> : null}
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        ) : (
          <div className="flex justify-between pt-4">
            <Link
              href="/"
              className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-md hover:scale-105 transition-transform hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className={`bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded-md transition-transform ${
                isSubmitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:scale-105 hover:bg-green-700 dark:hover:bg-green-600"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingDumbbell size={20} className="mr-2 inline" /> : null}
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}

        {isMobile && <div className="h-24"></div>}
      </form>

      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        title={formData.actividad === "Dia" ? "Registrar Pago de Día" : "Agregar Nuevo Usuario"}
        description={
          formData.actividad === "Dia"
            ? "Esta acción registrará un pago de día sin crear un usuario permanente. Ingrese el PIN de seguridad para continuar."
            : "Esta acción creará un nuevo usuario en el sistema. Ingrese el PIN de seguridad para continuar."
        }
      />

      <Alert
        message={alertMessage}
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        autoRedirect={!error && !contextError}
      />
    </main>
  )
}

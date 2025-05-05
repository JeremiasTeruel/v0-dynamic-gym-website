"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { useMobile } from "@/hooks/use-mobile"
import Alert from "@/components/alert"
import LoadingDumbbell from "@/components/loading-dumbbell"

export default function NuevoUsuario() {
  const router = useRouter()
  const { agregarNuevoUsuario, error: contextError } = useGymContext()
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("Listo! Ya sos parte del gimnasio.")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useMobile()

  const [formData, setFormData] = useState({
    nombreApellido: "",
    dni: "",
    edad: "",
    telefono: "",
    fechaInicio: "",
    metodoPago: "Efectivo",
    montoPago: "2500", // Valor predeterminado
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const calculateDueDate = (startDate) => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().split("T")[0]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.nombreApellido || !formData.dni || !formData.edad || !formData.fechaInicio || !formData.montoPago) {
      setError("Por favor complete todos los campos")
      return
    }

    // Validar que el monto sea un número positivo
    const monto = Number.parseFloat(formData.montoPago)
    if (isNaN(monto) || monto <= 0) {
      setError("El monto debe ser un número positivo")
      return
    }

    try {
      setIsSubmitting(true)

      // Crear el nuevo usuario con la fecha de vencimiento calculada
      const { montoPago, ...datosUsuario } = formData
      const nuevoUsuario = {
        ...datosUsuario,
        fechaVencimiento: calculateDueDate(formData.fechaInicio),
      }

      console.log("Enviando datos de nuevo usuario:", nuevoUsuario)

      // Agregar el usuario usando la función del contexto
      await agregarNuevoUsuario(nuevoUsuario, monto)

      // Mostrar la alerta de éxito
      setAlertMessage("Listo! Ya sos parte del gimnasio.")
      setShowAlert(true)

      // Registrar en consola para verificación
      console.log("Usuario creado:", nuevoUsuario)
    } catch (err) {
      console.error("Error al crear usuario:", err)
      setError(err.message || "Error al crear usuario. Por favor, intenta de nuevo.")
      setAlertMessage("Error al crear usuario: " + err.message)
      setShowAlert(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-green-600 mb-6 md:mb-10">Nuevo Usuario</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 md:space-y-6">
        {(error || contextError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error || contextError}
          </div>
        )}

        {/* Campos de formulario optimizados para móviles */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">Nombre y Apellido</label>
          <input
            type="text"
            name="nombreApellido"
            value={formData.nombreApellido}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">DNI</label>
          <input
            type="text"
            name="dni"
            value={formData.dni}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">Edad</label>
          <input
            type="number"
            name="edad"
            value={formData.edad}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">Fecha de Inicio</label>
          <input
            type="date"
            name="fechaInicio"
            value={formData.fechaInicio}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">Fecha de Vencimiento de Cuota</label>
          <input
            type="date"
            value={formData.fechaInicio ? calculateDueDate(formData.fechaInicio) : ""}
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
            disabled
            style={{ fontSize: "16px" }}
          />
          <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente (1 mes después de la fecha de inicio)</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">Monto de Pago</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
            <input
              type="number"
              name="montoPago"
              value={formData.montoPago}
              onChange={handleChange}
              className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              min="1"
              step="0.01"
              disabled={isSubmitting}
              style={{ fontSize: "16px" }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">Método de Pago</label>
          <select
            name="metodoPago"
            value={formData.metodoPago}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Mercado Pago">Mercado Pago</option>
          </select>
        </div>

        {/* Botones fijos en la parte inferior para móviles */}
        {isMobile ? (
          <div className="fixed bottom-20 left-0 right-0 bg-white border-t p-4 flex justify-between z-10">
            <Link
              href="/"
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md w-5/12 flex items-center justify-center"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className={`bg-green-600 text-white px-6 py-3 rounded-md w-5/12 flex items-center justify-center ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
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
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:scale-105 transition-transform"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className={`bg-green-600 text-white px-6 py-2 rounded-md transition-transform ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingDumbbell size={20} className="mr-2 inline" /> : null}
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}

        {/* Espacio adicional en la parte inferior para móviles */}
        {isMobile && <div className="h-24"></div>}
      </form>

      <Alert
        message={alertMessage}
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        autoRedirect={!error && !contextError}
      />
    </main>
  )
}

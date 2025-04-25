"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { useMobile } from "@/hooks/use-mobile"
import Alert from "@/components/alert"

export default function PagarCuota() {
  const router = useRouter()
  const { buscarUsuario, actualizarPago, error } = useGymContext()
  const [showAlert, setShowAlert] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const isMobile = useMobile()

  const [formData, setFormData] = useState({
    dni: "",
    fechaPago: new Date().toISOString().split("T")[0],
    metodoPago: "Efectivo",
  })

  const [userFound, setUserFound] = useState(null)

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
      } catch (error) {
        console.error("Error al buscar usuario:", error)
      } finally {
        setIsSearching(false)
      }
    }
  }

  const calculateNewDueDate = (paymentDate) => {
    const date = new Date(paymentDate)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().split("T")[0]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorLocal(null)

    if (!formData.dni || !formData.fechaPago) {
      setErrorLocal("Por favor complete todos los campos")
      return
    }

    if (!userFound) {
      setErrorLocal("Usuario no encontrado")
      return
    }

    try {
      setIsSubmitting(true)
      const newDueDate = calculateNewDueDate(formData.fechaPago)

      // Actualizar el pago usando la función del contexto
      await actualizarPago(formData.dni, newDueDate, formData.metodoPago)

      // Mostrar la alerta de éxito
      setShowAlert(true)

      console.log("Pago actualizado para:", userFound.nombreApellido)
    } catch (error) {
      console.error("Error al actualizar pago:", error)
      setErrorLocal("Error al actualizar pago. Por favor, intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-green-600 mb-6 md:mb-10">Pagar Cuota</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 md:space-y-6">
        {(errorLocal || error) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {errorLocal || error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">DNI</label>
          <div className="flex">
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={isSubmitting}
              style={{ fontSize: "16px" }}
            />
            {isSearching && (
              <div className="ml-2 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-500"></div>
              </div>
            )}
          </div>
          {userFound && <p className="text-sm text-green-600 mt-1">Usuario encontrado: {userFound.nombreApellido}</p>}
          {formData.dni.length > 5 && !userFound && !isSearching && (
            <p className="text-sm text-red-500 mt-1">Usuario no encontrado</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">Fecha de Pago</label>
          <input
            type="date"
            name="fechaPago"
            value={formData.fechaPago}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSubmitting}
            style={{ fontSize: "16px" }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none">
          <label className="block text-sm font-medium mb-1">Nueva Fecha de Vencimiento</label>
          <input
            type="date"
            value={calculateNewDueDate(formData.fechaPago)}
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
            disabled
            style={{ fontSize: "16px" }}
          />
          <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente (1 mes después de la fecha de pago)</p>
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
                isSubmitting || !userFound ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isSubmitting || !userFound}
            >
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
                isSubmitting || !userFound ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
              }`}
              disabled={isSubmitting || !userFound}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}

        {/* Espacio adicional en la parte inferior para móviles */}
        {isMobile && <div className="h-24"></div>}
      </form>

      <Alert
        message="Listo! Datos actualizados."
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        autoRedirect={true}
      />
    </main>
  )
}

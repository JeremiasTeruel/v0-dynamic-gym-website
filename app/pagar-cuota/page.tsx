"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { useMobile } from "@/hooks/use-mobile"
import Alert from "@/components/alert"
import LoadingDumbbell from "@/components/loading-dumbbell"
import ThemeToggle from "@/components/theme-toggle"

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
    montoPago: "40.000", // Valor predeterminado
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

    try {
      setIsSubmitting(true)
      const newDueDate = calculateNewDueDate(formData.fechaPago)

      // Actualizar el pago usando la función del contexto
      await actualizarPago(formData.dni, newDueDate, formData.metodoPago, monto)

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
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">Pagar Cuota</h1>
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
                <LoadingDumbbell size={20} className="text-green-500 dark:text-green-400" />
              </div>
            )}
          </div>
          {userFound && (
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Usuario encontrado: {userFound.nombreApellido}
              </p>
              <div className="text-xs text-green-700 dark:text-green-400 mt-1 grid grid-cols-2 gap-2">
                <div>Edad: {userFound.edad} años</div>
                <div>Actividad: {userFound.actividad || "Normal"}</div>
                <div className="col-span-2">Teléfono: {userFound.telefono || "No registrado"}</div>
              </div>
            </div>
          )}
          {formData.dni.length > 5 && !userFound && !isSearching && (
            <p className="text-sm text-red-500 mt-1 dark:text-red-400">Usuario no encontrado</p>
          )}
        </div>

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

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-0 md:shadow-none dark:bg-gray-800 dark:border-gray-700">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Monto de Pago</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">$</span>
            <input
              type="number"
              name="montoPago"
              value={formData.montoPago}
              onChange={handleChange}
              className="w-full p-3 pl-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
              min="1"
              step="0.01"
              disabled={isSubmitting}
              style={{ fontSize: "16px" }}
            />
          </div>
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
          </select>
        </div>

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

      <Alert
        message="Listo! Datos actualizados."
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        autoRedirect={true}
      />
    </main>
  )
}

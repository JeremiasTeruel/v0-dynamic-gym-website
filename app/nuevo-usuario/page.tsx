"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import Alert from "@/components/alert"

export default function NuevoUsuario() {
  const router = useRouter()
  const { addUser } = useGymContext()
  const [showAlert, setShowAlert] = useState(false)

  const [formData, setFormData] = useState({
    nombreApellido: "",
    dni: "",
    edad: "",
    fechaInicio: "",
    metodoPago: "Efectivo",
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

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.nombreApellido || !formData.dni || !formData.edad || !formData.fechaInicio) {
      alert("Por favor complete todos los campos")
      return
    }

    // Crear el nuevo usuario con la fecha de vencimiento calculada
    const newUser = {
      ...formData,
      fechaVencimiento: calculateDueDate(formData.fechaInicio),
    }

    // Agregar el usuario al contexto (que lo guardará en localStorage)
    addUser(newUser)

    // Mostrar la alerta de éxito
    setShowAlert(true)

    // Registrar en consola para verificación
    console.log("Usuario creado:", newUser)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold text-green-600 mb-10">Nuevo Usuario</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre y Apellido</label>
          <input
            type="text"
            name="nombreApellido"
            value={formData.nombreApellido}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">DNI</label>
          <input
            type="text"
            name="dni"
            value={formData.dni}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Edad</label>
          <input
            type="number"
            name="edad"
            value={formData.edad}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha de Inicio</label>
          <input
            type="date"
            name="fechaInicio"
            value={formData.fechaInicio}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha de Vencimiento de Cuota</label>
          <input
            type="date"
            value={formData.fechaInicio ? calculateDueDate(formData.fechaInicio) : ""}
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente (1 mes después de la fecha de inicio)</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Método de Pago</label>
          <select
            name="metodoPago"
            value={formData.metodoPago}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Mercado Pago">Mercado Pago</option>
          </select>
        </div>

        <div className="flex justify-between pt-4">
          <Link
            href="/"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:scale-105 transition-transform"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:scale-105 transition-transform"
          >
            Guardar
          </button>
        </div>
      </form>

      <Alert
        message="Listo! Ya sos parte del gimnasio."
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        autoRedirect={true}
      />
    </main>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import Alert from "@/components/alert"

export default function PagarCuota() {
  const router = useRouter()
  const { users, updatePayment } = useGymContext()
  const [showAlert, setShowAlert] = useState(false)

  const [formData, setFormData] = useState({
    dni: "",
    fechaPago: new Date().toISOString().split("T")[0],
    metodoPago: "Efectivo",
  })

  const [userFound, setUserFound] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === "dni" && value.length > 5) {
      const user = users.find((u) => u.dni === value)
      setUserFound(user || null)
    }
  }

  const calculateNewDueDate = (paymentDate) => {
    const date = new Date(paymentDate)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().split("T")[0]
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.dni || !formData.fechaPago) {
      alert("Por favor complete todos los campos")
      return
    }

    if (!userFound) {
      alert("Usuario no encontrado")
      return
    }

    const newDueDate = calculateNewDueDate(formData.fechaPago)

    updatePayment(formData.dni, newDueDate, formData.metodoPago)
    setShowAlert(true)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold text-green-600 mb-10">Pagar Cuota</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
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
          {userFound && <p className="text-sm text-green-600 mt-1">Usuario encontrado: {userFound.nombreApellido}</p>}
          {formData.dni.length > 5 && !userFound && <p className="text-sm text-red-500 mt-1">Usuario no encontrado</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha de Pago</label>
          <input
            type="date"
            name="fechaPago"
            value={formData.fechaPago}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nueva Fecha de Vencimiento</label>
          <input
            type="date"
            value={calculateNewDueDate(formData.fechaPago)}
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente (1 mes después de la fecha de pago)</p>
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
            disabled={!userFound}
          >
            Guardar
          </button>
        </div>
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

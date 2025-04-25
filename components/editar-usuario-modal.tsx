"use client"

import { useState, useEffect } from "react"
import type { Usuario } from "@/data/usuarios"

interface EditarUsuarioModalProps {
  usuario: Usuario | null
  isOpen: boolean
  onClose: () => void
  onSave: (usuario: Usuario) => Promise<void>
}

export default function EditarUsuarioModal({ usuario, isOpen, onClose, onSave }: EditarUsuarioModalProps) {
  const [formData, setFormData] = useState<Partial<Usuario>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (usuario) {
      setFormData({ ...usuario })
    }
  }, [usuario])

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

    if (!formData.nombreApellido || !formData.dni || !formData.edad || !formData.fechaInicio) {
      setError("Por favor complete todos los campos requeridos")
      return
    }

    try {
      setIsSubmitting(true)

      // Asegurarse de que fechaVencimiento esté actualizada si se cambió la fechaInicio
      const updatedData = {
        ...formData,
        fechaVencimiento:
          formData.fechaInicio !== usuario?.fechaInicio
            ? calculateDueDate(formData.fechaInicio)
            : formData.fechaVencimiento,
      }

      await onSave(updatedData as Usuario)
      onClose()
    } catch (err) {
      console.error("Error al actualizar usuario:", err)
      setError(err.message || "Error al actualizar usuario. Por favor, intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Editar Usuario</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre y Apellido</label>
            <input
              type="text"
              name="nombreApellido"
              value={formData.nombreApellido || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">DNI</label>
            <input
              type="text"
              name="dni"
              value={formData.dni || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Edad</label>
            <input
              type="number"
              name="edad"
              value={formData.edad || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha de Inicio</label>
            <input
              type="date"
              name="fechaInicio"
              value={formData.fechaInicio || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha de Vencimiento</label>
            <input
              type="date"
              name="fechaVencimiento"
              value={formData.fechaVencimiento || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Si cambia la fecha de inicio, la fecha de vencimiento se actualizará automáticamente.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Método de Pago</label>
            <select
              name="metodoPago"
              value={formData.metodoPago || "Efectivo"}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isSubmitting}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Mercado Pago">Mercado Pago</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

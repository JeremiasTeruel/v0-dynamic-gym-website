"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import LoadingDumbbell from "./loading-dumbbell"
import PinModal from "./pin-modal"

interface EgresosModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function EgresosModal({ isOpen, onClose, onSuccess }: EgresosModalProps) {
  const [monto, setMonto] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [nombre, setNombre] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingEgresoData, setPendingEgresoData] = useState<{
    monto: number
    descripcion: string
    fecha: string
    nombre: string
    cajaId: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!monto || !descripcion || !fecha || !nombre) {
      setError("Todos los campos son requeridos")
      return
    }

    if (Number(monto) <= 0) {
      setError("El monto debe ser mayor a 0")
      return
    }

    try {
      // Obtener caja actual
      const cajaResponse = await fetch("/api/caja/actual")
      const cajaData = await cajaResponse.json()

      if (!cajaData.cajaAbierta || !cajaData.caja) {
        setError("No hay caja abierta. Debe abrir una caja para registrar egresos.")
        return
      }

      setPendingEgresoData({
        monto: Number(monto),
        descripcion,
        fecha,
        nombre,
        cajaId: cajaData.caja.id,
      })
      setShowPinModal(true)
    } catch (error) {
      console.error("[v0] Error al verificar caja:", error)
      setError(error.message || "Error al verificar caja")
    }
  }

  const handlePinSuccess = async () => {
    if (!pendingEgresoData) return

    try {
      setGuardando(true)

      const response = await fetch("/api/egresos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pendingEgresoData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al registrar egreso")
      }

      // Limpiar formulario
      setMonto("")
      setDescripcion("")
      setFecha(new Date().toISOString().split("T")[0])
      setNombre("")
      setPendingEgresoData(null)

      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (error) {
      console.error("[v0] Error al registrar egreso:", error)
      setError(error.message || "Error al registrar egreso")
    } finally {
      setGuardando(false)
    }
  }

  const handlePinClose = () => {
    setShowPinModal(false)
    setPendingEgresoData(null)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Registrar Egreso</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              disabled={guardando}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monto *</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={guardando}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción *</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Descripción del egreso"
                rows={3}
                disabled={guardando}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha *</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={guardando}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre (quien realiza el egreso) *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Nombre completo"
                disabled={guardando}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={guardando}
              >
                {guardando ? (
                  <>
                    <LoadingDumbbell size={20} className="text-white" />
                    Guardando...
                  </>
                ) : (
                  "Registrar Egreso"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        title="Registrar Egreso de Dinero"
        description={`Esta acción registrará un egreso de $${monto} por concepto de "${descripcion}". Ingrese el PIN de seguridad para continuar.`}
      />
    </>
  )
}

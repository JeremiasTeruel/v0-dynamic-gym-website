"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { ACTIVIDADES_OPCIONES } from "@/data/usuarios"
import { ArrowLeft } from "lucide-react"
import PinModal from "@/components/pin-modal"
import Alert from "@/components/alert"
import LoadingDumbbell from "@/components/loading-dumbbell"
import ThemeToggle from "@/components/theme-toggle"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"

// Forzar renderizado dinámico
export const dynamic = "force-dynamic"

export default function NuevoUsuario() {
  const router = useRouter()
  const { agregarUsuario, registrarPago } = useGymContext()
  const { getSoundEnabled } = useSoundPreferences()

  const [formData, setFormData] = useState({
    nombreApellido: "",
    dni: "",
    actividad: "Normal",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaVencimiento: "",
    metodoPago: "Efectivo",
    montoPago: "32000",
    montoEfectivo: "0",
    montoMercadoPago: "0",
  })

  const [showPinModal, setShowPinModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })

  const calcularMontoPorActividad = (actividad: string, metodoPago: string): string => {
    if (actividad === "Dia") {
      return "5000"
    } else if (actividad === "Normal") {
      return metodoPago === "Efectivo" ? "32000" : "40000"
    } else if (actividad === "Familiar") {
      return metodoPago === "Efectivo" ? "30000" : "38000"
    } else {
      return metodoPago === "Efectivo" ? "28000" : "36000"
    }
  }

  useEffect(() => {
    const nuevoMonto = calcularMontoPorActividad(formData.actividad, formData.metodoPago)
    setFormData((prev) => ({ ...prev, montoPago: nuevoMonto }))
  }, [formData.actividad, formData.metodoPago])

  useEffect(() => {
    const newDate = calculateDueDate(formData.fechaInicio, formData.actividad)
    setFormData((prev) => ({ ...prev, fechaVencimiento: newDate }))
  }, [formData.fechaInicio, formData.actividad])

  const calculateDueDate = (startDate: string, actividad: string) => {
    const date = new Date(startDate)
    if (actividad === "Dia") {
      date.setDate(date.getDate() + 1)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    return date.toISOString().split("T")[0]
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.metodoPago === "Mixto") {
      const efectivo = Number.parseFloat(formData.montoEfectivo) || 0
      const mercadoPago = Number.parseFloat(formData.montoMercadoPago) || 0
      const total = Number.parseFloat(formData.montoPago)

      if (efectivo <= 0 && mercadoPago <= 0) {
        setAlertaInfo({
          mensaje: "Debe especificar al menos un monto en efectivo o Mercado Pago",
          visible: true,
          tipo: "error",
        })
        return
      }

      if (efectivo + mercadoPago !== total) {
        setAlertaInfo({
          mensaje: `La suma de los montos debe ser igual al total (${total}). Suma actual: ${efectivo + mercadoPago}`,
          visible: true,
          tipo: "error",
        })
        return
      }
    }

    setShowPinModal(true)
  }

  const handlePinSuccess = async () => {
    try {
      setGuardando(true)

      const nuevoUsuario = {
        nombreApellido: formData.nombreApellido,
        dni: formData.dni,
        telefono: "",
        edad: "",
        actividad: formData.actividad,
        fechaInicio: formData.fechaInicio,
        fechaVencimiento: formData.fechaVencimiento,
      }

      await agregarUsuario(nuevoUsuario)

      const pago = {
        userNombre: formData.nombreApellido,
        userDni: formData.dni,
        monto: Number.parseFloat(formData.montoPago),
        fecha: formData.fechaInicio,
        metodoPago: formData.metodoPago,
        montoEfectivo: formData.metodoPago === "Mixto" ? Number.parseFloat(formData.montoEfectivo) : 0,
        montoMercadoPago: formData.metodoPago === "Mixto" ? Number.parseFloat(formData.montoMercadoPago) : 0,
      }

      await registrarPago(pago)

      if (getSoundEnabled()) {
        await soundGenerator.playOperationCompleteSound()
      }

      setAlertaInfo({
        mensaje: "Usuario registrado y pago realizado exitosamente",
        visible: true,
        tipo: "success",
      })

      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Error al registrar usuario:", error)

      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }

      setAlertaInfo({
        mensaje: "Error al registrar usuario. Por favor, intenta de nuevo.",
        visible: true,
        tipo: "error",
      })
    } finally {
      setGuardando(false)
      setShowPinModal(false)
    }
  }

  const esPagoPorDia = formData.actividad === "Dia"

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/" className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">Nuevo Usuario</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombreApellido" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre y Apellido *
            </label>
            <input
              type="text"
              id="nombreApellido"
              value={formData.nombreApellido}
              onChange={(e) => setFormData({ ...formData, nombreApellido: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
              style={{ fontSize: "16px" }}
            />
          </div>

          <div>
            <label htmlFor="dni" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              DNI *
            </label>
            <input
              type="text"
              id="dni"
              value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
              style={{ fontSize: "16px" }}
            />
          </div>

          <div>
            <label htmlFor="actividad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Actividad *
            </label>
            <select
              id="actividad"
              value={formData.actividad}
              onChange={(e) => setFormData({ ...formData, actividad: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              style={{ fontSize: "16px" }}
            >
              {ACTIVIDADES_OPCIONES.map((actividad) => (
                <option key={actividad} value={actividad}>
                  {actividad}
                </option>
              ))}
            </select>
          </div>

          {esPagoPorDia && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⏰ <strong>Pago por Día:</strong> El usuario tendrá acceso hasta el día siguiente. Precio fijo: $5.000
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                id="fechaInicio"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="fechaVencimiento"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                id="fechaVencimiento"
                value={formData.fechaVencimiento}
                disabled
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {esPagoPorDia
                  ? "Se calcula automáticamente (1 día después)"
                  : "Se calcula automáticamente (1 mes después)"}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Método de Pago *
            </label>
            <select
              id="metodoPago"
              value={formData.metodoPago}
              onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={esPagoPorDia}
              style={{ fontSize: "16px" }}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Mercado Pago">Mercado Pago</option>
              {!esPagoPorDia && <option value="Mixto">Mixto</option>}
            </select>
            {esPagoPorDia && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Opción Mixto no disponible para pago por día
              </p>
            )}
          </div>

          {formData.metodoPago === "Mixto" && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md p-4 space-y-3">
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                🔀 Desglose de Pago Mixto
              </h3>

              <div>
                <label
                  htmlFor="montoEfectivo"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Monto en Efectivo ($)
                </label>
                <input
                  type="number"
                  id="montoEfectivo"
                  value={formData.montoEfectivo}
                  onChange={(e) => setFormData({ ...formData, montoEfectivo: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                  step="100"
                  style={{ fontSize: "16px" }}
                />
              </div>

              <div>
                <label
                  htmlFor="montoMercadoPago"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Monto en Mercado Pago ($)
                </label>
                <input
                  type="number"
                  id="montoMercadoPago"
                  value={formData.montoMercadoPago}
                  onChange={(e) => setFormData({ ...formData, montoMercadoPago: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                  step="100"
                  style={{ fontSize: "16px" }}
                />
              </div>

              <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Total calculado:</span>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    $
                    {(Number.parseFloat(formData.montoEfectivo) || 0) +
                      (Number.parseFloat(formData.montoMercadoPago) || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Total requerido:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">${formData.montoPago}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="montoPago" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto de Pago ($) *
            </label>
            <input
              type="number"
              id="montoPago"
              value={formData.montoPago}
              onChange={(e) => setFormData({ ...formData, montoPago: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
              disabled={esPagoPorDia}
              min="0"
              step="100"
              style={{ fontSize: "16px" }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {esPagoPorDia
                ? "El pago por día tiene un precio fijo de $5.000"
                : "Monto sugerido según actividad y método de pago"}
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 bg-gray-500 dark:bg-gray-600 text-white p-3 rounded-md hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 dark:bg-green-700 text-white p-3 rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={guardando}
            >
              {guardando ? <LoadingDumbbell size={24} className="mx-auto" /> : "Registrar Usuario"}
            </button>
          </div>
        </form>
      </div>

      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        title="Registrar Nuevo Usuario"
        description={`Se registrará a ${formData.nombreApellido} con un pago de $${formData.montoPago} (${formData.metodoPago}${
          formData.metodoPago === "Mixto"
            ? `: Efectivo $${formData.montoEfectivo}, Mercado Pago $${formData.montoMercadoPago}`
            : ""
        }). Ingrese el PIN para confirmar.`}
      />

      <Alert
        message={alertaInfo.mensaje}
        isOpen={alertaInfo.visible}
        onClose={() => setAlertaInfo((prev) => ({ ...prev, visible: false }))}
        type={alertaInfo.tipo}
      />
    </main>
  )
}

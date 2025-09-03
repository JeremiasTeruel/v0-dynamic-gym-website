"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Lock, Eye, EyeOff } from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"

interface PinModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title: string
  description: string
}

// PIN de seguridad - Cambiar aquí para modificar el PIN
const SECURITY_PIN = "1234"

export default function PinModal({ isOpen, onClose, onSuccess, title, description }: PinModalProps) {
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resetear estado cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setPin("")
      setError("")
      setAttempts(0)
      // Enfocar el primer input después de un pequeño delay
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [isOpen])

  // Bloquear temporalmente después de 3 intentos fallidos
  const isBlocked = attempts >= 3

  const handlePinChange = (index: number, value: string) => {
    // Solo permitir números
    if (!/^\d*$/.test(value)) return

    const newPin = pin.split("")
    newPin[index] = value

    // Si se ingresa un dígito, mover al siguiente input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    setPin(newPin.join(""))
    setError("")
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Manejar backspace
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Manejar Enter
    if (e.key === "Enter" && pin.length === 4) {
      handleVerifyPin()
    }
  }

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      setError("Ingrese los 4 dígitos del PIN")
      return
    }

    if (isBlocked) {
      setError("Demasiados intentos fallidos. Espere un momento.")
      return
    }

    setIsVerifying(true)
    setError("")

    // Simular verificación (pequeño delay para UX)
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (pin === SECURITY_PIN) {
      // PIN correcto
      onSuccess()
      onClose()
    } else {
      // PIN incorrecto
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPin("")
      setError(`PIN incorrecto. Intento ${newAttempts}/3`)

      if (newAttempts >= 3) {
        setError("Demasiados intentos fallidos. Contacte al administrador.")
        // Bloquear por 30 segundos
        setTimeout(() => {
          setAttempts(0)
          setError("")
        }, 30000)
      }

      // Enfocar el primer input
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }

    setIsVerifying(false)
  }

  const handleClose = () => {
    if (!isVerifying) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Lock className="h-6 w-6 mr-2 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Verificación de Seguridad</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isVerifying}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Descripción de la acción */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>

          {/* PIN Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
              Ingrese el PIN de seguridad
            </label>
            <div className="flex justify-center space-x-3 mb-4">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type={showPin ? "text" : "password"}
                  value={pin[index] || ""}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  maxLength={1}
                  disabled={isVerifying || isBlocked}
                  autoComplete="off"
                />
              ))}
            </div>

            {/* Toggle mostrar PIN */}
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                disabled={isVerifying}
              >
                {showPin ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showPin ? "Ocultar PIN" : "Mostrar PIN"}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              disabled={isVerifying}
            >
              Cancelar
            </button>
            <button
              onClick={handleVerifyPin}
              className="flex-1 px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
              disabled={isVerifying || pin.length !== 4 || isBlocked}
            >
              {isVerifying ? (
                <>
                  <LoadingDumbbell size={20} className="mr-2" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </button>
          </div>

          {/* Información adicional */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isBlocked
                ? "Contacte al administrador para restablecer el acceso"
                : `Intentos restantes: ${3 - attempts}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

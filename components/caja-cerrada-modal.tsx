"use client"

import { X, AlertCircle } from "lucide-react"

interface CajaCerradaModalProps {
  isOpen: boolean
  onClose: () => void
  onAbrirCaja: () => void
}

export default function CajaCerradaModal({ isOpen, onClose, onAbrirCaja }: CajaCerradaModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <AlertCircle className="h-6 w-6 mr-2 text-red-600 dark:text-red-400" />
            Caja Cerrada
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-gray-700 dark:text-gray-300 text-center">
              La caja se encuentra cerrada. Debe abrir la caja para poder realizar ventas o registrar pagos.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onAbrirCaja}
              className="flex-1 px-4 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              Abrir Caja
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

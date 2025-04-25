"use client"

import type React from "react"

import { useState } from "react"
import { CheckCircle, XCircle, Trash2, Edit } from "lucide-react"
import type { Usuario } from "@/data/usuarios"

interface UserCardProps {
  usuario: Usuario
  onEdit: (usuario: Usuario) => void
  onDelete: (id: string) => void
  isDeleting: boolean
  formatDate: (date: string) => string
  isPaymentDue: (date: string) => boolean
}

export default function UserCard({ usuario, onEdit, onDelete, isDeleting, formatDate, isPaymentDue }: UserCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  // Manejar gestos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 100) {
      // Deslizamiento a la izquierda
      setShowActions(true)
    }

    if (touchEnd - touchStart > 100) {
      // Deslizamiento a la derecha
      setShowActions(false)
    }
  }

  return (
    <div
      className="relative overflow-hidden border rounded-md mb-4 bg-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`transition-transform duration-300 ${showActions ? "transform -translate-x-24" : ""}`}
        onClick={() => setShowActions(false)}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">{usuario.nombreApellido}</h3>
            {isPaymentDue(usuario.fechaVencimiento) ? (
              <div className="flex items-center text-red-500">
                <XCircle className="h-5 w-5 mr-1" />
                <span>Vencida</span>
              </div>
            ) : (
              <div className="flex items-center text-green-500">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span>Al día</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">DNI:</span> {usuario.dni}
            </div>
            <div>
              <span className="font-medium">Teléfono:</span> {usuario.telefono || "-"}
            </div>
            <div>
              <span className="font-medium">Edad:</span> {usuario.edad} años
            </div>
            <div>
              <span className="font-medium">Inicio:</span> {formatDate(usuario.fechaInicio)}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Vencimiento:</span> {formatDate(usuario.fechaVencimiento)}
            </div>
          </div>
        </div>
        <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500">
          <span>ID: {usuario.id.substring(0, 8)}...</span>
          <span className="ml-2">• Desliza para opciones</span>
        </div>
      </div>

      <div className="absolute right-0 top-0 bottom-0 flex h-full">
        <button
          onClick={() => onEdit(usuario)}
          className="bg-blue-500 text-white h-full w-12 flex items-center justify-center"
        >
          <Edit className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(usuario.id)}
          disabled={isDeleting}
          className="bg-red-500 text-white h-full w-12 flex items-center justify-center"
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : (
            <Trash2 className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  )
}

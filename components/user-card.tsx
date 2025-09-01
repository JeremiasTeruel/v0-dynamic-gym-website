"use client"
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
  return (
    <div className="relative overflow-hidden border rounded-md mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{usuario.nombreApellido}</h3>

        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">DNI:</span>
            <span className="text-gray-900 dark:text-gray-100 ml-1">{usuario.dni}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Teléfono:</span>
            <span className="text-gray-900 dark:text-gray-100 ml-1">{usuario.telefono || "-"}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Edad:</span>
            <span className="text-gray-900 dark:text-gray-100 ml-1">{usuario.edad} años</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Actividad:</span>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full ml-1">
              {usuario.actividad || "Normal"}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Inicio:</span>
            <span className="text-gray-900 dark:text-gray-100 ml-1">{formatDate(usuario.fechaInicio)}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Vencimiento:</span>
            <span className="text-gray-900 dark:text-gray-100 ml-1">{formatDate(usuario.fechaVencimiento)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <div>
            {isPaymentDue(usuario.fechaVencimiento) ? (
              <div className="flex items-center text-red-500 dark:text-red-400">
                <XCircle className="h-5 w-5 mr-1" />
                <span>Vencida</span>
              </div>
            ) : (
              <div className="flex items-center text-green-500 dark:text-green-400">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span>Al día</span>
              </div>
            )}
          </div>

          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(usuario)}
              className="bg-blue-500 text-white p-1.5 rounded-md"
              aria-label="Editar usuario"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(usuario.id)}
              disabled={isDeleting}
              className="bg-red-500 text-white p-1.5 rounded-md"
              aria-label="Eliminar usuario"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
        <span>ID: {usuario.id.substring(0, 8)}...</span>
      </div>
    </div>
  )
}

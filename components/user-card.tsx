"use client"
import { CheckCircle, XCircle, Trash2, Edit } from "lucide-react"
import type { Usuario } from "@/data/usuarios"
import LoadingDumbbell from "@/components/loading-dumbbell"

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
    <div className="relative overflow-hidden border rounded-md mb-4 bg-white">
      <div className="p-4">
        <h3 className="font-bold text-lg">{usuario.nombreApellido}</h3>

        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
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

        <div className="flex justify-between items-center mt-3">
          <div>
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
              {isDeleting ? <LoadingDumbbell size={16} /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500">
        <span>ID: {usuario.id.substring(0, 8)}...</span>
      </div>
    </div>
  )
}

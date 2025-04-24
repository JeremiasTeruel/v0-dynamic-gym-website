"use client"

import { useState } from "react"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { CheckCircle, XCircle, Trash2, RefreshCw } from "lucide-react"

export default function Admin() {
  const { usuarios, cargando, error, eliminarUsuario, recargarUsuarios } = useGymContext()
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [recargando, setRecargando] = useState(false)

  const isPaymentDue = (dueDate) => {
    const today = new Date()
    const paymentDate = new Date(dueDate)
    return today > paymentDate
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  const handleEliminar = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      try {
        setEliminando(id)
        await eliminarUsuario(id)
      } catch (error) {
        console.error("Error al eliminar usuario:", error)
        alert("Error al eliminar usuario. Por favor, intenta de nuevo.")
      } finally {
        setEliminando(null)
      }
    }
  }

  const handleRecargar = async () => {
    try {
      setRecargando(true)
      await recargarUsuarios()
    } catch (error) {
      console.error("Error al recargar usuarios:", error)
    } finally {
      setRecargando(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold text-green-600 mb-10">Administración - Dynamic Gym</h1>

      <div className="w-full max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-2xl font-semibold">Lista de Usuarios ({usuarios.length})</h2>
            <button
              onClick={handleRecargar}
              className="ml-4 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              disabled={recargando || cargando}
              title="Recargar usuarios"
            >
              <RefreshCw className={`h-5 w-5 ${recargando ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded-md hover:scale-105 transition-transform">
              Volver al Inicio
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">{error}</div>
        )}

        {cargando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Nombre y Apellido</th>
                  <th className="p-3 text-left">DNI</th>
                  <th className="p-3 text-left">Edad</th>
                  <th className="p-3 text-left">Fecha Inicio</th>
                  <th className="p-3 text-left">Vencimiento</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-t border-gray-200">
                      <td className="p-3">{usuario.id.substring(0, 8)}...</td>
                      <td className="p-3">{usuario.nombreApellido}</td>
                      <td className="p-3">{usuario.dni}</td>
                      <td className="p-3">{usuario.edad}</td>
                      <td className="p-3">{formatDate(usuario.fechaInicio)}</td>
                      <td className="p-3">{formatDate(usuario.fechaVencimiento)}</td>
                      <td className="p-3">
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
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEliminar(usuario.id)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                          disabled={eliminando === usuario.id}
                          title="Eliminar usuario"
                        >
                          {eliminando === usuario.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500"></div>
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <p className="text-sm text-gray-500">Total de usuarios registrados: {usuarios.length}</p>
          <p className="text-sm text-gray-500 mt-1">Conectado a la base de datos MongoDB Atlas: Cluster0</p>
        </div>
      </div>
    </main>
  )
}

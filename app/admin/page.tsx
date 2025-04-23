"use client"

import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { CheckCircle, XCircle } from "lucide-react"

export default function Admin() {
  const { usuarios } = useGymContext()

  const isPaymentDue = (dueDate) => {
    const today = new Date()
    const paymentDate = new Date(dueDate)
    return today > paymentDate
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold text-green-600 mb-10">Administración - Dynamic Gym</h1>

      <div className="w-full max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Lista de Usuarios ({usuarios.length})</h2>
          <div className="flex gap-4">
            <Link
              href="/sincronizar"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:scale-105 transition-transform"
            >
              Sincronizar Datos
            </Link>
            <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded-md hover:scale-105 transition-transform">
              Volver al Inicio
            </Link>
          </div>
        </div>

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
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-t border-gray-200">
                  <td className="p-3">{usuario.id}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500">Total de usuarios registrados: {usuarios.length}</p>
        </div>
      </div>
    </main>
  )
}

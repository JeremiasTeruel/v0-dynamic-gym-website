"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import type { Usuario } from "@/data/usuarios"

interface ProximosVencimientosProps {
  usuarios: Usuario[]
}

export default function ProximosVencimientos({ usuarios }: ProximosVencimientosProps) {
  const isMobile = useMobile()
  const [proximosVencimientos, setProximosVencimientos] = useState<Usuario[]>([])

  // Función para calcular los días restantes hasta el vencimiento
  const calcularDiasRestantes = (fechaVencimiento: string): number => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0) // Normalizar a inicio del día
    const fechaVence = new Date(fechaVencimiento)
    fechaVence.setHours(0, 0, 0, 0) // Normalizar a inicio del día

    // Calcular diferencia en milisegundos y convertir a días
    const diferencia = fechaVence.getTime() - hoy.getTime()
    return Math.ceil(diferencia / (1000 * 3600 * 24))
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  // Actualizar la lista de próximos vencimientos cuando cambian los usuarios
  useEffect(() => {
    if (usuarios.length > 0) {
      // Filtrar usuarios cuya membresía no ha vencido aún
      const usuariosNoVencidos = usuarios.filter((usuario) => {
        const diasRestantes = calcularDiasRestantes(usuario.fechaVencimiento)
        return diasRestantes >= 0 // Solo incluir los que no han vencido
      })

      // Ordenar por fecha de vencimiento (más cercano primero)
      const ordenados = [...usuariosNoVencidos].sort((a, b) => {
        const diasA = calcularDiasRestantes(a.fechaVencimiento)
        const diasB = calcularDiasRestantes(b.fechaVencimiento)
        return diasA - diasB
      })

      // Tomar los primeros 10
      setProximosVencimientos(ordenados.slice(0, 10))
    }
  }, [usuarios])

  // Función para determinar el color basado en los días restantes
  const getColorClass = (diasRestantes: number): string => {
    if (diasRestantes <= 3) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    if (diasRestantes <= 7) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
        <Clock className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
        Próximos vencimientos
      </h2>

      {proximosVencimientos.length === 0 ? (
        <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No hay vencimientos próximos</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Vista para móviles */}
          {isMobile && (
            <div className="md:hidden">
              {proximosVencimientos.map((usuario) => {
                const diasRestantes = calcularDiasRestantes(usuario.fechaVencimiento)
                return (
                  <div key={usuario.id} className="border-b last:border-b-0 border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{usuario.nombreApellido}</p>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDate(usuario.fechaVencimiento)}</span>
                        </div>
                      </div>
                      <div
                        className={`text-center px-3 py-1 rounded-full text-sm font-medium ${getColorClass(diasRestantes)}`}
                      >
                        {diasRestantes} días
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Vista para escritorio */}
          {!isMobile && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha Vencimiento
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Días Restantes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {proximosVencimientos.map((usuario) => {
                  const diasRestantes = calcularDiasRestantes(usuario.fechaVencimiento)
                  return (
                    <tr key={usuario.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {usuario.nombreApellido}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(usuario.fechaVencimiento)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorClass(diasRestantes)}`}
                        >
                          {diasRestantes} días
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

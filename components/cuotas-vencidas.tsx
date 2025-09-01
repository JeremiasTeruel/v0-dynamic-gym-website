"use client"

import { useState, useEffect } from "react"
import { Calendar, CheckCircle, AlertCircle } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import type { Usuario } from "@/data/usuarios"

interface CuotasVencidasProps {
  usuarios: Usuario[]
}

export default function CuotasVencidas({ usuarios }: CuotasVencidasProps) {
  const isMobile = useMobile()
  const [cuotasVencidas, setCuotasVencidas] = useState<Usuario[]>([])

  // Función para calcular los días desde el vencimiento
  const calcularDiasVencidos = (fechaVencimiento: string): number => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0) // Normalizar a inicio del día
    const fechaVence = new Date(fechaVencimiento)
    fechaVence.setHours(0, 0, 0, 0) // Normalizar a inicio del día

    // Calcular diferencia en milisegundos y convertir a días
    const diferencia = hoy.getTime() - fechaVence.getTime()
    return Math.ceil(diferencia / (1000 * 3600 * 24))
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  // Actualizar la lista de cuotas vencidas cuando cambian los usuarios
  useEffect(() => {
    if (usuarios.length > 0) {
      // Filtrar usuarios cuya membresía ha vencido
      const usuariosVencidos = usuarios.filter((usuario) => {
        const diasVencidos = calcularDiasVencidos(usuario.fechaVencimiento)
        return diasVencidos > 0 // Solo incluir los que han vencido
      })

      // Ordenar por fecha de vencimiento (más antiguo primero)
      const ordenados = [...usuariosVencidos].sort((a, b) => {
        const diasA = calcularDiasVencidos(a.fechaVencimiento)
        const diasB = calcularDiasVencidos(b.fechaVencimiento)
        return diasB - diasA // Orden descendente (más días vencidos primero)
      })

      setCuotasVencidas(ordenados)
    }
  }, [usuarios])

  // Función para determinar el color basado en los días vencidos
  const getColorClass = (diasVencidos: number): string => {
    if (diasVencidos > 30) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    if (diasVencidos > 15) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
        <AlertCircle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
        Cuotas vencidas
      </h2>

      {cuotasVencidas.length === 0 ? (
        <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No hay usuarios con la cuota vencida aún.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Vista para móviles */}
          {isMobile && (
            <div className="md:hidden">
              {cuotasVencidas.map((usuario) => {
                const diasVencidos = calcularDiasVencidos(usuario.fechaVencimiento)
                return (
                  <div key={usuario.id} className="border-b last:border-b-0 border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{usuario.nombreApellido}</p>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDate(usuario.fechaVencimiento)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                            {usuario.actividad || "Normal"}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`text-center px-3 py-1 rounded-full text-sm font-medium ${getColorClass(diasVencidos)}`}
                      >
                        {diasVencidos} días
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
                    Actividad
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha Vencimiento
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Días Vencidos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cuotasVencidas.map((usuario) => {
                  const diasVencidos = calcularDiasVencidos(usuario.fechaVencimiento)
                  return (
                    <tr key={usuario.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {usuario.nombreApellido}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                          {usuario.actividad || "Normal"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(usuario.fechaVencimiento)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorClass(diasVencidos)}`}
                        >
                          {diasVencidos} días
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

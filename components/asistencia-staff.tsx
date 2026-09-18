"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, LogIn, LogOut, Briefcase } from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"

interface AsistenciaStaffRegistro {
  _id: string
  dni: string
  nombreApellido: string
  oficio: string
  fecha: string
  horaIngreso: string | null
  horaSalida: string | null
}

export default function AsistenciaStaff() {
  const [asistencias, setAsistencias] = useState<AsistenciaStaffRegistro[]>([])
  const [cargando, setCargando] = useState(true)

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "—"
    const date = new Date(isoString)
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const cargarAsistencias = useCallback(async () => {
    try {
      setCargando(true)
      const response = await fetch("/api/staff/asistencia")
      if (response.ok) {
        const data = await response.json()
        setAsistencias(data)
      } else {
        setAsistencias([])
      }
    } catch (error) {
      console.error("[v0] Error al cargar asistencia de staff:", error)
      setAsistencias([])
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarAsistencias()
  }, [cargarAsistencias])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-green-600 dark:text-green-400" />
          Asistencia Staff
        </h2>
        <button
          onClick={cargarAsistencias}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
          disabled={cargando}
          title="Recargar asistencia de staff"
        >
          <RefreshCw className={`h-5 w-5 ${cargando ? "animate-spin" : ""}`} />
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-8">
          <LoadingDumbbell size={32} className="text-green-500" />
        </div>
      ) : asistencias.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Aún no se registró asistencia del staff hoy.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Total de registros hoy: {asistencias.length}
          </p>

          {/* Vista móvil */}
          <div className="md:hidden space-y-3">
            {asistencias.map((a, index) => (
              <div
                key={a._id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{a.nombreApellido}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">DNI:</span> {a.dni}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Oficio:</span>{" "}
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                      {a.oficio}
                    </span>
                  </p>
                  <p className="text-green-700 dark:text-green-400 flex items-center gap-1">
                    <LogIn className="h-4 w-4" />
                    <span className="font-medium">Ingreso:</span> {formatTime(a.horaIngreso)}
                  </p>
                  <p className="text-red-600 dark:text-red-400 flex items-center gap-1">
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Salida:</span> {formatTime(a.horaSalida)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Vista desktop */}
          <div className="hidden md:block border dark:border-gray-600 rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-gray-900 dark:text-gray-100">#</th>
                  <th className="p-3 text-left text-gray-900 dark:text-gray-100">Nombre y Apellido</th>
                  <th className="p-3 text-left text-gray-900 dark:text-gray-100">DNI</th>
                  <th className="p-3 text-left text-gray-900 dark:text-gray-100">Oficio</th>
                  <th className="p-3 text-left text-gray-900 dark:text-gray-100">Hora Ingreso</th>
                  <th className="p-3 text-left text-gray-900 dark:text-gray-100">Hora Salida</th>
                </tr>
              </thead>
              <tbody>
                {asistencias.map((a, index) => (
                  <tr
                    key={a._id}
                    className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="p-3 text-gray-900 dark:text-gray-100">{index + 1}</td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">{a.nombreApellido}</td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">{a.dni}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                        {a.oficio}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        <LogIn className="h-4 w-4" />
                        {formatTime(a.horaIngreso)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <LogOut className="h-4 w-4" />
                        {formatTime(a.horaSalida)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

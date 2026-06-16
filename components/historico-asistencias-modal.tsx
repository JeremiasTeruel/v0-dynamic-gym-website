"use client"

import { useEffect, useState } from "react"
import { X, ChevronLeft, ChevronRight, Calendar, Users, Download } from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"

interface Asistencia {
  dni: string
  nombreApellido: string
  actividad: string
  fecha: string
  hora: string | null
  foto: string | null
}

interface HistoricoAsistenciasModalProps {
  isOpen: boolean
  onClose: () => void
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const fechaStr = (year: number, month: number, day: number) => {
  const m = String(month + 1).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

export default function HistoricoAsistenciasModal({ isOpen, onClose }: HistoricoAsistenciasModalProps) {
  const hoy = new Date()
  const [viewYear, setViewYear] = useState(hoy.getFullYear())
  const [viewMonth, setViewMonth] = useState(hoy.getMonth())
  const [fechasConAsistencia, setFechasConAsistencia] = useState<Record<string, number>>({})
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [cargandoFechas, setCargandoFechas] = useState(false)
  const [cargandoLista, setCargandoLista] = useState(false)

  useEffect(() => {
    if (isOpen) {
      cargarFechas()
      setFechaSeleccionada(null)
      setAsistencias([])
      setViewYear(hoy.getFullYear())
      setViewMonth(hoy.getMonth())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const cargarFechas = async () => {
    try {
      setCargandoFechas(true)
      const res = await fetch("/api/asistencias/fechas")
      if (res.ok) {
        const data: { fecha: string; cantidad: number }[] = await res.json()
        const map: Record<string, number> = {}
        data.forEach((d) => {
          map[d.fecha] = d.cantidad
        })
        setFechasConAsistencia(map)
      }
    } catch (error) {
      console.error("[v0] Error al cargar fechas de asistencias:", error)
    } finally {
      setCargandoFechas(false)
    }
  }

  const seleccionarFecha = async (fecha: string) => {
    setFechaSeleccionada(fecha)
    try {
      setCargandoLista(true)
      const res = await fetch(`/api/asistencias/${fecha}`)
      if (res.ok) {
        setAsistencias(await res.json())
      } else {
        setAsistencias([])
      }
    } catch (error) {
      console.error("[v0] Error al cargar asistencias del día:", error)
      setAsistencias([])
    } finally {
      setCargandoLista(false)
    }
  }

  const cambiarMes = (delta: number) => {
    let nuevoMes = viewMonth + delta
    let nuevoAnio = viewYear
    if (nuevoMes < 0) {
      nuevoMes = 11
      nuevoAnio -= 1
    } else if (nuevoMes > 11) {
      nuevoMes = 0
      nuevoAnio += 1
    }
    setViewMonth(nuevoMes)
    setViewYear(nuevoAnio)
  }

  const formatHora = (iso: string | null) => {
    if (!iso) return "--:--"
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  }

  const formatFechaLabel = (fecha: string) => {
    const d = new Date(fecha + "T12:00:00")
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  }

  const descargarAsistencias = async () => {
    if (!fechaSeleccionada || asistencias.length === 0) return
    const XLSX = await import("xlsx")
    const datos = asistencias.map((a, i) => ({
      "#": i + 1,
      "Nombre y Apellido": a.nombreApellido,
      DNI: a.dni,
      Actividad: a.actividad,
      Hora: formatHora(a.hora),
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Asistencias")
    ws["!cols"] = [{ wch: 4 }, { wch: 30 }, { wch: 12 }, { wch: 16 }, { wch: 8 }]
    XLSX.writeFile(wb, `asistencias_${fechaSeleccionada}.xlsx`)
  }

  if (!isOpen) return null

  const primerDiaSemana = new Date(viewYear, viewMonth, 1).getDay()
  const diasEnMes = new Date(viewYear, viewMonth + 1, 0).getDate()
  const celdas: (number | null)[] = []
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  const hoyStr = fechaStr(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-yellow-600 dark:text-yellow-400" />
            Histórico de Asistencias
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendario */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => cambiarMes(-1)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {MESES[viewMonth]} {viewYear}
              </h3>
              <button
                onClick={() => cambiarMes(1)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {cargandoFechas ? (
              <div className="flex justify-center py-12">
                <LoadingDumbbell size={32} className="text-yellow-500" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DIAS_SEMANA.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {celdas.map((dia, idx) => {
                    if (dia === null) return <div key={`empty-${idx}`} />
                    const fecha = fechaStr(viewYear, viewMonth, dia)
                    const cantidad = fechasConAsistencia[fecha]
                    const tieneAsistencia = cantidad > 0
                    const esSeleccionada = fecha === fechaSeleccionada
                    const esHoy = fecha === hoyStr
                    return (
                      <button
                        key={fecha}
                        onClick={() => tieneAsistencia && seleccionarFecha(fecha)}
                        disabled={!tieneAsistencia}
                        className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${
                          esSeleccionada
                            ? "bg-yellow-500 text-white font-bold"
                            : tieneAsistencia
                              ? "bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-gray-100 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 cursor-pointer"
                              : "text-gray-400 dark:text-gray-600 cursor-default"
                        } ${esHoy && !esSeleccionada ? "ring-2 ring-yellow-400" : ""}`}
                      >
                        <span>{dia}</span>
                        {tieneAsistencia && (
                          <span
                            className={`text-[10px] leading-none mt-0.5 font-medium ${
                              esSeleccionada ? "text-white" : "text-yellow-600 dark:text-yellow-400"
                            }`}
                          >
                            {cantidad}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700" />
                    Con asistencias
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded ring-2 ring-yellow-400" />
                    Hoy
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Lista de asistencias del día seleccionado */}
          <div className="border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-6 lg:pt-0 lg:pl-6">
            {!fechaSeleccionada ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Seleccioná un día del calendario para ver las asistencias registradas.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {formatFechaLabel(fechaSeleccionada)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Users className="h-4 w-4" />
                      {asistencias.length} {asistencias.length === 1 ? "asistencia" : "asistencias"}
                    </p>
                  </div>
                  {asistencias.length > 0 && (
                    <button
                      onClick={descargarAsistencias}
                      className="flex items-center gap-2 px-3 py-2 bg-yellow-600 dark:bg-yellow-700 text-white text-sm rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
                      title="Descargar asistencias"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden md:inline">Descargar</span>
                    </button>
                  )}
                </div>

                {cargandoLista ? (
                  <div className="flex justify-center py-12">
                    <LoadingDumbbell size={32} className="text-yellow-500" />
                  </div>
                ) : asistencias.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                    No hay asistencias registradas para este día.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                    {asistencias.map((a, index) => (
                      <div
                        key={`${a.dni}-${index}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border flex-shrink-0">
                          {a.foto ? (
                            <img
                              src={a.foto || "/placeholder.svg"}
                              alt={a.nombreApellido}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">
                              {a.nombreApellido?.charAt(0).toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{a.nombreApellido}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            DNI: {a.dni} · {a.actividad}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex-shrink-0">
                          {formatHora(a.hora)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

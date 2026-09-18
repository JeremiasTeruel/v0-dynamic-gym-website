"use client"

import { useState, useEffect, useCallback } from "react"
import { X, RefreshCw, UserPlus, Briefcase, Pencil, Trash2 } from "lucide-react"
import PinModal from "@/components/pin-modal"
import Alert from "@/components/alert"
import LoadingDumbbell from "@/components/loading-dumbbell"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"

interface StaffMiembro {
  id: string
  nombreApellido: string
  dni: string
  oficio: string
}

interface ListaStaffModalProps {
  isOpen: boolean
  onClose: () => void
}

type PinAccion = "crear" | "editar" | "eliminar" | null

export default function ListaStaffModal({ isOpen, onClose }: ListaStaffModalProps) {
  const [staff, setStaff] = useState<StaffMiembro[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [agregarModalAbierto, setAgregarModalAbierto] = useState(false)
  const [editarModalAbierto, setEditarModalAbierto] = useState(false)
  const [nombreApellido, setNombreApellido] = useState("")
  const [dni, setDni] = useState("")
  const [oficio, setOficio] = useState("")
  const [guardando, setGuardando] = useState(false)

  const [showPinModal, setShowPinModal] = useState(false)
  const [pinAccion, setPinAccion] = useState<PinAccion>(null)
  const [miembroSeleccionado, setMiembroSeleccionado] = useState<StaffMiembro | null>(null)

  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })

  const { getSoundEnabled } = useSoundPreferences()

  const ordenarStaff = (lista: StaffMiembro[]): StaffMiembro[] => {
    return [...lista].sort((a, b) => {
      const nombreA = a.nombreApellido
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
      const nombreB = b.nombreApellido
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
      return nombreA.localeCompare(nombreB)
    })
  }

  const cargarStaff = useCallback(async () => {
    try {
      setCargando(true)
      setError(null)
      const response = await fetch("/api/staff")
      if (!response.ok) {
        throw new Error("Error al cargar staff")
      }
      const data = await response.json()
      setStaff(ordenarStaff(data))
    } catch (err) {
      console.error("Error al cargar staff:", err)
      setError("Error al cargar la lista de staff. Por favor, intenta de nuevo.")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      cargarStaff()
    }
  }, [isOpen, cargarStaff])

  const resetFormulario = () => {
    setNombreApellido("")
    setDni("")
    setOficio("")
  }

  const abrirAgregar = () => {
    resetFormulario()
    setAgregarModalAbierto(true)
  }

  const cerrarAgregar = () => {
    // No cerrar/limpiar mientras se está verificando el PIN o guardando,
    // para evitar enviar campos vacíos al backend.
    if (showPinModal || guardando) return
    setAgregarModalAbierto(false)
    resetFormulario()
  }

  const abrirEditar = (miembro: StaffMiembro) => {
    setMiembroSeleccionado(miembro)
    setNombreApellido(miembro.nombreApellido)
    setDni(miembro.dni)
    setOficio(miembro.oficio)
    setEditarModalAbierto(true)
  }

  const cerrarEditar = () => {
    if (showPinModal || guardando) return
    setEditarModalAbierto(false)
    setMiembroSeleccionado(null)
    resetFormulario()
  }

  const handleCrear = () => {
    if (!nombreApellido.trim() || !dni.trim() || !oficio.trim()) {
      setAlertaInfo({
        mensaje: "Todos los campos son obligatorios",
        visible: true,
        tipo: "error",
      })
      return
    }
    setPinAccion("crear")
    setShowPinModal(true)
  }

  const handleEditar = () => {
    if (!nombreApellido.trim() || !dni.trim() || !oficio.trim()) {
      setAlertaInfo({
        mensaje: "Todos los campos son obligatorios",
        visible: true,
        tipo: "error",
      })
      return
    }
    setPinAccion("editar")
    setShowPinModal(true)
  }

  const solicitarEliminar = (miembro: StaffMiembro) => {
    setMiembroSeleccionado(miembro)
    setPinAccion("eliminar")
    setShowPinModal(true)
  }

  const handlePinSuccess = async () => {
    if (pinAccion === "crear") {
      await crearMiembro()
    } else if (pinAccion === "editar") {
      await editarMiembro()
    } else if (pinAccion === "eliminar") {
      await eliminarMiembro()
    }
    setPinAccion(null)
  }

  const crearMiembro = async () => {
    if (!nombreApellido.trim() || !dni.trim() || !oficio.trim()) {
      setAlertaInfo({ mensaje: "Todos los campos son obligatorios", visible: true, tipo: "error" })
      return
    }
    try {
      setGuardando(true)
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreApellido: nombreApellido.trim(),
          dni: dni.trim(),
          oficio: oficio.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Error al crear miembro de staff")
      }

      if (getSoundEnabled()) {
        await soundGenerator.playSuccessSound()
      }

      setStaff((prev) => ordenarStaff([...prev, data]))
      setAgregarModalAbierto(false)
      resetFormulario()
      setAlertaInfo({ mensaje: "Nuevo miembro de staff creado con éxito!", visible: true, tipo: "success" })
    } catch (err: any) {
      console.error("Error al crear miembro de staff:", err)
      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }
      setAlertaInfo({ mensaje: err.message || "Error al crear miembro de staff", visible: true, tipo: "error" })
    } finally {
      setGuardando(false)
    }
  }

  const editarMiembro = async () => {
    if (!miembroSeleccionado || !nombreApellido.trim() || !dni.trim() || !oficio.trim()) {
      setAlertaInfo({ mensaje: "Todos los campos son obligatorios", visible: true, tipo: "error" })
      return
    }
    try {
      setGuardando(true)
      const response = await fetch(`/api/staff/${miembroSeleccionado.dni}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreApellido: nombreApellido.trim(),
          dni: dni.trim(),
          oficio: oficio.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Error al editar miembro de staff")
      }

      if (getSoundEnabled()) {
        await soundGenerator.playSuccessSound()
      }

      setStaff((prev) => ordenarStaff(prev.map((m) => (m.id === data.id ? data : m))))
      setEditarModalAbierto(false)
      setMiembroSeleccionado(null)
      resetFormulario()
      setAlertaInfo({ mensaje: "Miembro de staff actualizado con éxito!", visible: true, tipo: "success" })
    } catch (err: any) {
      console.error("Error al editar miembro de staff:", err)
      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }
      setAlertaInfo({ mensaje: err.message || "Error al editar miembro de staff", visible: true, tipo: "error" })
    } finally {
      setGuardando(false)
    }
  }

  const eliminarMiembro = async () => {
    if (!miembroSeleccionado) return
    try {
      setGuardando(true)
      const response = await fetch(`/api/staff/${miembroSeleccionado.dni}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar miembro de staff")
      }

      if (getSoundEnabled()) {
        await soundGenerator.playSuccessSound()
      }

      setStaff((prev) => prev.filter((m) => m.id !== miembroSeleccionado.id))
      setMiembroSeleccionado(null)
      setAlertaInfo({ mensaje: "Miembro de staff eliminado con éxito!", visible: true, tipo: "success" })
    } catch (err: any) {
      console.error("Error al eliminar miembro de staff:", err)
      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }
      setAlertaInfo({ mensaje: err.message || "Error al eliminar miembro de staff", visible: true, tipo: "error" })
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  const pinConfig = {
    crear: {
      title: "Crear Miembro de Staff",
      description: "Ingrese el código de verificación para crear el nuevo miembro de staff.",
    },
    editar: {
      title: "Editar Miembro de Staff",
      description: "Ingrese el código de verificación para guardar los cambios.",
    },
    eliminar: {
      title: "Eliminar Miembro de Staff",
      description: `Ingrese el código de verificación para eliminar a ${miembroSeleccionado?.nombreApellido ?? "este miembro"}.`,
    },
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full h-full md:h-[90vh] max-w-5xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Lista de Staff ({staff.length})
              </h2>
              <button
                onClick={abrirAgregar}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                <span className="hidden sm:inline">Agregar Staff</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cargarStaff}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                disabled={cargando}
                title="Recargar staff"
              >
                <RefreshCw className={`h-5 w-5 ${cargando ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                {error}
              </div>
            )}

            {cargando ? (
              <div className="flex justify-center py-8">
                <LoadingDumbbell size={32} className="text-green-500" />
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-lg text-gray-500 dark:text-gray-400">No hay miembros de staff registrados.</p>
              </div>
            ) : (
              <>
                {/* Vista móvil */}
                <div className="md:hidden space-y-3">
                  {staff.map((miembro) => (
                    <div
                      key={miembro.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {miembro.nombreApellido}
                          </h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">DNI:</span> {miembro.dni}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            <span className="font-medium">Oficio:</span>{" "}
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                              {miembro.oficio}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => abrirEditar(miembro)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Editar"
                            aria-label={`Editar a ${miembro.nombreApellido}`}
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => solicitarEliminar(miembro)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Eliminar"
                            aria-label={`Eliminar a ${miembro.nombreApellido}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
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
                        <th className="p-3 text-right text-gray-900 dark:text-gray-100">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((miembro, index) => (
                        <tr
                          key={miembro.id}
                          className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="p-3 text-gray-900 dark:text-gray-100">{index + 1}</td>
                          <td className="p-3 text-gray-900 dark:text-gray-100">{miembro.nombreApellido}</td>
                          <td className="p-3 text-gray-900 dark:text-gray-100">{miembro.dni}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                              {miembro.oficio}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => abrirEditar(miembro)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Editar"
                                aria-label={`Editar a ${miembro.nombreApellido}`}
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => solicitarEliminar(miembro)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Eliminar"
                                aria-label={`Eliminar a ${miembro.nombreApellido}`}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Total de miembros de staff: {staff.length}
            </p>
          </div>
        </div>
      </div>

      {/* Modal Agregar Staff */}
      {agregarModalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[55] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Agregar Miembro de Staff</h2>
              <button
                onClick={cerrarAgregar}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={guardando}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  value={nombreApellido}
                  onChange={(e) => setNombreApellido(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DNI</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ej: 40123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Oficio</label>
                <input
                  type="text"
                  value={oficio}
                  onChange={(e) => setOficio(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ej: Profesor, Recepcionista"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={cerrarAgregar}
                className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                disabled={guardando}
              >
                {guardando ? (
                  <>
                    <LoadingDumbbell size={20} className="mr-2" />
                    Creando...
                  </>
                ) : (
                  "Crear"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Staff */}
      {editarModalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[55] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar Miembro de Staff</h2>
              <button
                onClick={cerrarEditar}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={guardando}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  value={nombreApellido}
                  onChange={(e) => setNombreApellido(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DNI</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ej: 40123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Oficio</label>
                <input
                  type="text"
                  value={oficio}
                  onChange={(e) => setOficio(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ej: Profesor, Recepcionista"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={cerrarEditar}
                className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                onClick={handleEditar}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                disabled={guardando}
              >
                {guardando ? (
                  <>
                    <LoadingDumbbell size={20} className="mr-2" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <PinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false)
          setPinAccion(null)
        }}
        onSuccess={handlePinSuccess}
        title={pinAccion ? pinConfig[pinAccion].title : "Verificación de Seguridad"}
        description={pinAccion ? pinConfig[pinAccion].description : "Ingrese el código de verificación."}
      />

      <Alert
        message={alertaInfo.mensaje}
        isOpen={alertaInfo.visible}
        onClose={() => setAlertaInfo((prev) => ({ ...prev, visible: false }))}
        type={alertaInfo.tipo}
      />
    </>
  )
}

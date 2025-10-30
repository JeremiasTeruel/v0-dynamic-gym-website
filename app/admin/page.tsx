"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import {
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Edit,
  Search,
  X,
  BarChart,
  Package,
  FileText,
  UserPlus,
  CreditCard,
  ShoppingCart,
} from "lucide-react"
import EditarUsuarioModal from "@/components/editar-usuario-modal"
import UserCard from "@/components/user-card"
import PinModal from "@/components/pin-modal"
import StockBebidasModal from "@/components/stock-bebidas-modal"
import ReporteCierreCaja from "@/components/reporte-cierre-caja"
import VentaBebidasModal from "@/components/venta-bebidas-modal"
import { useMobile } from "@/hooks/use-mobile"
import type { Usuario } from "@/data/usuarios"
import Alert from "@/components/alert"
import LoadingDumbbell from "@/components/loading-dumbbell"
import ThemeToggle from "@/components/theme-toggle"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"

export default function Admin() {
  const { usuarios, cargando, error, eliminarUsuario, actualizarUsuario, recargarUsuarios } = useGymContext()
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [recargando, setRecargando] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [stockModalAbierto, setStockModalAbierto] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinAction, setPinAction] = useState<{ type: "delete" | "edit"; data: any } | null>(null)
  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })
  const [busqueda, setBusqueda] = useState("")
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([])
  const [usuariosOrdenados, setUsuariosOrdenados] = useState<Usuario[]>([])
  const [reporteModalAbierto, setReporteModalAbierto] = useState(false)
  const [showVentaBebidasModal, setShowVentaBebidasModal] = useState(false)
  const isMobile = useMobile()
  const { getSoundEnabled } = useSoundPreferences()

  const ordenarUsuarios = (listaUsuarios: Usuario[]): Usuario[] => {
    return [...listaUsuarios].sort((a, b) => {
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

  useEffect(() => {
    const ordenados = ordenarUsuarios(usuarios)
    setUsuariosOrdenados(ordenados)
  }, [usuarios])

  useEffect(() => {
    if (!busqueda.trim()) {
      setUsuariosFiltrados(usuariosOrdenados)
      return
    }

    const termino = busqueda
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    const filtrados = usuariosOrdenados.filter((usuario) => {
      const nombre = usuario.nombreApellido
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
      return nombre.includes(termino)
    })

    setUsuariosFiltrados(filtrados)
  }, [busqueda, usuariosOrdenados])

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
    const usuario = usuarios.find((u) => u.id === id)
    if (!usuario) return

    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      setPinAction({ type: "delete", data: { id, nombre: usuario.nombreApellido } })
      setShowPinModal(true)
    }
  }

  const handleEditar = (usuario: Usuario) => {
    setUsuarioEditando(usuario)
    setModalAbierto(true)
  }

  const handleGuardarEdicion = async (usuarioActualizado: Usuario) => {
    try {
      await actualizarUsuario(usuarioActualizado.id, usuarioActualizado)

      if (getSoundEnabled()) {
        await soundGenerator.playSuccessSound()
      }

      setAlertaInfo({
        mensaje: "Usuario actualizado correctamente",
        visible: true,
        tipo: "success",
      })
    } catch (error) {
      console.error("Error al actualizar usuario:", error)

      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }

      setAlertaInfo({
        mensaje: "Error al actualizar usuario. Por favor, intenta de nuevo.",
        visible: true,
        tipo: "error",
      })
    }
  }

  const handleRecargar = async () => {
    try {
      setRecargando(true)
      await recargarUsuarios()

      if (getSoundEnabled()) {
        await soundGenerator.playSuccessSound()
      }

      setAlertaInfo({
        mensaje: "Datos recargados correctamente",
        visible: true,
        tipo: "success",
      })
    } catch (error) {
      console.error("Error al recargar usuarios:", error)

      if (getSoundEnabled()) {
        await soundGenerator.playAlarmSound()
      }

      setAlertaInfo({
        mensaje: "Error al recargar datos. Por favor, intenta de nuevo.",
        visible: true,
        tipo: "error",
      })
    } finally {
      setRecargando(false)
    }
  }

  const handlePinSuccess = async () => {
    if (!pinAction) return

    if (pinAction.type === "delete") {
      try {
        setEliminando(pinAction.data.id)
        await eliminarUsuario(pinAction.data.id)

        if (getSoundEnabled()) {
          await soundGenerator.playDeleteSound()
        }

        setAlertaInfo({
          mensaje: "Usuario eliminado correctamente",
          visible: true,
          tipo: "success",
        })
      } catch (error) {
        console.error("Error al eliminar usuario:", error)

        if (getSoundEnabled()) {
          await soundGenerator.playAlarmSound()
        }

        setAlertaInfo({
          mensaje: "Error al eliminar usuario. Por favor, intenta de nuevo.",
          visible: true,
          tipo: "error",
        })
      } finally {
        setEliminando(null)
      }
    }

    setPinAction(null)
  }

  const handlePinClose = () => {
    setShowPinModal(false)
    setPinAction(null)
  }

  const limpiarBusqueda = () => {
    setBusqueda("")
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-400">
          Administración - High Performance Gym
        </h1>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-6xl">
        <div className="mb-8 hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/nuevo-usuario"
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 px-4 py-4 rounded-lg shadow-sm text-yellow-600 dark:text-yellow-400 font-medium hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <UserPlus className="h-5 w-5" />
            Nuevo Usuario
          </Link>

          <Link
            href="/pagar-cuota"
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 px-4 py-4 rounded-lg shadow-sm text-yellow-600 dark:text-yellow-400 font-medium hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <CreditCard className="h-5 w-5" />
            Pagar Cuota
          </Link>

          <button
            onClick={() => setShowVentaBebidasModal(true)}
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 px-4 py-4 rounded-lg shadow-sm text-yellow-600 dark:text-yellow-400 font-medium hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <ShoppingCart className="h-5 w-5" />
            Venta de Bebidas
          </button>
        </div>

        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/admin/control-pagos"
            className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm text-green-600 font-medium hover:bg-green-50 transition-colors"
          >
            <BarChart className="h-5 w-5" />
            Control de Pagos
          </Link>

          <button
            onClick={() => setStockModalAbierto(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          >
            <Package className="h-5 w-5" />
            Stock de Bebidas
          </button>

          <button
            onClick={() => setReporteModalAbierto(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm text-purple-600 font-medium hover:bg-purple-50 transition-colors"
          >
            <FileText className="h-5 w-5" />
            Reportes de Caja
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 bg-gray-500 dark:bg-gray-600 px-4 py-3 rounded-lg shadow-sm text-white font-medium hover:bg-gray-700 dark:hover:bg-gray-500"
          >
            Volver al Inicio
          </Link>
        </div>

        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-2 md:p-0 md:static md:bg-transparent mb-4 rounded-lg shadow-sm md:shadow-none">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full p-3 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontSize: "16px" }}
            />
            {busqueda && (
              <button
                onClick={limpiarBusqueda}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-semibold">
              Lista de Usuarios ({usuariosFiltrados.length}/{usuarios.length})
            </h2>
            <div className="flex items-center">
              <button
                onClick={handleRecargar}
                className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-500 focus:outline-none"
                disabled={recargando || cargando}
                title="Recargar usuarios"
              >
                <RefreshCw className={`h-5 w-5 ${recargando ? "animate-spin" : ""}`} />
              </button>
              <Link
                href="/"
                className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-500"
              >
                Volver al Inicio
              </Link>
              <Link
                href="/"
                className="md:hidden ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">{error}</div>
        )}

        {cargando ? (
          <div className="flex justify-center py-8">
            <LoadingDumbbell size={32} className="text-yellow-500" />
          </div>
        ) : (
          <>
            {busqueda && usuariosFiltrados.length === 0 ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-gray-500 dark:text-gray-400">
                  No se encontraron usuarios que coincidan con "{busqueda}"
                </p>
                <button onClick={limpiarBusqueda} className="mt-2 text-green-600 dark:text-green-400 hover:underline">
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <>
                {isMobile && (
                  <div className="md:hidden">
                    {usuariosFiltrados.map((usuario) => (
                      <UserCard
                        key={usuario.id}
                        usuario={usuario}
                        onEdit={handleEditar}
                        onDelete={handleEliminar}
                        isDeleting={eliminando === usuario.id}
                        formatDate={formatDate}
                        isPaymentDue={isPaymentDue}
                      />
                    ))}
                  </div>
                )}

                {!isMobile && (
                  <div className="border dark:border-gray-600 rounded-md overflow-hidden overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th className="p-3 text-left text-gray-900 dark:text-gray-100">ID</th>
                          <th className="p-3 text-left text-gray-900 dark:text-gray-100">Nombre y Apellido</th>
                          <th className="p-3 text-left text-gray-900 dark:text-gray-100">DNI</th>
                          <th className="p-3 text-left text-gray-900 dark:text-gray-100">Actividad</th>
                          <th className="p-3 text-left text-gray-900 dark:text-gray-100">Fecha Inicio</th>
                          <th className="p-3 text-left text-gray-900 dark:text-gray-100">Vencimiento</th>
                          <th className="p-3 text-left text-gray-900 dark:text-gray-100">Estado</th>
                          <th className="p-3 text-left text-gray-900 dark:text-gray-100">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuariosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-4 text-center text-gray-500 dark:text-gray-400">
                              No hay usuarios registrados
                            </td>
                          </tr>
                        ) : (
                          usuariosFiltrados.map((usuario) => (
                            <tr key={usuario.id} className="border-t border-gray-200 dark:border-gray-600">
                              <td className="p-3">{usuario.id.substring(0, 8)}...</td>
                              <td className="p-3">{usuario.nombreApellido}</td>
                              <td className="p-3">{usuario.dni}</td>
                              <td className="p-3">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                                  {usuario.actividad || "Normal"}
                                </span>
                              </td>
                              <td className="p-3">{formatDate(usuario.fechaInicio)}</td>
                              <td className="p-3">{formatDate(usuario.fechaVencimiento)}</td>
                              <td className="p-3">
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
                              </td>
                              <td className="p-3">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditar(usuario)}
                                    className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 focus:outline-none"
                                    title="Editar usuario"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleEliminar(usuario.id)}
                                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 focus:outline-none"
                                    disabled={eliminando === usuario.id}
                                    title="Eliminar usuario"
                                  >
                                    {eliminando === usuario.id ? (
                                      <LoadingDumbbell size={20} className="text-red-500 dark:text-red-400" />
                                    ) : (
                                      <Trash2 className="h-5 w-5" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className="mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {busqueda
              ? `Mostrando ${usuariosFiltrados.length} de ${usuarios.length} usuarios (ordenados alfabéticamente)`
              : `Total de usuarios registrados: ${usuarios.length} (ordenados alfabéticamente)`}
          </p>
        </div>
      </div>

      <EditarUsuarioModal
        usuario={usuarioEditando}
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false)
          setUsuarioEditando(null)
        }}
        onSave={handleGuardarEdicion}
      />

      <StockBebidasModal isOpen={stockModalAbierto} onClose={() => setStockModalAbierto(false)} />

      <ReporteCierreCaja isOpen={reporteModalAbierto} onClose={() => setReporteModalAbierto(false)} />

      <VentaBebidasModal isOpen={showVentaBebidasModal} onClose={() => setShowVentaBebidasModal(false)} />

      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        title={pinAction?.type === "delete" ? "Eliminar Usuario" : "Acción Administrativa"}
        description={
          pinAction?.type === "delete"
            ? `Esta acción eliminará permanentemente a ${pinAction.data.nombre} del sistema. Ingrese el PIN de seguridad para continuar.`
            : "Ingrese el PIN de seguridad para realizar esta acción."
        }
      />

      <Alert
        message={alertaInfo.mensaje}
        isOpen={alertaInfo.visible}
        onClose={() => setAlertaInfo((prev) => ({ ...prev, visible: false }))}
        type={alertaInfo.tipo}
      />
    </main>
  )
}

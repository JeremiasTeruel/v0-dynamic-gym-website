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
  Users,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import EditarUsuarioModal from "@/components/editar-usuario-modal"
import UserCard from "@/components/user-card"
import PinModal from "@/components/pin-modal"
import StockBebidasModal from "@/components/stock-bebidas-modal"
import ReporteCierreCaja from "@/components/reporte-cierre-caja"
import VentaBebidasModal from "@/components/venta-bebidas-modal"
import EgresosModal from "@/components/egresos-modal"
import { useMobile } from "@/hooks/use-mobile"
import type { Usuario } from "@/data/usuarios"
import { ACTIVIDADES_OPCIONES } from "@/data/usuarios"
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
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [filtroEstadoCuota, setFiltroEstadoCuota] = useState<"todos" | "al_dia" | "vencida">("todos")
  const [filtroMesVencimiento, setFiltroMesVencimiento] = useState<string | null>(null)
  const [filtroActividad, setFiltroActividad] = useState<string | null>(null)
  const [subMenuEstadoAbierto, setSubMenuEstadoAbierto] = useState(false)
  const [subMenuActividadAbierto, setSubMenuActividadAbierto] = useState(false)
  const [reporteModalAbierto, setReporteModalAbierto] = useState(false)
  const [showVentaBebidasModal, setShowVentaBebidasModal] = useState(false)
  const [listaUsuariosModalAbierto, setListaUsuariosModalAbierto] = useState(false)
  const [egresosModalAbierto, setEgresosModalAbierto] = useState(false)
  const isMobile = useMobile()
  const { getSoundEnabled } = useSoundPreferences()

  const [ingresosDia, setIngresosDia] = useState([])
  const [cargandoIngresos, setCargandoIngresos] = useState(true)

  // Lista de actividades disponibles (importada de data/usuarios)
  const actividadesDisponibles = ACTIVIDADES_OPCIONES

  // Generar lista de meses pasados (desde el mes actual hacia atras)
  const generarMesesPasados = () => {
    const meses = []
    const hoy = new Date()
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const nombreMes = fecha.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
      meses.push({
        label: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
        mes: fecha.getMonth(),
        anio: fecha.getFullYear(),
      })
    }
    return meses
  }

  const mesesPasados = generarMesesPasados()

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
    let filtrados = [...usuariosOrdenados]

    // Filtrar por busqueda de nombre
    if (busqueda.trim()) {
      const termino = busqueda
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

      filtrados = filtrados.filter((usuario) => {
        const nombre = usuario.nombreApellido
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
        return nombre.includes(termino)
      })
    }

    // Filtrar por estado de cuota
    if (filtroEstadoCuota === "al_dia") {
      filtrados = filtrados.filter((usuario) => !isPaymentDue(usuario.fechaVencimiento))
    } else if (filtroEstadoCuota === "vencida") {
      filtrados = filtrados.filter((usuario) => isPaymentDue(usuario.fechaVencimiento))
      
      // Si hay un mes especifico seleccionado, filtrar por ese mes
      if (filtroMesVencimiento) {
        const [mes, anio] = filtroMesVencimiento.split("-").map(Number)
        filtrados = filtrados.filter((usuario) => {
          const fechaVenc = new Date(usuario.fechaVencimiento)
          return fechaVenc.getMonth() === mes && fechaVenc.getFullYear() === anio
        })
      }
    }

    // Filtrar por actividad
    if (filtroActividad) {
      filtrados = filtrados.filter((usuario) => usuario.actividad === filtroActividad)
    }

    setUsuariosFiltrados(filtrados)
  }, [busqueda, usuariosOrdenados, filtroEstadoCuota, filtroMesVencimiento, filtroActividad])

  const isPaymentDue = (dueDate) => {
    const today = new Date()
    const paymentDate = new Date(dueDate)
    return today > paymentDate
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  const formatTime = (isoString) => {
    if (!isoString) return "N/A"
    const date = new Date(isoString)
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
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

  const limpiarFiltros = () => {
    setFiltroEstadoCuota("todos")
    setFiltroMesVencimiento(null)
    setFiltroActividad(null)
    setSubMenuEstadoAbierto(false)
    setSubMenuActividadAbierto(false)
  }

  const hayFiltrosActivos = filtroEstadoCuota !== "todos" || filtroActividad !== null

  // Cerrar dropdown de filtros al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest("[data-filtros-dropdown]")) {
        setFiltrosAbiertos(false)
      }
    }

    if (filtrosAbiertos) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [filtrosAbiertos])

  const cargarIngresosDia = async () => {
    try {
      setCargandoIngresos(true)

      const cajaResponse = await fetch("/api/caja/actual")
      const cajaData = await cajaResponse.json()

      if (cajaData.cajaAbierta && cajaData.caja) {
        console.log("[v0] Cargando ingresos para caja:", cajaData.caja.id)
        const response = await fetch(`/api/ingresos/caja/${cajaData.caja.id}`)

        if (response.ok) {
          const ingresos = await response.json()
          console.log("[v0] Ingresos de la caja cargados:", ingresos.length)
          setIngresosDia(ingresos)
        } else {
          console.error("[v0] Error al cargar ingresos:", response.status)
          setIngresosDia([])
        }
      } else {
        // Si no hay caja abierta, mostrar lista vacía
        console.log("[v0] No hay caja abierta, mostrando lista vacía")
        setIngresosDia([])
      }
    } catch (error) {
      console.error("[v0] Error al cargar ingresos del día:", error)
      setIngresosDia([])
    } finally {
      setCargandoIngresos(false)
    }
  }

  useEffect(() => {
    cargarIngresosDia()

    // Recargar ingresos cada 30 segundos
    const interval = setInterval(cargarIngresosDia, 30000)

    return () => clearInterval(interval)
  }, [])

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
            Venta de Productos
          </button>
        </div>

        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setListaUsuariosModalAbierto(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <Users className="h-5 w-5" />
            Lista de Usuarios
          </button>

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
            Stock de Productos
          </button>

          <button
            onClick={() => setReporteModalAbierto(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm text-purple-600 font-medium hover:bg-purple-50 transition-colors"
          >
            <FileText className="h-5 w-5" />
            Reportes de Caja
          </button>

          <button
            onClick={() => setEgresosModalAbierto(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <FileText className="h-5 w-5" />
            Egresos
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 bg-gray-500 dark:bg-gray-600 px-4 py-3 rounded-lg shadow-sm text-white font-medium hover:bg-gray-700 dark:hover:bg-gray-500"
          >
            Volver al Inicio
          </Link>
        </div>

        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Registro de Asistencia del Día</h2>
              <button
                onClick={cargarIngresosDia}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                disabled={cargandoIngresos}
                title="Recargar ingresos"
              >
                <RefreshCw className={`h-5 w-5 ${cargandoIngresos ? "animate-spin" : ""}`} />
              </button>
            </div>

            {cargandoIngresos ? (
              <div className="flex justify-center py-8">
                <LoadingDumbbell size={32} className="text-yellow-500" />
              </div>
            ) : ingresosDia.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-500 dark:text-gray-400">Aún no han ingresado usuarios al gimnasio.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Total de ingresos hoy: {ingresosDia.length}
                </p>

                {/* Vista móvil */}
                <div className="md:hidden space-y-3">
                  {ingresosDia.map((ingreso, index) => (
                    <div
                      key={ingreso._id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                    >
<div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border flex-shrink-0 shadow-md">
                                            {ingreso.foto ? (
                                              <img
                                                src={ingreso.foto || "/placeholder.svg"}
                                                alt={ingreso.nombreApellido}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span className="text-lg font-medium text-muted-foreground">
                                                {ingreso.nombreApellido?.charAt(0).toUpperCase() || "?"}
                                              </span>
                                            )}
                                          </div>
                                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{ingreso.nombreApellido}</h3>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</span>
                                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">DNI:</span> {ingreso.dni}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Actividad:</span>{" "}
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                            {ingreso.actividad}
                          </span>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Vencimiento:</span> {formatDate(ingreso.fechaVencimiento)}
                        </p>
                        <div className="mt-2">
                          {isPaymentDue(ingreso.fechaVencimiento) ? (
                            <div className="flex items-center text-red-500 dark:text-red-400 text-sm">
                              <XCircle className="h-4 w-4 mr-1" />
                              <span>Cuota vencida</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-green-500 dark:text-green-400 text-sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span>Cuota al día</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mt-2">
                          <span className="font-medium">Hora:</span> {formatTime(ingreso.hora)}
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
                                        <th className="p-3 text-left text-gray-900 dark:text-gray-100">Imagen</th>
                                        <th className="p-3 text-left text-gray-900 dark:text-gray-100">Nombre y Apellido</th>
                                        <th className="p-3 text-left text-gray-900 dark:text-gray-100">DNI</th>
                                        <th className="p-3 text-left text-gray-900 dark:text-gray-100">Actividad</th>
                                        <th className="p-3 text-left text-gray-900 dark:text-gray-100">Vencimiento</th>
                                        <th className="p-3 text-left text-gray-900 dark:text-gray-100">Estado</th>
                                        <th className="p-3 text-left text-gray-900 dark:text-gray-100">Hora</th>
                                      </tr>
                                    </thead>
                    <tbody>
                      {ingresosDia.map((ingreso, index) => (
<tr
                                          key={ingreso._id}
                                          className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        >
                                          <td className="p-3 text-gray-900 dark:text-gray-100">{index + 1}</td>
                                          <td className="p-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border shadow-md">
                                              {ingreso.foto ? (
                                                <img
                                                  src={ingreso.foto || "/placeholder.svg"}
                                                  alt={ingreso.nombreApellido}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <span className="text-lg font-medium text-muted-foreground">
                                                  {ingreso.nombreApellido?.charAt(0).toUpperCase() || "?"}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="p-3 text-gray-900 dark:text-gray-100">{ingreso.nombreApellido}</td>
                                          <td className="p-3 text-gray-900 dark:text-gray-100">{ingreso.dni}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                              {ingreso.actividad}
                            </span>
                          </td>
                          <td className="p-3 text-gray-900 dark:text-gray-100">
                            {formatDate(ingreso.fechaVencimiento)}
                          </td>
                          <td className="p-3">
                            {isPaymentDue(ingreso.fechaVencimiento) ? (
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
                          <td className="p-3 text-gray-900 dark:text-gray-100">{formatTime(ingreso.hora)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {listaUsuariosModalAbierto && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full h-full md:h-[95vh] max-w-7xl flex flex-col overflow-hidden">
              <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Lista de Usuarios ({usuariosFiltrados.length}/{usuarios.length})
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRecargar}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                    disabled={recargando || cargando}
                    title="Recargar usuarios"
                  >
                    <RefreshCw className={`h-5 w-5 ${recargando ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => setListaUsuariosModalAbierto(false)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-3 items-start">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full p-3 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      style={{ fontSize: "16px" }}
                    />
                    {busqueda && (
                      <button
                        onClick={limpiarBusqueda}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Boton de Filtros */}
                  <div className="relative" data-filtros-dropdown>
                    <button
                      onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                      className={`flex items-center gap-2 px-4 py-3 border rounded-md transition-colors ${
                        hayFiltrosActivos
                          ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Filter className="h-5 w-5" />
                      <span className="hidden sm:inline">Filtros</span>
                      {hayFiltrosActivos && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                      )}
                      <ChevronDown className={`h-4 w-4 transition-transform ${filtrosAbiertos ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown de Filtros */}
                    {filtrosAbiertos && (
                      <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">Filtros</span>
                          {hayFiltrosActivos && (
                            <button
                              onClick={limpiarFiltros}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Limpiar todos
                            </button>
                          )}
                        </div>

                        {/* Filtro Estado de Cuota */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => {
                              setSubMenuEstadoAbierto(!subMenuEstadoAbierto)
                              setSubMenuActividadAbierto(false)
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <span className="text-gray-700 dark:text-gray-300">Estado de cuota</span>
                            <div className="flex items-center gap-2">
                              {filtroEstadoCuota !== "todos" && (
                                <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                                  {filtroEstadoCuota === "al_dia" ? "Al dia" : "Vencida"}
                                </span>
                              )}
                              <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${subMenuEstadoAbierto ? "rotate-90" : ""}`} />
                            </div>
                          </button>

                          {subMenuEstadoAbierto && (
                            <div className="px-4 pb-3 space-y-1">
                              <button
                                onClick={() => {
                                  setFiltroEstadoCuota("al_dia")
                                  setFiltroMesVencimiento(null)
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                  filtroEstadoCuota === "al_dia"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                Al dia
                              </button>
                              <div>
                                <button
                                  onClick={() => {
                                    setFiltroEstadoCuota("vencida")
                                    setFiltroMesVencimiento(null)
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                    filtroEstadoCuota === "vencida"
                                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  Vencida
                                </button>
                                {filtroEstadoCuota === "vencida" && (
                                  <div className="mt-2 ml-3 space-y-1 max-h-40 overflow-y-auto">
                                    <button
                                      onClick={() => setFiltroMesVencimiento(null)}
                                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                                        filtroMesVencimiento === null
                                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium"
                                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      Todos los vencidos
                                    </button>
                                    {mesesPasados.map((m) => (
                                      <button
                                        key={`${m.mes}-${m.anio}`}
                                        onClick={() => setFiltroMesVencimiento(`${m.mes}-${m.anio}`)}
                                        className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                                          filtroMesVencimiento === `${m.mes}-${m.anio}`
                                            ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                                        }`}
                                      >
                                        {m.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {filtroEstadoCuota !== "todos" && (
                                <button
                                  onClick={() => {
                                    setFiltroEstadoCuota("todos")
                                    setFiltroMesVencimiento(null)
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Quitar filtro de estado
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Filtro Actividad */}
                        <div>
                          <button
                            onClick={() => {
                              setSubMenuActividadAbierto(!subMenuActividadAbierto)
                              setSubMenuEstadoAbierto(false)
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <span className="text-gray-700 dark:text-gray-300">Actividad</span>
                            <div className="flex items-center gap-2">
                              {filtroActividad && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                  {filtroActividad}
                                </span>
                              )}
                              <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${subMenuActividadAbierto ? "rotate-90" : ""}`} />
                            </div>
                          </button>

                          {subMenuActividadAbierto && (
                            <div className="px-4 pb-3 space-y-1">
                              {actividadesDisponibles.map((actividad) => (
                                <button
                                  key={actividad}
                                  onClick={() => setFiltroActividad(actividad)}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                    filtroActividad === actividad
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {actividad}
                                </button>
                              ))}
                              {filtroActividad && (
                                <button
                                  onClick={() => setFiltroActividad(null)}
                                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Quitar filtro de actividad
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mostrar filtros activos */}
                {hayFiltrosActivos && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {filtroEstadoCuota !== "todos" && (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        filtroEstadoCuota === "al_dia"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }`}>
                        Estado: {filtroEstadoCuota === "al_dia" ? "Al dia" : "Vencida"}
                        {filtroMesVencimiento && ` (${mesesPasados.find(m => `${m.mes}-${m.anio}` === filtroMesVencimiento)?.label})`}
                        <button
                          onClick={() => {
                            setFiltroEstadoCuota("todos")
                            setFiltroMesVencimiento(null)
                          }}
                          className="ml-1 hover:opacity-70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {filtroActividad && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        Actividad: {filtroActividad}
                        <button
                          onClick={() => setFiltroActividad(null)}
                          className="ml-1 hover:opacity-70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                    {error}
                  </div>
                )}

                {cargando ? (
                  <div className="flex justify-center py-8">
                    <LoadingDumbbell size={32} className="text-indigo-500" />
                  </div>
                ) : (
                  <>
                    {busqueda && usuariosFiltrados.length === 0 ? (
                      <div className="text-center py-8 border rounded-md">
                        <p className="text-gray-500 dark:text-gray-400">
                          No se encontraron usuarios que coincidan con "{busqueda}"
                        </p>
                        <button
                          onClick={limpiarBusqueda}
                          className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Limpiar búsqueda
                        </button>
                      </div>
                    ) : (
                      <>
                        {isMobile && (
                          <div className="md:hidden space-y-4">
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
                          <div className="border dark:border-gray-600 rounded-md overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                  <th className="p-3 text-left text-gray-900 dark:text-gray-100">ID</th>
                                  <th className="p-3 text-left text-gray-900 dark:text-gray-100">Nombre y Apellido</th>
                                  <th className="p-3 text-left text-gray-900 dark:text-gray-100">DNI</th>
                                  <th className="p-3 text-left text-gray-900 dark:text-gray-100">Foto</th>
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
                                    <td colSpan={9} className="p-4 text-center text-gray-500 dark:text-gray-400">
                                      No hay usuarios registrados
                                    </td>
                                  </tr>
                                ) : (
                                  usuariosFiltrados.map((usuario) => (
                                    <tr
                                      key={usuario.id}
                                      className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    >
                                      <td className="p-3 text-gray-900 dark:text-gray-100">
                                        {usuario.id.substring(0, 8)}...
                                      </td>
                                      <td className="p-3 text-gray-900 dark:text-gray-100">{usuario.nombreApellido}</td>
                                      <td className="p-3 text-gray-900 dark:text-gray-100">{usuario.dni}</td>
                                      <td className="p-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border">
                                          {usuario.foto ? (
                                            <img
                                              src={usuario.foto || "/placeholder.svg"}
                                              alt={usuario.nombreApellido}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <span className="text-xs text-muted-foreground">N/A</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                                          {usuario.actividad || "Normal"}
                                        </span>
                                      </td>
                                      <td className="p-3 text-gray-900 dark:text-gray-100">
                                        {formatDate(usuario.fechaInicio)}
                                      </td>
                                      <td className="p-3 text-gray-900 dark:text-gray-100">
                                        {formatDate(usuario.fechaVencimiento)}
                                      </td>
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
                                            className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none"
                                            title="Editar usuario"
                                          >
                                            <Edit className="h-5 w-5" />
                                          </button>
                                          <button
                                            onClick={() => handleEliminar(usuario.id)}
                                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:outline-none"
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
              </div>

              <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {busqueda || hayFiltrosActivos
                    ? `Mostrando ${usuariosFiltrados.length} de ${usuarios.length} usuarios (ordenados alfabéticamente)`
                    : `Total de usuarios registrados: ${usuarios.length} (ordenados alfabéticamente)`}
                </p>
              </div>
            </div>
          </div>
        )}

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

        <EgresosModal
          isOpen={egresosModalAbierto}
          onClose={() => setEgresosModalAbierto(false)}
          onSuccess={() => {
            setAlertaInfo({
              mensaje: "Egreso registrado correctamente",
              visible: true,
              tipo: "success",
            })
          }}
        />

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
      </div>
    </main>
  )
}

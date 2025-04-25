"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { CheckCircle, XCircle, Trash2, RefreshCw, Edit, Search, X } from "lucide-react"
import EditarUsuarioModal from "@/components/editar-usuario-modal"
import UserCard from "@/components/user-card"
import { useMobile } from "@/hooks/use-mobile"
import type { Usuario } from "@/data/usuarios"
import Alert from "@/components/alert"

export default function Admin() {
  const { usuarios, cargando, error, eliminarUsuario, actualizarUsuario, recargarUsuarios } = useGymContext()
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [recargando, setRecargando] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })
  const [busqueda, setBusqueda] = useState("")
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([])
  const [usuariosOrdenados, setUsuariosOrdenados] = useState<Usuario[]>([])
  const isMobile = useMobile()

  // Ordenar usuarios alfabéticamente
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

  // Ordenar la lista completa de usuarios cuando cambia
  useEffect(() => {
    const ordenados = ordenarUsuarios(usuarios)
    setUsuariosOrdenados(ordenados)
  }, [usuarios])

  // Filtrar y ordenar usuarios cuando cambia la búsqueda o la lista ordenada
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
    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      try {
        setEliminando(id)
        await eliminarUsuario(id)
        setAlertaInfo({
          mensaje: "Usuario eliminado correctamente",
          visible: true,
          tipo: "success",
        })
      } catch (error) {
        console.error("Error al eliminar usuario:", error)
        setAlertaInfo({
          mensaje: "Error al eliminar usuario. Por favor, intenta de nuevo.",
          visible: true,
          tipo: "error",
        })
      } finally {
        setEliminando(null)
      }
    }
  }

  const handleEditar = (usuario: Usuario) => {
    setUsuarioEditando(usuario)
    setModalAbierto(true)
  }

  const handleGuardarEdicion = async (usuarioActualizado: Usuario) => {
    try {
      await actualizarUsuario(usuarioActualizado.id, usuarioActualizado)
      setAlertaInfo({
        mensaje: "Usuario actualizado correctamente",
        visible: true,
        tipo: "success",
      })
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
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
      setAlertaInfo({
        mensaje: "Datos recargados correctamente",
        visible: true,
        tipo: "success",
      })
    } catch (error) {
      console.error("Error al recargar usuarios:", error)
      setAlertaInfo({
        mensaje: "Error al recargar datos. Por favor, intenta de nuevo.",
        visible: true,
        tipo: "error",
      })
    } finally {
      setRecargando(false)
    }
  }

  const limpiarBusqueda = () => {
    setBusqueda("")
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-green-600 mb-6 md:mb-10">Administración - Dynamic Gym</h1>

      <div className="w-full max-w-6xl">
        {/* Barra de búsqueda optimizada para móviles */}
        <div className="sticky top-0 bg-white z-10 p-2 md:p-0 md:static md:bg-transparent mb-4 rounded-lg shadow-sm md:shadow-none">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontSize: "16px" }} // Evita zoom en iOS
            />
            {busqueda && (
              <button
                onClick={limpiarBusqueda}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                className="ml-2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={recargando || cargando}
                title="Recargar usuarios"
              >
                <RefreshCw className={`h-5 w-5 ${recargando ? "animate-spin" : ""}`} />
              </button>
              <Link href="/" className="md:hidden ml-2 p-2 text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="hidden md:flex">
            <Link
              href="/"
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:scale-105 transition-transform text-center"
            >
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
          <>
            {busqueda && usuariosFiltrados.length === 0 ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-gray-500">No se encontraron usuarios que coincidan con "{busqueda}"</p>
                <button onClick={limpiarBusqueda} className="mt-2 text-green-600 hover:underline">
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <>
                {/* Vista de tarjetas para móviles */}
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

                {/* Tabla para escritorio */}
                {!isMobile && (
                  <div className="border rounded-md overflow-hidden overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left">ID</th>
                          <th className="p-3 text-left">Nombre y Apellido</th>
                          <th className="p-3 text-left">DNI</th>
                          <th className="p-3 text-left">Teléfono</th>
                          <th className="p-3 text-left">Edad</th>
                          <th className="p-3 text-left">Fecha Inicio</th>
                          <th className="p-3 text-left">Vencimiento</th>
                          <th className="p-3 text-left">Estado</th>
                          <th className="p-3 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuariosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-4 text-center text-gray-500">
                              No hay usuarios registrados
                            </td>
                          </tr>
                        ) : (
                          usuariosFiltrados.map((usuario) => (
                            <tr key={usuario.id} className="border-t border-gray-200">
                              <td className="p-3">{usuario.id.substring(0, 8)}...</td>
                              <td className="p-3">{usuario.nombreApellido}</td>
                              <td className="p-3">{usuario.dni}</td>
                              <td className="p-3">{usuario.telefono || "-"}</td>
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
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditar(usuario)}
                                    className="text-blue-500 hover:text-blue-700 focus:outline-none"
                                    title="Editar usuario"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </button>
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
          <p className="text-sm text-gray-500">
            {busqueda
              ? `Mostrando ${usuariosFiltrados.length} de ${usuarios.length} usuarios (ordenados alfabéticamente)`
              : `Total de usuarios registrados: ${usuarios.length} (ordenados alfabéticamente)`}
          </p>
        </div>
      </div>

      {/* Modal de edición */}
      <EditarUsuarioModal
        usuario={usuarioEditando}
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false)
          setUsuarioEditando(null)
        }}
        onSave={handleGuardarEdicion}
      />

      {/* Alerta */}
      <Alert
        message={alertaInfo.mensaje}
        isOpen={alertaInfo.visible}
        onClose={() => setAlertaInfo((prev) => ({ ...prev, visible: false }))}
        type={alertaInfo.tipo}
      />
    </main>
  )
}

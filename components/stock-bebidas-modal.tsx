"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Package, Edit, Trash2, Plus, Search } from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"
import PinModal from "@/components/pin-modal"
import Alert from "@/components/alert"

interface Bebida {
  id: string
  nombre: string
  precio: number
  stock: number
  categoria: string
  activo: boolean
}

interface StockBebidasModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function StockBebidasModal({ isOpen, onClose }: StockBebidasModalProps) {
  const [bebidas, setBebidas] = useState<Bebida[]>([])
  const [bebidaEditando, setBebidaEditando] = useState<Bebida | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [cargandoBebidas, setCargandoBebidas] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinAction, setPinAction] = useState<{ type: "edit" | "delete" | "create"; data: any } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })

  const [formulario, setFormulario] = useState({
    nombre: "",
    precio: "",
    stock: "",
    categoria: "",
  })

  const categorias = ["Agua", "Deportiva", "Gaseosa", "Proteína", "Energética", "Jugos", "Otros"]

  // Cargar bebidas cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarBebidas()
      setBusqueda("")
      setError(null)
    }
  }, [isOpen])

  const cargarBebidas = async () => {
    try {
      setCargandoBebidas(true)
      const response = await fetch("/api/bebidas/admin")

      if (!response.ok) {
        throw new Error("Error al cargar bebidas")
      }

      const bebidasData = await response.json()
      setBebidas(bebidasData)
    } catch (error) {
      console.error("Error al cargar bebidas:", error)
      setError("Error al cargar las bebidas")
    } finally {
      setCargandoBebidas(false)
    }
  }

  const bebidasFiltradas = bebidas.filter(
    (bebida) =>
      bebida.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      bebida.categoria.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
  }

  const handleFormularioChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNuevaBebida = () => {
    setFormulario({
      nombre: "",
      precio: "",
      stock: "",
      categoria: "",
    })
    setBebidaEditando(null)
    setMostrarFormulario(true)
  }

  const handleEditarBebida = (bebida: Bebida) => {
    setFormulario({
      nombre: bebida.nombre,
      precio: bebida.precio.toString(),
      stock: bebida.stock.toString(),
      categoria: bebida.categoria,
    })
    setBebidaEditando(bebida)
    setMostrarFormulario(true)
  }

  const handleEliminarBebida = (bebida: Bebida) => {
    setPinAction({ type: "delete", data: bebida })
    setShowPinModal(true)
  }

  const handleSubmitFormulario = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!formulario.nombre.trim()) {
      setError("El nombre es requerido")
      return
    }

    const precio = Number.parseFloat(formulario.precio)
    if (isNaN(precio) || precio <= 0) {
      setError("El precio debe ser un número positivo")
      return
    }

    const stock = Number.parseInt(formulario.stock)
    if (isNaN(stock) || stock < 0) {
      setError("El stock debe ser un número mayor o igual a 0")
      return
    }

    if (!formulario.categoria) {
      setError("La categoría es requerida")
      return
    }

    // Configurar acción de PIN
    const action = bebidaEditando ? "edit" : "create"
    setPinAction({
      type: action,
      data: {
        ...formulario,
        precio,
        stock,
        bebidaId: bebidaEditando?.id,
      },
    })
    setShowPinModal(true)
  }

  const handlePinSuccess = async () => {
    if (!pinAction) return

    try {
      setGuardando(true)

      if (pinAction.type === "create") {
        // Crear nueva bebida
        const response = await fetch("/api/bebidas/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pinAction.data),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Error al crear bebida")
        }

        setBebidas((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        setAlertaInfo({
          mensaje: "Bebida creada exitosamente",
          visible: true,
          tipo: "success",
        })
      } else if (pinAction.type === "edit") {
        // Actualizar bebida existente
        const response = await fetch(`/api/bebidas/admin/${pinAction.data.bebidaId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: pinAction.data.nombre,
            precio: pinAction.data.precio,
            stock: pinAction.data.stock,
            categoria: pinAction.data.categoria,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Error al actualizar bebida")
        }

        setBebidas((prev) =>
          prev
            .map((bebida) => (bebida.id === pinAction.data.bebidaId ? data : bebida))
            .sort((a, b) => a.nombre.localeCompare(b.nombre)),
        )
        setAlertaInfo({
          mensaje: "Bebida actualizada exitosamente",
          visible: true,
          tipo: "success",
        })
      } else if (pinAction.type === "delete") {
        // Eliminar bebida
        const response = await fetch(`/api/bebidas/admin/${pinAction.data.id}`, {
          method: "DELETE",
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Error al eliminar bebida")
        }

        setBebidas((prev) =>
          prev.map((bebida) => (bebida.id === pinAction.data.id ? { ...bebida, activo: false } : bebida)),
        )
        setAlertaInfo({
          mensaje: "Bebida desactivada exitosamente",
          visible: true,
          tipo: "success",
        })
      }

      setMostrarFormulario(false)
      setBebidaEditando(null)
      setFormulario({
        nombre: "",
        precio: "",
        stock: "",
        categoria: "",
      })
    } catch (error) {
      console.error("Error en operación:", error)
      setError(error.message || "Error al procesar la operación")
    } finally {
      setGuardando(false)
      setPinAction(null)
    }
  }

  const handlePinClose = () => {
    setShowPinModal(false)
    setPinAction(null)
  }

  const handleClose = () => {
    if (!guardando) {
      setMostrarFormulario(false)
      setBebidaEditando(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Package className="h-6 w-6 mr-2 text-green-600 dark:text-green-400" />
              Gestión de Stock de Bebidas
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={guardando}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}

            {!mostrarFormulario ? (
              <>
                {/* Controles superiores */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar bebidas..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <button
                    onClick={handleNuevaBebida}
                    className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                    disabled={guardando}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nueva Bebida
                  </button>
                </div>

                {/* Lista de bebidas */}
                {cargandoBebidas ? (
                  <div className="flex justify-center py-8">
                    <LoadingDumbbell size={32} className="text-green-500" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando bebidas...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Precio
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {bebidasFiltradas.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                              {busqueda
                                ? "No se encontraron bebidas que coincidan con la búsqueda"
                                : "No hay bebidas registradas"}
                            </td>
                          </tr>
                        ) : (
                          bebidasFiltradas.map((bebida) => (
                            <tr key={bebida.id} className={!bebida.activo ? "opacity-60" : ""}>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {bebida.nombre}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                                  {bebida.categoria}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                {formatMonto(bebida.precio)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    bebida.stock === 0
                                      ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                      : bebida.stock <= 5
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                        : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                  }`}
                                >
                                  {bebida.stock} unidades
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    bebida.activo
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                      : "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300"
                                  }`}
                                >
                                  {bebida.activo ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditarBebida(bebida)}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                    disabled={guardando}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  {bebida.activo && (
                                    <button
                                      onClick={() => handleEliminarBebida(bebida)}
                                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                      disabled={guardando}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
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
            ) : (
              /* Formulario de edición/creación */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {bebidaEditando ? "Editar Bebida" : "Nueva Bebida"}
                  </h3>
                  <button
                    onClick={() => setMostrarFormulario(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={guardando}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitFormulario} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Producto
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={handleFormularioChange}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                        disabled={guardando}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoría
                      </label>
                      <select
                        name="categoria"
                        value={formulario.categoria}
                        onChange={handleFormularioChange}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                        disabled={guardando}
                      >
                        <option value="">Seleccionar categoría</option>
                        {categorias.map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Precio ($)
                      </label>
                      <input
                        type="number"
                        name="precio"
                        value={formulario.precio}
                        onChange={handleFormularioChange}
                        min="0"
                        step="0.01"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                        disabled={guardando}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Stock (unidades)
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={formulario.stock}
                        onChange={handleFormularioChange}
                        min="0"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                        disabled={guardando}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setMostrarFormulario(false)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                      disabled={guardando}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
                      disabled={guardando}
                    >
                      {guardando ? (
                        <>
                          <LoadingDumbbell size={16} className="mr-2" />
                          Guardando...
                        </>
                      ) : bebidaEditando ? (
                        "Actualizar"
                      ) : (
                        "Crear"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de PIN */}
      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        title={
          pinAction?.type === "create"
            ? "Crear Nueva Bebida"
            : pinAction?.type === "edit"
              ? "Actualizar Bebida"
              : "Eliminar Bebida"
        }
        description={
          pinAction?.type === "create"
            ? `Esta acción creará una nueva bebida "${pinAction?.data?.nombre}". Ingrese el PIN de seguridad para continuar.`
            : pinAction?.type === "edit"
              ? `Esta acción actualizará la bebida "${pinAction?.data?.nombre}". Ingrese el PIN de seguridad para continuar.`
              : `Esta acción desactivará la bebida "${pinAction?.data?.nombre}". Ingrese el PIN de seguridad para continuar.`
        }
      />

      {/* Alerta */}
      <Alert
        message={alertaInfo.mensaje}
        isOpen={alertaInfo.visible}
        onClose={() => setAlertaInfo((prev) => ({ ...prev, visible: false }))}
        type={alertaInfo.tipo}
      />
    </>
  )
}

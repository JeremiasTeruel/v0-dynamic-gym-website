"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type { Usuario } from "@/data/usuarios"

// Definir la interfaz para un registro de pago
export interface RegistroPago {
  id?: string
  userNombre: string
  userDni: string
  monto: number
  fecha: string
  metodoPago: string
}

interface GymContextType {
  usuarios: Usuario[]
  cargando: boolean
  error: string | null
  pagos: RegistroPago[]
  cargandoPagos: boolean
  buscarUsuario: (dni: string) => Promise<Usuario | null>
  agregarNuevoUsuario: (usuario: Omit<Usuario, "id">, montoPago: number) => Promise<void>
  actualizarPago: (dni: string, nuevaFechaVencimiento: string, metodoPago: string, montoPago: number) => Promise<void>
  actualizarUsuario: (id: string, datosActualizados: Partial<Usuario>) => Promise<void>
  eliminarUsuario: (id: string) => Promise<void>
  recargarUsuarios: () => Promise<void>
  registrarPago: (pago: Omit<RegistroPago, "id">) => Promise<void>
  obtenerPagosPorFecha: (fecha: string) => Promise<RegistroPago[]>
  obtenerPagosPorRango: (inicio: string, fin: string) => Promise<RegistroPago[]>
  recargarPagos: () => Promise<void>
  obtenerUsuariosPorMes: (year?: string) => Promise<any[]>
}

const GymContext = createContext<GymContextType | null>(null)

// Función para ordenar usuarios alfabéticamente
const ordenarUsuariosAlfabeticamente = (usuarios: Usuario[]): Usuario[] => {
  return [...usuarios].sort((a, b) => {
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

export function GymProvider({ children }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [pagos, setPagos] = useState<RegistroPago[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const [cargandoPagos, setCargandoPagos] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Función para cargar todos los usuarios
  const cargarUsuarios = async () => {
    try {
      setCargando(true)
      setError(null)

      console.log("Intentando cargar usuarios...")

      const response = await fetch("/api/usuarios")

      console.log("Respuesta recibida:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error en la respuesta:", errorData)
        throw new Error(errorData.error || `Error al cargar usuarios: ${response.status} ${response.statusText}`)
      }

      const usuariosDB = await response.json()
      console.log("Usuarios cargados:", usuariosDB.length)

      // Ordenar usuarios alfabéticamente antes de guardarlos en el estado
      const usuariosOrdenados = ordenarUsuariosAlfabeticamente(usuariosDB)
      setUsuarios(usuariosOrdenados)
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
      setError(`Error al cargar usuarios: ${err.message}. Por favor, intenta de nuevo.`)
    } finally {
      setCargando(false)
    }
  }

  // Función para cargar todos los pagos
  const cargarPagos = async () => {
    try {
      setCargandoPagos(true)
      setError(null)

      console.log("Intentando cargar pagos...")

      const response = await fetch("/api/pagos")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error en la respuesta:", errorData)
        throw new Error(errorData.error || `Error al cargar pagos: ${response.status} ${response.statusText}`)
      }

      const pagosDB = await response.json()
      console.log("Pagos cargados:", pagosDB.length)

      setPagos(pagosDB)
    } catch (err) {
      console.error("Error al cargar pagos:", err)
      setError(`Error al cargar pagos: ${err.message}. Por favor, intenta de nuevo.`)
    } finally {
      setCargandoPagos(false)
    }
  }

  // Cargar usuarios y pagos al iniciar
  useEffect(() => {
    cargarUsuarios()
    cargarPagos()
  }, [])

  // Función para buscar un usuario por DNI
  const buscarUsuario = async (dni: string): Promise<Usuario | null> => {
    try {
      const response = await fetch(`/api/usuarios/${dni}`)
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al buscar usuario")
      }

      return await response.json()
    } catch (err) {
      console.error("Error al buscar usuario:", err)
      setError("Error al buscar usuario. Por favor, intenta de nuevo.")
      return null
    }
  }

  // Función para registrar un pago en la base de datos
  const registrarPago = async (pago: Omit<RegistroPago, "id">): Promise<void> => {
    try {
      setError(null)

      console.log("Enviando solicitud para registrar pago:", pago)

      const response = await fetch("/api/pagos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pago),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error en la respuesta del servidor:", data)
        throw new Error(data.error || "Error al registrar pago")
      }

      console.log("Pago registrado exitosamente:", data)

      // Actualizar la lista de pagos
      setPagos((prevPagos) => [...prevPagos, data])
    } catch (err) {
      console.error("Error al registrar pago:", err)
      setError(err.message || "Error al registrar pago. Por favor, intenta de nuevo.")
      throw err
    }
  }

  // Función para agregar un nuevo usuario con registro de pago
  const agregarNuevoUsuario = async (usuario: Omit<Usuario, "id">, montoPago: number): Promise<void> => {
    try {
      setError(null)

      console.log("Enviando solicitud para agregar usuario:", usuario)

      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuario),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error en la respuesta del servidor:", data)
        throw new Error(data.error || "Error al agregar usuario")
      }

      console.log("Usuario agregado exitosamente:", data)

      // Agregar el nuevo usuario y reordenar la lista
      const nuevosUsuarios = ordenarUsuariosAlfabeticamente([...usuarios, data])
      setUsuarios(nuevosUsuarios)

      // Registrar el pago en la base de datos
      const fechaActual = new Date().toISOString().split("T")[0]
      await registrarPago({
        userNombre: data.nombreApellido,
        userDni: data.dni,
        monto: montoPago,
        fecha: fechaActual,
        metodoPago: usuario.metodoPago,
      })
    } catch (err) {
      console.error("Error al agregar usuario:", err)
      setError(err.message || "Error al agregar usuario. Por favor, intenta de nuevo.")
      throw err
    }
  }

  // Función para actualizar el pago de un usuario
  const actualizarPago = async (
    dni: string,
    nuevaFechaVencimiento: string,
    metodoPago: string,
    montoPago: number,
  ): Promise<void> => {
    try {
      setError(null)

      const response = await fetch(`/api/usuarios/${dni}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fechaVencimiento: nuevaFechaVencimiento, metodoPago }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error en la respuesta del servidor:", data)
        throw new Error(data.error || "Error al actualizar pago")
      }

      // Actualizar el usuario y reordenar la lista
      const nuevosUsuarios = usuarios.map((u) => (u.dni === dni ? data : u))
      setUsuarios(ordenarUsuariosAlfabeticamente(nuevosUsuarios))

      // Registrar el pago en la base de datos
      const fechaActual = new Date().toISOString().split("T")[0]
      const usuarioActualizado = nuevosUsuarios.find((u) => u.dni === dni)

      if (usuarioActualizado) {
        await registrarPago({
          userNombre: usuarioActualizado.nombreApellido,
          userDni: usuarioActualizado.dni,
          monto: montoPago,
          fecha: fechaActual,
          metodoPago: metodoPago,
        })
      }
    } catch (err) {
      console.error("Error al actualizar pago:", err)
      setError("Error al actualizar pago. Por favor, intenta de nuevo.")
      throw err
    }
  }

  // Función para actualizar un usuario
  const actualizarUsuario = async (id: string, datosActualizados: Partial<Usuario>): Promise<void> => {
    try {
      setError(null)

      console.log("Enviando solicitud para actualizar usuario:", id, datosActualizados)

      const response = await fetch(`/api/usuarios/actualizar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosActualizados),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error en la respuesta del servidor:", data)
        throw new Error(data.error || "Error al actualizar usuario")
      }

      console.log("Usuario actualizado exitosamente:", data)

      // Actualizar el usuario y reordenar la lista
      const nuevosUsuarios = usuarios.map((u) => (u.id === id ? data : u))
      setUsuarios(ordenarUsuariosAlfabeticamente(nuevosUsuarios))
    } catch (err) {
      console.error("Error al actualizar usuario:", err)
      setError(err.message || "Error al actualizar usuario. Por favor, intenta de nuevo.")
      throw err
    }
  }

  // Función para eliminar un usuario
  const eliminarUsuario = async (id: string): Promise<void> => {
    try {
      setError(null)

      const response = await fetch(`/api/usuarios/eliminar/${id}`, {
        method: "DELETE",
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error("Error en la respuesta del servidor:", data)
        throw new Error(data.error || "Error al eliminar usuario")
      }

      // Eliminar el usuario (no es necesario reordenar ya que solo se elimina)
      setUsuarios((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      console.error("Error al eliminar usuario:", err)
      setError("Error al eliminar usuario. Por favor, intenta de nuevo.")
      throw err
    }
  }

  // Función para recargar usuarios
  const recargarUsuarios = async (): Promise<void> => {
    await cargarUsuarios()
  }

  // Función para recargar pagos
  const recargarPagos = async (): Promise<void> => {
    await cargarPagos()
  }

  // Función para obtener los pagos de un día específico
  const obtenerPagosPorFecha = async (fecha: string): Promise<RegistroPago[]> => {
    try {
      const response = await fetch(`/api/pagos/fecha/${fecha}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al obtener pagos por fecha")
      }

      return await response.json()
    } catch (err) {
      console.error(`Error al obtener pagos para la fecha ${fecha}:`, err)
      setError(`Error al obtener pagos. Por favor, intenta de nuevo.`)
      return []
    }
  }

  // Función para obtener los pagos por rango de fechas
  const obtenerPagosPorRango = async (inicio: string, fin: string): Promise<RegistroPago[]> => {
    try {
      const response = await fetch(`/api/pagos/rango?inicio=${inicio}&fin=${fin}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al obtener pagos por rango de fechas")
      }

      return await response.json()
    } catch (err) {
      console.error(`Error al obtener pagos entre ${inicio} y ${fin}:`, err)
      setError(`Error al obtener pagos. Por favor, intenta de nuevo.`)
      return []
    }
  }

  // Función para obtener usuarios registrados por mes
  const obtenerUsuariosPorMes = async (year?: string): Promise<any[]> => {
    try {
      const yearParam = year ? `?year=${year}` : ""
      const response = await fetch(`/api/usuarios/por-mes${yearParam}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al obtener usuarios por mes")
      }

      return await response.json()
    } catch (err) {
      console.error(`Error al obtener usuarios por mes:`, err)
      setError(`Error al obtener datos de usuarios. Por favor, intenta de nuevo.`)
      return []
    }
  }

  return (
    <GymContext.Provider
      value={{
        usuarios,
        cargando,
        error,
        pagos,
        cargandoPagos,
        buscarUsuario,
        agregarNuevoUsuario,
        actualizarPago,
        actualizarUsuario,
        eliminarUsuario,
        recargarUsuarios,
        registrarPago,
        obtenerPagosPorFecha,
        obtenerPagosPorRango,
        recargarPagos,
        obtenerUsuariosPorMes,
      }}
    >
      {children}
    </GymContext.Provider>
  )
}

export function useGymContext() {
  const context = useContext(GymContext)
  if (!context) {
    throw new Error("useGymContext debe ser usado dentro de un GymProvider")
  }
  return context
}

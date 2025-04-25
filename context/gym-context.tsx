"use client"

import { createContext, useContext, useState, useEffect } from "react"
// Importar el modelo de pago
import type { Usuario } from "@/data/usuarios"
import type { Payment } from "@/models/payment"

// Añadir los pagos al estado y funciones relacionadas a la interfaz
interface GymContextType {
  usuarios: Usuario[]
  cargando: boolean
  error: string | null
  buscarUsuario: (dni: string) => Promise<Usuario | null>
  agregarNuevoUsuario: (usuario: Omit<Usuario, "id">) => Promise<void>
  actualizarPago: (dni: string, nuevaFechaVencimiento: string, metodoPago: string, monto: number) => Promise<void>
  actualizarUsuario: (id: string, datosActualizados: Partial<Usuario>) => Promise<void>
  eliminarUsuario: (id: string) => Promise<void>
  recargarUsuarios: () => Promise<void>
  pagos: Payment[]
  cargandoPagos: boolean
  recargarPagos: () => Promise<void>
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

// Agregar el estado de pagos al provider
export function GymProvider({ children }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [pagos, setPagos] = useState<Payment[]>([])
  const [cargandoPagos, setCargandoPagos] = useState<boolean>(true)

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

  // Función para agregar un nuevo usuario
  const agregarNuevoUsuario = async (usuario: Omit<Usuario, "id">): Promise<void> => {
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
    } catch (err) {
      console.error("Error al agregar usuario:", err)
      setError(err.message || "Error al agregar usuario. Por favor, intenta de nuevo.")
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

  // Función para cargar pagos
  const cargarPagos = async () => {
    try {
      setCargandoPagos(true)

      const response = await fetch("/api/payments")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error al cargar pagos: ${response.status} ${response.statusText}`)
      }

      const pagosDB = await response.json()
      setPagos(pagosDB)
    } catch (err) {
      console.error("Error al cargar pagos:", err)
      setError(`Error al cargar pagos: ${err.message}. Por favor, intenta de nuevo.`)
    } finally {
      setCargandoPagos(false)
    }
  }

  // Cargar pagos al iniciar
  useEffect(() => {
    cargarPagos()
  }, [])

  // Actualizar la función actualizarPago para incluir el registro del pago
  const actualizarPago = async (
    dni: string,
    nuevaFechaVencimiento: string,
    metodoPago: string,
    monto: number,
  ): Promise<void> => {
    try {
      setError(null)

      // 1. Actualizar la fecha de vencimiento del usuario
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

      // Actualizar el usuario local
      const nuevosUsuarios = usuarios.map((u) => (u.dni === dni ? data : u))
      setUsuarios(ordenarUsuariosAlfabeticamente(nuevosUsuarios))

      // 2. Registrar el pago
      const usuario = usuarios.find((u) => u.dni === dni)
      if (!usuario) {
        throw new Error("Usuario no encontrado")
      }

      const pagoResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: usuario.id,
          userName: usuario.nombreApellido,
          date: new Date().toISOString(),
          amount: monto,
          paymentMethod: metodoPago,
        }),
      })

      if (!pagoResponse.ok) {
        const errorData = await pagoResponse.json().catch(() => ({}))
        console.error("Error al registrar pago:", errorData)
        // No lanzamos error para que el pago del usuario se actualice incluso si falla el registro
      } else {
        // Actualizar la lista de pagos localmente
        const nuevoPago = await pagoResponse.json()
        setPagos((pagosAnteriores) => [nuevoPago, ...pagosAnteriores])
      }
    } catch (err) {
      console.error("Error al actualizar pago:", err)
      setError("Error al actualizar pago. Por favor, intenta de nuevo.")
      throw err
    }
  }

  // Función para recargar pagos
  const recargarPagos = async (): Promise<void> => {
    await cargarPagos()
  }

  return (
    <GymContext.Provider
      value={{
        usuarios,
        cargando,
        error,
        buscarUsuario,
        agregarNuevoUsuario,
        actualizarPago,
        actualizarUsuario,
        eliminarUsuario,
        recargarUsuarios,
        pagos,
        cargandoPagos,
        recargarPagos,
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

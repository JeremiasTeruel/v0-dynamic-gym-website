"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type { Usuario } from "@/data/usuarios"

interface GymContextType {
  usuarios: Usuario[]
  cargando: boolean
  error: string | null
  buscarUsuario: (dni: string) => Promise<Usuario | null>
  agregarNuevoUsuario: (usuario: Omit<Usuario, "id">) => Promise<void>
  actualizarPago: (dni: string, nuevaFechaVencimiento: string, metodoPago: string) => Promise<void>
  eliminarUsuario: (id: string) => Promise<void>
  recargarUsuarios: () => Promise<void>
}

const GymContext = createContext<GymContextType | null>(null)

export function GymProvider({ children }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
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
      setUsuarios(usuariosDB)
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
      setError(`Error al cargar usuarios: ${err.message}. Por favor, intenta de nuevo.`)
    } finally {
      setCargando(false)
    }
  }

  // Cargar usuarios al iniciar
  useEffect(() => {
    cargarUsuarios()
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
      setUsuarios((prev) => [...prev, data])
    } catch (err) {
      console.error("Error al agregar usuario:", err)
      setError(err.message || "Error al agregar usuario. Por favor, intenta de nuevo.")
      throw err
    }
  }

  // Función para actualizar el pago de un usuario
  const actualizarPago = async (dni: string, nuevaFechaVencimiento: string, metodoPago: string): Promise<void> => {
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

      setUsuarios((prev) => prev.map((u) => (u.dni === dni ? data : u)))
    } catch (err) {
      console.error("Error al actualizar pago:", err)
      setError("Error al actualizar pago. Por favor, intenta de nuevo.")
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

  return (
    <GymContext.Provider
      value={{
        usuarios,
        cargando,
        error,
        buscarUsuario,
        agregarNuevoUsuario,
        actualizarPago,
        eliminarUsuario,
        recargarUsuarios,
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

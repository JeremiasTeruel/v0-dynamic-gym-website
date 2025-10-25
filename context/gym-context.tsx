"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Usuario } from "@/data/usuarios"

export interface RegistroPago {
  id: string
  userNombre: string
  userDni: string
  monto: number
  fecha: string
  metodoPago: string
  montoEfectivo?: number
  montoMercadoPago?: number
}

interface GymContextType {
  usuarios: Usuario[]
  pagos: RegistroPago[]
  cargando: boolean
  cargandoPagos: boolean
  error: string | null
  buscarUsuario: (dni: string) => Promise<Usuario | undefined>
  agregarUsuario: (usuario: Omit<Usuario, "id">) => Promise<void>
  actualizarUsuario: (id: string, usuario: Partial<Usuario>) => Promise<void>
  eliminarUsuario: (id: string) => Promise<void>
  registrarPago: (pago: Omit<RegistroPago, "id">) => Promise<void>
  obtenerPagosPorFecha: (fecha: string) => Promise<RegistroPago[]>
  obtenerPagosPorRango: (inicio: string, fin: string) => Promise<RegistroPago[]>
  recargarUsuarios: () => Promise<void>
}

const GymContext = createContext<GymContextType | undefined>(undefined)

export function GymProvider({ children }: { children: React.ReactNode }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [pagos, setPagos] = useState<RegistroPago[]>([])
  const [cargando, setCargando] = useState(true)
  const [cargandoPagos, setCargandoPagos] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar usuarios desde la API
  const cargarUsuarios = useCallback(async () => {
    try {
      setCargando(true)
      setError(null)

      const response = await fetch("/api/usuarios")

      if (!response.ok) {
        throw new Error(`Error al cargar usuarios: ${response.status}`)
      }

      const data = await response.json()
      setUsuarios(data)
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      setError(error instanceof Error ? error.message : "Error al cargar usuarios")
      setUsuarios([])
    } finally {
      setCargando(false)
    }
  }, [])

  // Cargar pagos desde la API
  const cargarPagos = useCallback(async () => {
    try {
      setCargandoPagos(true)

      const response = await fetch("/api/pagos")

      if (!response.ok) {
        throw new Error(`Error al cargar pagos: ${response.status}`)
      }

      const data = await response.json()
      setPagos(data)
    } catch (error) {
      console.error("Error al cargar pagos:", error)
      setPagos([])
    } finally {
      setCargandoPagos(false)
    }
  }, [])

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarUsuarios()
    cargarPagos()
  }, [cargarUsuarios, cargarPagos])

  const buscarUsuario = async (dni: string): Promise<Usuario | undefined> => {
    try {
      const response = await fetch(`/api/usuarios/${dni}`)

      if (!response.ok) {
        if (response.status === 404) {
          return undefined
        }
        throw new Error(`Error al buscar usuario: ${response.status}`)
      }

      const usuario = await response.json()
      return usuario
    } catch (error) {
      console.error("Error al buscar usuario:", error)
      return undefined
    }
  }

  const agregarUsuario = async (usuario: Omit<Usuario, "id">): Promise<void> => {
    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuario),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al agregar usuario")
      }

      const nuevoUsuario = await response.json()
      setUsuarios((prev) => [...prev, nuevoUsuario])
    } catch (error) {
      console.error("Error al agregar usuario:", error)
      throw error
    }
  }

  const actualizarUsuario = async (id: string, usuarioActualizado: Partial<Usuario>): Promise<void> => {
    try {
      const response = await fetch(`/api/usuarios/actualizar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuarioActualizado),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar usuario")
      }

      const usuarioNuevo = await response.json()
      setUsuarios((prev) => prev.map((u) => (u.id === id ? usuarioNuevo : u)))
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      throw error
    }
  }

  const eliminarUsuario = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/usuarios/eliminar/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar usuario")
      }

      setUsuarios((prev) => prev.filter((u) => u.id !== id))
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      throw error
    }
  }

  const registrarPago = async (pago: Omit<RegistroPago, "id">): Promise<void> => {
    try {
      const response = await fetch("/api/pagos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pago),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al registrar pago")
      }

      const nuevoPago = await response.json()
      setPagos((prev) => [...prev, nuevoPago])
    } catch (error) {
      console.error("Error al registrar pago:", error)
      throw error
    }
  }

  const obtenerPagosPorFecha = async (fecha: string): Promise<RegistroPago[]> => {
    try {
      const response = await fetch(`/api/pagos/fecha/${fecha}`)

      if (!response.ok) {
        throw new Error(`Error al obtener pagos: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error al obtener pagos por fecha:", error)
      return []
    }
  }

  const obtenerPagosPorRango = async (inicio: string, fin: string): Promise<RegistroPago[]> => {
    try {
      const response = await fetch(`/api/pagos/rango?inicio=${inicio}&fin=${fin}`)

      if (!response.ok) {
        throw new Error(`Error al obtener pagos: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error al obtener pagos por rango:", error)
      return []
    }
  }

  const recargarUsuarios = async (): Promise<void> => {
    await cargarUsuarios()
  }

  return (
    <GymContext.Provider
      value={{
        usuarios,
        pagos,
        cargando,
        cargandoPagos,
        error,
        buscarUsuario,
        agregarUsuario,
        actualizarUsuario,
        eliminarUsuario,
        registrarPago,
        obtenerPagosPorFecha,
        obtenerPagosPorRango,
        recargarUsuarios,
      }}
    >
      {children}
    </GymContext.Provider>
  )
}

export function useGymContext() {
  const context = useContext(GymContext)
  if (context === undefined) {
    throw new Error("useGymContext must be used within a GymProvider")
  }
  return context
}

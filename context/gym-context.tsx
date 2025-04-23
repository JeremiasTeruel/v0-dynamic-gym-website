"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { type Usuario, usuariosIniciales } from "@/data/usuarios"
import {
  obtenerTodosUsuarios,
  buscarUsuarioPorDni,
  agregarUsuario as dbAgregarUsuario,
  actualizarPagoUsuario as dbActualizarPagoUsuario,
  inicializarBaseDeDatos,
  eliminarUsuario as dbEliminarUsuario,
} from "@/services/usuario-service"

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

      // Inicializar la base de datos si está vacía
      await inicializarBaseDeDatos(usuariosIniciales)

      // Obtener todos los usuarios
      const usuariosDB = await obtenerTodosUsuarios()
      setUsuarios(usuariosDB)
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
      setError("Error al cargar usuarios. Por favor, intenta de nuevo.")
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
      return await buscarUsuarioPorDni(dni)
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
      const nuevoUsuario = await dbAgregarUsuario(usuario)
      if (nuevoUsuario) {
        setUsuarios((prev) => [...prev, nuevoUsuario])
      }
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
      const usuarioActualizado = await dbActualizarPagoUsuario(dni, nuevaFechaVencimiento, metodoPago)

      if (usuarioActualizado) {
        setUsuarios((prev) => prev.map((u) => (u.dni === dni ? usuarioActualizado : u)))
      }
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
      const eliminado = await dbEliminarUsuario(id)

      if (eliminado) {
        setUsuarios((prev) => prev.filter((u) => u.id !== id))
      }
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

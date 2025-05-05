"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type { Usuario } from "@/data/usuarios"

// Definir la interfaz para un registro de pago
export interface RegistroPago {
  id: string
  usuarioId: string
  nombreUsuario: string
  dni: string
  monto: number
  metodoPago: string
  fecha: string
  tipo: "nuevo" | "renovacion" // Para distinguir entre nuevos usuarios y renovaciones
}

interface GymContextType {
  usuarios: Usuario[]
  cargando: boolean
  error: string | null
  registrosPagos: RegistroPago[]
  buscarUsuario: (dni: string) => Promise<Usuario | null>
  agregarNuevoUsuario: (usuario: Omit<Usuario, "id">, montoPago: number) => Promise<void>
  actualizarPago: (dni: string, nuevaFechaVencimiento: string, metodoPago: string, montoPago: number) => Promise<void>
  actualizarUsuario: (id: string, datosActualizados: Partial<Usuario>) => Promise<void>
  eliminarUsuario: (id: string) => Promise<void>
  recargarUsuarios: () => Promise<void>
  obtenerPagosDia: (fecha: string) => RegistroPago[]
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

// Función para generar un ID único
const generarId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export function GymProvider({ children }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [registrosPagos, setRegistrosPagos] = useState<RegistroPago[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar registros de pagos desde localStorage al iniciar
  useEffect(() => {
    const registrosGuardados = localStorage.getItem("gymRegistrosPagos")
    if (registrosGuardados) {
      try {
        setRegistrosPagos(JSON.parse(registrosGuardados))
      } catch (error) {
        console.error("Error al cargar registros de pagos:", error)
      }
    }
  }, [])

  // Guardar registros de pagos en localStorage cuando cambian
  useEffect(() => {
    if (registrosPagos.length > 0) {
      localStorage.setItem("gymRegistrosPagos", JSON.stringify(registrosPagos))
    }
  }, [registrosPagos])

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

      // Registrar el pago
      const fechaActual = new Date().toISOString().split("T")[0]
      const nuevoPago: RegistroPago = {
        id: generarId(),
        usuarioId: data.id,
        nombreUsuario: data.nombreApellido,
        dni: data.dni,
        monto: montoPago,
        metodoPago: usuario.metodoPago,
        fecha: fechaActual,
        tipo: "nuevo",
      }

      setRegistrosPagos((prevRegistros) => [...prevRegistros, nuevoPago])
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

      // Registrar el pago
      const fechaActual = new Date().toISOString().split("T")[0]
      const usuarioActualizado = nuevosUsuarios.find((u) => u.dni === dni)

      if (usuarioActualizado) {
        const nuevoPago: RegistroPago = {
          id: generarId(),
          usuarioId: usuarioActualizado.id,
          nombreUsuario: usuarioActualizado.nombreApellido,
          dni: usuarioActualizado.dni,
          monto: montoPago,
          metodoPago: metodoPago,
          fecha: fechaActual,
          tipo: "renovacion",
        }

        setRegistrosPagos((prevRegistros) => [...prevRegistros, nuevoPago])
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

  // Función para obtener los pagos de un día específico
  const obtenerPagosDia = (fecha: string): RegistroPago[] => {
    return registrosPagos.filter((pago) => pago.fecha === fecha)
  }

  return (
    <GymContext.Provider
      value={{
        usuarios,
        cargando,
        error,
        registrosPagos,
        buscarUsuario,
        agregarNuevoUsuario,
        actualizarPago,
        actualizarUsuario,
        eliminarUsuario,
        recargarUsuarios,
        obtenerPagosDia,
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

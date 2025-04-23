"use client"

import { createContext, useContext, useState } from "react"
import {
  type Usuario,
  cargarUsuarios,
  buscarUsuarioPorDni,
  agregarUsuario,
  actualizarPagoUsuario,
} from "@/data/usuarios"

interface GymContextType {
  usuarios: Usuario[]
  buscarUsuario: (dni: string) => Usuario | undefined
  agregarNuevoUsuario: (usuario: Omit<Usuario, "id">) => void
  actualizarPago: (dni: string, nuevaFechaVencimiento: string, metodoPago: string) => void
}

const GymContext = createContext<GymContextType | null>(null)

export function GymProvider({ children }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => cargarUsuarios())

  // Función para buscar un usuario por DNI
  const buscarUsuario = (dni: string): Usuario | undefined => {
    return buscarUsuarioPorDni(usuarios, dni)
  }

  // Función para agregar un nuevo usuario
  const agregarNuevoUsuario = (usuario: Omit<Usuario, "id">): void => {
    try {
      const nuevosUsuarios = agregarUsuario(usuarios, usuario)
      setUsuarios(nuevosUsuarios)
      console.log("Usuario agregado correctamente:", usuario)
    } catch (error) {
      console.error("Error al agregar usuario:", error.message)
      alert(error.message)
    }
  }

  // Función para actualizar el pago de un usuario
  const actualizarPago = (dni: string, nuevaFechaVencimiento: string, metodoPago: string): void => {
    const nuevosUsuarios = actualizarPagoUsuario(usuarios, dni, nuevaFechaVencimiento, metodoPago)
    setUsuarios(nuevosUsuarios)
    console.log("Pago actualizado para usuario con DNI:", dni)
  }

  return (
    <GymContext.Provider
      value={{
        usuarios,
        buscarUsuario,
        agregarNuevoUsuario,
        actualizarPago,
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

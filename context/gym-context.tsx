"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Datos iniciales de ejemplo
const initialUsers = [
  {
    nombreApellido: "Juan Pérez",
    dni: "12345678",
    edad: "25",
    fechaInicio: "2023-01-15",
    fechaVencimiento: "2023-02-15",
    metodoPago: "Efectivo",
  },
  {
    nombreApellido: "María López",
    dni: "87654321",
    edad: "30",
    fechaInicio: "2023-03-10",
    fechaVencimiento: "2023-04-10",
    metodoPago: "Mercado Pago",
  },
]

// Definir la estructura del objeto usuarios
interface Usuario {
  nombreApellido: string
  dni: string
  edad: string
  fechaInicio: string
  fechaVencimiento: string
  metodoPago: string
}

interface GymContextType {
  users: Usuario[]
  addUser: (user: Usuario) => void
  updatePayment: (dni: string, newDueDate: string, paymentMethod: string) => void
}

const GymContext = createContext<GymContextType | null>(null)

export function GymProvider({ children }) {
  // Inicializar el estado con los usuarios guardados en localStorage o los iniciales
  const [users, setUsers] = useState<Usuario[]>(() => {
    // Intentar cargar usuarios desde localStorage al iniciar
    if (typeof window !== "undefined") {
      const savedUsers = localStorage.getItem("gymUsers")
      return savedUsers ? JSON.parse(savedUsers) : initialUsers
    }
    return initialUsers
  })

  // Guardar usuarios en localStorage cuando cambian
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gymUsers", JSON.stringify(users))
      console.log("Usuarios guardados en localStorage:", users)
    }
  }, [users])

  // Función para agregar un nuevo usuario
  const addUser = (newUser: Usuario) => {
    setUsers((prevUsers) => {
      // Verificar si el usuario ya existe (por DNI)
      const userExists = prevUsers.some((user) => user.dni === newUser.dni)

      if (userExists) {
        alert("Ya existe un usuario con ese DNI")
        return prevUsers
      }

      // Agregar el nuevo usuario al array
      const updatedUsers = [...prevUsers, newUser]

      // Guardar inmediatamente en localStorage para mayor seguridad
      if (typeof window !== "undefined") {
        localStorage.setItem("gymUsers", JSON.stringify(updatedUsers))
        console.log("Nuevo usuario agregado:", newUser)
        console.log("Total de usuarios:", updatedUsers.length)
      }

      return updatedUsers
    })
  }

  // Función para actualizar el pago de un usuario
  const updatePayment = (dni: string, newDueDate: string, paymentMethod: string) => {
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((user) =>
        user.dni === dni ? { ...user, fechaVencimiento: newDueDate, metodoPago: paymentMethod } : user,
      )

      // Guardar inmediatamente en localStorage para mayor seguridad
      if (typeof window !== "undefined") {
        localStorage.setItem("gymUsers", JSON.stringify(updatedUsers))
        console.log("Pago actualizado para usuario con DNI:", dni)
      }

      return updatedUsers
    })
  }

  return <GymContext.Provider value={{ users, addUser, updatePayment }}>{children}</GymContext.Provider>
}

export function useGymContext() {
  const context = useContext(GymContext)
  if (!context) {
    throw new Error("useGymContext debe ser usado dentro de un GymProvider")
  }
  return context
}

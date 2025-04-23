"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useGymContext } from "@/context/gym-context"
import { CheckCircle, XCircle } from "lucide-react"
import Alert from "@/components/alert"

export default function Home() {
  const [searchDni, setSearchDni] = useState("")
  const [foundUser, setFoundUser] = useState(null)
  const [showAlert, setShowAlert] = useState(false)
  const { users } = useGymContext()
  const router = useRouter()

  const handleSearch = () => {
    if (!searchDni.trim()) return

    // Buscar por DNI exacto
    const user = users.find((user) => user.dni === searchDni.trim())

    if (user) {
      setFoundUser(user)

      // Configurar un temporizador para limpiar la pantalla después de 5 segundos
      setTimeout(() => {
        setFoundUser(null)
        setSearchDni("")
      }, 5000)
    } else {
      setFoundUser(null)
      setShowAlert(true)
    }
  }

  const isPaymentDue = (dueDate) => {
    const today = new Date()
    const paymentDate = new Date(dueDate)
    return today > paymentDate
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  useEffect(() => {
    if (searchDni === "") {
      setFoundUser(null)
    }
  }, [searchDni])

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold text-green-600 mb-10">Dynamic Gym</h1>

      <div className="w-full max-w-md">
        <div className="flex mb-6">
          <input
            type="text"
            placeholder="Ingrese el DNI del usuario"
            value={searchDni}
            onChange={(e) => setSearchDni(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleSearch}
            className="bg-gray-500 text-white px-4 py-2 rounded-r-md hover:scale-105 transition-transform"
          >
            Buscar
          </button>
        </div>

        {foundUser && (
          <div className="border border-gray-200 rounded-md p-4 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{foundUser.nombreApellido}</h2>
            <p className="mb-1">
              <span className="font-medium">DNI:</span> {foundUser.dni}
            </p>
            <p className="mb-1">
              <span className="font-medium">Edad:</span> {foundUser.edad} años
            </p>
            <div className="flex items-center mt-3">
              <span className="font-medium mr-2">Estado de cuota:</span>
              {isPaymentDue(foundUser.fechaVencimiento) ? (
                <div className="flex items-center text-red-500">
                  <XCircle className="h-5 w-5 mr-1" />
                  <span>Vencida el {formatDate(foundUser.fechaVencimiento)}</span>
                </div>
              ) : (
                <div className="flex items-center text-green-500">
                  <CheckCircle className="h-5 w-5 mr-1" />
                  <span>Al día hasta {formatDate(foundUser.fechaVencimiento)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <Link href="/nuevo-usuario" className="text-green-600 hover:underline text-center">
            ¿Nuevo en el gimnasio?
          </Link>

          <Link href="/pagar-cuota" className="text-green-600 hover:underline text-center">
            Pagar cuota mensual
          </Link>
        </div>
      </div>

      <Alert
        message="Usuario no encontrado."
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        autoRedirect={true}
      />
    </main>
  )
}

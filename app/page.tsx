"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useGymContext } from "@/context/gym-context"
import { CheckCircle, XCircle, Settings } from "lucide-react"
import Alert from "@/components/alert"

export default function Home() {
  const [searchDni, setSearchDni] = useState("")
  const [foundUser, setFoundUser] = useState(null)
  const [showAlert, setShowAlert] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const { buscarUsuario, cargando } = useGymContext()
  const router = useRouter()

  const handleSearch = async () => {
    if (!searchDni.trim() || isSearching) return

    setIsSearching(true)

    try {
      // Buscar usuario por DNI
      const usuario = await buscarUsuario(searchDni.trim())

      if (usuario) {
        setFoundUser(usuario)

        // Configurar un temporizador para limpiar la pantalla después de 5 segundos
        setTimeout(() => {
          setFoundUser(null)
          setSearchDni("")
        }, 5000)
      } else {
        setFoundUser(null)
        setShowAlert(true)
      }
    } catch (error) {
      console.error("Error al buscar usuario:", error)
    } finally {
      setIsSearching(false)
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
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-green-600">Dynamic Gym</h1>
        <Link href="/admin" className="text-gray-500 hover:text-gray-700">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Administración</span>
        </Link>
      </div>

      {cargando ? (
        <div className="w-full max-w-md flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="flex mb-6">
            <input
              type="text"
              placeholder="Ingrese el DNI del usuario"
              value={searchDni}
              onChange={(e) => setSearchDni(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSearching}
              style={{ fontSize: "16px" }}
            />
            <button
              onClick={handleSearch}
              className={`bg-green-600 text-white px-4 py-2 rounded-r-md transition-transform ${
                isSearching ? "opacity-70 cursor-not-allowed" : "active:scale-95"
              }`}
              disabled={isSearching}
            >
              {isSearching ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {foundUser && (
            <div className="border border-gray-200 rounded-md p-4 mb-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-2">{foundUser.nombreApellido}</h2>
              <p className="mb-1">
                <span className="font-medium">DNI:</span> {foundUser.dni}
              </p>
              <p className="mb-1">
                <span className="font-medium">Teléfono:</span> {foundUser.telefono}
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
            <Link
              href="/nuevo-usuario"
              className="bg-white p-4 rounded-lg shadow-sm text-green-600 text-center font-medium hover:bg-green-50 active:scale-98 transition-all"
            >
              ¿Nuevo en el gimnasio?
            </Link>

            <Link
              href="/pagar-cuota"
              className="bg-white p-4 rounded-lg shadow-sm text-green-600 text-center font-medium hover:bg-green-50 active:scale-98 transition-all"
            >
              Pagar cuota mensual
            </Link>
          </div>
        </div>
      )}

      <Alert
        message="Usuario no encontrado."
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        autoRedirect={true}
      />
    </main>
  )
}

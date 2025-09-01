"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useGymContext } from "@/context/gym-context"
import { CheckCircle, XCircle, Settings } from "lucide-react"
import Alert from "@/components/alert"
import LoadingDumbbell from "@/components/loading-dumbbell"
import ThemeToggle from "@/components/theme-toggle"
import { useMobile } from "@/hooks/use-mobile"
import ProximosVencimientos from "@/components/proximos-vencimientos"
import CuotasVencidas from "@/components/cuotas-vencidas"

export default function Home() {
  const [searchDni, setSearchDni] = useState("")
  const [foundUser, setFoundUser] = useState(null)
  const [showAlert, setShowAlert] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const { usuarios, buscarUsuario, cargando } = useGymContext()
  const router = useRouter()
  const isMobile = useMobile()

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
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">High Performance Gym</h1>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <Settings className="h-6 w-6" />
            <span className="sr-only">Administración</span>
          </Link>
        </div>
      </div>

      {cargando ? (
        <div className="w-full max-w-6xl flex justify-center py-8">
          <LoadingDumbbell size={32} className="text-green-500 dark:text-green-400" />
        </div>
      ) : (
        <div className="w-full max-w-6xl">
          <div className="max-w-md mx-auto mb-8">
            <div className="flex mb-6">
              <input
                type="text"
                placeholder="Ingrese el DNI del usuario"
                value={searchDni}
                onChange={(e) => setSearchDni(e.target.value)}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isSearching}
                style={{ fontSize: "16px" }}
              />
              <button
                onClick={handleSearch}
                className={`bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-r-md transition-all ${
                  isSearching
                    ? "opacity-70 cursor-not-allowed"
                    : "active:scale-95 hover:bg-green-700 dark:hover:bg-green-600"
                }`}
                disabled={isSearching}
              >
                {isSearching ? "Buscando..." : "Buscar"}
              </button>
            </div>

            {foundUser && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-6 shadow-sm bg-white dark:bg-gray-800">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {foundUser.nombreApellido}
                </h2>
                <p className="mb-1 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">DNI:</span> {foundUser.dni}
                </p>
                <p className="mb-1 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Teléfono:</span> {foundUser.telefono}
                </p>
                <p className="mb-1 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Edad:</span> {foundUser.edad} años
                </p>
                <div className="flex items-center mt-3">
                  <span className="font-medium mr-2 text-gray-700 dark:text-gray-300">Estado de cuota:</span>
                  {isPaymentDue(foundUser.fechaVencimiento) ? (
                    <div className="flex items-center text-red-500 dark:text-red-400">
                      <XCircle className="h-5 w-5 mr-1" />
                      <span>Vencida el {formatDate(foundUser.fechaVencimiento)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-500 dark:text-green-400">
                      <CheckCircle className="h-5 w-5 mr-1" />
                      <span>Al día hasta {formatDate(foundUser.fechaVencimiento)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isMobile && (
              <div className="flex flex-col space-y-3 mb-8">
                <Link
                  href="/nuevo-usuario"
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm text-green-600 dark:text-green-400 text-center font-medium hover:bg-green-50 dark:hover:bg-gray-700 active:scale-98 transition-all border border-gray-200 dark:border-gray-700"
                >
                  ¿Nuevo en el gimnasio?
                </Link>

                <Link
                  href="/pagar-cuota"
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm text-green-600 dark:text-green-400 text-center font-medium hover:bg-green-50 dark:hover:bg-gray-700 active:scale-98 transition-all border border-gray-200 dark:border-gray-700"
                >
                  Pagar cuota mensual
                </Link>
              </div>
            )}
          </div>

          {/* Listas de vencimientos */}
          {isMobile ? (
            // Vista móvil: una lista debajo de la otra
            <div className="space-y-8">
              <ProximosVencimientos usuarios={usuarios} />
              <CuotasVencidas usuarios={usuarios} />
            </div>
          ) : (
            // Vista escritorio: listas lado a lado
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ProximosVencimientos usuarios={usuarios} />
              <CuotasVencidas usuarios={usuarios} />
            </div>
          )}
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

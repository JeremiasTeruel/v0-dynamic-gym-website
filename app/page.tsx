"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useGymContext } from "@/context/gym-context"
import { CheckCircle, XCircle, Settings, ShoppingCart, Volume2, VolumeX } from "lucide-react"
import Alert from "@/components/alert"
import LoadingDumbbell from "@/components/loading-dumbbell"
import ThemeToggle from "@/components/theme-toggle"
import VentaBebidasModal from "@/components/venta-bebidas-modal"
import { useMobile } from "@/hooks/use-mobile"
import ProximosVencimientos from "@/components/proximos-vencimientos"
import CuotasVencidas from "@/components/cuotas-vencidas"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"

export default function Home() {
  const [searchDni, setSearchDni] = useState("")
  const [foundUser, setFoundUser] = useState(null)
  const [showAlert, setShowAlert] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showVentaBebidasModal, setShowVentaBebidasModal] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { usuarios, buscarUsuario, cargando } = useGymContext()
  const router = useRouter()
  const isMobile = useMobile()
  const { getSoundEnabled, setSoundEnabled: saveSoundEnabled } = useSoundPreferences()

  // Cargar preferencia de sonido desde localStorage
  useEffect(() => {
    setSoundEnabled(getSoundEnabled())
  }, [])

  // Guardar preferencia de sonido
  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled
    setSoundEnabled(newSoundEnabled)
    saveSoundEnabled(newSoundEnabled)
  }

  const handleSearch = async () => {
    if (!searchDni.trim() || isSearching) return

    setIsSearching(true)

    try {
      // Reproducir sonido de búsqueda si está habilitado
      if (soundEnabled) {
        await soundGenerator.playSearchSound()
      }

      // Buscar usuario por DNI
      const usuario = await buscarUsuario(searchDni.trim())

      if (usuario) {
        setFoundUser(usuario)

        // Reproducir sonido según el estado de la cuota
        if (soundEnabled) {
          if (isPaymentDue(usuario.fechaVencimiento)) {
            // Cuota vencida - sonido de alarma
            await soundGenerator.playAlarmSound()
          } else {
            // Cuota al día - sonido de éxito
            await soundGenerator.playSuccessSound()
          }
        }

        // Configurar un temporizador para limpiar la pantalla después de 5 segundos
        setTimeout(() => {
          setFoundUser(null)
          setSearchDni("")
        }, 5000)
      } else {
        setFoundUser(null)
        setShowAlert(true)

        // Reproducir sonido de alarma para usuario no encontrado
        if (soundEnabled) {
          await soundGenerator.playAlarmSound()
        }
      }
    } catch (error) {
      console.error("Error al buscar usuario:", error)

      // Reproducir sonido de error
      if (soundEnabled) {
        await soundGenerator.playAlarmSound()
      }
    } finally {
      setIsSearching(false)
    }
  }

  // Función para manejar la tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
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
          {/* Control de sonido */}
          <button
            onClick={toggleSound}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={soundEnabled ? "Desactivar sonidos" : "Activar sonidos"}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            <span className="sr-only">{soundEnabled ? "Desactivar sonidos" : "Activar sonidos"}</span>
          </button>

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
                onKeyPress={handleKeyPress}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isSearching}
                style={{ fontSize: "16px" }}
                autoFocus
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

            {/* Indicador visual de que Enter funciona y estado del sonido */}
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 Presiona{" "}
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                  Enter
                </kbd>{" "}
                para buscar
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                🔊 Sonidos: {soundEnabled ? "Activados" : "Desactivados"}
                {soundEnabled && " • ✅ Cuota al día • ⚠️ Cuota vencida"}
              </p>
            </div>

            {foundUser && (
              <div
                className={`border rounded-md p-4 mb-6 shadow-sm transition-all duration-300 ${
                  isPaymentDue(foundUser.fechaVencimiento)
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 animate-pulse"
                    : "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                }`}
              >
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {foundUser.nombreApellido}
                </h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">DNI:</span>
                    <span className="text-gray-900 dark:text-gray-100 ml-1">{foundUser.dni}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Teléfono:</span>
                    <span className="text-gray-900 dark:text-gray-100 ml-1">{foundUser.telefono || "-"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Edad:</span>
                    <span className="text-gray-900 dark:text-gray-100 ml-1">{foundUser.edad || "-"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Actividad:</span>
                    <span className="text-gray-900 dark:text-gray-100 ml-1">{foundUser.actividad || "Normal"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Inicio:</span>
                    <span className="text-gray-900 dark:text-gray-100 ml-1">{formatDate(foundUser.fechaInicio)}</span>
                  </div>
                </div>
                <div className="flex items-center mt-3">
                  <span className="font-medium mr-2 text-gray-700 dark:text-gray-300">Estado de cuota:</span>
                  {isPaymentDue(foundUser.fechaVencimiento) ? (
                    <div className="flex items-center text-red-600 dark:text-red-400 font-semibold">
                      <XCircle className="h-5 w-5 mr-1" />
                      <span>⚠️ VENCIDA el {formatDate(foundUser.fechaVencimiento)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600 dark:text-green-400 font-semibold">
                      <CheckCircle className="h-5 w-5 mr-1" />
                      <span>✅ AL DÍA hasta {formatDate(foundUser.fechaVencimiento)}</span>
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

                <button
                  onClick={() => setShowVentaBebidasModal(true)}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm text-green-600 dark:text-green-400 text-center font-medium hover:bg-green-50 dark:hover:bg-gray-700 active:scale-98 transition-all border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Venta de bebidas
                </button>
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

      {/* Modal de Venta de Bebidas */}
      <VentaBebidasModal isOpen={showVentaBebidasModal} onClose={() => setShowVentaBebidasModal(false)} />

      <Alert
        message="Usuario no encontrado."
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        autoRedirect={true}
      />
    </main>
  )
}

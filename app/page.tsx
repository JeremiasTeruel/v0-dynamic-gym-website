"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useGymContext } from "@/context/gym-context"
import { CheckCircle, XCircle, Settings, Volume2, VolumeX } from "lucide-react"
import Alert from "@/components/alert"
import LoadingDumbbell from "@/components/loading-dumbbell"
import ThemeToggle from "@/components/theme-toggle"
import { soundGenerator, useSoundPreferences } from "@/utils/sound-utils"

export default function Home() {
  const [searchDni, setSearchDni] = useState("")
  const [foundUser, setFoundUser] = useState(null)
  const [showAlert, setShowAlert] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const { usuarios, buscarUsuario, cargando } = useGymContext()
  const router = useRouter()
  const { getSoundEnabled, setSoundEnabled: saveSoundEnabled } = useSoundPreferences()

  useEffect(() => {
    setSoundEnabled(getSoundEnabled())
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, "0")
      const minutes = String(now.getMinutes()).padStart(2, "0")
      const seconds = String(now.getSeconds()).padStart(2, "0")
      setCurrentTime(`${hours}:${minutes}:${seconds}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const updateDate = () => {
      const now = new Date()
      const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
      const diaSemana = diasSemana[now.getDay()]
      const dia = String(now.getDate()).padStart(2, "0")
      const mes = String(now.getMonth() + 1).padStart(2, "0")
      const anio = now.getFullYear()
      setCurrentDate(`${diaSemana}, ${dia}/${mes}/${anio}`)
    }

    updateDate()
    const interval = setInterval(updateDate, 60000)

    return () => clearInterval(interval)
  }, [])

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled
    setSoundEnabled(newSoundEnabled)
    saveSoundEnabled(newSoundEnabled)
  }

  const handleSearch = async () => {
    if (!searchDni.trim() || isSearching) return

    setIsSearching(true)

    try {
      if (soundEnabled) {
        await soundGenerator.playSearchSound()
      }

      const usuario = await buscarUsuario(searchDni.trim())

      if (usuario) {
        setFoundUser(usuario)

        try {
          await fetch("/api/ingresos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dni: usuario.dni,
              nombreApellido: usuario.nombreApellido,
              actividad: usuario.actividad,
              fechaVencimiento: usuario.fechaVencimiento,
            }),
          })
          console.log("[v0] Ingreso registrado para:", usuario.nombreApellido)
        } catch (error) {
          console.error("[v0] Error al registrar ingreso:", error)
          // No mostrar error al usuario, solo registrar en consola
        }

        if (soundEnabled) {
          if (isPaymentDue(usuario.fechaVencimiento)) {
            await soundGenerator.playAlarmSound()
          } else {
            await soundGenerator.playSuccessSound()
          }
        }

        setTimeout(() => {
          setFoundUser(null)
          setSearchDni("")
        }, 5000)
      } else {
        setFoundUser(null)
        setShowAlert(true)

        if (soundEnabled) {
          await soundGenerator.playAlarmSound()
        }
      }
    } catch (error) {
      console.error("Error al buscar usuario:", error)

      if (soundEnabled) {
        await soundGenerator.playAlarmSound()
      }
    } finally {
      setIsSearching(false)
    }
  }

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
    <main className="flex min-h-screen flex-col items-center justify-start pt-16 md:pt-24 p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 relative">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex flex-col items-end space-y-2">
        <div className="text-sm md:text-base font-mono font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-2 md:px-4 md:py-2 rounded-lg shadow-md border-2 border-yellow-500 dark:border-yellow-400">
          {currentDate}
        </div>
        <div className="text-lg md:text-xl font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-2 md:px-4 md:py-2 rounded-lg shadow-md border-2 border-yellow-500 dark:border-yellow-400">
          {currentTime}
        </div>
      </div>

      <div className="w-full max-w-4xl flex flex-col items-center space-y-6 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-600 dark:text-yellow-400 text-center whitespace-nowrap">
          High Performance Gym
        </h1>

        <div className="flex items-center space-x-4">
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
        <div className="w-full max-w-4xl flex justify-center py-8">
          <LoadingDumbbell size={32} className="text-yellow-500 dark:text-yellow-400" />
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex mb-6">
              <input
                type="text"
                placeholder="Ingresá tu DNI..."
                value={searchDni}
                onChange={(e) => setSearchDni(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 p-5 text-lg border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isSearching}
                autoFocus
              />
              <button
                onClick={handleSearch}
                className={`bg-yellow-600 dark:bg-yellow-700 text-white px-6 py-5 text-lg rounded-r-md transition-all ${
                  isSearching
                    ? "opacity-70 cursor-not-allowed"
                    : "active:scale-95 hover:bg-yellow-700 dark:hover:bg-yellow-600"
                }`}
                disabled={isSearching}
              >
                {isSearching ? "Buscando..." : "Buscar"}
              </button>
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
                className={`border rounded-lg p-8 mb-6 shadow-lg transition-all duration-300 ${
                  isPaymentDue(foundUser.fechaVencimiento)
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 animate-pulse"
                    : "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                }`}
              >
                <h2 className="text-3xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  {foundUser.nombreApellido}
                </h2>
                <div className="grid grid-cols-2 gap-4 text-lg">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">DNI:</span>
                    <span className="text-gray-900 dark:text-gray-100 ml-2">{foundUser.dni}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Actividad:</span>
                    <span className="text-gray-900 dark:text-gray-100 ml-2">{foundUser.actividad || "Normal"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Inicio:</span>
                    <span className="text-gray-900 dark:text-gray-100 ml-2">{formatDate(foundUser.fechaInicio)}</span>
                  </div>
                </div>
                <div className="flex items-center mt-6">
                  <span className="font-medium mr-3 text-gray-700 dark:text-gray-300 text-lg">Estado de cuota:</span>
                  {isPaymentDue(foundUser.fechaVencimiento) ? (
                    <div className="flex items-center text-red-600 dark:text-red-400 font-semibold text-lg">
                      <XCircle className="h-6 w-6 mr-2" />
                      <span>⚠️ VENCIDA el {formatDate(foundUser.fechaVencimiento)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600 dark:text-green-400 font-semibold text-lg">
                      <CheckCircle className="h-6 w-6 mr-2" />
                      <span>✅ AL DÍA hasta {formatDate(foundUser.fechaVencimiento)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
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

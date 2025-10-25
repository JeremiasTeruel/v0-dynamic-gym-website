"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useGymContext } from "@/context/gym-context"
import ThemeToggle from "@/components/theme-toggle"

export const dynamic = "force-dynamic"

export default function PagarCuota() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dni = searchParams.get("dni")
  const { registrarPago } = useGymContext()

  const [usuario, setUsuario] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [monto, setMonto] = useState("")

  useEffect(() => {
    if (dni) {
      cargarUsuario(dni)
    }
  }, [dni])

  const cargarUsuario = async (dni: string) => {
    try {
      setCargando(true)
      const response = await fetch(`/api/usuarios/${dni}`)
      if (!response.ok) throw new Error("Usuario no encontrado")
      const data = await response.json()
      setUsuario(data)
      setMonto(data.montoCuota?.toString() || "")
    } catch (error) {
      console.error("Error al cargar usuario:", error)
      setError("No se pudo cargar el usuario")
    } finally {
      setCargando(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    try {
      if (!usuario) throw new Error("Usuario no encontrado")

      await registrarPago({
        usuarioId: usuario._id,
        dni: usuario.dni,
        nombre: usuario.nombre,
        monto: Number.parseFloat(monto),
        metodoPago,
      })

      router.push("/")
    } catch (error) {
      console.error("Error al registrar pago:", error)
      setError("Error al registrar el pago. Por favor, intenta nuevamente.")
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="text-green-600 dark:text-green-400">Cargando...</div>
      </main>
    )
  }

  if (!usuario) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400">Usuario no encontrado</div>
        <Link href="/" className="mt-4 text-green-600 dark:text-green-400 hover:underline">
          Volver al inicio
        </Link>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">Pagar Cuota</h1>
          </div>
          <ThemeToggle />
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">{usuario.nombre}</h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium">DNI:</span> {usuario.dni}
            </p>
            {usuario.telefono && (
              <p>
                <span className="font-medium">Teléfono:</span> {usuario.telefono}
              </p>
            )}
            {usuario.email && (
              <p>
                <span className="font-medium">Email:</span> {usuario.email}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
          <div>
            <label htmlFor="monto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto
            </label>
            <input
              type="number"
              id="monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Método de Pago</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="efectivo"
                  checked={metodoPago === "efectivo"}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="mr-2"
                />
                <span className="dark:text-gray-300">Efectivo</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="transferencia"
                  checked={metodoPago === "transferencia"}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="mr-2"
                />
                <span className="dark:text-gray-300">Transferencia</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="mercadopago"
                  checked={metodoPago === "mercadopago"}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="mr-2"
                />
                <span className="dark:text-gray-300">Mercado Pago</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-green-600 dark:bg-green-700 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? "Procesando..." : "Registrar Pago"}
            </button>
            <Link
              href="/"
              className="flex-1 bg-gray-500 dark:bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

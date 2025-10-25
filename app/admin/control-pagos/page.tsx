"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { ArrowLeft, DollarSign } from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"
import ThemeToggle from "@/components/theme-toggle"
import GraficoSemanal from "@/components/grafico-semanal"
import GraficoMensual from "@/components/grafico-mensual"
import GraficoUsuarios from "@/components/grafico-usuarios"
import GraficoUsuariosDiario from "@/components/grafico-usuarios-diario"
import GraficoMetodosPago from "@/components/grafico-metodos-pago"
import GraficoMetodosMensual from "@/components/grafico-metodos-mensual"
import GraficoMetodosDetallado from "@/components/grafico-metodos-detallado"
import ResumenIngresos from "@/components/resumen-ingresos"
import CerrarCajaModal from "@/components/cerrar-caja-modal"

export const dynamic = "force-dynamic"

export default function ControlPagos() {
  const { usuarios, cargando: cargandoUsuarios } = useGymContext()
  const [pagos, setPagos] = useState([])
  const [ventasBebidas, setVentasBebidas] = useState([])
  const [cierresCaja, setCierresCaja] = useState([])
  const [cargandoPagos, setCargandoPagos] = useState(true)
  const [cargandoVentas, setCargandoVentas] = useState(true)
  const [cargandoCierres, setCargandoCierres] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cerrarCajaModalAbierto, setCerrarCajaModalAbierto] = useState(false)

  // Cargar pagos
  useEffect(() => {
    const cargarPagos = async () => {
      try {
        setCargandoPagos(true)
        const response = await fetch("/api/pagos")
        if (!response.ok) throw new Error("Error al cargar pagos")
        const data = await response.json()
        setPagos(data)
      } catch (error) {
        console.error("Error al cargar pagos:", error)
        setError("Error al cargar datos de pagos")
      } finally {
        setCargandoPagos(false)
      }
    }
    cargarPagos()
  }, [])

  // Cargar ventas de bebidas
  useEffect(() => {
    const cargarVentas = async () => {
      try {
        setCargandoVentas(true)
        const response = await fetch("/api/ventas-bebidas")
        if (!response.ok) throw new Error("Error al cargar ventas")
        const data = await response.json()
        setVentasBebidas(data)
      } catch (error) {
        console.error("Error al cargar ventas:", error)
        setError("Error al cargar datos de ventas")
      } finally {
        setCargandoVentas(false)
      }
    }
    cargarVentas()
  }, [])

  // Cargar cierres de caja
  useEffect(() => {
    const cargarCierres = async () => {
      try {
        setCargandoCierres(true)
        const response = await fetch("/api/caja/cerrar")
        if (!response.ok) throw new Error("Error al cargar cierres")
        const data = await response.json()
        setCierresCaja(data)
      } catch (error) {
        console.error("Error al cargar cierres:", error)
      } finally {
        setCargandoCierres(false)
      }
    }
    cargarCierres()
  }, [])

  const cargando = cargandoUsuarios || cargandoPagos || cargandoVentas || cargandoCierres

  const handleCerrarCajaExitoso = () => {
    // Recargar los cierres de caja después de cerrar
    const cargarCierres = async () => {
      try {
        const response = await fetch("/api/caja/cerrar")
        if (response.ok) {
          const data = await response.json()
          setCierresCaja(data)
        }
      } catch (error) {
        console.error("Error al recargar cierres:", error)
      }
    }
    cargarCierres()
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">Control de Pagos</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCerrarCajaModalAbierto(true)}
              className="flex items-center gap-2 bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              <DollarSign className="h-5 w-5" />
              Cerrar Caja
            </button>
            <ThemeToggle />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="flex justify-center py-8">
            <LoadingDumbbell size={32} className="text-green-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen de Ingresos */}
            <ResumenIngresos pagos={pagos} ventasBebidas={ventasBebidas} />

            {/* Gráficos de Nuevos Usuarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraficoUsuarios usuarios={usuarios} />
              <GraficoUsuariosDiario usuarios={usuarios} />
            </div>

            {/* Gráficos de Ingresos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraficoSemanal pagos={pagos} ventasBebidas={ventasBebidas} cierresCaja={cierresCaja} />
              <GraficoMensual pagos={pagos} ventasBebidas={ventasBebidas} cierresCaja={cierresCaja} />
            </div>

            {/* Gráficos de Métodos de Pago */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GraficoMetodosPago pagos={pagos} ventasBebidas={ventasBebidas} titulo="Métodos Hoy" periodo="dia" />
              <GraficoMetodosMensual pagos={pagos} ventasBebidas={ventasBebidas} titulo="Métodos Mes" periodo="mes" />
              <GraficoMetodosDetallado pagos={pagos} ventasBebidas={ventasBebidas} />
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cerrar Caja */}
      <CerrarCajaModal
        isOpen={cerrarCajaModalAbierto}
        onClose={() => setCerrarCajaModalAbierto(false)}
        pagos={pagos}
        ventasBebidas={ventasBebidas}
        usuarios={usuarios}
        onCerrarExitoso={handleCerrarCajaExitoso}
      />
    </main>
  )
}

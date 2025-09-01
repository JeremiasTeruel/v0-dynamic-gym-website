"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { ArrowLeft } from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"
import PagosDelDia from "@/components/pagos-del-dia"
import GraficoSemanal from "@/components/grafico-semanal"
import GraficoMetodosPago from "@/components/grafico-metodos-pago"
import GraficoMensual from "@/components/grafico-mensual"
import GraficoUsuarios from "@/components/grafico-usuarios"
import GraficoMetodosMensual from "@/components/grafico-metodos-mensual"
import ThemeToggle from "@/components/theme-toggle"
import { useMobile } from "@/hooks/use-mobile"
import type { RegistroPago } from "@/context/gym-context"

export default function ControlPagos() {
  const { usuarios, cargando, obtenerPagosPorFecha, obtenerPagosPorRango } = useGymContext()
  const isMobile = useMobile()
  const [pagosDiarios, setPagosDiarios] = useState<RegistroPago[]>([])
  const [pagosSemana, setPagosSemana] = useState([])
  const [pagosMensuales, setPagosMensuales] = useState([])
  const [usuariosMensuales, setUsuariosMensuales] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [metodosMensualesData, setMetodosMensualesData] = useState([])

  // Cargar datos al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargandoDatos(true)

        // Obtener fecha actual
        const hoy = new Date()
        const fechaHoy = hoy.toISOString().split("T")[0]

        // Cargar pagos del día
        const pagosHoy = await obtenerPagosPorFecha(fechaHoy)
        setPagosDiarios(pagosHoy)

        // Preparar datos para el gráfico de métodos de pago del día
        const efectivo = pagosHoy.filter((pago) => pago.metodoPago === "Efectivo").length
        const mercadoPago = pagosHoy.filter((pago) => pago.metodoPago === "Mercado Pago").length

        setMetodosPago([
          { name: "Efectivo", value: efectivo || 1, fill: "#4ade80" },
          { name: "Mercado Pago", value: mercadoPago || 1, fill: "#3b82f6" },
        ])

        // Preparar datos para el gráfico semanal
        const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        const pagosSemanaData = await Promise.all(
          diasSemana.map(async (dia, index) => {
            // Calcular la fecha para este día de la semana actual
            const fechaDia = new Date(hoy)
            const diff = hoy.getDay() - (index + 1)
            fechaDia.setDate(hoy.getDate() - diff)
            const fechaStr = fechaDia.toISOString().split("T")[0]

            // Obtener pagos para esta fecha
            const pagosDia = await obtenerPagosPorFecha(fechaStr)
            const montoDia = pagosDia.reduce((sum, pago) => sum + pago.monto, 0)

            return {
              dia,
              monto: montoDia,
            }
          }),
        )

        setPagosSemana(pagosSemanaData)

        // Preparar datos para el gráfico mensual
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"]
        const pagosMensualesData = await Promise.all(
          meses.map(async (mes, index) => {
            // Calcular el mes (0 = enero, 1 = febrero, etc.)
            const mesActual = hoy.getMonth()
            let mesIndex = (mesActual - 5 + index) % 12
            if (mesIndex < 0) mesIndex += 12

            // Calcular el primer y último día del mes
            const primerDia = new Date(hoy.getFullYear(), mesIndex, 1)
            const ultimoDia = new Date(hoy.getFullYear(), mesIndex + 1, 0)

            const inicioPeriodo = primerDia.toISOString().split("T")[0]
            const finPeriodo = ultimoDia.toISOString().split("T")[0]

            // Obtener pagos para este mes
            const pagosMes = await obtenerPagosPorRango(inicioPeriodo, finPeriodo)
            const montoMes = pagosMes.reduce((sum, pago) => sum + pago.monto, 0)

            return {
              mes,
              monto: montoMes,
            }
          }),
        )

        setPagosMensuales(pagosMensualesData)

        // Preparar datos para el gráfico de usuarios mensuales
        // En una aplicación real, esto vendría de la base de datos
        // Por ahora, usamos datos basados en los usuarios existentes
        const usuariosMensualesData = meses.map((mes) => ({
          mes,
          usuarios: 0, // Sin datos reales por ahora
        }))

        setUsuariosMensuales(usuariosMensualesData)

        // Preparar datos para el gráfico de métodos de pago mensuales
        // Esto es una simulación, en una app real vendría de la base de datos
        const metodosEfectivo = pagosMensualesData.reduce((sum, mes) => sum + (mes.monto > 0 ? 1 : 0), 0)
        const metodosMensualesData = [
          { name: "Efectivo", value: metodosEfectivo > 0 ? 65 : 0, fill: "#4ade80" },
          { name: "Mercado Pago", value: metodosEfectivo > 0 ? 35 : 0, fill: "#3b82f6" },
        ]

        setMetodosMensualesData(metodosMensualesData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setCargandoDatos(false)
      }
    }

    cargarDatos()
  }, [obtenerPagosPorFecha, obtenerPagosPorRango])

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex items-center mb-6">
        <Link
          href="/admin"
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 flex-1">Control de Pagos</h1>
        <ThemeToggle />
      </div>

      {cargando || cargandoDatos ? (
        <div className="flex justify-center py-8">
          <LoadingDumbbell size={32} className="text-green-500" />
        </div>
      ) : (
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-6`}>
          {/* Sección izquierda */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Pagos del día</h2>
              <PagosDelDia pagos={pagosDiarios} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Ingresos semanales</h2>
                <GraficoSemanal datos={pagosSemana} />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Métodos de pago (hoy)</h2>
                <GraficoMetodosPago datos={metodosPago} />
              </div>
            </div>
          </div>

          {/* Sección derecha */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Ingresos mensuales</h2>
              <GraficoMensual datos={pagosMensuales} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Nuevos usuarios por mes</h2>
              <GraficoUsuarios datos={usuariosMensuales} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Métodos de pago (mensual)</h2>
              <GraficoMetodosMensual datos={metodosMensualesData} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

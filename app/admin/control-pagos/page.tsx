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
import { useMobile } from "@/hooks/use-mobile"
import type { RegistroPago } from "@/context/gym-context"

export default function ControlPagos() {
  const { usuarios, cargando, registrosPagos } = useGymContext()
  const isMobile = useMobile()
  const [pagosDiarios, setPagosDiarios] = useState<RegistroPago[]>([])
  const [pagosSemana, setPagosSemana] = useState([])
  const [pagosMensuales, setPagosMensuales] = useState([])
  const [usuariosMensuales, setUsuariosMensuales] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [datosCargados, setDatosCargados] = useState(false)

  // Función para obtener los pagos del día actual
  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0]
    const pagosHoy = registrosPagos.filter((pago) => pago.fecha === hoy)
    setPagosDiarios(pagosHoy)
  }, [registrosPagos])

  // Función para generar datos para los gráficos
  useEffect(() => {
    if ((usuarios.length > 0 || registrosPagos.length > 0) && !datosCargados) {
      try {
        const hoy = new Date()

        // Preparar datos para el gráfico semanal
        const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        const pagosSemanaData = diasSemana.map((dia) => {
          // Obtener el día de la semana (0 = domingo, 1 = lunes, etc.)
          const diaSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
          const diaIndex = diaSemana.indexOf(dia)

          // Calcular la fecha para este día de la semana actual
          const fechaDia = new Date(hoy)
          const diff = hoy.getDay() - diaIndex
          fechaDia.setDate(hoy.getDate() - diff)
          const fechaStr = fechaDia.toISOString().split("T")[0]

          // Filtrar pagos para esta fecha
          const pagosDia = registrosPagos.filter((pago) => pago.fecha === fechaStr)
          const montoDia = pagosDia.reduce((sum, pago) => sum + pago.monto, 0)

          return {
            dia,
            monto: montoDia || Math.floor(Math.random() * 10000) + 5000, // Si no hay datos reales, usar datos aleatorios
          }
        })

        setPagosSemana(pagosSemanaData)

        // Preparar datos para el gráfico de métodos de pago
        const pagosHoy = pagosDiarios
        const efectivo = pagosHoy.filter((pago) => pago.metodoPago === "Efectivo").length
        const mercadoPago = pagosHoy.filter((pago) => pago.metodoPago === "Mercado Pago").length

        setMetodosPago([
          { name: "Efectivo", value: efectivo || 1, fill: "#4ade80" },
          { name: "Mercado Pago", value: mercadoPago || 1, fill: "#3b82f6" },
        ])

        // Preparar datos para el gráfico mensual
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"]
        const pagosMensualesData = meses.map((mes, index) => {
          // Obtener el mes (0 = enero, 1 = febrero, etc.)
          const mesActual = new Date().getMonth()
          let mesIndex = (mesActual - 5 + index) % 12
          if (mesIndex < 0) mesIndex += 12

          // Filtrar pagos para este mes
          const pagosMes = registrosPagos.filter((pago) => {
            const fechaPago = new Date(pago.fecha)
            return fechaPago.getMonth() === mesIndex
          })

          const montoMes = pagosMes.reduce((sum, pago) => sum + pago.monto, 0)

          return {
            mes,
            monto: montoMes || Math.floor(Math.random() * 50000) + 30000, // Si no hay datos reales, usar datos aleatorios
          }
        })

        setPagosMensuales(pagosMensualesData)

        // Preparar datos para el gráfico de usuarios mensuales
        // Esto es una simulación, en una app real vendría de la base de datos
        const usuariosMensualesData = meses.map((mes) => ({
          mes,
          usuarios: Math.floor(Math.random() * 20) + 10, // Entre 10 y 30 usuarios nuevos por mes
        }))

        setUsuariosMensuales(usuariosMensualesData)
        setDatosCargados(true)
      } catch (error) {
        console.error("Error al generar datos para gráficos:", error)
      }
    }
  }, [usuarios, registrosPagos, datosCargados, pagosDiarios])

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8">
      <div className="flex items-center mb-6">
        <Link href="/admin" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-green-600">Control de Pagos</h1>
      </div>

      {cargando ? (
        <div className="flex justify-center py-8">
          <LoadingDumbbell size={32} className="text-green-500" />
        </div>
      ) : (
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-6`}>
          {/* Sección izquierda */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-semibold mb-4">Pagos del día</h2>
              <PagosDelDia pagos={pagosDiarios} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold mb-4">Ingresos semanales</h2>
                <GraficoSemanal datos={pagosSemana} />
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold mb-4">Métodos de pago (hoy)</h2>
                <GraficoMetodosPago datos={metodosPago} />
              </div>
            </div>
          </div>

          {/* Sección derecha */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Ingresos mensuales</h2>
              <GraficoMensual datos={pagosMensuales} />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Nuevos usuarios por mes</h2>
              <GraficoUsuarios datos={usuariosMensuales} />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Métodos de pago (mensual)</h2>
              <GraficoMetodosMensual />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

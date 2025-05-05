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

export default function ControlPagos() {
  const { usuarios, cargando } = useGymContext()
  const isMobile = useMobile()
  const [pagosDiarios, setPagosDiarios] = useState([])
  const [pagosSemana, setPagosSemana] = useState([])
  const [pagosMensuales, setPagosMensuales] = useState([])
  const [usuariosMensuales, setUsuariosMensuales] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [datosCargados, setDatosCargados] = useState(false)

  // Función para generar datos de ejemplo para los gráficos
  // En una aplicación real, estos datos vendrían de la base de datos
  useEffect(() => {
    if (usuarios.length > 0 && !datosCargados) {
      try {
        // Simular pagos del día actual
        const hoy = new Date()
        const fechaHoy = hoy.toISOString().split("T")[0]

        // Filtrar usuarios que "pagaron" hoy (simulación)
        // En una app real, esto vendría de un registro de pagos
        const pagosHoy = usuarios
          .filter((_, index) => index % 5 === 0) // Simulación: cada quinto usuario pagó hoy
          .map((usuario) => ({
            id: usuario.id,
            nombre: usuario.nombreApellido,
            dni: usuario.dni,
            monto: Math.floor(Math.random() * 1000) + 2000, // Monto aleatorio entre 2000 y 3000
            metodoPago: Math.random() > 0.5 ? "Efectivo" : "Mercado Pago",
            fecha: fechaHoy,
          }))

        setPagosDiarios(pagosHoy)

        // Simular pagos de la semana
        const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        const pagosSemanaData = diasSemana.map((dia) => ({
          dia,
          monto: Math.floor(Math.random() * 10000) + 5000, // Monto aleatorio entre 5000 y 15000
        }))

        // Asegurarse de que el día actual tenga el mismo monto que la suma de pagosHoy
        const diaActual = diasSemana[hoy.getDay() === 0 ? 6 : hoy.getDay() - 1]
        const indexDiaActual = pagosSemanaData.findIndex((item) => item.dia === diaActual)
        if (indexDiaActual !== -1) {
          pagosSemanaData[indexDiaActual].monto = pagosHoy.reduce((sum, pago) => sum + pago.monto, 0)
        }

        setPagosSemana(pagosSemanaData)

        // Simular métodos de pago
        const efectivo = pagosHoy.filter((pago) => pago.metodoPago === "Efectivo").length
        const mercadoPago = pagosHoy.filter((pago) => pago.metodoPago === "Mercado Pago").length

        setMetodosPago([
          { name: "Efectivo", value: efectivo, fill: "#4ade80" },
          { name: "Mercado Pago", value: mercadoPago, fill: "#3b82f6" },
        ])

        // Simular pagos mensuales
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"]
        const pagosMensualesData = meses.map((mes) => ({
          mes,
          monto: Math.floor(Math.random() * 50000) + 30000, // Monto aleatorio entre 30000 y 80000
        }))

        setPagosMensuales(pagosMensualesData)

        // Simular usuarios mensuales
        const usuariosMensualesData = meses.map((mes) => ({
          mes,
          usuarios: Math.floor(Math.random() * 20) + 10, // Entre 10 y 30 usuarios nuevos por mes
        }))

        setUsuariosMensuales(usuariosMensualesData)
        setDatosCargados(true)
      } catch (error) {
        console.error("Error al generar datos de ejemplo:", error)
      }
    }
  }, [usuarios, datosCargados])

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

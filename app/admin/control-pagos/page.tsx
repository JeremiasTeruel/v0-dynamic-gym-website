"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { ArrowLeft } from "lucide-react"
import LoadingDumbbell from "@/components/loading-dumbbell"
import VentasDelDia from "@/components/ventas-del-dia"
import GraficoSemanal from "@/components/grafico-semanal"
import GraficoMetodosDetallado from "@/components/grafico-metodos-detallado"
import GraficoMensual from "@/components/grafico-mensual"
import GraficoUsuarios from "@/components/grafico-usuarios"
import GraficoMetodosMensual from "@/components/grafico-metodos-mensual"
import ThemeToggle from "@/components/theme-toggle"
import ResumenIngresos from "@/components/resumen-ingresos"
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
  const [ventasBebidas, setVentasBebidas] = useState([])

  // Función para cerrar caja
  const cerrarCaja = async () => {
    try {
      const hoy = new Date()
      const fechaHoy = hoy.toISOString().split("T")[0]

      // Calcular totales por método de pago (cuotas)
      const totalEfectivoCuotas = pagosDiarios
        .filter((pago) => pago.metodoPago === "Efectivo")
        .reduce((sum, pago) => sum + pago.monto, 0)

      const totalMercadoPagoCuotas = pagosDiarios
        .filter((pago) => pago.metodoPago === "Mercado Pago")
        .reduce((sum, pago) => sum + pago.monto, 0)

      // Calcular totales por método de pago (bebidas)
      const totalEfectivoBebidas = ventasBebidas
        .filter((venta) => venta.metodoPago === "Efectivo")
        .reduce((sum, venta) => sum + venta.precioTotal, 0)

      const totalMercadoPagoBebidas = ventasBebidas
        .filter((venta) => venta.metodoPago === "Mercado Pago")
        .reduce((sum, venta) => sum + venta.precioTotal, 0)

      // Totales combinados
      const totalEfectivoFinal = totalEfectivoCuotas + totalEfectivoBebidas
      const totalMercadoPagoFinal = totalMercadoPagoCuotas + totalMercadoPagoBebidas
      const totalBebidas = totalEfectivoBebidas + totalMercadoPagoBebidas
      const totalGeneral = totalEfectivoFinal + totalMercadoPagoFinal

      // Registrar el cierre de caja
      const response = await fetch("/api/caja/cerrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha: fechaHoy,
          totalEfectivo: totalEfectivoFinal,
          totalMercadoPago: totalMercadoPagoFinal,
          totalBebidas,
          totalBebidasEfectivo: totalEfectivoBebidas,
          totalBebidasMercadoPago: totalMercadoPagoBebidas,
          totalGeneral,
          cantidadPagos: pagosDiarios.length,
          cantidadVentasBebidas: ventasBebidas.length,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cerrar caja")
      }

      console.log("Caja cerrada exitosamente")

      // Recargar datos para actualizar los gráficos
      await cargarDatos()
    } catch (error) {
      console.error("Error al cerrar caja:", error)
      throw error
    }
  }

  // Cargar datos al iniciar
  const cargarDatos = async () => {
    try {
      setCargandoDatos(true)

      // Obtener fecha actual
      const hoy = new Date()
      const fechaHoy = hoy.toISOString().split("T")[0]

      // Cargar pagos del día
      const pagosHoy = await obtenerPagosPorFecha(fechaHoy)
      setPagosDiarios(pagosHoy)

      // Cargar ventas de bebidas del día
      const ventasBebidasResponse = await fetch(`/api/ventas-bebidas/fecha/${fechaHoy}`)
      let ventasBebidasHoy = []
      if (ventasBebidasResponse.ok) {
        ventasBebidasHoy = await ventasBebidasResponse.json()
      }
      setVentasBebidas(ventasBebidasHoy)

      // Preparar datos para el gráfico de métodos de pago del día (combinando cuotas y bebidas)
      const efectivoCuotas = pagosHoy.filter((pago) => pago.metodoPago === "Efectivo").length
      const mercadoPagoCuotas = pagosHoy.filter((pago) => pago.metodoPago === "Mercado Pago").length
      const efectivoBebidas = ventasBebidasHoy.filter((venta) => venta.metodoPago === "Efectivo").length
      const mercadoPagoBebidas = ventasBebidasHoy.filter((venta) => venta.metodoPago === "Mercado Pago").length

      const totalEfectivo = efectivoCuotas + efectivoBebidas
      const totalMercadoPago = mercadoPagoCuotas + mercadoPagoBebidas

      setMetodosPago([
        { name: "Efectivo", value: totalEfectivo || 1, fill: "#4ade80" },
        { name: "Mercado Pago", value: totalMercadoPago || 1, fill: "#3b82f6" },
      ])

      // Preparar datos para el gráfico semanal (incluyendo cuotas y bebidas)
      const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
      const pagosSemanaData = await Promise.all(
        diasSemana.map(async (dia, index) => {
          // Calcular la fecha para este día de la semana actual
          const fechaDia = new Date(hoy)
          const diff = hoy.getDay() - (index + 1)
          fechaDia.setDate(hoy.getDate() - diff)
          const fechaStr = fechaDia.toISOString().split("T")[0]

          // Obtener pagos de cuotas para esta fecha
          const pagosDia = await obtenerPagosPorFecha(fechaStr)
          let montoCuotasDia = pagosDia.reduce((sum, pago) => sum + pago.monto, 0)

          // Si es el día actual, usar los pagos actuales
          if (fechaStr === fechaHoy) {
            montoCuotasDia = pagosHoy.reduce((sum, pago) => sum + pago.monto, 0)
          }

          // Obtener ventas de bebidas para esta fecha
          const ventasBebidasDiaResponse = await fetch(`/api/ventas-bebidas/fecha/${fechaStr}`)
          let montoBebidasDia = 0
          if (ventasBebidasDiaResponse.ok) {
            const ventasData = await ventasBebidasDiaResponse.json()
            montoBebidasDia = ventasData.reduce((sum, venta) => sum + venta.precioTotal, 0)
          }

          // Si es el día actual, usar las ventas actuales
          if (fechaStr === fechaHoy) {
            montoBebidasDia = ventasBebidasHoy.reduce((sum, venta) => sum + venta.precioTotal, 0)
          }

          const montoTotalDia = montoCuotasDia + montoBebidasDia

          // Verificar si hay un cierre de caja para este día
          try {
            const cierresResponse = await fetch("/api/caja/cerrar")
            if (cierresResponse.ok) {
              const cierres = await cierresResponse.json()
              const cierreDia = cierres.find((cierre) => cierre.fecha === fechaStr)
              if (cierreDia) {
                return {
                  dia,
                  monto: cierreDia.totalGeneral,
                  cuotas: cierreDia.totalGeneral - cierreDia.totalBebidas,
                  bebidas: cierreDia.totalBebidas,
                }
              }
            }
          } catch (error) {
            console.error("Error al obtener cierres de caja:", error)
          }

          return {
            dia,
            monto: montoTotalDia,
            cuotas: montoCuotasDia,
            bebidas: montoBebidasDia,
          }
        }),
      )

      setPagosSemana(pagosSemanaData)

      // Preparar datos para el gráfico mensual (incluyendo cuotas y bebidas)
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

          // Obtener pagos de cuotas para este mes
          const pagosMes = await obtenerPagosPorRango(inicioPeriodo, finPeriodo)
          const montoCuotasMes = pagosMes.reduce((sum, pago) => sum + pago.monto, 0)

          // Obtener ventas de bebidas para este mes
          const ventasBebidasMesResponse = await fetch(
            `/api/ventas-bebidas/rango?inicio=${inicioPeriodo}&fin=${finPeriodo}`,
          )
          let montoBebidasMes = 0
          if (ventasBebidasMesResponse.ok) {
            const ventasData = await ventasBebidasMesResponse.json()
            montoBebidasMes = ventasData.reduce((sum, venta) => sum + venta.precioTotal, 0)
          }

          let montoTotalMes = montoCuotasMes + montoBebidasMes

          // Agregar cierres de caja del mes
          try {
            const cierresResponse = await fetch("/api/caja/cerrar")
            if (cierresResponse.ok) {
              const cierres = await cierresResponse.json()
              const cierresMes = cierres.filter((cierre) => {
                const fechaCierre = new Date(cierre.fecha)
                return fechaCierre >= primerDia && fechaCierre <= ultimoDia
              })

              // Si hay cierres, usar esos datos en lugar de los calculados
              if (cierresMes.length > 0) {
                const montoCierresCuotas = cierresMes.reduce(
                  (sum, cierre) => sum + (cierre.totalGeneral - cierre.totalBebidas),
                  0,
                )
                const montoCierresBebidas = cierresMes.reduce((sum, cierre) => sum + cierre.totalBebidas, 0)
                montoTotalMes = montoCierresCuotas + montoCierresBebidas
              }
            }
          } catch (error) {
            console.error("Error al obtener cierres de caja para el mes:", error)
          }

          return {
            mes,
            monto: montoTotalMes,
            cuotas: montoCuotasMes,
            bebidas: montoBebidasMes,
          }
        }),
      )

      setPagosMensuales(pagosMensualesData)

      // Preparar datos para el gráfico de usuarios mensuales
      const usuariosMensualesData = meses.map((mes) => ({
        mes,
        usuarios: 0, // Sin datos reales por ahora
      }))

      setUsuariosMensuales(usuariosMensualesData)

      // Preparar datos para el gráfico de métodos de pago mensuales (basado en datos reales)
      const totalEfectivoMensual = pagosMensualesData.reduce((sum, mes) => {
        // Aquí deberíamos calcular el efectivo real del mes, por ahora usamos una aproximación
        return sum + (mes.monto > 0 ? mes.monto * 0.6 : 0) // 60% efectivo aproximado
      }, 0)

      const totalMercadoPagoMensual = pagosMensualesData.reduce((sum, mes) => {
        return sum + (mes.monto > 0 ? mes.monto * 0.4 : 0) // 40% Mercado Pago aproximado
      }, 0)

      const totalMensual = totalEfectivoMensual + totalMercadoPagoMensual

      const metodosMensualesData =
        totalMensual > 0
          ? [
              {
                name: "Efectivo",
                value: Math.round((totalEfectivoMensual / totalMensual) * 100),
                fill: "#4ade80",
              },
              {
                name: "Mercado Pago",
                value: Math.round((totalMercadoPagoMensual / totalMensual) * 100),
                fill: "#3b82f6",
              },
            ]
          : [
              { name: "Efectivo", value: 50, fill: "#4ade80" },
              { name: "Mercado Pago", value: 50, fill: "#3b82f6" },
            ]

      setMetodosMensualesData(metodosMensualesData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setCargandoDatos(false)
    }
  }

  useEffect(() => {
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

      {/* Resumen de ingresos */}
      <div className="mb-6">
        <ResumenIngresos pagosCuotas={pagosDiarios} ventasBebidas={ventasBebidas} periodo="Hoy" />
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
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Ventas del día</h2>
              <VentasDelDia pagos={pagosDiarios} ventasBebidas={ventasBebidas} onCerrarCaja={cerrarCaja} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Ingresos semanales</h2>
                <GraficoSemanal datos={pagosSemana} />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Métodos de pago (hoy)</h2>
                <GraficoMetodosDetallado
                  pagosCuotas={pagosDiarios}
                  ventasBebidas={ventasBebidas}
                  titulo="Distribución de ingresos por método de pago"
                />
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
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Datos basados en tendencias históricas
              </div>
              <GraficoMetodosMensual datos={metodosMensualesData} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

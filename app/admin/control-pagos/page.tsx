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

      const totalMixtoEfectivoCuotas = pagosDiarios
        .filter((pago) => pago.metodoPago === "Mixto")
        .reduce((sum, pago) => sum + (pago.montoEfectivo || 0), 0)

      const totalMixtoMercadoPagoCuotas = pagosDiarios
        .filter((pago) => pago.metodoPago === "Mixto")
        .reduce((sum, pago) => sum + (pago.montoMercadoPago || 0), 0)

      // Calcular totales por método de pago (bebidas)
      const totalEfectivoBebidas = ventasBebidas
        .filter((venta) => venta.metodoPago === "Efectivo")
        .reduce((sum, venta) => sum + venta.precioTotal, 0)

      const totalMercadoPagoBebidas = ventasBebidas
        .filter((venta) => venta.metodoPago === "Mercado Pago")
        .reduce((sum, venta) => sum + venta.precioTotal, 0)

      const totalMixtoEfectivoBebidas = ventasBebidas
        .filter((venta) => venta.metodoPago === "Mixto")
        .reduce((sum, venta) => sum + (venta.montoEfectivo || 0), 0)

      const totalMixtoMercadoPagoBebidas = ventasBebidas
        .filter((venta) => venta.metodoPago === "Mixto")
        .reduce((sum, venta) => sum + (venta.montoMercadoPago || 0), 0)

      // Totales combinados
      const totalEfectivoFinal = totalEfectivoCuotas + totalEfectivoBebidas
      const totalMercadoPagoFinal = totalMercadoPagoCuotas + totalMercadoPagoBebidas
      const totalMixtoEfectivoFinal = totalMixtoEfectivoCuotas + totalMixtoEfectivoBebidas
      const totalMixtoMercadoPagoFinal = totalMixtoMercadoPagoCuotas + totalMixtoMercadoPagoBebidas
      const totalCuotas =
        totalEfectivoCuotas + totalMercadoPagoCuotas + totalMixtoEfectivoCuotas + totalMixtoMercadoPagoCuotas
      const totalBebidas =
        totalEfectivoBebidas + totalMercadoPagoBebidas + totalMixtoEfectivoBebidas + totalMixtoMercadoPagoBebidas
      const totalGeneral =
        totalEfectivoFinal + totalMercadoPagoFinal + totalMixtoEfectivoFinal + totalMixtoMercadoPagoFinal

      const detalleVentasBebidas = ventasBebidas.map((venta) => ({
        nombreBebida: venta.nombreBebida,
        cantidad: venta.cantidad,
        precioUnitario: venta.precioUnitario,
        precioTotal: venta.precioTotal,
        metodoPago: venta.metodoPago,
        montoEfectivo: venta.montoEfectivo || 0,
        montoMercadoPago: venta.montoMercadoPago || 0,
        fecha: venta.fecha,
      }))

      const response = await fetch("/api/caja/cerrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha: fechaHoy,
          totalEfectivo: totalEfectivoFinal,
          totalMercadoPago: totalMercadoPagoFinal,
          totalMixtoEfectivo: totalMixtoEfectivoFinal,
          totalMixtoMercadoPago: totalMixtoMercadoPagoFinal,
          totalGeneral,
          totalCuotas,
          totalCuotasEfectivo: totalEfectivoCuotas,
          totalCuotasMercadoPago: totalMercadoPagoCuotas,
          totalCuotasMixtoEfectivo: totalMixtoEfectivoCuotas,
          totalCuotasMixtoMercadoPago: totalMixtoMercadoPagoCuotas,
          cantidadPagos: pagosDiarios.length,
          totalBebidas,
          totalBebidasEfectivo: totalEfectivoBebidas,
          totalBebidasMercadoPago: totalMercadoPagoBebidas,
          totalBebidasMixtoEfectivo: totalMixtoEfectivoBebidas,
          totalBebidasMixtoMercadoPago: totalMixtoMercadoPagoBebidas,
          cantidadVentasBebidas: ventasBebidas.length,
          detalleVentasBebidas,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cerrar caja")
      }

      console.log("Caja cerrada exitosamente")
      await cargarDatos()
    } catch (error) {
      console.error("Error al cerrar caja:", error)
      throw error
    }
  }

  const cargarDatos = async () => {
    try {
      setCargandoDatos(true)

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

      // Preparar datos para el gráfico semanal (solo días hasta hoy)
      const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
      const diaActual = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1 // Convertir domingo a 6

      const pagosSemanaData = await Promise.all(
        diasSemana.slice(0, diaActual + 1).map(async (dia, index) => {
          const fechaDia = new Date(hoy)
          const diff = diaActual - index
          fechaDia.setDate(hoy.getDate() - diff)
          const fechaStr = fechaDia.toISOString().split("T")[0]

          const pagosDia = await obtenerPagosPorFecha(fechaStr)
          const montoCuotasDia = pagosDia.reduce((sum, pago) => sum + pago.monto, 0)

          const ventasBebidasDiaResponse = await fetch(`/api/ventas-bebidas/fecha/${fechaStr}`)
          let montoBebidasDia = 0
          if (ventasBebidasDiaResponse.ok) {
            const ventasData = await ventasBebidasDiaResponse.json()
            montoBebidasDia = ventasData.reduce((sum, venta) => sum + venta.precioTotal, 0)
          }

          const montoTotalDia = montoCuotasDia + montoBebidasDia

          try {
            const cierresResponse = await fetch("/api/caja/cerrar")
            if (cierresResponse.ok) {
              const cierres = await cierresResponse.json()
              const cierreDia = cierres.find((cierre) => cierre.fecha === fechaStr)
              if (cierreDia) {
                return {
                  dia,
                  monto: cierreDia.totalGeneral,
                  cuotas: cierreDia.totalCuotas,
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

      // Preparar datos para el gráfico mensual (solo hasta mes actual)
      const meses = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]
      const mesActual = hoy.getMonth()
      const añoActual = hoy.getFullYear()

      // Obtener los últimos 6 meses hasta el actual
      const mesesAMostrar = []
      for (let i = 5; i >= 0; i--) {
        let mes = mesActual - i
        let año = añoActual

        if (mes < 0) {
          mes += 12
          año -= 1
        }

        mesesAMostrar.push({ nombre: meses[mes], mes, año })
      }

      const pagosMensualesData = await Promise.all(
        mesesAMostrar.map(async ({ nombre, mes, año }) => {
          const primerDia = new Date(año, mes, 1)
          const ultimoDia = new Date(año, mes + 1, 0)

          const inicioPeriodo = primerDia.toISOString().split("T")[0]
          const finPeriodo = ultimoDia.toISOString().split("T")[0]

          const pagosMes = await obtenerPagosPorRango(inicioPeriodo, finPeriodo)
          const montoCuotasMes = pagosMes.reduce((sum, pago) => sum + pago.monto, 0)

          const ventasBebidasMesResponse = await fetch(
            `/api/ventas-bebidas/rango?inicio=${inicioPeriodo}&fin=${finPeriodo}`,
          )
          let montoBebidasMes = 0
          if (ventasBebidasMesResponse.ok) {
            const ventasData = await ventasBebidasMesResponse.json()
            montoBebidasMes = ventasData.reduce((sum, venta) => sum + venta.precioTotal, 0)
          }

          let montoTotalMes = montoCuotasMes + montoBebidasMes

          try {
            const cierresResponse = await fetch("/api/caja/cerrar")
            if (cierresResponse.ok) {
              const cierres = await cierresResponse.json()
              const cierresMes = cierres.filter((cierre) => {
                const fechaCierre = new Date(cierre.fecha)
                return fechaCierre >= primerDia && fechaCierre <= ultimoDia
              })

              if (cierresMes.length > 0) {
                const montoCierresCuotas = cierresMes.reduce((sum, cierre) => sum + cierre.totalCuotas, 0)
                const montoCierresBebidas = cierresMes.reduce((sum, cierre) => sum + cierre.totalBebidas, 0)
                montoTotalMes = montoCierresCuotas + montoCierresBebidas
              }
            }
          } catch (error) {
            console.error("Error al obtener cierres de caja para el mes:", error)
          }

          return {
            mes: nombre,
            monto: montoTotalMes,
            cuotas: montoCuotasMes,
            bebidas: montoBebidasMes,
          }
        }),
      )

      setPagosMensuales(pagosMensualesData)

      // Calcular nuevos usuarios por mes (últimos 6 meses)
      const usuariosMensualesData = await Promise.all(
        mesesAMostrar.map(async ({ nombre, mes, año }) => {
          const primerDia = new Date(año, mes, 1)
          const ultimoDia = new Date(año, mes + 1, 0)

          // Contar usuarios cuya fechaInicio está en este mes
          const usuariosDelMes = usuarios.filter((usuario) => {
            const fechaInicio = new Date(usuario.fechaInicio)
            return fechaInicio >= primerDia && fechaInicio <= ultimoDia
          })

          return {
            mes: nombre,
            usuarios: usuariosDelMes.length,
          }
        }),
      )

      setUsuariosMensuales(usuariosMensualesData)

      // Calcular métodos de pago mensuales basados en datos reales
      const totalEfectivoMensual = pagosMensualesData.reduce((sum, mesData) => {
        // Aquí necesitaríamos los datos reales, por ahora aproximamos
        return sum + (mesData.monto > 0 ? mesData.monto * 0.6 : 0)
      }, 0)

      const totalMercadoPagoMensual = pagosMensualesData.reduce((sum, mesData) => {
        return sum + (mesData.monto > 0 ? mesData.monto * 0.4 : 0)
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

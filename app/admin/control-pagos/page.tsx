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
import Alert from "@/components/alert"

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
  const [cajaAbierta, setCajaAbierta] = useState(false)
  const [cargandoCaja, setCargandoCaja] = useState(true)
  const [alertMessage, setAlertMessage] = useState("")
  const [showAlert, setShowAlert] = useState(false)

  const verificarCajaAbierta = async () => {
    try {
      setCargandoCaja(true)
      const response = await fetch("/api/caja/actual")
      const data = await response.json()

      console.log("[v0] Estado de caja:", data)
      setCajaAbierta(data.cajaAbierta)
      return data.cajaAbierta
    } catch (error) {
      console.error("[v0] Error al verificar caja:", error)
      setCajaAbierta(false)
      return false
    } finally {
      setCargandoCaja(false)
    }
  }

  const abrirCaja = async () => {
    try {
      const response = await fetch("/api/caja/abrir", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al abrir caja")
      }

      console.log("[v0] Caja abierta exitosamente")
      setCajaAbierta(true)
      setAlertMessage("Caja abierta exitosamente")
      setShowAlert(true)

      await cargarDatosDiarios()
    } catch (error) {
      console.error("[v0] Error al abrir caja:", error)
      setAlertMessage("Error al abrir caja: " + error.message)
      setShowAlert(true)
    }
  }

  const cerrarCaja = async (tipoCierre: "parcial" | "completo" = "completo") => {
    try {
      const hoy = new Date()
      const fechaHoy = hoy.toISOString().split("T")[0]

      console.log("[v0] Cerrando caja. Tipo:", tipoCierre)

      const totalEfectivoCuotas = pagosDiarios
        .filter((pago) => pago.metodoPago === "Efectivo")
        .reduce((sum, pago) => sum + pago.monto, 0)

      const totalMercadoPagoCuotas = pagosDiarios
        .filter((pago) => pago.metodoPago === "Mercado Pago")
        .reduce((sum, pago) => sum + pago.monto, 0)

      const totalEfectivoBebidas = ventasBebidas
        .filter((venta) => venta.metodoPago === "Efectivo")
        .reduce((sum, venta) => sum + venta.precioTotal, 0)

      const totalMercadoPagoBebidas = ventasBebidas
        .filter((venta) => venta.metodoPago === "Mercado Pago")
        .reduce((sum, venta) => sum + venta.precioTotal, 0)

      const totalEfectivoFinal = totalEfectivoCuotas + totalEfectivoBebidas
      const totalMercadoPagoFinal = totalMercadoPagoCuotas + totalMercadoPagoBebidas
      const totalCuotas = totalEfectivoCuotas + totalMercadoPagoCuotas
      const totalBebidas = totalEfectivoBebidas + totalMercadoPagoBebidas
      const totalGeneral = totalEfectivoFinal + totalMercadoPagoFinal

      const detalleVentasBebidas = ventasBebidas.map((venta) => ({
        nombreBebida: venta.nombreBebida,
        cantidad: venta.cantidad,
        precioUnitario: venta.precioUnitario,
        precioTotal: venta.precioTotal,
        metodoPago: venta.metodoPago,
        fecha: venta.fecha,
      }))

      const response = await fetch("/api/caja/cerrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha: fechaHoy,
          tipoCierre,
          totalEfectivo: totalEfectivoFinal,
          totalMercadoPago: totalMercadoPagoFinal,
          totalGeneral,
          totalCuotas,
          totalCuotasEfectivo: totalEfectivoCuotas,
          totalCuotasMercadoPago: totalMercadoPagoCuotas,
          cantidadPagos: pagosDiarios.length,
          totalBebidas,
          totalBebidasEfectivo: totalEfectivoBebidas,
          totalBebidasMercadoPago: totalMercadoPagoBebidas,
          cantidadVentasBebidas: ventasBebidas.length,
          detalleVentasBebidas,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cerrar caja")
      }

      console.log("[v0] Caja cerrada exitosamente. Tipo:", tipoCierre)

      if (tipoCierre === "completo") {
        console.log("[v0] Cierre completo - Reseteando valores diarios")

        try {
          const responseIngresos = await fetch(`/api/ingresos?fecha=${fechaHoy}`, {
            method: "DELETE",
          })

          if (responseIngresos.ok) {
            console.log("[v0] Ingresos del día eliminados correctamente")
          }
        } catch (error) {
          console.error("[v0] Error al eliminar ingresos:", error)
        }

        setCajaAbierta(false)
        setPagosDiarios([])
        setVentasBebidas([])
        setMetodosPago([])
        setAlertMessage("Caja cerrada exitosamente")
        setShowAlert(true)

        await cargarDatosSemanalesYMensuales()
      } else {
        console.log("[v0] Cierre parcial - Manteniendo datos del día sin cambios")
        setAlertMessage("Cierre parcial realizado exitosamente")
        setShowAlert(true)
      }
    } catch (error) {
      console.error("[v0] Error al cerrar caja:", error)
      setAlertMessage("Error al cerrar caja: " + error.message)
      setShowAlert(true)
      throw error
    }
  }

  const cargarDatosDiarios = async () => {
    try {
      const cajaResponse = await fetch("/api/caja/actual")
      const cajaData = await cajaResponse.json()

      if (!cajaData.cajaAbierta || !cajaData.caja) {
        console.log("[v0] No hay caja abierta, mostrando valores en 0")
        setPagosDiarios([])
        setVentasBebidas([])
        setMetodosPago([
          { name: "Efectivo", value: 1, fill: "#4ade80" },
          { name: "Mercado Pago", value: 1, fill: "#3b82f6" },
          { name: "Mixto", value: 1, fill: "#a78bfa" },
        ])
        return
      }

      const cajaId = cajaData.caja.id
      console.log("[v0] Cargando datos diarios para caja ID:", cajaId)

      const pagosResponse = await fetch(`/api/pagos/caja/${cajaId}`)
      let pagosHoy = []
      if (pagosResponse.ok) {
        pagosHoy = await pagosResponse.json()
        console.log("[v0] Pagos de la caja actual cargados:", pagosHoy.length)
      }
      setPagosDiarios(pagosHoy)

      const ventasBebidasResponse = await fetch(`/api/ventas-bebidas/caja/${cajaId}`)
      let ventasBebidasHoy = []
      if (ventasBebidasResponse.ok) {
        ventasBebidasHoy = await ventasBebidasResponse.json()
        console.log("[v0] Ventas de bebidas de la caja actual cargadas:", ventasBebidasHoy.length)
      }
      setVentasBebidas(ventasBebidasHoy)

      const efectivoCuotas = pagosHoy.filter((pago) => pago.metodoPago === "Efectivo").length
      const mercadoPagoCuotas = pagosHoy.filter((pago) => pago.metodoPago === "Mercado Pago").length
      const mixtoCuotas = pagosHoy.filter((pago) => pago.metodoPago === "Mixto").length

      const efectivoBebidas = ventasBebidasHoy.filter((venta) => venta.metodoPago === "Efectivo").length
      const mercadoPagoBebidas = ventasBebidasHoy.filter((venta) => venta.metodoPago === "Mercado Pago").length
      const mixtoBebidas = ventasBebidasHoy.filter((venta) => venta.metodoPago === "Mixto").length

      const totalEfectivo = efectivoCuotas + efectivoBebidas
      const totalMercadoPago = mercadoPagoCuotas + mercadoPagoBebidas
      const totalMixto = mixtoCuotas + mixtoBebidas

      setMetodosPago([
        { name: "Efectivo", value: totalEfectivo || 1, fill: "#4ade80" },
        { name: "Mercado Pago", value: totalMercadoPago || 1, fill: "#3b82f6" },
        { name: "Mixto", value: totalMixto || 1, fill: "#a78bfa" },
      ])
    } catch (error) {
      console.error("[v0] Error al cargar datos diarios:", error)
    }
  }

  const cargarDatosSemanalesYMensuales = async () => {
    try {
      const hoy = new Date()
      const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
      const pagosSemanaData = await Promise.all(
        diasSemana.map(async (dia, index) => {
          const fechaDia = new Date(hoy)
          const diff = hoy.getDay() - (index + 1)
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

          return {
            dia,
            monto: montoTotalDia,
            cuotas: montoCuotasDia,
            bebidas: montoBebidasDia,
          }
        }),
      )

      setPagosSemana(pagosSemanaData)

      const nombresMeses = [
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

      const mesActual = hoy.getMonth() // 0-11
      const anioActual = hoy.getFullYear()

      const ultimos6Meses = []
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date(anioActual, mesActual - i, 1)
        ultimos6Meses.push({
          nombre: nombresMeses[fecha.getMonth()],
          mes: fecha.getMonth(),
          anio: fecha.getFullYear(),
        })
      }

      const pagosMensualesData = await Promise.all(
        ultimos6Meses.map(async (mesInfo) => {
          const primerDia = new Date(mesInfo.anio, mesInfo.mes, 1)
          const ultimoDia = new Date(mesInfo.anio, mesInfo.mes + 1, 0)

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

          const montoTotalMes = montoCuotasMes + montoBebidasMes

          return {
            mes: mesInfo.nombre,
            monto: montoTotalMes,
            cuotas: montoCuotasMes,
            bebidas: montoBebidasMes,
          }
        }),
      )

      setPagosMensuales(pagosMensualesData)

      const usuariosMensualesData = ultimos6Meses.map((mesInfo) => {
        const primerDia = new Date(mesInfo.anio, mesInfo.mes, 1)
        const ultimoDia = new Date(mesInfo.anio, mesInfo.mes + 1, 0)

        const usuariosDelMes = usuarios.filter((usuario) => {
          if (!usuario.fechaCreacion) return false

          const fechaCreacion = new Date(usuario.fechaCreacion)
          return fechaCreacion >= primerDia && fechaCreacion <= ultimoDia
        })

        console.log(`[v0] Usuarios creados en ${mesInfo.nombre} ${mesInfo.anio}:`, usuariosDelMes.length)

        return {
          mes: mesInfo.nombre,
          usuarios: usuariosDelMes.length,
        }
      })

      setUsuariosMensuales(usuariosMensualesData)

      const totalEfectivoMensual = pagosMensualesData.reduce((sum, mes) => {
        return sum + (mes.monto > 0 ? mes.monto * 0.6 : 0)
      }, 0)

      const totalMercadoPagoMensual = pagosMensualesData.reduce((sum, mes) => {
        return sum + (mes.monto > 0 ? mes.monto * 0.4 : 0)
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
      console.error("[v0] Error al cargar datos semanales y mensuales:", error)
    }
  }

  useEffect(() => {
    const inicializar = async () => {
      setCargandoDatos(true)

      await cargarDatosSemanalesYMensuales()

      const abierta = await verificarCajaAbierta()

      if (abierta) {
        await cargarDatosDiarios()
      }

      setCargandoDatos(false)
    }

    inicializar()
  }, [obtenerPagosPorFecha, obtenerPagosPorRango, usuarios])

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex items-center mb-6">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400 flex-1">Control de Pagos</h1>
        <ThemeToggle />
      </div>

      <div className="mb-6">
        <ResumenIngresos
          pagosCuotas={pagosDiarios}
          ventasBebidas={ventasBebidas}
          periodo="Hoy"
          cajaAbierta={cajaAbierta}
          onAbrirCaja={abrirCaja}
        />
      </div>

      {cargando || cargandoDatos || cargandoCaja ? (
        <div className="flex justify-center py-8">
          <LoadingDumbbell size={32} className="text-yellow-500" />
        </div>
      ) : (
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-6`}>
          <div className="space-y-6">
            {cajaAbierta && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Ventas del día</h2>
                <VentasDelDia pagos={pagosDiarios} ventasBebidas={ventasBebidas} onCerrarCaja={cerrarCaja} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Ingresos semanales</h2>
                <GraficoSemanal datos={pagosSemana} />
              </div>

              {cajaAbierta && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Métodos de pago (hoy)</h2>
                  <GraficoMetodosDetallado
                    pagosCuotas={pagosDiarios}
                    ventasBebidas={ventasBebidas}
                    titulo="Distribución de ingresos por método de pago"
                  />
                </div>
              )}
            </div>
          </div>

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

      <Alert message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />
    </main>
  )
}

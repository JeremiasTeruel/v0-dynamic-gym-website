"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { ArrowLeft } from "lucide-react"
import GraficoSemanal from "@/components/grafico-semanal"
import GraficoMensual from "@/components/grafico-mensual"
import GraficoMetodosPago from "@/components/grafico-metodos-pago"
import GraficoMetodosMensual from "@/components/grafico-metodos-mensual"
import GraficoMetodosDetallado from "@/components/grafico-metodos-detallado"
import GraficoUsuarios from "@/components/grafico-usuarios"
import GraficoUsuariosDiario from "@/components/grafico-usuarios-diario"
import ResumenIngresos from "@/components/resumen-ingresos"
import CerrarCajaModal from "@/components/cerrar-caja-modal"
import LoadingDumbbell from "@/components/loading-dumbbell"
import Alert from "@/components/alert"
import ThemeToggle from "@/components/theme-toggle"

interface VentaBebida {
  id: string
  nombreBebida: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  metodoPago: string
  montoEfectivo?: number
  montoMercadoPago?: number
  fecha: string
}

export default function ControlPagos() {
  const { usuarios, pagos, cargandoPagos, obtenerPagosPorFecha, obtenerPagosPorRango } = useGymContext()
  const [ventasBebidas, setVentasBebidas] = useState<VentaBebida[]>([])
  const [cargandoVentas, setCargandoVentas] = useState(true)
  const [cerrarCajaModalAbierto, setCerrarCajaModalAbierto] = useState(false)
  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })

  // Cargar ventas de bebidas
  useEffect(() => {
    cargarVentasBebidas()
  }, [])

  const cargarVentasBebidas = async () => {
    try {
      setCargandoVentas(true)
      const response = await fetch("/api/ventas-bebidas")

      if (!response.ok) {
        throw new Error("Error al cargar ventas de bebidas")
      }

      const ventas = await response.json()
      setVentasBebidas(ventas)
    } catch (error) {
      console.error("Error al cargar ventas de bebidas:", error)
    } finally {
      setCargandoVentas(false)
    }
  }

  // Calcular datos para los gráficos
  const datosGraficos = useMemo(() => {
    const hoy = new Date()
    const inicioSemana = new Date(hoy)
    inicioSemana.setDate(hoy.getDate() - hoy.getDay())

    // Datos semanales (solo hasta hoy)
    const datosSemana = []
    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

    for (let i = 0; i <= hoy.getDay(); i++) {
      const fecha = new Date(inicioSemana)
      fecha.setDate(inicioSemana.getDate() + i)
      const fechaStr = fecha.toISOString().split("T")[0]

      const pagosDia = pagos.filter((pago) => pago.fecha === fechaStr)
      const ventasDia = ventasBebidas.filter((venta) => venta.fecha === fechaStr)

      const totalCuotas = pagosDia.reduce((sum, pago) => sum + pago.monto, 0)
      const totalBebidas = ventasDia.reduce((sum, venta) => sum + venta.precioTotal, 0)

      datosSemana.push({
        dia: diasSemana[i],
        cuotas: totalCuotas,
        bebidas: totalBebidas,
        total: totalCuotas + totalBebidas,
      })
    }

    // Datos mensuales (últimos 6 meses hasta el actual)
    const datosMensual = []
    const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const mesIndex = fecha.getMonth()
      const año = fecha.getFullYear()

      // Solo incluir meses hasta el actual
      if (fecha > hoy) continue

      const inicioMes = new Date(año, mesIndex, 1).toISOString().split("T")[0]
      const finMes =
        mesIndex === hoy.getMonth() && año === hoy.getFullYear()
          ? hoy.toISOString().split("T")[0]
          : new Date(año, mesIndex + 1, 0).toISOString().split("T")[0]

      const pagosMes = pagos.filter((pago) => pago.fecha >= inicioMes && pago.fecha <= finMes)
      const ventasMes = ventasBebidas.filter((venta) => venta.fecha >= inicioMes && venta.fecha <= finMes)

      const totalCuotas = pagosMes.reduce((sum, pago) => sum + pago.monto, 0)
      const totalBebidas = ventasMes.reduce((sum, venta) => sum + venta.precioTotal, 0)

      datosMensual.push({
        mes: mesesNombres[mesIndex],
        cuotas: totalCuotas,
        bebidas: totalBebidas,
        total: totalCuotas + totalBebidas,
      })
    }

    // Datos de usuarios nuevos por mes (últimos 6 meses)
    const datosUsuariosMensual = []
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const mesIndex = fecha.getMonth()
      const año = fecha.getFullYear()

      if (fecha > hoy) continue

      const inicioMes = new Date(año, mesIndex, 1).toISOString().split("T")[0]
      const finMes =
        mesIndex === hoy.getMonth() && año === hoy.getFullYear()
          ? hoy.toISOString().split("T")[0]
          : new Date(año, mesIndex + 1, 0).toISOString().split("T")[0]

      const usuariosNuevosMes = usuarios.filter((usuario) => {
        const fechaInicio = new Date(usuario.fechaInicio).toISOString().split("T")[0]
        return fechaInicio >= inicioMes && fechaInicio <= finMes
      }).length

      datosUsuariosMensual.push({
        mes: mesesNombres[mesIndex],
        usuarios: usuariosNuevosMes,
      })
    }

    // Usuarios nuevos hoy
    const hoyStr = hoy.toISOString().split("T")[0]
    const usuariosNuevosHoy = usuarios.filter((usuario) => {
      const fechaInicio = new Date(usuario.fechaInicio).toISOString().split("T")[0]
      return fechaInicio === hoyStr
    }).length

    return {
      semanal: datosSemana,
      mensual: datosMensual,
      usuariosMensual: datosUsuariosMensual,
      usuariosHoy: usuariosNuevosHoy,
    }
  }, [pagos, ventasBebidas, usuarios])

  // Calcular pagos y ventas del día
  const hoy = new Date().toISOString().split("T")[0]
  const pagosDia = pagos.filter((pago) => pago.fecha === hoy)
  const ventasDia = ventasBebidas.filter((venta) => venta.fecha === hoy)

  const totalPagosDia = pagosDia.reduce((sum, pago) => sum + pago.monto, 0)
  const totalVentasDia = ventasDia.reduce((sum, venta) => sum + venta.precioTotal, 0)
  const totalDia = totalPagosDia + totalVentasDia

  const handleCerrarCaja = async (cantidadNuevosUsuarios: number, detalleNuevosUsuarios: any[]) => {
    try {
      // Calcular totales por método de pago para cuotas
      const totalEfectivoCuotas = pagosDia
        .filter((pago) => pago.metodoPago === "Efectivo")
        .reduce((sum, pago) => sum + pago.monto, 0)

      const totalMercadoPagoCuotas = pagosDia
        .filter((pago) => pago.metodoPago === "Mercado Pago")
        .reduce((sum, pago) => sum + pago.monto, 0)

      const totalMixtoEfectivoCuotas = pagosDia
        .filter((pago) => pago.metodoPago === "Mixto")
        .reduce((sum, pago) => sum + (pago.montoEfectivo || 0), 0)

      const totalMixtoMercadoPagoCuotas = pagosDia
        .filter((pago) => pago.metodoPago === "Mixto")
        .reduce((sum, pago) => sum + (pago.montoMercadoPago || 0), 0)

      // Calcular totales por método de pago para bebidas
      const totalEfectivoBebidas = ventasDia
        .filter((venta) => venta.metodoPago === "Efectivo")
        .reduce((sum, venta) => sum + venta.precioTotal, 0)

      const totalMercadoPagoBebidas = ventasDia
        .filter((venta) => venta.metodoPago === "Mercado Pago")
        .reduce((sum, venta) => sum + venta.precioTotal, 0)

      const totalMixtoEfectivoBebidas = ventasDia
        .filter((venta) => venta.metodoPago === "Mixto")
        .reduce((sum, venta) => sum + (venta.montoEfectivo || 0), 0)

      const totalMixtoMercadoPagoBebidas = ventasDia
        .filter((venta) => venta.metodoPago === "Mixto")
        .reduce((sum, venta) => sum + (venta.montoMercadoPago || 0), 0)

      // Totales combinados
      const totalEfectivo = totalEfectivoCuotas + totalEfectivoBebidas
      const totalMercadoPago = totalMercadoPagoCuotas + totalMercadoPagoBebidas
      const totalMixtoEfectivo = totalMixtoEfectivoCuotas + totalMixtoEfectivoBebidas
      const totalMixtoMercadoPago = totalMixtoMercadoPagoCuotas + totalMixtoMercadoPagoBebidas

      const totalCuotas =
        totalEfectivoCuotas + totalMercadoPagoCuotas + totalMixtoEfectivoCuotas + totalMixtoMercadoPagoCuotas
      const totalBebidas =
        totalEfectivoBebidas + totalMercadoPagoBebidas + totalMixtoEfectivoBebidas + totalMixtoMercadoPagoBebidas

      const detalleVentasBebidas = ventasDia.map((venta) => ({
        nombre: venta.nombreBebida,
        cantidad: venta.cantidad,
        total: venta.precioTotal,
        metodoPago: venta.metodoPago,
      }))

      const response = await fetch("/api/caja/cerrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha: hoy,
          totalEfectivo,
          totalMercadoPago,
          totalMixtoEfectivo,
          totalMixtoMercadoPago,
          totalCuotas,
          totalCuotasEfectivo: 0, // Placeholder for totalCuotasEfectivo
          totalCuotasMercadoPago: 0, // Placeholder for totalCuotasMercadoPago
          totalCuotasMixtoEfectivo: totalMixtoEfectivoCuotas,
          totalCuotasMixtoMercadoPago: totalMixtoMercadoPagoCuotas,
          totalBebidas,
          totalBebidasEfectivo: 0, // Placeholder for totalBebidasEfectivo
          totalBebidasMercadoPago: 0, // Placeholder for totalBebidasMercadoPago
          totalBebidasMixtoEfectivo: totalMixtoEfectivoBebidas,
          totalBebidasMixtoMercadoPago: totalMixtoMercadoPagoBebidas,
          totalGeneral: totalDia,
          cantidadPagos: pagosDia.length,
          cantidadVentasBebidas: ventasDia.length,
          cantidadNuevosUsuarios,
          detalleVentasBebidas,
          detalleNuevosUsuarios,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al cerrar la caja")
      }

      setAlertaInfo({
        mensaje: "Caja cerrada exitosamente",
        visible: true,
        tipo: "success",
      })

      setCerrarCajaModalAbierto(false)
    } catch (error) {
      console.error("Error al cerrar caja:", error)
      setAlertaInfo({
        mensaje: "Error al cerrar la caja. Por favor, intenta de nuevo.",
        visible: true,
        tipo: "error",
      })
    }
  }

  if (cargandoPagos || cargandoVentas) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingDumbbell size={48} className="text-green-500" />
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link
              href="/admin"
              className="mr-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">Control de Pagos</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Resumen de ingresos y botón de cerrar caja */}
        <div className="mb-8">
          <ResumenIngresos
            totalDia={totalDia}
            cantidadTransacciones={pagosDia.length + ventasDia.length}
            onCerrarCaja={() => setCerrarCajaModalAbierto(true)}
          />
        </div>

        {/* Gráficos de usuarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de usuarios mensuales */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Nuevos Usuarios por Mes (Últimos 6 meses)
            </h3>
            <GraficoUsuarios datos={datosGraficos.usuariosMensual} />
          </div>

          {/* Gráfico de usuarios del día */}
          <GraficoUsuariosDiario usuariosHoy={datosGraficos.usuariosHoy} />
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico semanal */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ingresos de la Semana</h3>
            <GraficoSemanal datos={datosGraficos.semanal} />
          </div>

          {/* Gráfico mensual */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Ingresos Mensuales (Últimos 6 meses)
            </h3>
            <GraficoMensual datos={datosGraficos.mensual} />
          </div>
        </div>

        {/* Gráficos de métodos de pago */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Métodos de Pago (Hoy)</h3>
            <GraficoMetodosPago pagos={pagosDia} ventasBebidas={ventasDia} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Métodos de Pago (Este Mes)</h3>
            <GraficoMetodosMensual pagos={pagos} ventasBebidas={ventasBebidas} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Desglose Detallado (Hoy)</h3>
            <GraficoMetodosDetallado pagos={pagosDia} ventasBebidas={ventasDia} />
          </div>
        </div>
      </div>

      {/* Modal de cerrar caja */}
      <CerrarCajaModal
        isOpen={cerrarCajaModalAbierto}
        onClose={() => setCerrarCajaModalAbierto(false)}
        onConfirm={handleCerrarCaja}
        pagosDia={pagosDia}
        ventasBebidas={ventasDia}
        totalDia={totalDia}
        usuarios={usuarios}
      />

      {/* Alerta */}
      <Alert
        message={alertaInfo.mensaje}
        isOpen={alertaInfo.visible}
        onClose={() => setAlertaInfo((prev) => ({ ...prev, visible: false }))}
        type={alertaInfo.tipo}
      />
    </main>
  )
}

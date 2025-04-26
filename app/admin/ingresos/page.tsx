"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { RefreshCw, ArrowLeft, CreditCard, BadgeDollarSign, Calendar } from "lucide-react"
import MonthlyChart from "@/components/chart"
import { useMobile } from "@/hooks/use-mobile"
import type { Payment } from "@/models/payment"

// Importar el nuevo componente de carga
import LoadingDumbbell from "@/components/loading-dumbbell"

// Definir las funciones utilitarias directamente en este archivo
// Función para formatear el monto en pesos argentinos
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Función para agrupar pagos por mes
function groupPaymentsByMonth(payments: Payment[]): { [key: string]: number } {
  const grouped = payments.reduce(
    (acc, payment) => {
      const date = new Date(payment.date)
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`

      if (!acc[monthYear]) {
        acc[monthYear] = 0
      }

      acc[monthYear] += payment.amount
      return acc
    },
    {} as { [key: string]: number },
  )

  return grouped
}

// Función para obtener el total del mes actual
function getCurrentMonthTotal(payments: Payment[]): number {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return payments.reduce((total, payment) => {
    const paymentDate = new Date(payment.date)
    if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
      return total + payment.amount
    }
    return total
  }, 0)
}

export default function Ingresos() {
  const { pagos, cargandoPagos, recargarPagos } = useGymContext()
  const [recargando, setRecargando] = useState(false)
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0)
  const [monthlyData, setMonthlyData] = useState<{ [key: string]: number }>({})
  const [currentMonthKey, setCurrentMonthKey] = useState("")
  const isMobile = useMobile()

  useEffect(() => {
    if (pagos.length > 0) {
      // Calcular el total del mes actual
      const total = getCurrentMonthTotal(pagos)
      setCurrentMonthTotal(total)

      // Agrupar pagos por mes
      const grouped = groupPaymentsByMonth(pagos)
      setMonthlyData(grouped)

      // Determinar la clave del mes actual
      const now = new Date()
      const currentMonth = `${now.getMonth() + 1}/${now.getFullYear()}`
      setCurrentMonthKey(currentMonth)
    }
  }, [pagos])

  const handleRecargar = async () => {
    try {
      setRecargando(true)
      await recargarPagos()
    } catch (error) {
      console.error("Error al recargar pagos:", error)
    } finally {
      setRecargando(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 pb-24 md:pb-8">
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link
              href="/admin"
              className="mr-2 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-green-600">Ingresos de Dynamic Gym</h1>
          </div>
          <button
            onClick={handleRecargar}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            disabled={recargando || cargandoPagos}
            title="Recargar datos"
          >
            <RefreshCw className={`h-5 w-5 ${recargando ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center text-green-600 mb-2">
              <BadgeDollarSign className="h-5 w-5 mr-2" />
              <h2 className="font-semibold">Total del Mes</h2>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(currentMonthTotal)}</p>
            <p className="text-sm text-gray-500">
              Mes de {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center text-blue-600 mb-2">
              <CreditCard className="h-5 w-5 mr-2" />
              <h2 className="font-semibold">Cantidad de Pagos</h2>
            </div>
            <p className="text-2xl font-bold">
              {
                pagos.filter((p) => {
                  const now = new Date()
                  const paymentDate = new Date(p.date)
                  return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
                }).length
              }
            </p>
            <p className="text-sm text-gray-500">Este mes</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center text-purple-600 mb-2">
              <Calendar className="h-5 w-5 mr-2" />
              <h2 className="font-semibold">Promedio por Pago</h2>
            </div>
            {(() => {
              const currentMonthPayments = pagos.filter((p) => {
                const now = new Date()
                const paymentDate = new Date(p.date)
                return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
              })

              const count = currentMonthPayments.length
              const average = count > 0 ? currentMonthTotal / count : 0

              return (
                <>
                  <p className="text-2xl font-bold">{formatCurrency(average)}</p>
                  <p className="text-sm text-gray-500">Este mes</p>
                </>
              )
            })()}
          </div>
        </div>

        {/* Gráfico de ingresos mensuales */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <h2 className="text-xl font-semibold mb-4">Evolución de Ingresos Mensuales</h2>
          {Object.keys(monthlyData).length > 0 ? (
            <MonthlyChart data={monthlyData} currentMonth={currentMonthKey} />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No hay datos suficientes para mostrar el gráfico
            </div>
          )}
        </div>

        {/* Lista de pagos */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Historial de Pagos</h2>
            <p className="text-sm text-gray-500">Mostrando {pagos.length} pagos en total</p>
          </div>

          {cargandoPagos ? (
            <div className="flex justify-center p-8">
              <LoadingDumbbell size={48} />
            </div>
          ) : pagos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay pagos registrados</div>
          ) : (
            <>
              {/* Vista de escritorio */}
              {!isMobile && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Usuario</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Método de Pago</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pagos.map((pago) => (
                        <tr key={pago._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{formatDate(pago.date)}</td>
                          <td className="px-4 py-3">{pago.userName}</td>
                          <td className="px-4 py-3 text-sm">{pago.paymentMethod}</td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(pago.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Vista móvil */}
              {isMobile && (
                <div className="divide-y divide-gray-200">
                  {pagos.map((pago) => (
                    <div key={pago._id} className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{pago.userName}</span>
                        <span className="font-bold text-green-600">{formatCurrency(pago.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{formatDate(pago.date)}</span>
                        <span>{pago.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

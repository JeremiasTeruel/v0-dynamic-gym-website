"use client"

import { useState, useMemo } from "react"
import { DollarSign, ShoppingCart } from "lucide-react"
import CerrarCajaModal from "@/components/cerrar-caja-modal"
import Alert from "@/components/alert"
import type { RegistroPago } from "@/context/gym-context"
import { useGymContext } from "@/context/gym-context"

interface VentaBebida {
  id: string
  nombreBebida: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  metodoPago: string
  fecha: string
}

interface VentasDelDiaProps {
  pagos: RegistroPago[]
  ventasBebidas: VentaBebida[]
  onCerrarCaja?: () => Promise<void>
}

export default function VentasDelDia({ pagos = [], ventasBebidas = [], onCerrarCaja }: VentasDelDiaProps) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })

  const { usuarios } = useGymContext()

  const totalPagos = useMemo(() => {
    return pagos.reduce((sum, pago) => sum + pago.monto, 0)
  }, [pagos])

  const totalBebidas = useMemo(() => {
    return ventasBebidas.reduce((sum, venta) => sum + venta.precioTotal, 0)
  }, [ventasBebidas])

  const totalDelDia = totalPagos + totalBebidas

  const nuevosUsuariosHoy = useMemo(() => {
    const hoy = new Date().toISOString().split("T")[0]
    return usuarios.filter((usuario) => {
      const fechaInicio = new Date(usuario.fechaInicio).toISOString().split("T")[0]
      return fechaInicio === hoy
    }).length
  }, [usuarios])

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
  }

  const handleCerrarCaja = async () => {
    try {
      if (onCerrarCaja) {
        await onCerrarCaja()
        setAlertaInfo({
          mensaje: "Caja cerrada correctamente. Los ingresos se han registrado en los reportes.",
          visible: true,
          tipo: "success",
        })
      }
    } catch (error) {
      console.error("Error al cerrar caja:", error)
      setAlertaInfo({
        mensaje: "Error al cerrar la caja. Por favor, intenta de nuevo.",
        visible: true,
        tipo: "error",
      })
    }
  }

  if (pagos.length === 0 && ventasBebidas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No han ingresado pagos ni ventas el día de la fecha.
      </div>
    )
  }

  return (
    <div>
      {/* Resumen de ingresos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Cuotas */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Cuotas</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatMonto(totalPagos)}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">{pagos.length} pagos</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Total Bebidas */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Bebidas</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatMonto(totalBebidas)}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{ventasBebidas.length} ventas</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Total General */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatMonto(totalDelDia)}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {pagos.length + ventasBebidas.length} transacciones
              </p>
            </div>
            <div className="flex flex-col items-center">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400 -mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Tablas de transacciones */}
      <div className="space-y-6">
        {/* Tabla de Pagos de Cuotas */}
        {pagos.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Pagos de Cuotas ({pagos.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Método
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {pago.userNombre}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {pago.userDni}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatMonto(pago.monto)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {pago.metodoPago}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabla de Ventas de Bebidas */}
        {ventasBebidas.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Ventas de Bebidas ({ventasBebidas.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Método
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {ventasBebidas.map((venta) => (
                    <tr key={venta.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {venta.nombreBebida}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {venta.cantidad}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatMonto(venta.precioUnitario)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatMonto(venta.precioTotal)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {venta.metodoPago}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Botón Cerrar Caja */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-center">
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={totalDelDia === 0}
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Cerrar Caja
          </button>
        </div>

        {totalDelDia === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            No hay ingresos para cerrar la caja
          </p>
        )}
      </div>

      {/* Modal de Cerrar Caja */}
      <CerrarCajaModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onConfirm={handleCerrarCaja}
        pagosDia={pagos}
        ventasBebidas={ventasBebidas}
        totalDia={totalDelDia}
        nuevosUsuarios={nuevosUsuariosHoy}
      />

      {/* Alerta */}
      <Alert
        message={alertaInfo.mensaje}
        isOpen={alertaInfo.visible}
        onClose={() => setAlertaInfo((prev) => ({ ...prev, visible: false }))}
        type={alertaInfo.tipo}
      />
    </div>
  )
}

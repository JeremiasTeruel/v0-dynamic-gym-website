"use client"

import { useState, useMemo } from "react"
import { DollarSign } from "lucide-react"
import CerrarCajaModal from "@/components/cerrar-caja-modal"
import Alert from "@/components/alert"
import type { RegistroPago } from "@/context/gym-context"

interface PagosDelDiaProps {
  pagos: RegistroPago[]
  onCerrarCaja?: () => Promise<void>
}

export default function PagosDelDia({ pagos = [], onCerrarCaja }: PagosDelDiaProps) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [alertaInfo, setAlertaInfo] = useState<{ mensaje: string; visible: boolean; tipo: "success" | "error" }>({
    mensaje: "",
    visible: false,
    tipo: "success",
  })

  const totalDelDia = useMemo(() => {
    return pagos.reduce((sum, pago) => sum + pago.monto, 0)
  }, [pagos])

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

  if (!pagos || pagos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No han ingresado pagos el día de la fecha.
      </div>
    )
  }

  return (
    <div>
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
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{pago.userDni}</td>
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

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Total del día:</span>
          <span className="font-bold text-xl text-green-600 dark:text-green-400">{formatMonto(totalDelDia)}</span>
        </div>

        {/* Botón Cerrar Caja */}
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
        totalDia={totalDelDia}
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

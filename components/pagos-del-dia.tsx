"use client"

import { useMemo } from "react"
import type { RegistroPago } from "@/context/gym-context"

interface PagosDelDiaProps {
  pagos: RegistroPago[]
}

export default function PagosDelDia({ pagos = [] }: PagosDelDiaProps) {
  const totalDelDia = useMemo(() => {
    return pagos.reduce((sum, pago) => sum + pago.monto, 0)
  }, [pagos])

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
  }

  if (!pagos || pagos.length === 0) {
    return <div className="text-center py-8 text-gray-500">No han ingresado pagos el día de la fecha.</div>
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pagos.map((pago) => (
              <tr key={pago.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{pago.userNombre}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{pago.userDni}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatMonto(pago.monto)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{pago.metodoPago}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
        <span className="font-bold text-lg">Total del día:</span>
        <span className="font-bold text-xl text-green-600">{formatMonto(totalDelDia)}</span>
      </div>
    </div>
  )
}

// Definición del modelo de pago
export interface Payment {
  _id?: string
  userId: string
  userName: string
  date: string
  amount: number
  paymentMethod: string
  createdAt: string
}

// Función para formatear el monto en pesos argentinos
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Función para agrupar pagos por mes
export function groupPaymentsByMonth(payments: Payment[]): { [key: string]: number } {
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
export function getCurrentMonthTotal(payments: Payment[]): number {
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

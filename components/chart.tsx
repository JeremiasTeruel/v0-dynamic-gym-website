"use client"

import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"

// Función para formatear el monto en pesos argentinos
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount)
}

interface ChartProps {
  data: { [key: string]: number }
  currentMonth: string
}

export default function MonthlyChart({ data, currentMonth }: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<"bar">>()

  useEffect(() => {
    if (!chartRef.current || Object.keys(data).length === 0) return

    // Destruir el gráfico anterior si existe
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const months = Object.keys(data).sort((a, b) => {
      const [monthA, yearA] = a.split("/")
      const [monthB, yearB] = b.split("/")
      const dateA = new Date(Number(yearA), Number(monthA) - 1)
      const dateB = new Date(Number(yearB), Number(monthB) - 1)
      return dateA.getTime() - dateB.getTime()
    })

    const values = months.map((month) => data[month])

    const backgroundColor = months.map((month) =>
      month === currentMonth ? "rgba(34, 197, 94, 0.8)" : "rgba(156, 163, 175, 0.5)",
    )

    const labels = months.map((month) => {
      const [m, y] = month.split("/")
      const date = new Date(Number(y), Number(m) - 1)
      return date.toLocaleDateString("es-AR", { month: "short", year: "numeric" })
    })

    const ctx = chartRef.current.getContext("2d")

    chartInstance.current = new Chart(ctx!, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Ingresos por Mes",
            data: values,
            backgroundColor,
            borderColor: "rgba(34, 197, 94, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "$ " + value.toLocaleString("es-AR"),
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || ""
                if (label) {
                  label += ": "
                }
                if (context.parsed.y !== null) {
                  label += formatCurrency(context.parsed.y)
                }
                return label
              },
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, currentMonth])

  return (
    <div className="w-full h-80">
      <canvas ref={chartRef}></canvas>
    </div>
  )
}

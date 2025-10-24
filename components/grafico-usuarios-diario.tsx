"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useTheme } from "@/context/theme-context"
import { UserPlus } from "lucide-react"

interface GraficoUsuariosDiarioProps {
  usuariosHoy: number
}

export default function GraficoUsuariosDiario({ usuariosHoy }: GraficoUsuariosDiarioProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const datos = [
    {
      dia: "Hoy",
      usuarios: usuariosHoy,
    },
  ]

  const maxValue = Math.max(usuariosHoy, 5) // Mínimo 5 para que el gráfico se vea bien

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <UserPlus className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
          Nuevos Usuarios Hoy
        </h3>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{usuariosHoy}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {usuariosHoy === 1 ? "usuario nuevo" : "usuarios nuevos"}
          </p>
        </div>
      </div>

      {usuariosHoy > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
              <XAxis
                dataKey="dia"
                tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
                axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
              />
              <YAxis
                domain={[0, maxValue]}
                tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
                axisLine={{ stroke: isDark ? "#6b7280" : "#9ca3af" }}
              />
              <Tooltip
                formatter={(value) => [value, "Nuevos usuarios"]}
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                  borderRadius: "6px",
                  color: isDark ? "#f3f4f6" : "#111827",
                }}
              />
              <Bar dataKey="usuarios" radius={[8, 8, 0, 0]}>
                {datos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={isDark ? "#22c55e" : "#16a34a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <div className="text-center">
            <UserPlus className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No hay nuevos usuarios hoy</p>
          </div>
        </div>
      )}
    </div>
  )
}

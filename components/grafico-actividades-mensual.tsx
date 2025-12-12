"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTheme } from "@/components/theme-provider"

interface DatosActividadMensual {
  mes: string
  Normal: number
  Familiar: number
  BJJ: number
  MMA: number
  Boxeo: number
  Convenio: number
  Dia: number
  Referees: number
}

interface GraficoActividadesMensualProps {
  datos: DatosActividadMensual[]
}

// Colores para cada actividad
const COLORES_ACTIVIDADES = {
  Normal: "#3b82f6", // Azul
  Familiar: "#10b981", // Verde
  BJJ: "#f59e0b", // Amarillo/Naranja
  MMA: "#ef4444", // Rojo
  Boxeo: "#8b5cf6", // Violeta
  Convenio: "#06b6d4", // Cyan
  Dia: "#f97316", // Naranja
  Referees: "#ec4899", // Rosa
}

export default function GraficoActividadesMensual({ datos }: GraficoActividadesMensualProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const textColor = isDark ? "#e5e7eb" : "#374151"
  const gridColor = isDark ? "#374151" : "#e5e7eb"

  // Filtrar actividades que tienen al menos un usuario en algún mes
  const actividadesConDatos = Object.keys(COLORES_ACTIVIDADES).filter((actividad) =>
    datos.some((mes) => (mes[actividad as keyof typeof COLORES_ACTIVIDADES] || 0) > 0),
  )

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={datos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="mes" tick={{ fill: textColor, fontSize: 12 }} />
        <YAxis tick={{ fill: textColor, fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            borderRadius: "8px",
            color: textColor,
          }}
          formatter={(value: number, name: string) => [`${value} usuarios`, name]}
        />
        <Legend
          wrapperStyle={{ color: textColor, fontSize: 12 }}
          formatter={(value) => <span style={{ color: textColor }}>{value}</span>}
        />
        {actividadesConDatos.map((actividad) => (
          <Bar
            key={actividad}
            dataKey={actividad}
            fill={COLORES_ACTIVIDADES[actividad as keyof typeof COLORES_ACTIVIDADES]}
            stackId="actividades"
            radius={actividad === actividadesConDatos[actividadesConDatos.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

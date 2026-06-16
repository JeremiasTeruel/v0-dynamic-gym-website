import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// GET - Obtener todas las fechas que tienen asistencias registradas con su cantidad.
// Combina el histórico permanente con los ingresos vivos (caja abierta actual).
export async function GET() {
  try {
    const db = await getMongoDb()
    const historico = db.collection("asistencias_historico")
    const ingresos = db.collection("ingresos")

    const conteo: Record<string, number> = {}

    const histAgg = await historico.aggregate([{ $group: { _id: "$fecha", cantidad: { $sum: 1 } } }]).toArray()
    histAgg.forEach((h) => {
      if (h._id) conteo[h._id] = (conteo[h._id] || 0) + h.cantidad
    })

    const ingAgg = await ingresos.aggregate([{ $group: { _id: "$fecha", cantidad: { $sum: 1 } } }]).toArray()
    ingAgg.forEach((h) => {
      if (h._id) conteo[h._id] = (conteo[h._id] || 0) + h.cantidad
    })

    const fechas = Object.entries(conteo).map(([fecha, cantidad]) => ({ fecha, cantidad }))

    return NextResponse.json(fechas)
  } catch (error) {
    console.error("[v0] Error al obtener fechas de asistencias:", error)
    return NextResponse.json({ error: "Error al obtener fechas de asistencias: " + error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// GET - Obtener todas las fechas únicas de asistencias
export async function GET() {
  try {
    const db = await getMongoDb()
    const ingresosCollection = db.collection("ingresos")

    // Obtener fechas únicas ordenadas de más reciente a más antigua
    const fechasUnicas = await ingresosCollection.aggregate([
      {
        $group: {
          _id: "$fecha",
          cantidadAsistencias: { $sum: 1 },
          primerIngreso: { $min: "$timestamp" }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: 90 // Últimos 90 días con asistencias
      }
    ]).toArray()

    const fechasFormateadas = fechasUnicas.map((item) => ({
      fecha: item._id,
      cantidadAsistencias: item.cantidadAsistencias
    }))

    return NextResponse.json(fechasFormateadas)
  } catch (error) {
    console.error("[v0] Error al obtener fechas de asistencias:", error)
    return NextResponse.json({ error: "Error al obtener fechas de asistencias: " + error.message }, { status: 500 })
  }
}

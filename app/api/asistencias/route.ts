import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// GET - Obtener todas las fechas con asistencias registradas
export async function GET() {
  try {
    const db = await getMongoDb()
    const ingresosCollection = db.collection("ingresos")

    // Obtener todas las fechas únicas de ingresos
    const fechasUnicas = await ingresosCollection.aggregate([
      {
        $group: {
          _id: "$fecha",
          totalAsistencias: { $sum: 1 },
          primeraHora: { $min: "$hora" },
          ultimaHora: { $max: "$hora" }
        }
      },
      {
        $sort: { _id: -1 } // Ordenar por fecha descendente (más reciente primero)
      },
      {
        $limit: 365 // Limitar a últimos 365 días
      }
    ]).toArray()

    const asistenciasPorFecha = fechasUnicas.map(item => ({
      fecha: item._id,
      totalAsistencias: item.totalAsistencias,
      primeraHora: item.primeraHora,
      ultimaHora: item.ultimaHora
    }))

    return NextResponse.json(asistenciasPorFecha)
  } catch (error) {
    console.error("Error al obtener asistencias:", error)
    return NextResponse.json(
      { error: "Error al obtener asistencias: " + error.message },
      { status: 500 }
    )
  }
}

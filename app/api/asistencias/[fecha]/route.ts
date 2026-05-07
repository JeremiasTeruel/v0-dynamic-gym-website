import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// GET - Obtener asistencias de una fecha específica
export async function GET(
  request: Request,
  { params }: { params: { fecha: string } }
) {
  try {
    const { fecha } = await params

    if (!fecha) {
      return NextResponse.json(
        { error: "Fecha es requerida" },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const ingresosCollection = db.collection("ingresos")

    // Buscar ingresos de la fecha especificada
    const ingresos = await ingresosCollection
      .find({ fecha })
      .sort({ timestamp: 1 })
      .toArray()

    // Formatear los resultados
    const asistencias = ingresos.map((ingreso) => ({
      id: ingreso._id.toString(),
      dni: ingreso.dni,
      nombreApellido: ingreso.nombreApellido,
      actividad: ingreso.actividad,
      fechaVencimiento: ingreso.fechaVencimiento,
      foto: ingreso.foto,
      hora: ingreso.hora,
      timestamp: ingreso.timestamp
    }))

    return NextResponse.json({
      fecha,
      totalAsistencias: asistencias.length,
      asistencias
    })
  } catch (error) {
    console.error("Error al obtener asistencias por fecha:", error)
    return NextResponse.json(
      { error: "Error al obtener asistencias: " + error.message },
      { status: 500 }
    )
  }
}

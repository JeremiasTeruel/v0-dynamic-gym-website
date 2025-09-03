import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "ventas_bebidas"

// GET para obtener todas las ventas de bebidas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    let query = {}

    // Si se especifica una fecha, filtrar por esa fecha
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)

      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)

      query = {
        fecha: {
          $gte: fechaInicio,
          $lte: fechaFin,
        },
      }
    }

    const ventas = await collection.find(query).sort({ fecha: -1 }).toArray()

    // Convertir _id de MongoDB a id de string
    const ventasFormateadas = ventas.map((venta) => ({
      ...venta,
      id: venta._id.toString(),
      _id: undefined,
      fecha: venta.fecha.toISOString(),
    }))

    return NextResponse.json(ventasFormateadas)
  } catch (error) {
    console.error("API ERROR: Error al obtener ventas de bebidas:", error)
    return NextResponse.json(
      {
        error: "Error al obtener ventas de bebidas",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

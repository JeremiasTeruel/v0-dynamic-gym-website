import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "ventas_bebidas"

// GET para obtener ventas de bebidas por fecha
export async function GET(request: Request, { params }: { params: { fecha: string } }) {
  try {
    const fecha = params.fecha
    console.log(`API: Intentando obtener ventas de bebidas para la fecha ${fecha}...`)

    // Crear objetos Date para el inicio y fin del día
    const fechaInicio = new Date(fecha)
    fechaInicio.setHours(0, 0, 0, 0)

    const fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Buscar ventas entre fechaInicio y fechaFin
    const ventas = await collection
      .find({
        fecha: {
          $gte: fechaInicio,
          $lte: fechaFin,
        },
      })
      .toArray()

    console.log(`API: Se encontraron ${ventas.length} ventas de bebidas para la fecha ${fecha}`)

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
    const ventasFormateadas = ventas.map((venta) => ({
      ...venta,
      id: venta._id.toString(),
      _id: undefined,
      fecha: venta.fecha.toISOString(), // Convertir fecha a string ISO
    }))

    return NextResponse.json(ventasFormateadas)
  } catch (error) {
    console.error(`API ERROR: Error al obtener ventas de bebidas para la fecha ${params.fecha}:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener ventas de bebidas por fecha",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "ventas_bebidas"

// GET para obtener ventas de bebidas por rango de fechas
export async function GET(request: Request) {
  try {
    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const inicio = searchParams.get("inicio")
    const fin = searchParams.get("fin")

    if (!inicio || !fin) {
      return NextResponse.json({ error: "Se requieren fechas de inicio y fin" }, { status: 400 })
    }

    console.log(`API: Intentando obtener ventas de bebidas entre ${inicio} y ${fin}...`)

    // Crear objetos Date para el inicio y fin del rango
    const fechaInicio = new Date(inicio)
    fechaInicio.setHours(0, 0, 0, 0)

    const fechaFin = new Date(fin)
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

    console.log(`API: Se encontraron ${ventas.length} ventas de bebidas entre ${inicio} y ${fin}`)

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
    const ventasFormateadas = ventas.map((venta) => ({
      ...venta,
      id: venta._id.toString(),
      _id: undefined,
      fecha: venta.fecha.toISOString(), // Convertir fecha a string ISO
    }))

    return NextResponse.json(ventasFormateadas)
  } catch (error) {
    console.error("API ERROR: Error al obtener ventas de bebidas por rango de fechas:", error)
    return NextResponse.json(
      {
        error: "Error al obtener ventas de bebidas por rango de fechas",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

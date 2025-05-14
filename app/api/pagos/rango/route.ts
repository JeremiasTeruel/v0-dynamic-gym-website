import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "pagos"

// GET para obtener pagos por rango de fechas
export async function GET(request: Request) {
  try {
    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const inicio = searchParams.get("inicio")
    const fin = searchParams.get("fin")

    if (!inicio || !fin) {
      return NextResponse.json({ error: "Se requieren fechas de inicio y fin" }, { status: 400 })
    }

    console.log(`API: Intentando obtener pagos entre ${inicio} y ${fin}...`)

    // Crear objetos Date para el inicio y fin del rango
    const fechaInicio = new Date(inicio)
    fechaInicio.setHours(0, 0, 0, 0)

    const fechaFin = new Date(fin)
    fechaFin.setHours(23, 59, 59, 999)

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Buscar pagos entre fechaInicio y fechaFin
    const pagos = await collection
      .find({
        fecha: {
          $gte: fechaInicio,
          $lte: fechaFin,
        },
      })
      .toArray()

    console.log(`API: Se encontraron ${pagos.length} pagos entre ${inicio} y ${fin}`)

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
    const pagosFormateados = pagos.map((pago) => ({
      ...pago,
      id: pago._id.toString(),
      _id: undefined,
      fecha: pago.fecha.toISOString(), // Convertir fecha a string ISO
    }))

    return NextResponse.json(pagosFormateados)
  } catch (error) {
    console.error("API ERROR: Error al obtener pagos por rango de fechas:", error)
    return NextResponse.json(
      {
        error: "Error al obtener pagos por rango de fechas",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

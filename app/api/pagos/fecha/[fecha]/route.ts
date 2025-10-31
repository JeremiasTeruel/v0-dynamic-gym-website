import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "pagos"

// GET para obtener pagos por fecha
export async function GET(request: Request, { params }: { params: { fecha: string } }) {
  try {
    const fecha = params.fecha
    const { searchParams } = new URL(request.url)
    const desde = searchParams.get("desde") // Parámetro opcional para filtrar desde una hora específica

    console.log(`API: Intentando obtener pagos para la fecha ${fecha}...`)
    if (desde) {
      console.log(`API: Filtrando pagos desde ${desde}`)
    }

    // Crear objetos Date para el inicio y fin del día
    const fechaInicio = new Date(fecha)
    fechaInicio.setHours(0, 0, 0, 0)

    const fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const query: any = {
      fecha: {
        $gte: desde ? new Date(desde) : fechaInicio, // Si hay "desde", usar ese timestamp
        $lte: fechaFin,
      },
    }

    // Buscar pagos entre fechaInicio y fechaFin (o desde el timestamp especificado)
    const pagos = await collection.find(query).toArray()

    console.log(`API: Se encontraron ${pagos.length} pagos para la fecha ${fecha}`)

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
    const pagosFormateados = pagos.map((pago) => ({
      ...pago,
      id: pago._id.toString(),
      _id: undefined,
      fecha: pago.fecha.toISOString(), // Convertir fecha a string ISO
    }))

    return NextResponse.json(pagosFormateados)
  } catch (error) {
    console.error(`API ERROR: Error al obtener pagos para la fecha ${params.fecha}:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener pagos por fecha",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

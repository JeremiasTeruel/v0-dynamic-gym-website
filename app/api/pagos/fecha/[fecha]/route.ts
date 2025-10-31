import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "pagos"
const CIERRES_COLLECTION = "cierres_caja"

// GET para obtener pagos por fecha
export async function GET(request: Request, { params }: { params: { fecha: string } }) {
  try {
    const fecha = params.fecha
    console.log(`API: Intentando obtener pagos para la fecha ${fecha}...`)

    // Crear objetos Date para el inicio y fin del día
    const fechaInicio = new Date(fecha)
    fechaInicio.setHours(0, 0, 0, 0)

    const fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)
    const cierresCollection = db.collection(CIERRES_COLLECTION)

    const ultimoCierreCompleto = await cierresCollection.findOne(
      {
        fecha: {
          $gte: fechaInicio,
          $lte: fechaFin,
        },
        tipoCierre: "completo",
      },
      { sort: { horaCierre: -1 } },
    )

    console.log(`API: Último cierre completo encontrado:`, ultimoCierreCompleto?.horaCierre)

    const query: any = {
      fecha: {
        $gte: fechaInicio,
        $lte: fechaFin,
      },
    }

    // Si existe un cierre completo, filtrar solo pagos después del cierre
    if (ultimoCierreCompleto && ultimoCierreCompleto.horaCierre) {
      query.fecha.$gt = ultimoCierreCompleto.horaCierre
      console.log(`API: Filtrando pagos posteriores a ${ultimoCierreCompleto.horaCierre}`)
    }

    // Buscar pagos según el query
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

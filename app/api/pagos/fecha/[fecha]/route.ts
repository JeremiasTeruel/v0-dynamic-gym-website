import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "pagos"
const CIERRES_COLLECTION = "cierres_caja"

// GET para obtener pagos por fecha
export async function GET(request: Request, { params }: { params: { fecha: string } }) {
  try {
    const fecha = params.fecha
    console.log(`[v0] API: Intentando obtener pagos para la fecha ${fecha}...`)

    // Crear objetos Date para el inicio y fin del día
    const fechaInicio = new Date(fecha)
    fechaInicio.setHours(0, 0, 0, 0)

    const fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)

    console.log(`[v0] API: Rango de búsqueda - Inicio: ${fechaInicio.toISOString()}, Fin: ${fechaFin.toISOString()}`)

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)
    const cierresCollection = db.collection(CIERRES_COLLECTION)

    // Buscar el último cierre completo del día
    const ultimoCierreCompleto = await cierresCollection
      .find({
        fecha: {
          $gte: fechaInicio,
          $lte: fechaFin,
        },
        tipoCierre: "completo",
      })
      .sort({ fechaCierre: -1 })
      .limit(1)
      .toArray()

    let fechaDesde = fechaInicio

    // Si hay un cierre completo, solo mostrar pagos posteriores a ese cierre
    if (ultimoCierreCompleto.length > 0) {
      fechaDesde = new Date(ultimoCierreCompleto[0].fechaCierre)
      console.log(`[v0] API: Último cierre completo encontrado en ${fechaDesde.toISOString()}`)
      console.log(`[v0] API: Mostrando solo pagos posteriores al cierre`)
    } else {
      console.log(`[v0] API: No hay cierre completo, mostrando todos los pagos del día`)
    }

    // Buscar pagos desde fechaDesde hasta fechaFin
    const pagos = await collection
      .find({
        fecha: {
          $gte: fechaDesde,
          $lte: fechaFin,
        },
      })
      .toArray()

    console.log(`[v0] API: Se encontraron ${pagos.length} pagos para la fecha ${fecha}`)

    if (pagos.length > 0) {
      console.log(`[v0] API: Detalles de pagos encontrados:`)
      pagos.forEach((pago, index) => {
        console.log(`[v0] API: Pago ${index + 1}:`, {
          nombre: pago.userNombre,
          dni: pago.userDni,
          monto: pago.monto,
          fecha: pago.fecha,
          tipoPago: pago.tipoPago,
        })
      })
    }

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
    const pagosFormateados = pagos.map((pago) => ({
      ...pago,
      id: pago._id.toString(),
      _id: undefined,
      fecha: pago.fecha.toISOString(), // Convertir fecha a string ISO
    }))

    return NextResponse.json(pagosFormateados)
  } catch (error) {
    console.error(`[v0] API ERROR: Error al obtener pagos para la fecha ${params.fecha}:`, error)
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

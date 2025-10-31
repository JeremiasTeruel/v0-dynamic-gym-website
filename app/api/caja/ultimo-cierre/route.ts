import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "cierres_caja"

// GET para obtener el último cierre completo de caja del día actual
export async function GET() {
  try {
    console.log("API: Intentando obtener último cierre completo de caja...")

    // Obtener fecha de hoy
    const hoy = new Date()
    const fechaInicio = new Date(hoy)
    fechaInicio.setHours(0, 0, 0, 0)

    const fechaFin = new Date(hoy)
    fechaFin.setHours(23, 59, 59, 999)

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Buscar el último cierre completo del día actual
    const ultimoCierre = await collection
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

    if (ultimoCierre.length > 0) {
      console.log("API: Se encontró un cierre completo:", ultimoCierre[0].fechaCierre)
      return NextResponse.json({
        existe: true,
        fechaCierre: ultimoCierre[0].fechaCierre.toISOString(),
      })
    }

    console.log("API: No se encontró ningún cierre completo para hoy")
    return NextResponse.json({ existe: false })
  } catch (error) {
    console.error("API ERROR: Error al obtener último cierre de caja:", error)
    return NextResponse.json(
      {
        error: "Error al obtener último cierre de caja",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

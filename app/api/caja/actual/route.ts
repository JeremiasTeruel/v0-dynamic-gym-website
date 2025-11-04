import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION = "cajas"

// GET para obtener la caja actual
// IMPORTANTE: El sistema NO se rige por fecha. Busca cualquier caja con estado "abierta"
// sin importar cuándo fue abierta. Las cajas permanecen abiertas hasta cierre manual.
export async function GET() {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const cajaActual = await collection.findOne({
      estado: "abierta",
    })

    if (!cajaActual) {
      return NextResponse.json({ cajaAbierta: false, caja: null })
    }

    return NextResponse.json({
      cajaAbierta: true,
      caja: {
        ...cajaActual,
        id: cajaActual._id.toString(),
        _id: undefined,
      },
    })
  } catch (error) {
    console.error("[v0] Error al obtener caja actual:", error)
    return NextResponse.json({ error: "Error al obtener caja actual", details: error.message }, { status: 500 })
  }
}

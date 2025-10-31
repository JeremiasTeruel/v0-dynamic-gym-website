import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION = "cajas"

export async function GET() {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Buscar cualquier caja que esté abierta (sin importar la fecha)
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

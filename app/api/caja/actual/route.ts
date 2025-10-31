import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION = "cajas"

// GET para obtener la caja actual del día
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")

    if (!fecha) {
      return NextResponse.json({ error: "Fecha requerida" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Buscar caja abierta para la fecha especificada
    const cajaActual = await collection.findOne({
      fecha: new Date(fecha),
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

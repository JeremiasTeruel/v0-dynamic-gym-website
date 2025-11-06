import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// GET - Obtener ingresos de una caja específica
export async function GET(request: Request, { params }: { params: { cajaId: string } }) {
  try {
    const { cajaId } = params

    if (!cajaId) {
      return NextResponse.json({ error: "ID de caja es requerido" }, { status: 400 })
    }

    const db = await getMongoDb()
    const ingresosCollection = db.collection("ingresos")

    console.log("[v0] Obteniendo ingresos para caja:", cajaId)

    // Buscar ingresos de la caja específica
    const ingresos = await ingresosCollection.find({ cajaId }).sort({ timestamp: 1 }).toArray()

    console.log("[v0] Ingresos encontrados:", ingresos.length)

    // Convertir ObjectId a string
    const ingresosFormateados = ingresos.map((ingreso) => ({
      ...ingreso,
      _id: ingreso._id.toString(),
    }))

    return NextResponse.json(ingresosFormateados)
  } catch (error) {
    console.error("[v0] Error al obtener ingresos de caja:", error)
    return NextResponse.json({ error: "Error al obtener ingresos: " + error.message }, { status: 500 })
  }
}

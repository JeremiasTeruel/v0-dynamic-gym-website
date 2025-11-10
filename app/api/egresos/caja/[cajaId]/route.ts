import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION_EGRESOS = "egresos"

export async function GET(request: Request, { params }: { params: { cajaId: string } }) {
  try {
    const { cajaId } = params

    if (!cajaId) {
      return NextResponse.json({ error: "ID de caja requerido" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION_EGRESOS)

    const egresos = await collection.find({ cajaId }).sort({ fecha: -1 }).toArray()

    const egresosFormateados = egresos.map((egreso) => ({
      id: egreso._id.toString(),
      monto: egreso.monto,
      descripcion: egreso.descripcion,
      fecha: egreso.fecha.toISOString(),
      nombre: egreso.nombre,
      metodoPago: egreso.metodoPago || "Efectivo",
      cajaId: egreso.cajaId,
      fechaRegistro: egreso.fechaRegistro?.toISOString(),
    }))

    console.log(`[v0] Egresos encontrados para caja ${cajaId}:`, egresosFormateados.length)

    return NextResponse.json(egresosFormateados)
  } catch (error) {
    console.error("[v0] Error al obtener egresos por caja:", error)
    return NextResponse.json({ error: "Error al obtener egresos", details: error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION_EGRESOS = "egresos"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const inicio = searchParams.get("inicio")
    const fin = searchParams.get("fin")

    if (!inicio || !fin) {
      return NextResponse.json({ error: "Fechas de inicio y fin requeridas" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION_EGRESOS)

    const fechaInicio = new Date(inicio)
    const fechaFin = new Date(fin)
    fechaFin.setHours(23, 59, 59, 999)

    const egresos = await collection
      .find({
        fecha: {
          $gte: fechaInicio,
          $lte: fechaFin,
        },
      })
      .sort({ fecha: -1 })
      .toArray()

    const egresosFormateados = egresos.map((egreso) => ({
      id: egreso._id.toString(),
      monto: egreso.monto,
      descripcion: egreso.descripcion,
      fecha: egreso.fecha.toISOString(),
      nombre: egreso.nombre,
      cajaId: egreso.cajaId,
      fechaRegistro: egreso.fechaRegistro?.toISOString(),
    }))

    console.log(`[v0] Egresos encontrados en rango ${inicio} - ${fin}:`, egresosFormateados.length)

    return NextResponse.json(egresosFormateados)
  } catch (error) {
    console.error("[v0] Error al obtener egresos por rango:", error)
    return NextResponse.json({ error: "Error al obtener egresos", details: error.message }, { status: 500 })
  }
}

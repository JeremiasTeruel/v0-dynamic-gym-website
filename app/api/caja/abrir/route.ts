import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION = "cajas"

// POST para abrir una nueva caja
export async function POST(request: Request) {
  try {
    const { fecha } = await request.json()

    if (!fecha) {
      return NextResponse.json({ error: "Fecha requerida" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si ya existe una caja abierta para esta fecha
    const cajaExistente = await collection.findOne({
      fecha: new Date(fecha),
      estado: "abierta",
    })

    if (cajaExistente) {
      return NextResponse.json({ error: "Ya existe una caja abierta para esta fecha" }, { status: 400 })
    }

    // Crear nueva caja
    const nuevaCaja = {
      fecha: new Date(fecha),
      fechaApertura: new Date(),
      fechaCierre: null,
      estado: "abierta",
      totalEfectivo: 0,
      totalMercadoPago: 0,
      totalGeneral: 0,
      cantidadPagos: 0,
      cantidadVentasBebidas: 0,
    }

    const resultado = await collection.insertOne(nuevaCaja)

    if (resultado.acknowledged) {
      console.log("[v0] Caja abierta exitosamente:", resultado.insertedId)
      return NextResponse.json({
        ...nuevaCaja,
        id: resultado.insertedId.toString(),
      })
    }

    return NextResponse.json({ error: "Error al abrir caja" }, { status: 500 })
  } catch (error) {
    console.error("[v0] Error al abrir caja:", error)
    return NextResponse.json({ error: "Error al abrir caja", details: error.message }, { status: 500 })
  }
}

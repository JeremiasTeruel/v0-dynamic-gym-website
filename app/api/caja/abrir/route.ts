import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION = "cajas"

// POST para abrir una nueva caja
// IMPORTANTE: El sistema NO se rige por fecha. Las cajas permanecen abiertas
// indefinidamente hasta que se cierren manualmente, incluso si cambia la fecha.
export async function POST(request: Request) {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const cajaExistente = await collection.findOne({
      estado: "abierta",
    })

    if (cajaExistente) {
      return NextResponse.json(
        { error: "Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva." },
        { status: 400 },
      )
    }

    const ahora = new Date()
    const nuevaCaja = {
      fecha: ahora, // Fecha de referencia (solo informativa)
      fechaApertura: ahora, // Fecha/hora exacta de apertura
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
      console.log("[v0] Caja abierta exitosamente con ID:", resultado.insertedId)
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

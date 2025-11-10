import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION_EGRESOS = "egresos"

export async function POST(request: Request) {
  try {
    const { monto, descripcion, fecha, nombre, cajaId, metodoPago } = await request.json()

    if (!monto || !descripcion || !fecha || !nombre || !metodoPago) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (!cajaId) {
      return NextResponse.json(
        { error: "No hay caja abierta. Debe abrir una caja para registrar egresos." },
        { status: 400 },
      )
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION_EGRESOS)

    const nuevoEgreso = {
      monto: Number(monto),
      descripcion,
      fecha: new Date(fecha),
      nombre,
      cajaId,
      metodoPago,
      fechaRegistro: new Date(),
    }

    const resultado = await collection.insertOne(nuevoEgreso)

    console.log("[v0] Egreso registrado:", resultado.insertedId)

    return NextResponse.json({
      success: true,
      id: resultado.insertedId.toString(),
    })
  } catch (error) {
    console.error("[v0] Error al registrar egreso:", error)
    return NextResponse.json({ error: "Error al registrar egreso", details: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION_EGRESOS)

    const egresos = await collection.find({}).sort({ fecha: -1 }).toArray()

    const egresosFormateados = egresos.map((egreso) => ({
      id: egreso._id.toString(),
      monto: egreso.monto,
      descripcion: egreso.descripcion,
      fecha: egreso.fecha.toISOString(),
      nombre: egreso.nombre,
      cajaId: egreso.cajaId,
      metodoPago: egreso.metodoPago || "Efectivo",
      fechaRegistro: egreso.fechaRegistro?.toISOString(),
    }))

    return NextResponse.json(egresosFormateados)
  } catch (error) {
    console.error("[v0] Error al obtener egresos:", error)
    return NextResponse.json({ error: "Error al obtener egresos", details: error.message }, { status: 500 })
  }
}

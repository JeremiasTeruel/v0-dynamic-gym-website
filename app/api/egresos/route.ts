import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION_EGRESOS = "egresos"

// GET: Obtener todos los egresos
export async function GET() {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION_EGRESOS)

    const egresos = await collection.find({}).sort({ fecha: -1 }).toArray()

    const egresosFormateados = egresos.map((egreso) => ({
      id: egreso._id.toString(),
      monto: egreso.monto,
      descripcion: egreso.descripcion,
      fecha: egreso.fecha,
      profe: egreso.profe,
      cajaId: egreso.cajaId,
    }))

    return NextResponse.json(egresosFormateados)
  } catch (error) {
    console.error("[v0] Error al obtener egresos:", error)
    return NextResponse.json({ error: "Error al obtener egresos" }, { status: 500 })
  }
}

// POST: Crear un nuevo egreso
export async function POST(request: Request) {
  try {
    const { monto, descripcion, fecha, profe, cajaId } = await request.json()

    // Validaciones
    if (!monto || monto <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
    }

    if (!descripcion || descripcion.trim() === "") {
      return NextResponse.json({ error: "Descripción requerida" }, { status: 400 })
    }

    if (!fecha) {
      return NextResponse.json({ error: "Fecha requerida" }, { status: 400 })
    }

    if (!profe || profe.trim() === "") {
      return NextResponse.json({ error: "Profe requerido" }, { status: 400 })
    }

    if (!cajaId) {
      return NextResponse.json({ error: "ID de caja requerido" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION_EGRESOS)

    const nuevoEgreso = {
      monto: Number.parseFloat(monto),
      descripcion: descripcion.trim(),
      fecha: new Date(fecha),
      profe: profe.trim(),
      cajaId,
      fechaCreacion: new Date(),
    }

    const resultado = await collection.insertOne(nuevoEgreso)

    return NextResponse.json({
      id: resultado.insertedId.toString(),
      ...nuevoEgreso,
    })
  } catch (error) {
    console.error("[v0] Error al crear egreso:", error)
    return NextResponse.json({ error: "Error al crear egreso" }, { status: 500 })
  }
}

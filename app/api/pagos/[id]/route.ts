import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection("pagos")

    const pago = await collection.findOne({ _id: new ObjectId(id) })
    if (!pago) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    await collection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      message: "Pago eliminado correctamente",
      pagoEliminado: {
        ...pago,
        id: pago._id.toString(),
        _id: undefined,
      },
    })
  } catch (error: any) {
    console.error("API ERROR: Error al eliminar pago:", error)
    return NextResponse.json({ error: "Error al eliminar pago", details: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { tipoPago, monto, metodoPago } = body

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection("pagos")

    const updateFields: Record<string, unknown> = {}

    if (tipoPago !== undefined) updateFields.tipoPago = tipoPago
    if (monto !== undefined) {
      const montoNumerico = Number.parseFloat(monto)
      if (isNaN(montoNumerico)) {
        return NextResponse.json({ error: "El monto debe ser un numero valido" }, { status: 400 })
      }
      updateFields.monto = montoNumerico
    }
    if (metodoPago !== undefined) updateFields.metodoPago = metodoPago
    updateFields.editado = true

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    const pagoActualizado = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      ...pagoActualizado,
      id: pagoActualizado._id.toString(),
      _id: undefined,
    })
  } catch (error) {
    console.error("API ERROR: Error al actualizar pago:", error)
    return NextResponse.json({ error: "Error al actualizar pago", details: error.message }, { status: 500 })
  }
}

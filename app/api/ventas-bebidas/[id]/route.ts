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
    const collection = db.collection("ventas_bebidas")

    const venta = await collection.findOne({ _id: new ObjectId(id) })
    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    await collection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      message: "Venta eliminada correctamente",
      ventaEliminada: {
        ...venta,
        id: venta._id.toString(),
        _id: undefined,
        fecha: venta.fecha?.toISOString?.() || venta.fecha,
      },
    })
  } catch (error: any) {
    console.error("API ERROR: Error al eliminar venta:", error)
    return NextResponse.json({ error: "Error al eliminar venta", details: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { cantidad, precioTotal, metodoPago } = body

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection("ventas_bebidas")

    const updateFields: Record<string, unknown> = {}

    if (cantidad !== undefined) {
      const cantidadNumerica = Number.parseInt(cantidad)
      if (isNaN(cantidadNumerica) || cantidadNumerica < 1) {
        return NextResponse.json({ error: "La cantidad debe ser un numero valido mayor a 0" }, { status: 400 })
      }
      updateFields.cantidad = cantidadNumerica
    }
    if (precioTotal !== undefined) {
      const totalNumerico = Number.parseFloat(precioTotal)
      if (isNaN(totalNumerico)) {
        return NextResponse.json({ error: "El total debe ser un numero valido" }, { status: 400 })
      }
      updateFields.precioTotal = totalNumerico
    }
    if (metodoPago !== undefined) updateFields.metodoPago = metodoPago
    updateFields.editado = true

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    const ventaActualizada = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      ...ventaActualizada,
      id: ventaActualizada._id.toString(),
      _id: undefined,
      fecha: ventaActualizada.fecha?.toISOString?.() || ventaActualizada.fecha,
    })
  } catch (error) {
    console.error("API ERROR: Error al actualizar venta:", error)
    return NextResponse.json({ error: "Error al actualizar venta", details: error.message }, { status: 500 })
  }
}

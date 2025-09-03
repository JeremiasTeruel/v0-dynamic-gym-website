import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "bebidas"

// PUT para actualizar una bebida
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { nombre, precio, stock, categoria, activo } = await request.json()

    console.log(`Actualizando bebida con ID: ${id}`, { nombre, precio, stock, categoria, activo })

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si existe otra bebida con el mismo nombre (excluyendo la actual)
    if (nombre) {
      const bebidaExistente = await collection.findOne({
        nombre: { $regex: new RegExp(`^${nombre}$`, "i") },
        _id: { $ne: new ObjectId(id) },
      })
      if (bebidaExistente) {
        return NextResponse.json({ error: "Ya existe una bebida con ese nombre" }, { status: 400 })
      }
    }

    // Preparar los datos para actualizar
    const datosActualizacion = {}
    if (nombre !== undefined) datosActualizacion.nombre = nombre.trim()
    if (precio !== undefined) datosActualizacion.precio = Number.parseFloat(precio)
    if (stock !== undefined) datosActualizacion.stock = Number.parseInt(stock)
    if (categoria !== undefined) datosActualizacion.categoria = categoria.trim()
    if (activo !== undefined) datosActualizacion.activo = Boolean(activo)
    datosActualizacion.fechaActualizacion = new Date()

    // Actualizar la bebida
    const resultado = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: datosActualizacion },
      { returnDocument: "after" },
    )

    if (!resultado) {
      return NextResponse.json({ error: "Bebida no encontrada" }, { status: 404 })
    }

    // Convertir _id de MongoDB a id de string
    const bebidaActualizada = {
      ...resultado,
      id: resultado._id.toString(),
      _id: undefined,
    }

    console.log("Bebida actualizada:", bebidaActualizada)

    return NextResponse.json(bebidaActualizada)
  } catch (error) {
    console.error("Error al actualizar bebida:", error)
    return NextResponse.json(
      {
        error: "Error al actualizar bebida",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// DELETE para eliminar una bebida (marcar como inactiva)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // En lugar de eliminar, marcar como inactiva
    const resultado = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          activo: false,
          fechaEliminacion: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!resultado) {
      return NextResponse.json({ error: "Bebida no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Bebida desactivada correctamente" })
  } catch (error) {
    console.error("Error al eliminar bebida:", error)
    return NextResponse.json(
      {
        error: "Error al eliminar bebida",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

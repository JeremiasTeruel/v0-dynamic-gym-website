import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "bebidas"

// GET para obtener el stock de una bebida específica
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bebidaId = searchParams.get("id")

    if (!bebidaId) {
      return NextResponse.json({ error: "ID de bebida requerido" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const bebida = await collection.findOne({ _id: new ObjectId(bebidaId) })

    if (!bebida) {
      return NextResponse.json({ error: "Bebida no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      id: bebida._id.toString(),
      nombre: bebida.nombre,
      stock: bebida.stock,
      precio: bebida.precio,
    })
  } catch (error) {
    console.error("API ERROR: Error al obtener stock:", error)
    return NextResponse.json(
      {
        error: "Error al obtener stock",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// PUT para actualizar el stock de una bebida
export async function PUT(request: Request) {
  try {
    const { bebidaId, nuevoStock } = await request.json()

    if (!bebidaId || nuevoStock === undefined) {
      return NextResponse.json({ error: "ID de bebida y nuevo stock requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const resultado = await collection.updateOne({ _id: new ObjectId(bebidaId) }, { $set: { stock: nuevoStock } })

    if (resultado.matchedCount === 0) {
      return NextResponse.json({ error: "Bebida no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Stock actualizado correctamente",
    })
  } catch (error) {
    console.error("API ERROR: Error al actualizar stock:", error)
    return NextResponse.json(
      {
        error: "Error al actualizar stock",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

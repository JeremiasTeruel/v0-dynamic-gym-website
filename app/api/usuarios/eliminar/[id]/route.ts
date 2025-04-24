import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "usuarios"

// DELETE para eliminar un usuario por ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const resultado = await collection.deleteOne({ _id: new ObjectId(id) })

    if (resultado.deletedCount === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}

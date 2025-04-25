import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "usuarios"

// PUT para actualizar un usuario por ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const datosActualizados = await request.json()

    console.log(`Actualizando usuario con ID: ${id}`, datosActualizados)

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Eliminar el campo id si existe para evitar conflictos con _id de MongoDB
    const { id: _, ...datosParaActualizar } = datosActualizados

    // Actualizar el usuario
    const resultado = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: datosParaActualizar },
      { returnDocument: "after" },
    )

    if (!resultado) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Convertir _id de MongoDB a id de string
    const usuarioActualizado = {
      ...resultado,
      id: resultado._id.toString(),
      _id: undefined,
    }

    console.log("Usuario actualizado:", usuarioActualizado)

    return NextResponse.json(usuarioActualizado)
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json(
      {
        error: "Error al actualizar usuario",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

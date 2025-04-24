import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "usuarios"

// GET para buscar un usuario por DNI
export async function GET(request: Request, { params }: { params: { dni: string } }) {
  try {
    const dni = params.dni
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)
    const usuario = await collection.findOne({ dni })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Convertir _id de MongoDB a id de string
    return NextResponse.json({
      ...usuario,
      id: usuario._id.toString(),
      _id: undefined,
    })
  } catch (error) {
    console.error("Error al buscar usuario:", error)
    return NextResponse.json({ error: "Error al buscar usuario" }, { status: 500 })
  }
}

// PUT para actualizar el pago de un usuario
export async function PUT(request: Request, { params }: { params: { dni: string } }) {
  try {
    const dni = params.dni
    const { fechaVencimiento, metodoPago } = await request.json()

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Actualizar el usuario
    const resultado = await collection.findOneAndUpdate(
      { dni },
      { $set: { fechaVencimiento, metodoPago } },
      { returnDocument: "after" },
    )

    if (!resultado) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Convertir _id de MongoDB a id de string
    return NextResponse.json({
      ...resultado,
      id: resultado._id.toString(),
      _id: undefined,
    })
  } catch (error) {
    console.error("Error al actualizar pago:", error)
    return NextResponse.json({ error: "Error al actualizar pago" }, { status: 500 })
  }
}

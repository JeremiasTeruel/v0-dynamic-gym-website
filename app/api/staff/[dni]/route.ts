import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION = "staff"

// GET para buscar un miembro del staff por DNI
export async function GET(request: Request, { params }: { params: { dni: string } }) {
  try {
    const dni = params.dni
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)
    const miembro = await collection.findOne({ dni })

    if (!miembro) {
      return NextResponse.json({ error: "Miembro de staff no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ...miembro,
      id: miembro._id.toString(),
      _id: undefined,
    })
  } catch (error) {
    console.error("Error al buscar miembro de staff:", error)
    return NextResponse.json({ error: "Error al buscar miembro de staff" }, { status: 500 })
  }
}

// PUT para editar un miembro del staff por DNI
export async function PUT(request: Request, { params }: { params: { dni: string } }) {
  try {
    const dniActual = params.dni
    const body = await request.json()
    const { nombreApellido, dni, oficio } = body

    if (!nombreApellido?.trim() || !dni?.trim() || !oficio?.trim()) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const miembro = await collection.findOne({ dni: dniActual })
    if (!miembro) {
      return NextResponse.json({ error: "Miembro de staff no encontrado" }, { status: 404 })
    }

    // Si cambia el DNI, verificar que no exista otro miembro con ese DNI
    if (dni.trim() !== dniActual) {
      const existente = await collection.findOne({ dni: dni.trim() })
      if (existente) {
        return NextResponse.json({ error: "Ya existe un miembro de staff con ese DNI" }, { status: 409 })
      }
    }

    await collection.updateOne(
      { dni: dniActual },
      {
        $set: {
          nombreApellido: nombreApellido.trim(),
          dni: dni.trim(),
          oficio: oficio.trim(),
        },
      },
    )

    return NextResponse.json({
      id: miembro._id.toString(),
      nombreApellido: nombreApellido.trim(),
      dni: dni.trim(),
      oficio: oficio.trim(),
    })
  } catch (error) {
    console.error("Error al editar miembro de staff:", error)
    return NextResponse.json({ error: "Error al editar miembro de staff" }, { status: 500 })
  }
}

// DELETE para eliminar un miembro del staff por DNI
export async function DELETE(request: Request, { params }: { params: { dni: string } }) {
  try {
    const dni = params.dni
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const resultado = await collection.deleteOne({ dni })

    if (resultado.deletedCount === 0) {
      return NextResponse.json({ error: "Miembro de staff no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar miembro de staff:", error)
    return NextResponse.json({ error: "Error al eliminar miembro de staff" }, { status: 500 })
  }
}

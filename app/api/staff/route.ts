import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "staff"

// GET para obtener todos los miembros del staff
export async function GET() {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const staff = await collection.find({}).toArray()

    const staffFormateado = staff.map((miembro) => ({
      ...miembro,
      id: miembro._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(staffFormateado)
  } catch (error) {
    console.error("API ERROR: Error al obtener staff:", error)
    return NextResponse.json(
      { error: "Error al obtener staff", details: error.message },
      { status: 500 },
    )
  }
}

// POST para agregar un nuevo miembro del staff
export async function POST(request: Request) {
  try {
    const miembro = await request.json()

    if (!miembro.nombreApellido || !miembro.dni || !miembro.oficio) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si ya existe un miembro con ese DNI
    const existente = await collection.findOne({ dni: miembro.dni })
    if (existente) {
      return NextResponse.json({ error: "Ya existe un miembro de staff con ese DNI" }, { status: 400 })
    }

    const { id, ...miembroSinId } = miembro

    const miembroConFecha = {
      ...miembroSinId,
      fechaCreacion: new Date(),
    }

    const resultado = await collection.insertOne(miembroConFecha)

    if (resultado.acknowledged) {
      const nuevoMiembro = {
        ...miembroConFecha,
        id: resultado.insertedId.toString(),
        fechaCreacion: miembroConFecha.fechaCreacion.toISOString(),
      }
      return NextResponse.json(nuevoMiembro)
    }

    return NextResponse.json({ error: "Error al agregar miembro de staff" }, { status: 500 })
  } catch (error) {
    console.error("API ERROR: Error al agregar staff:", error)
    return NextResponse.json(
      { error: "Error al agregar miembro de staff", details: error.message },
      { status: 500 },
    )
  }
}

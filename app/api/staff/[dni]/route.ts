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

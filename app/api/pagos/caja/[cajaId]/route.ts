import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION = "pagos"

export async function GET(request: Request, { params }: { params: { cajaId: string } }) {
  try {
    const { cajaId } = params
    console.log(`[v0] API: Obteniendo pagos para caja ID: ${cajaId}`)

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const pagos = await collection.find({ cajaId }).toArray()
    console.log(`[v0] API: Se encontraron ${pagos.length} pagos para la caja ${cajaId}`)

    const pagosFormateados = pagos.map((pago) => ({
      ...pago,
      id: pago._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(pagosFormateados)
  } catch (error) {
    console.error("[v0] API ERROR: Error al obtener pagos por caja:", error)
    return NextResponse.json(
      {
        error: "Error al obtener pagos",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

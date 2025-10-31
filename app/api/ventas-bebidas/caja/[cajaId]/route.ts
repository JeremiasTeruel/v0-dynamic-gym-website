import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION = "ventas_bebidas"

export async function GET(request: Request, { params }: { params: { cajaId: string } }) {
  try {
    const { cajaId } = params
    console.log(`[v0] API: Obteniendo ventas de bebidas para caja ID: ${cajaId}`)

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const ventas = await collection.find({ cajaId }).toArray()
    console.log(`[v0] API: Se encontraron ${ventas.length} ventas para la caja ${cajaId}`)

    const ventasFormateadas = ventas.map((venta) => ({
      ...venta,
      id: venta._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(ventasFormateadas)
  } catch (error) {
    console.error("[v0] API ERROR: Error al obtener ventas por caja:", error)
    return NextResponse.json(
      {
        error: "Error al obtener ventas",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "usuarios"

// GET para obtener usuarios agrupados por mes
export async function GET(request: Request) {
  try {
    console.log("API: Intentando obtener usuarios agrupados por mes...")

    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || new Date().getFullYear().toString()

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Crear un pipeline de agregación para agrupar usuarios por mes de registro
    const pipeline = [
      {
        $match: {
          fechaInicio: {
            $regex: `^${year}`,
          },
        },
      },
      {
        $addFields: {
          mes: { $substr: ["$fechaInicio", 5, 2] }, // Extraer el mes (formato: YYYY-MM-DD)
        },
      },
      {
        $group: {
          _id: "$mes",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]

    const resultados = await collection.aggregate(pipeline).toArray()
    console.log(`API: Se encontraron datos de usuarios por mes:`, resultados)

    // Formatear los resultados para que sean más fáciles de usar en el frontend
    const mesesFormateados = resultados.map((item) => {
      const mesNumero = Number.parseInt(item._id, 10)
      const nombresMeses = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]

      return {
        mes: nombresMeses[mesNumero - 1],
        usuarios: item.count,
        mesNumero: mesNumero,
      }
    })

    return NextResponse.json(mesesFormateados)
  } catch (error) {
    console.error("API ERROR: Error al obtener usuarios por mes:", error)
    return NextResponse.json(
      {
        error: "Error al obtener usuarios por mes",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// GET - Obtener asistencias de una fecha específica
export async function GET(request: Request, { params }: { params: { fecha: string } }) {
  try {
    const { fecha } = params

    if (!fecha) {
      return NextResponse.json({ error: "Fecha es requerida" }, { status: 400 })
    }

    const db = await getMongoDb()
    const ingresosCollection = db.collection("ingresos")
    const usuariosCollection = db.collection("usuarios")

    // Buscar ingresos de la fecha específica
    const ingresos = await ingresosCollection.find({ fecha }).sort({ timestamp: 1 }).toArray()

    // Para cada ingreso, buscar la foto actual del usuario si no tiene foto guardada
    const ingresosConFoto = await Promise.all(
      ingresos.map(async (ingreso) => {
        let foto = ingreso.foto

        // Si el ingreso no tiene foto, buscar la foto actual del usuario
        if (!foto && ingreso.dni) {
          const usuario = await usuariosCollection.findOne({ dni: ingreso.dni })
          if (usuario && usuario.foto) {
            foto = usuario.foto
          }
        }

        return {
          ...ingreso,
          _id: ingreso._id.toString(),
          foto: foto || null,
        }
      })
    )

    return NextResponse.json(ingresosConFoto)
  } catch (error) {
    console.error("[v0] Error al obtener asistencias por fecha:", error)
    return NextResponse.json({ error: "Error al obtener asistencias: " + error.message }, { status: 500 })
  }
}

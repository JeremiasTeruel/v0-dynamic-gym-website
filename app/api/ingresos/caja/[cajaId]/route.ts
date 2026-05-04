import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// GET - Obtener ingresos de una caja específica
export async function GET(request: Request, { params }: { params: { cajaId: string } }) {
  try {
    const { cajaId } = params

    if (!cajaId) {
      return NextResponse.json({ error: "ID de caja es requerido" }, { status: 400 })
    }

    const db = await getMongoDb()
    const ingresosCollection = db.collection("ingresos_maipu")
    const usuariosCollection = db.collection("usuarios")

    // Buscar ingresos de la caja específica
    const ingresos = await ingresosCollection.find({ cajaId }).sort({ timestamp: 1 }).toArray()

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
    console.error("[v0] Error al obtener ingresos de caja:", error)
    return NextResponse.json({ error: "Error al obtener ingresos: " + error.message }, { status: 500 })
  }
}

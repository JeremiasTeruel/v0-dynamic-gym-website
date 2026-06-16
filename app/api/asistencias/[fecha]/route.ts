import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// GET - Obtener las asistencias de una fecha específica (formato YYYY-MM-DD).
// Combina el histórico permanente con los ingresos vivos de esa fecha.
export async function GET(request: Request, { params }: { params: { fecha: string } }) {
  try {
    const { fecha } = params

    if (!fecha) {
      return NextResponse.json({ error: "Fecha es requerida" }, { status: 400 })
    }

    const db = await getMongoDb()
    const historico = await db
      .collection("asistencias_historico")
      .find({ fecha })
      .sort({ timestamp: 1 })
      .toArray()
    const live = await db.collection("ingresos").find({ fecha }).sort({ timestamp: 1 }).toArray()

    const asistencias = [...historico, ...live].map((a) => ({
      dni: a.dni || "",
      nombreApellido: a.nombreApellido || "Usuario",
      actividad: a.actividad || "Normal",
      fecha: a.fecha,
      hora: a.hora || null,
      foto: a.foto || null,
    }))

    return NextResponse.json(asistencias)
  } catch (error) {
    console.error("[v0] Error al obtener asistencias por fecha:", error)
    return NextResponse.json({ error: "Error al obtener asistencias: " + error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const STAFF_COLLECTION = "staff"
const ASISTENCIA_COLLECTION = "asistenciaStaff"

// POST - Marcar ingreso o salida de un miembro del staff
export async function POST(request: Request) {
  try {
    const { dni } = await request.json()

    if (!dni) {
      return NextResponse.json({ error: "DNI es requerido" }, { status: 400 })
    }

    const db = await getMongoDb()
    const staffCollection = db.collection(STAFF_COLLECTION)
    const asistenciaCollection = db.collection(ASISTENCIA_COLLECTION)

    // Verificar que el miembro del staff exista
    const miembro = await staffCollection.findOne({ dni })
    if (!miembro) {
      return NextResponse.json(
        { error: "STAFF_NO_ENCONTRADO", message: "Miembro de staff no encontrado" },
        { status: 404 },
      )
    }

    const ahora = new Date()
    const fechaHoy = ahora.toISOString().split("T")[0]

    // Buscar si ya marcó asistencia hoy
    const registroHoy = await asistenciaCollection.findOne({ dni, fecha: fechaHoy })

    // Datos del miembro para la respuesta
    const staffData = {
      nombreApellido: miembro.nombreApellido,
      dni: miembro.dni,
      oficio: miembro.oficio,
    }

    if (!registroHoy) {
      // No está en la lista de hoy -> marcar INGRESO
      const nuevoRegistro = {
        dni: miembro.dni,
        nombreApellido: miembro.nombreApellido,
        oficio: miembro.oficio,
        fecha: fechaHoy,
        horaIngreso: ahora.toISOString(),
        horaSalida: null,
        timestamp: ahora.getTime(),
      }

      const result = await asistenciaCollection.insertOne(nuevoRegistro)

      return NextResponse.json({
        tipo: "ingreso",
        staff: staffData,
        asistencia: { ...nuevoRegistro, _id: result.insertedId.toString() },
      })
    }

    if (!registroHoy.horaSalida) {
      // Ya marcó ingreso pero no salida -> marcar SALIDA
      await asistenciaCollection.updateOne(
        { _id: registroHoy._id },
        { $set: { horaSalida: ahora.toISOString() } },
      )

      return NextResponse.json({
        tipo: "salida",
        staff: staffData,
      })
    }

    // Ya marcó ingreso y salida hoy
    return NextResponse.json({
      tipo: "ya_completado",
      staff: staffData,
    })
  } catch (error) {
    console.error("Error al marcar asistencia de staff:", error)
    return NextResponse.json(
      { error: "Error al marcar asistencia de staff: " + error.message },
      { status: 500 },
    )
  }
}

// GET - Obtener asistencia del staff del día
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")

    const db = await getMongoDb()
    const asistenciaCollection = db.collection(ASISTENCIA_COLLECTION)

    const fechaBusqueda = fecha || new Date().toISOString().split("T")[0]

    const asistencias = await asistenciaCollection
      .find({ fecha: fechaBusqueda })
      .sort({ timestamp: 1 })
      .toArray()

    const asistenciasFormateadas = asistencias.map((a) => ({
      ...a,
      _id: a._id.toString(),
    }))

    return NextResponse.json(asistenciasFormateadas)
  } catch (error) {
    console.error("Error al obtener asistencia de staff:", error)
    return NextResponse.json(
      { error: "Error al obtener asistencia de staff: " + error.message },
      { status: 500 },
    )
  }
}

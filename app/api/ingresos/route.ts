import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// POST - Registrar un ingreso de usuario
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dni, nombreApellido, actividad, fechaVencimiento } = body

    if (!dni || !nombreApellido) {
      return NextResponse.json({ error: "DNI y nombre son requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const ingresosCollection = db.collection("ingresos")

    // Obtener fecha actual
    const hoy = new Date()
    const fechaHoy = hoy.toISOString().split("T")[0]

    // Verificar si el usuario ya ingresó hoy
    const ingresoExistente = await ingresosCollection.findOne({
      dni,
      fecha: fechaHoy,
    })

    if (ingresoExistente) {
      // Usuario ya registró su ingreso hoy, no hacer nada
      return NextResponse.json({ message: "Usuario ya registrado hoy", ingreso: ingresoExistente })
    }

    // Registrar el ingreso
    const nuevoIngreso = {
      dni,
      nombreApellido,
      actividad: actividad || "Normal",
      fechaVencimiento,
      fecha: fechaHoy,
      hora: hoy.toISOString(),
      timestamp: hoy.getTime(),
    }

    const result = await ingresosCollection.insertOne(nuevoIngreso)

    return NextResponse.json({
      message: "Ingreso registrado correctamente",
      ingreso: { ...nuevoIngreso, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error al registrar ingreso:", error)
    return NextResponse.json({ error: "Error al registrar ingreso: " + error.message }, { status: 500 })
  }
}

// GET - Obtener ingresos del día
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")

    const db = await getMongoDb()
    const ingresosCollection = db.collection("ingresos")

    // Si no se especifica fecha, usar la fecha actual
    const fechaBusqueda = fecha || new Date().toISOString().split("T")[0]

    // Buscar ingresos del día
    const ingresos = await ingresosCollection.find({ fecha: fechaBusqueda }).sort({ timestamp: 1 }).toArray()

    // Convertir ObjectId a string
    const ingresosFormateados = ingresos.map((ingreso) => ({
      ...ingreso,
      _id: ingreso._id.toString(),
    }))

    return NextResponse.json(ingresosFormateados)
  } catch (error) {
    console.error("Error al obtener ingresos:", error)
    return NextResponse.json({ error: "Error al obtener ingresos: " + error.message }, { status: 500 })
  }
}

// DELETE - Limpiar ingresos del día (usado en cierre completo de caja)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")

    if (!fecha) {
      return NextResponse.json({ error: "Fecha es requerida" }, { status: 400 })
    }

    const db = await getMongoDb()
    const ingresosCollection = db.collection("ingresos")

    // Eliminar ingresos del día
    const result = await ingresosCollection.deleteMany({ fecha })

    return NextResponse.json({
      message: "Ingresos eliminados correctamente",
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error("Error al eliminar ingresos:", error)
    return NextResponse.json({ error: "Error al eliminar ingresos: " + error.message }, { status: 500 })
  }
}

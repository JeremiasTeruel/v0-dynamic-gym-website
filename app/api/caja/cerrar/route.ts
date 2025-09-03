import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "cierres_caja"

// POST para registrar un cierre de caja
export async function POST(request: Request) {
  try {
    const {
      fecha,
      totalEfectivo,
      totalMercadoPago,
      totalBebidas,
      totalBebidasEfectivo,
      totalBebidasMercadoPago,
      totalGeneral,
      cantidadPagos,
      cantidadVentasBebidas,
    } = await request.json()

    console.log("API: Datos recibidos para cerrar caja:", {
      fecha,
      totalEfectivo,
      totalMercadoPago,
      totalBebidas,
      totalBebidasEfectivo,
      totalBebidasMercadoPago,
      totalGeneral,
      cantidadPagos,
      cantidadVentasBebidas,
    })

    // Validar que los campos requeridos estén presentes
    if (!fecha || totalGeneral === undefined) {
      console.error("API ERROR: Faltan campos requeridos")
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si ya existe un cierre para esta fecha
    const cierreExistente = await collection.findOne({ fecha })
    if (cierreExistente) {
      console.error("API ERROR: Ya existe un cierre de caja para esta fecha:", fecha)
      return NextResponse.json({ error: "Ya existe un cierre de caja para esta fecha" }, { status: 400 })
    }

    // Preparar el documento para insertar
    const cierreParaInsertar = {
      fecha: new Date(fecha),
      totalEfectivo: Number.parseFloat(totalEfectivo) || 0,
      totalMercadoPago: Number.parseFloat(totalMercadoPago) || 0,
      totalBebidas: Number.parseFloat(totalBebidas) || 0,
      totalBebidasEfectivo: Number.parseFloat(totalBebidasEfectivo) || 0,
      totalBebidasMercadoPago: Number.parseFloat(totalBebidasMercadoPago) || 0,
      totalGeneral: Number.parseFloat(totalGeneral),
      cantidadPagos: Number.parseInt(cantidadPagos) || 0,
      cantidadVentasBebidas: Number.parseInt(cantidadVentasBebidas) || 0,
      fechaCierre: new Date(),
    }

    // Insertar el nuevo cierre de caja
    const resultado = await collection.insertOne(cierreParaInsertar)

    if (resultado.acknowledged) {
      // Devolver el cierre con su nuevo ID
      const nuevoCierre = {
        ...cierreParaInsertar,
        id: resultado.insertedId.toString(),
      }
      console.log("API: Cierre de caja registrado exitosamente:", nuevoCierre)
      return NextResponse.json(nuevoCierre)
    }

    console.error("API ERROR: Error al insertar cierre de caja en la base de datos")
    return NextResponse.json({ error: "Error al registrar cierre de caja" }, { status: 500 })
  } catch (error) {
    console.error("API ERROR: Error al registrar cierre de caja:", error)
    return NextResponse.json(
      {
        error: "Error al registrar cierre de caja",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// GET para obtener todos los cierres de caja
export async function GET() {
  try {
    console.log("API: Intentando obtener cierres de caja...")

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const cierres = await collection.find({}).sort({ fecha: -1 }).toArray()
    console.log(`API: Se encontraron ${cierres.length} cierres de caja`)

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
    const cierresFormateados = cierres.map((cierre) => ({
      ...cierre,
      id: cierre._id.toString(),
      _id: undefined,
      fecha: cierre.fecha.toISOString().split("T")[0], // Convertir fecha a string
      fechaCierre: cierre.fechaCierre.toISOString(), // Convertir fecha de cierre a string ISO
    }))

    return NextResponse.json(cierresFormateados)
  } catch (error) {
    console.error("API ERROR: Error al obtener cierres de caja:", error)
    return NextResponse.json(
      {
        error: "Error al obtener cierres de caja",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

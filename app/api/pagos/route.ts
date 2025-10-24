import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION = "pagos"

export async function GET() {
  try {
    console.log("API: Intentando obtener pagos...")

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const pagos = await collection.find({}).toArray()
    console.log(`API: Se encontraron ${pagos.length} pagos`)

    const pagosFormateados = pagos.map((pago) => ({
      ...pago,
      id: pago._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(pagosFormateados)
  } catch (error) {
    console.error("API ERROR: Error al obtener pagos:", error)
    return NextResponse.json(
      {
        error: "Error al obtener pagos",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const pago = await request.json()
    console.log("API: Datos recibidos para registrar pago:", pago)

    if (!pago.userNombre || !pago.userDni || !pago.monto || !pago.metodoPago) {
      console.error("API ERROR: Faltan campos requeridos:", pago)
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const montoNumerico = Number.parseFloat(pago.monto)
    if (isNaN(montoNumerico)) {
      return NextResponse.json({ error: "El monto debe ser un número válido" }, { status: 400 })
    }

    // Preparar el documento para insertar con soporte para pago mixto
    const pagoParaInsertar = {
      userNombre: pago.userNombre,
      userDni: pago.userDni,
      monto: montoNumerico,
      fecha: new Date(pago.fecha || new Date()),
      metodoPago: pago.metodoPago,
      // Campos para pago mixto
      montoEfectivo: pago.montoEfectivo ? Number.parseFloat(pago.montoEfectivo) : 0,
      montoMercadoPago: pago.montoMercadoPago ? Number.parseFloat(pago.montoMercadoPago) : 0,
    }

    const resultado = await collection.insertOne(pagoParaInsertar)

    if (resultado.acknowledged) {
      const nuevoPago = {
        ...pagoParaInsertar,
        id: resultado.insertedId.toString(),
      }
      console.log("API: Pago registrado exitosamente:", nuevoPago)
      return NextResponse.json(nuevoPago)
    }

    console.error("API ERROR: Error al insertar pago en la base de datos")
    return NextResponse.json({ error: "Error al registrar pago" }, { status: 500 })
  } catch (error) {
    console.error("API ERROR: Error al registrar pago:", error)
    return NextResponse.json(
      {
        error: "Error al registrar pago",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

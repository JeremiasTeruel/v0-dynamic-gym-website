import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "payments"

// GET para obtener todos los pagos
export async function GET() {
  try {
    console.log("API: Intentando obtener pagos...")

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const payments = await collection.find({}).sort({ date: -1 }).toArray()
    console.log(`API: Se encontraron ${payments.length} pagos`)

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
    const paymentsFormateados = payments.map((payment) => ({
      ...payment,
      _id: payment._id.toString(),
    }))

    return NextResponse.json(paymentsFormateados)
  } catch (error) {
    console.error("API ERROR: Error al obtener pagos:", error)
    return NextResponse.json(
      {
        error: "Error al obtener pagos",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// POST para agregar un nuevo pago
export async function POST(request: Request) {
  try {
    const payment = await request.json()
    console.log("API: Datos recibidos para registrar pago:", payment)

    // Validar que los campos requeridos estén presentes
    if (!payment.userId || !payment.userName || !payment.date || payment.amount === undefined) {
      console.error("API ERROR: Faltan campos requeridos:", payment)
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Agregar timestamp de creación
    const paymentWithTimestamp = {
      ...payment,
      createdAt: new Date().toISOString(),
    }

    // Insertar el nuevo pago
    const resultado = await collection.insertOne(paymentWithTimestamp)

    if (resultado.acknowledged) {
      // Devolver el pago con su nuevo ID
      const nuevoPago = {
        ...paymentWithTimestamp,
        _id: resultado.insertedId.toString(),
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
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "pagos"

// GET para obtener todos los pagos
export async function GET() {
  try {
    console.log("API: Intentando obtener pagos...")

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const pagos = await collection.find({}).toArray()
    console.log(`API: Se encontraron ${pagos.length} pagos`)

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
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

// POST para registrar un nuevo pago
export async function POST(request: Request) {
  try {
    const pago = await request.json()
    console.log("API: Datos recibidos para registrar pago:", pago)

    // Validar que los campos requeridos estén presentes
    if (!pago.userNombre || !pago.userDni || !pago.monto || !pago.metodoPago) {
      console.error("API ERROR: Faltan campos requeridos:", pago)
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Asegurarse de que el monto sea un número
    const montoNumerico = Number.parseFloat(pago.monto)
    if (isNaN(montoNumerico)) {
      return NextResponse.json({ error: "El monto debe ser un número válido" }, { status: 400 })
    }

    // Incluir tipoPago en el documento a insertar
    const pagoParaInsertar = {
      userNombre: pago.userNombre,
      userDni: pago.userDni,
      monto: montoNumerico,
      fecha: new Date(pago.fecha || new Date()),
      metodoPago: pago.metodoPago,
      tipoPago: pago.tipoPago || "Pago de cuota", // Valor por defecto si no se especifica
    }

    // Insertar el nuevo pago
    const resultado = await collection.insertOne(pagoParaInsertar)

    if (resultado.acknowledged) {
      // Devolver el pago con su nuevo ID
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

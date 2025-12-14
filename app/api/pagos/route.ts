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

    if (!pago.cajaId) {
      console.error("API ERROR: Falta cajaId:", pago)
      return NextResponse.json({ error: "Falta cajaId - la caja debe estar abierta" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const montoNumerico = Number.parseFloat(pago.monto)
    if (isNaN(montoNumerico)) {
      return NextResponse.json({ error: "El monto debe ser un número válido" }, { status: 400 })
    }

    const fechaPago = new Date(pago.fecha || new Date())
    const inicioDia = new Date(fechaPago)
    inicioDia.setHours(0, 0, 0, 0)
    const finDia = new Date(fechaPago)
    finDia.setHours(23, 59, 59, 999)

    const pagoExistente = await collection.findOne({
      userDni: pago.userDni,
      tipoPago: "Pago de cuota",
      fecha: {
        $gte: inicioDia,
        $lte: finDia,
      },
    })

    if (pagoExistente) {
      console.log("API: Ya existe un pago de cuota para este DNI hoy:", pago.userDni)
      return NextResponse.json(
        {
          error: "Ya existe un pago de cuota registrado para este DNI en el día de hoy",
        },
        { status: 400 },
      )
    }

    const pagoParaInsertar = {
      userNombre: pago.userNombre,
      userDni: pago.userDni,
      monto: montoNumerico,
      fecha: fechaPago,
      metodoPago: pago.metodoPago,
      tipoPago: pago.tipoPago || "Pago de cuota",
      cajaId: pago.cajaId, // ID de la caja actual
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

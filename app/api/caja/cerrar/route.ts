import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "cierres_caja"

// POST para registrar un cierre de caja
export async function POST(request: Request) {
  try {
    const {
      fecha,
      tipoCierre,
      totalEfectivo,
      totalMercadoPago,
      totalCuotas,
      totalCuotasEfectivo,
      totalCuotasMercadoPago,
      totalBebidas,
      totalBebidasEfectivo,
      totalBebidasMercadoPago,
      totalGeneral,
      cantidadPagos,
      cantidadVentasBebidas,
      detalleVentasBebidas,
    } = await request.json()

    console.log("API: Datos recibidos para cerrar caja:", {
      fecha,
      tipoCierre,
      totalEfectivo,
      totalMercadoPago,
      totalCuotas,
      totalCuotasEfectivo,
      totalCuotasMercadoPago,
      totalBebidas,
      totalBebidasEfectivo,
      totalBebidasMercadoPago,
      totalGeneral,
      cantidadPagos,
      cantidadVentasBebidas,
      detalleVentasBebidas,
    })

    // Validar que los campos requeridos estén presentes
    if (!fecha || totalGeneral === undefined || !tipoCierre) {
      console.error("API ERROR: Faltan campos requeridos")
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    if (tipoCierre === "completo") {
      const cierreCompletoExistente = await collection.findOne({ fecha, tipoCierre: "completo" })
      if (cierreCompletoExistente) {
        console.error("API ERROR: Ya existe un cierre completo de caja para esta fecha:", fecha)
        return NextResponse.json({ error: "Ya existe un cierre completo de caja para esta fecha" }, { status: 400 })
      }
    }

    const horaCierre = new Date()

    // Preparar el documento para insertar
    const cierreParaInsertar = {
      fecha: new Date(fecha),
      tipoCierre,
      horaCierre, // Guardar la hora exacta del cierre
      // Totales generales por método de pago
      totalEfectivo: Number.parseFloat(totalEfectivo) || 0,
      totalMercadoPago: Number.parseFloat(totalMercadoPago) || 0,
      totalGeneral: Number.parseFloat(totalGeneral),

      // Totales de cuotas
      totalCuotas: Number.parseFloat(totalCuotas) || 0,
      totalCuotasEfectivo: Number.parseFloat(totalCuotasEfectivo) || 0,
      totalCuotasMercadoPago: Number.parseFloat(totalCuotasMercadoPago) || 0,
      cantidadPagos: Number.parseInt(cantidadPagos) || 0,

      // Totales de bebidas
      totalBebidas: Number.parseFloat(totalBebidas) || 0,
      totalBebidasEfectivo: Number.parseFloat(totalBebidasEfectivo) || 0,
      totalBebidasMercadoPago: Number.parseFloat(totalBebidasMercadoPago) || 0,
      cantidadVentasBebidas: Number.parseInt(cantidadVentasBebidas) || 0,

      // Detalle de ventas de bebidas (opcional)
      detalleVentasBebidas: detalleVentasBebidas || [],

      // Metadatos
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
      horaCierre: cierre.horaCierre?.toISOString(), // Incluir hora de cierre
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

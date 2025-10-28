import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION = "cierres_caja"

export async function POST(request: Request) {
  try {
    const {
      fecha,
      totalEfectivo,
      totalMercadoPago,
      totalMixtoEfectivo,
      totalMixtoMercadoPago,
      totalCuotas,
      totalCuotasEfectivo,
      totalCuotasMercadoPago,
      totalCuotasMixtoEfectivo,
      totalCuotasMixtoMercadoPago,
      totalBebidas,
      totalBebidasEfectivo,
      totalBebidasMercadoPago,
      totalBebidasMixtoEfectivo,
      totalBebidasMixtoMercadoPago,
      totalGeneral,
      cantidadPagos,
      cantidadVentasBebidas,
      detalleVentasBebidas,
      cantidadNuevosUsuarios,
    } = await request.json()

    console.log("API: Datos recibidos para cerrar caja:", {
      fecha,
      totalEfectivo,
      totalMercadoPago,
      totalMixtoEfectivo,
      totalMixtoMercadoPago,
      totalGeneral,
      cantidadNuevosUsuarios,
    })

    if (!fecha || totalGeneral === undefined) {
      console.error("API ERROR: Faltan campos requeridos")
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const cierreExistente = await collection.findOne({ fecha })
    if (cierreExistente) {
      console.error("API ERROR: Ya existe un cierre de caja para esta fecha:", fecha)
      return NextResponse.json({ error: "Ya existe un cierre de caja para esta fecha" }, { status: 400 })
    }

    const cierreParaInsertar = {
      fecha: new Date(fecha),
      // Totales generales por método de pago
      totalEfectivo: Number.parseFloat(totalEfectivo) || 0,
      totalMercadoPago: Number.parseFloat(totalMercadoPago) || 0,
      totalMixtoEfectivo: Number.parseFloat(totalMixtoEfectivo) || 0,
      totalMixtoMercadoPago: Number.parseFloat(totalMixtoMercadoPago) || 0,
      totalGeneral: Number.parseFloat(totalGeneral),

      // Totales de cuotas
      totalCuotas: Number.parseFloat(totalCuotas) || 0,
      totalCuotasEfectivo: Number.parseFloat(totalCuotasEfectivo) || 0,
      totalCuotasMercadoPago: Number.parseFloat(totalCuotasMercadoPago) || 0,
      totalCuotasMixtoEfectivo: Number.parseFloat(totalCuotasMixtoEfectivo) || 0,
      totalCuotasMixtoMercadoPago: Number.parseFloat(totalCuotasMixtoMercadoPago) || 0,
      cantidadPagos: Number.parseInt(cantidadPagos) || 0,

      // Totales de bebidas
      totalBebidas: Number.parseFloat(totalBebidas) || 0,
      totalBebidasEfectivo: Number.parseFloat(totalBebidasEfectivo) || 0,
      totalBebidasMercadoPago: Number.parseFloat(totalBebidasMercadoPago) || 0,
      totalBebidasMixtoEfectivo: Number.parseFloat(totalBebidasMixtoEfectivo) || 0,
      totalBebidasMixtoMercadoPago: Number.parseFloat(totalBebidasMixtoMercadoPago) || 0,
      cantidadVentasBebidas: Number.parseInt(cantidadVentasBebidas) || 0,

      // Detalle de ventas de bebidas
      detalleVentasBebidas: detalleVentasBebidas || [],

      cantidadNuevosUsuarios: Number.parseInt(cantidadNuevosUsuarios) || 0,

      // Metadatos
      fechaCierre: new Date(),
    }

    const resultado = await collection.insertOne(cierreParaInsertar)

    if (resultado.acknowledged) {
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

export async function GET() {
  try {
    console.log("API: Intentando obtener cierres de caja...")

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const cierres = await collection.find({}).sort({ fecha: -1 }).toArray()
    console.log(`API: Se encontraron ${cierres.length} cierres de caja`)

    const cierresFormateados = cierres.map((cierre) => ({
      ...cierre,
      id: cierre._id.toString(),
      _id: undefined,
      fecha: cierre.fecha.toISOString().split("T")[0],
      fechaCierre: cierre.fechaCierre.toISOString(),
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

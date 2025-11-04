import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION_CIERRES = "cierres_caja"
const COLLECTION_CAJAS = "cajas"

// POST para registrar un cierre de caja
// IMPORTANTE: El sistema NO se rige por fecha. Las cajas solo se cierran manualmente
// cuando se llama a este endpoint. No hay cierre automático por cambio de fecha.
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

    console.log("[v0] Datos recibidos para cerrar caja:", {
      fecha,
      tipoCierre,
      totalGeneral,
    })

    if (!fecha || totalGeneral === undefined || !tipoCierre) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collectionCierres = db.collection(COLLECTION_CIERRES)
    const collectionCajas = db.collection(COLLECTION_CAJAS)

    const cajaAbierta = await collectionCajas.findOne({
      estado: "abierta",
    })

    if (!cajaAbierta) {
      return NextResponse.json({ error: "No hay ninguna caja abierta para cerrar" }, { status: 400 })
    }

    if (tipoCierre === "completo") {
      await collectionCajas.updateOne(
        { _id: cajaAbierta._id },
        {
          $set: {
            estado: "cerrada",
            fechaCierre: new Date(),
            totalEfectivo: Number.parseFloat(totalEfectivo) || 0,
            totalMercadoPago: Number.parseFloat(totalMercadoPago) || 0,
            totalGeneral: Number.parseFloat(totalGeneral),
            cantidadPagos: Number.parseInt(cantidadPagos) || 0,
            cantidadVentasBebidas: Number.parseInt(cantidadVentasBebidas) || 0,
          },
        },
      )
      console.log("[v0] Caja cerrada manualmente con ID:", cajaAbierta._id)
    }

    // Preparar el documento para insertar
    const cierreParaInsertar = {
      cajaId: cajaAbierta._id.toString(), // Guardar referencia al ID de la caja
      fecha: new Date(fecha),
      tipoCierre,
      totalEfectivo: Number.parseFloat(totalEfectivo) || 0,
      totalMercadoPago: Number.parseFloat(totalMercadoPago) || 0,
      totalGeneral: Number.parseFloat(totalGeneral),
      totalCuotas: Number.parseFloat(totalCuotas) || 0,
      totalCuotasEfectivo: Number.parseFloat(totalCuotasEfectivo) || 0,
      totalCuotasMercadoPago: Number.parseFloat(totalCuotasMercadoPago) || 0,
      cantidadPagos: Number.parseInt(cantidadPagos) || 0,
      totalBebidas: Number.parseFloat(totalBebidas) || 0,
      totalBebidasEfectivo: Number.parseFloat(totalBebidasEfectivo) || 0,
      totalBebidasMercadoPago: Number.parseFloat(totalBebidasMercadoPago) || 0,
      cantidadVentasBebidas: Number.parseInt(cantidadVentasBebidas) || 0,
      detalleVentasBebidas: detalleVentasBebidas || [],
      fechaCierre: new Date(),
    }

    const resultado = await collectionCierres.insertOne(cierreParaInsertar)

    if (resultado.acknowledged) {
      const nuevoCierre = {
        ...cierreParaInsertar,
        id: resultado.insertedId.toString(),
      }
      console.log("[v0] Cierre de caja registrado exitosamente:", nuevoCierre)
      return NextResponse.json(nuevoCierre)
    }

    return NextResponse.json({ error: "Error al registrar cierre de caja" }, { status: 500 })
  } catch (error) {
    console.error("[v0] Error al registrar cierre de caja:", error)
    return NextResponse.json({ error: "Error al registrar cierre de caja", details: error.message }, { status: 500 })
  }
}

// GET para obtener todos los cierres de caja
export async function GET() {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION_CIERRES)

    const cierres = await collection.find({}).sort({ fechaCierre: -1 }).toArray()

    console.log("[v0] Total de cierres encontrados en la base de datos:", cierres.length)

    const cierresFormateados = cierres.map((cierre) => {
      const { _id, ...cierreData } = cierre
      return {
        ...cierreData,
        id: _id.toString(),
        fecha: cierre.fecha.toISOString().split("T")[0],
        fechaCierre: cierre.fechaCierre.toISOString(),
      }
    })

    console.log("[v0] Cierres formateados para enviar:", cierresFormateados.length)

    return NextResponse.json(cierresFormateados)
  } catch (error) {
    console.error("[v0] Error al obtener cierres de caja:", error)
    return NextResponse.json({ error: "Error al obtener cierres de caja", details: error.message }, { status: 500 })
  }
}

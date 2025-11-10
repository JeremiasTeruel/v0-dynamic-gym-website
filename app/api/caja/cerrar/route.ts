import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

const COLLECTION_CIERRES = "cierres_caja"
const COLLECTION_CAJAS = "cajas"
const COLLECTION_PAGOS = "pagos"
const COLLECTION_VENTAS = "ventas_bebidas"
const COLLECTION_USUARIOS = "usuarios"
const COLLECTION_EGRESOS = "egresos"

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
    const collectionPagos = db.collection(COLLECTION_PAGOS)
    const collectionVentas = db.collection(COLLECTION_VENTAS)
    const collectionUsuarios = db.collection(COLLECTION_USUARIOS)
    const collectionEgresos = db.collection(COLLECTION_EGRESOS)

    const cajaAbierta = await collectionCajas.findOne({
      estado: "abierta",
    })

    if (!cajaAbierta) {
      return NextResponse.json({ error: "No hay ninguna caja abierta para cerrar" }, { status: 400 })
    }

    const cajaId = cajaAbierta._id.toString()

    const pagos = await collectionPagos.find({ cajaId }).toArray()
    const detallePagosCuotas = await Promise.all(
      pagos.map(async (pago) => {
        const usuario = await collectionUsuarios.findOne({ dni: pago.userDni })

        console.log("[v0] Procesando pago:", {
          userDni: pago.userDni,
          usuarioEncontrado: !!usuario,
          nombreApellido: usuario?.nombreApellido || "No encontrado",
        })

        return {
          nombreApellido: usuario?.nombreApellido || "Usuario no encontrado",
          dni: pago.userDni || "",
          monto: pago.monto,
          metodoPago: pago.metodoPago,
          fecha: pago.fecha,
          actividad: usuario?.actividad || "N/A",
        }
      }),
    )

    const ventas = await collectionVentas.find({ cajaId }).toArray()
    const detalleVentasBebidasCompleto = ventas.map((venta) => ({
      nombreBebida: venta.nombreBebida,
      cantidad: venta.cantidad,
      precioUnitario: venta.precioUnitario,
      precioTotal: venta.precioTotal,
      metodoPago: venta.metodoPago,
      fecha: venta.fecha,
    }))

    const fechaApertura = cajaAbierta.fechaApertura
    const fechaCierreActual = new Date()
    const nuevosUsuarios = await collectionUsuarios
      .find({
        fechaCreacion: {
          $gte: fechaApertura,
          $lte: fechaCierreActual,
        },
      })
      .toArray()

    const detalleNuevosUsuarios = nuevosUsuarios.map((usuario) => ({
      nombreApellido: usuario.nombreApellido,
      dni: usuario.dni,
      actividad: usuario.actividad,
      metodoPago: usuario.metodoPago,
      fechaInicio: usuario.fechaInicio,
      fechaVencimiento: usuario.fechaVencimiento,
      fechaCreacion: usuario.fechaCreacion,
    }))

    const egresos = await collectionEgresos.find({ cajaId }).toArray()
    const detalleEgresos = egresos.map((egreso) => ({
      monto: egreso.monto,
      descripcion: egreso.descripcion,
      nombre: egreso.nombre,
      fecha: egreso.fecha,
    }))

    const totalEgresos = egresos.reduce((sum, egreso) => sum + egreso.monto, 0)

    console.log("[v0] Detalles recopilados:", {
      pagos: detallePagosCuotas.length,
      ventas: detalleVentasBebidasCompleto.length,
      nuevosUsuarios: detalleNuevosUsuarios.length,
      egresos: detalleEgresos.length,
      totalEgresos,
    })

    if (tipoCierre === "completo") {
      await collectionCajas.updateOne(
        { _id: cajaAbierta._id },
        {
          $set: {
            estado: "cerrada",
            fechaCierre: fechaCierreActual,
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

    const cierreParaInsertar = {
      cajaId: cajaId,
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
      detalleVentasBebidas: detalleVentasBebidasCompleto,
      detallePagosCuotas: detallePagosCuotas,
      detalleNuevosUsuarios: detalleNuevosUsuarios,
      detalleEgresos: detalleEgresos,
      totalEgresos: totalEgresos,
      cantidadEgresos: egresos.length,
      fechaCierre: fechaCierreActual,
    }

    const resultado = await collectionCierres.insertOne(cierreParaInsertar)

    if (resultado.acknowledged) {
      const nuevoCierre = {
        ...cierreParaInsertar,
        id: resultado.insertedId.toString(),
      }
      console.log("[v0] Cierre de caja registrado exitosamente con detalles completos incluyendo egresos")
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

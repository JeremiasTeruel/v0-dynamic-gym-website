import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "bebidas"

// Datos iniciales de bebidas
const bebidasIniciales = [
  {
    nombre: "Agua Mineral 500ml",
    precio: 800,
    stock: 50,
    categoria: "Agua",
    activo: true,
  },
  {
    nombre: "Gatorade 500ml",
    precio: 1200,
    stock: 30,
    categoria: "Deportiva",
    activo: true,
  },
  {
    nombre: "Coca Cola 500ml",
    precio: 1000,
    stock: 25,
    categoria: "Gaseosa",
    activo: true,
  },
  {
    nombre: "Protein Shake",
    precio: 2500,
    stock: 15,
    categoria: "Proteína",
    activo: true,
  },
  {
    nombre: "Red Bull 250ml",
    precio: 1800,
    stock: 20,
    categoria: "Energética",
    activo: true,
  },
  {
    nombre: "Agua Saborizada 500ml",
    precio: 900,
    stock: 35,
    categoria: "Agua",
    activo: true,
  },
]

// Inicializar la base de datos si está vacía
async function inicializarBebidas() {
  try {
    console.log("Intentando inicializar bebidas...")
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si la colección está vacía
    const count = await collection.countDocuments()
    console.log(`La colección de bebidas tiene ${count} documentos`)

    if (count === 0) {
      // Si está vacía, insertar los datos iniciales
      console.log("Insertando bebidas iniciales...")
      await collection.insertMany(bebidasIniciales)
      console.log("Bebidas inicializadas con datos de ejemplo")
    }
  } catch (error) {
    console.error("Error al inicializar bebidas:", error)
    throw error
  }
}

// GET para obtener todas las bebidas
export async function GET() {
  try {
    console.log("API: Intentando obtener bebidas...")

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Inicializar bebidas si está vacía
    await inicializarBebidas()

    // Obtener solo bebidas activas con stock > 0
    const bebidas = await collection.find({ activo: true, stock: { $gt: 0 } }).toArray()
    console.log(`API: Se encontraron ${bebidas.length} bebidas disponibles`)

    // Convertir _id de MongoDB a id de string
    const bebidasFormateadas = bebidas.map((bebida) => ({
      ...bebida,
      id: bebida._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(bebidasFormateadas)
  } catch (error) {
    console.error("API ERROR: Error al obtener bebidas:", error)
    return NextResponse.json(
      {
        error: "Error al obtener bebidas",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// POST para registrar una venta y actualizar stock
export async function POST(request: Request) {
  try {
    const { bebidaId, cantidad, precioTotal, metodoPago, cajaId } = await request.json()
    console.log("API: Datos recibidos para venta de bebida:", { bebidaId, cantidad, precioTotal, metodoPago, cajaId })

    if (!bebidaId || !cantidad || !precioTotal || !metodoPago || !cajaId) {
      console.error("API ERROR: Faltan campos requeridos")
      return NextResponse.json({ error: "Faltan campos requeridos (incluyendo cajaId)" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Buscar la bebida
    const bebida = await collection.findOne({ _id: new (await import("mongodb")).ObjectId(bebidaId) })
    if (!bebida) {
      return NextResponse.json({ error: "Bebida no encontrada" }, { status: 404 })
    }

    // Verificar stock disponible
    if (bebida.stock < cantidad) {
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 })
    }

    // Actualizar stock
    const nuevoStock = bebida.stock - cantidad
    const resultado = await collection.updateOne(
      { _id: new (await import("mongodb")).ObjectId(bebidaId) },
      { $set: { stock: nuevoStock } },
    )

    if (resultado.modifiedCount === 0) {
      return NextResponse.json({ error: "Error al actualizar stock" }, { status: 500 })
    }

    const ventasCollection = db.collection("ventas_bebidas")
    const venta = {
      bebidaId: bebidaId,
      nombreBebida: bebida.nombre,
      cantidad: cantidad,
      precioUnitario: bebida.precio,
      precioTotal: precioTotal,
      metodoPago: metodoPago,
      fecha: new Date(),
      stockAnterior: bebida.stock,
      stockNuevo: nuevoStock,
      cajaId: cajaId, // ID de la caja actual
    }

    await ventasCollection.insertOne(venta)

    console.log("API: Venta registrada exitosamente con cajaId:", cajaId)
    return NextResponse.json({
      success: true,
      message: "Venta registrada correctamente",
      stockNuevo: nuevoStock,
    })
  } catch (error) {
    console.error("API ERROR: Error al procesar venta:", error)
    return NextResponse.json(
      {
        error: "Error al procesar venta",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

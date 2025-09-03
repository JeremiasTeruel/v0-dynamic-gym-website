import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "bebidas"

// GET para obtener todas las bebidas (incluyendo inactivas y sin stock)
export async function GET() {
  try {
    console.log("API: Intentando obtener todas las bebidas para admin...")

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Obtener todas las bebidas (activas e inactivas)
    const bebidas = await collection.find({}).sort({ nombre: 1 }).toArray()
    console.log(`API: Se encontraron ${bebidas.length} bebidas en total`)

    // Convertir _id de MongoDB a id de string
    const bebidasFormateadas = bebidas.map((bebida) => ({
      ...bebida,
      id: bebida._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(bebidasFormateadas)
  } catch (error) {
    console.error("API ERROR: Error al obtener bebidas para admin:", error)
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

// POST para agregar una nueva bebida
export async function POST(request: Request) {
  try {
    const { nombre, precio, stock, categoria } = await request.json()
    console.log("API: Datos recibidos para nueva bebida:", { nombre, precio, stock, categoria })

    // Validar que los campos requeridos estén presentes
    if (!nombre || !precio || stock === undefined || !categoria) {
      console.error("API ERROR: Faltan campos requeridos")
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si ya existe una bebida con ese nombre
    const bebidaExistente = await collection.findOne({ nombre: { $regex: new RegExp(`^${nombre}$`, "i") } })
    if (bebidaExistente) {
      return NextResponse.json({ error: "Ya existe una bebida con ese nombre" }, { status: 400 })
    }

    // Preparar el documento para insertar
    const nuevaBebida = {
      nombre: nombre.trim(),
      precio: Number.parseFloat(precio),
      stock: Number.parseInt(stock),
      categoria: categoria.trim(),
      activo: true,
      fechaCreacion: new Date(),
    }

    // Insertar la nueva bebida
    const resultado = await collection.insertOne(nuevaBebida)

    if (resultado.acknowledged) {
      // Devolver la bebida con su nuevo ID
      const bebidaCreada = {
        ...nuevaBebida,
        id: resultado.insertedId.toString(),
      }
      console.log("API: Bebida creada exitosamente:", bebidaCreada)
      return NextResponse.json(bebidaCreada)
    }

    console.error("API ERROR: Error al insertar bebida en la base de datos")
    return NextResponse.json({ error: "Error al agregar bebida" }, { status: 500 })
  } catch (error) {
    console.error("API ERROR: Error al agregar bebida:", error)
    return NextResponse.json(
      {
        error: "Error al agregar bebida",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

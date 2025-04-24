import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"
import { usuariosIniciales } from "@/data/usuarios"

// Nombre de la colección en MongoDB
const COLLECTION = "usuarios"

// Inicializar la base de datos si está vacía
async function inicializarBaseDeDatos() {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si la colección está vacía
    const count = await collection.countDocuments()

    if (count === 0) {
      // Si está vacía, insertar los datos iniciales
      await collection.insertMany(
        usuariosIniciales.map((usuario) => ({
          ...usuario,
          // Eliminar el id para que MongoDB genere uno nuevo
          id: undefined,
        })),
      )
      console.log("Base de datos inicializada con datos de ejemplo")
    }
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
  }
}

// GET para obtener todos los usuarios
export async function GET() {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Inicializar la base de datos si está vacía
    await inicializarBaseDeDatos()

    const usuarios = await collection.find({}).toArray()

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
    const usuariosFormateados = usuarios.map((usuario) => ({
      ...usuario,
      id: usuario._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(usuariosFormateados)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

// POST para agregar un nuevo usuario
export async function POST(request: Request) {
  try {
    const usuario = await request.json()
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si ya existe un usuario con ese DNI
    const usuarioExistente = await collection.findOne({ dni: usuario.dni })
    if (usuarioExistente) {
      return NextResponse.json({ error: "Ya existe un usuario con ese DNI" }, { status: 400 })
    }

    // Insertar el nuevo usuario
    const resultado = await collection.insertOne(usuario)

    if (resultado.acknowledged) {
      // Devolver el usuario con su nuevo ID
      return NextResponse.json({
        ...usuario,
        id: resultado.insertedId.toString(),
      })
    }

    return NextResponse.json({ error: "Error al agregar usuario" }, { status: 500 })
  } catch (error) {
    console.error("Error al agregar usuario:", error)
    return NextResponse.json({ error: "Error al agregar usuario" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"
import { usuariosIniciales } from "@/data/usuarios"

// Nombre de la colección en MongoDB
const COLLECTION = "usuarios"

// Inicializar la base de datos si está vacía
async function inicializarBaseDeDatos() {
  try {
    console.log("Intentando inicializar la base de datos...")
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si la colección está vacía
    const count = await collection.countDocuments()
    console.log(`La colección tiene ${count} documentos`)

    if (count === 0) {
      // Si está vacía, insertar los datos iniciales
      console.log("Insertando datos iniciales...")
      await collection.insertMany(
        usuariosIniciales.map((usuario) => ({
          ...usuario,
          // Eliminar el id para que MongoDB genere uno nuevo
          id: undefined,
          fechaCreacion: new Date(),
        })),
      )
      console.log("Base de datos inicializada con datos de ejemplo")
    }
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
    throw error
  }
}

// GET para obtener todos los usuarios
export async function GET() {
  try {
    console.log("API: Intentando obtener usuarios...")

    // Intentar obtener la conexión a la base de datos
    const db = await getMongoDb()
    console.log("API: Conexión a la base de datos establecida")

    const collection = db.collection(COLLECTION)
    console.log("API: Colección obtenida:", COLLECTION)

    // Inicializar la base de datos si está vacía
    await inicializarBaseDeDatos()
    console.log("API: Base de datos inicializada")

    const usuarios = await collection.find({}).toArray()
    console.log(`API: Se encontraron ${usuarios.length} usuarios`)

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
    const usuariosFormateados = usuarios.map((usuario) => ({
      ...usuario,
      id: usuario._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(usuariosFormateados)
  } catch (error) {
    console.error("API ERROR: Error al obtener usuarios:", error)
    return NextResponse.json(
      {
        error: "Error al obtener usuarios",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// POST para agregar un nuevo usuario
export async function POST(request: Request) {
  try {
    const usuario = await request.json()
    console.log("API: Datos recibidos para crear usuario:", usuario)

    // Validar que los campos requeridos estén presentes
    if (!usuario.nombreApellido || !usuario.dni || !usuario.fechaInicio || !usuario.fechaVencimiento) {
      console.error("API ERROR: Faltan campos requeridos:", usuario)
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si ya existe un usuario con ese DNI
    const usuarioExistente = await collection.findOne({ dni: usuario.dni })
    if (usuarioExistente) {
      console.error("API ERROR: Ya existe un usuario con ese DNI:", usuario.dni)
      return NextResponse.json({ error: "Ya existe un usuario con ese DNI" }, { status: 400 })
    }

    // Preparar el documento para insertar
    // Asegurarse de que no haya un campo 'id' que pueda causar conflictos con '_id' de MongoDB
    const { id, ...usuarioSinId } = usuario

    const usuarioConFecha = {
      ...usuarioSinId,
      fechaCreacion: new Date(),
    }

    // Insertar el nuevo usuario
    const resultado = await collection.insertOne(usuarioConFecha)

    if (resultado.acknowledged) {
      // Devolver el usuario con su nuevo ID
      const nuevoUsuario = {
        ...usuarioConFecha,
        id: resultado.insertedId.toString(),
        fechaCreacion: usuarioConFecha.fechaCreacion.toISOString(),
      }
      console.log("API: Usuario creado exitosamente:", nuevoUsuario)
      return NextResponse.json(nuevoUsuario)
    }

    console.error("API ERROR: Error al insertar usuario en la base de datos")
    return NextResponse.json({ error: "Error al agregar usuario" }, { status: 500 })
  } catch (error) {
    console.error("API ERROR: Error al agregar usuario:", error)
    return NextResponse.json(
      {
        error: "Error al agregar usuario",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

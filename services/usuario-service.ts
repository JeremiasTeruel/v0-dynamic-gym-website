import { getMongoDb } from "@/lib/mongodb"
import type { Usuario } from "@/data/usuarios"
import { ObjectId } from "mongodb"

// Nombre de la colección en MongoDB
const COLLECTION = "usuarios"

// Función para obtener todos los usuarios
export async function obtenerTodosUsuarios(): Promise<Usuario[]> {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)
    const usuarios = await collection.find({}).toArray()

    // Convertir _id de MongoDB a id de string para mantener compatibilidad
    return usuarios.map((usuario) => ({
      ...usuario,
      id: usuario._id.toString(),
      _id: undefined,
    })) as Usuario[]
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    // Si hay un error, devolver un array vacío o los datos iniciales
    return []
  }
}

// Función para buscar un usuario por DNI
export async function buscarUsuarioPorDni(dni: string): Promise<Usuario | null> {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)
    const usuario = await collection.findOne({ dni })

    if (!usuario) return null

    // Convertir _id de MongoDB a id de string
    return {
      ...usuario,
      id: usuario._id.toString(),
      _id: undefined,
    } as Usuario
  } catch (error) {
    console.error("Error al buscar usuario por DNI:", error)
    return null
  }
}

// Función para agregar un nuevo usuario
export async function agregarUsuario(usuario: Omit<Usuario, "id">): Promise<Usuario | null> {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Verificar si ya existe un usuario con ese DNI
    const usuarioExistente = await collection.findOne({ dni: usuario.dni })
    if (usuarioExistente) {
      throw new Error("Ya existe un usuario con ese DNI")
    }

    // Insertar el nuevo usuario
    const resultado = await collection.insertOne(usuario)

    if (resultado.acknowledged) {
      // Devolver el usuario con su nuevo ID
      return {
        ...usuario,
        id: resultado.insertedId.toString(),
      } as Usuario
    }

    return null
  } catch (error) {
    console.error("Error al agregar usuario:", error)
    throw error
  }
}

// Función para actualizar el pago de un usuario
export async function actualizarPagoUsuario(
  dni: string,
  nuevaFechaVencimiento: string,
  metodoPago: string,
): Promise<Usuario | null> {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    // Actualizar el usuario
    const resultado = await collection.findOneAndUpdate(
      { dni },
      { $set: { fechaVencimiento: nuevaFechaVencimiento, metodoPago } },
      { returnDocument: "after" },
    )

    if (resultado) {
      // Convertir _id de MongoDB a id de string
      return {
        ...resultado,
        id: resultado._id.toString(),
        _id: undefined,
      } as Usuario
    }

    return null
  } catch (error) {
    console.error("Error al actualizar pago de usuario:", error)
    return null
  }
}

// Función para inicializar la base de datos con datos de ejemplo si está vacía
export async function inicializarBaseDeDatos(usuariosIniciales: Usuario[]): Promise<void> {
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

// Función para eliminar un usuario
export async function eliminarUsuario(id: string): Promise<boolean> {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTION)

    const resultado = await collection.deleteOne({ _id: new ObjectId(id) })

    return resultado.deletedCount === 1
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    return false
  }
}

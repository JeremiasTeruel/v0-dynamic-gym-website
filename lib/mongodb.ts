import { MongoClient, type Db } from "mongodb"

// Asegurarnos de que este código solo se ejecute en el servidor
if (typeof window !== "undefined") {
  throw new Error("Este módulo solo debe importarse desde el servidor")
}

// Usar la variable de entorno para la URI de MongoDB
const uri = process.env.MONGODB_URI || ""
const options = {
  // Opciones recomendadas para MongoDB Atlas
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

// Verificar que la URI esté definida
if (!uri) {
  console.error("¡ADVERTENCIA! La variable de entorno MONGODB_URI no está definida")
  throw new Error("Por favor, configura la variable de entorno MONGODB_URI en tu proyecto de Vercel")
}

let client: MongoClient
let clientPromise: Promise<MongoClient>
let db: Db

try {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
} catch (error) {
  console.error("Error al inicializar la conexión a MongoDB:", error)
  throw new Error("No se pudo inicializar la conexión a la base de datos")
}

export async function getMongoDb() {
  try {
    if (!db) {
      const client = await clientPromise
      db = client.db()
      console.log("Conexión a MongoDB establecida correctamente")
    }
    return db
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error)
    throw new Error(
      "No se pudo conectar a la base de datos. Verifica que la variable de entorno MONGODB_URI esté configurada correctamente.",
    )
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

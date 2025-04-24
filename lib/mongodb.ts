import { MongoClient, type Db } from "mongodb"

// Asegurarnos de que este código solo se ejecute en el servidor
if (typeof window !== "undefined") {
  throw new Error("Este módulo solo debe importarse desde el servidor")
}

// Usar la variable de entorno para la URI de MongoDB o la cadena de conexión directa como respaldo
const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://jteruel8:naCxod-nirdec-sujve7@cluster0.dtczv4t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const options = {
  // Opciones recomendadas para MongoDB Atlas
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

// Verificar que la URI esté definida
if (!uri) {
  console.error("¡ADVERTENCIA! No se encontró una cadena de conexión para MongoDB")
  throw new Error("Por favor, configura la variable de entorno MONGODB_URI en tu proyecto de Vercel")
}

let client: MongoClient
let clientPromise: Promise<MongoClient>
let db: Db

try {
  console.log("Inicializando cliente MongoDB...")
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
  console.log("Cliente MongoDB inicializado")
} catch (error) {
  console.error("Error al inicializar la conexión a MongoDB:", error)
  throw new Error("No se pudo inicializar la conexión a la base de datos: " + error.message)
}

export async function getMongoDb() {
  try {
    console.log("Intentando obtener conexión a MongoDB...")
    if (!db) {
      console.log("Esperando conexión del cliente...")
      const client = await clientPromise
      console.log("Cliente conectado, obteniendo base de datos...")
      db = client.db()
      console.log("Conexión a MongoDB establecida correctamente")
    }
    return db
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error)
    throw new Error(
      "No se pudo conectar a la base de datos. Verifica que la variable de entorno MONGODB_URI esté configurada correctamente. Error: " +
        error.message,
    )
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

import { MongoClient, type Db } from "mongodb"

// Asegurarnos de que este código solo se ejecute en el servidor
if (typeof window !== "undefined") {
  throw new Error("Este módulo solo debe importarse desde el servidor")
}

const uri =
  "mongodb+srv://jteruel8:PuertoMadryn2467@cluster0.dtczv4t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const options = {
  // Opciones recomendadas para MongoDB Atlas
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>
let db: Db

if (!uri) {
  throw new Error("Please add your MongoDB URI to .env.local")
}

// In production mode, it's best to not use a global variable.
client = new MongoClient(uri, options)
clientPromise = client.connect()

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
    throw new Error("No se pudo conectar a la base de datos")
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

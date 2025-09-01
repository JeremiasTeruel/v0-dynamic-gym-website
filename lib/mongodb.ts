import { MongoClient, type Db } from "mongodb"

// Asegurarnos de que este código solo se ejecute en el servidor
if (typeof window !== "undefined") {
  throw new Error("Este módulo solo debe importarse desde el servidor")
}

// Usar una cadena de conexión directa para evitar problemas con las variables de entorno
const uri =
  "mongodb+srv://gymadmin:gympassword123@cluster0.dtczv4t.mongodb.net/highPerformanceGym?retryWrites=true&w=majority&appName=Cluster0"

// Imprimir información de depuración (sin mostrar la contraseña completa)
const uriForLogging = uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")
console.log("Usando cadena de conexión (censurada):", uriForLogging)

const options = {
  // Opciones recomendadas para MongoDB Atlas
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000, // Aumentado para dar más tiempo
  socketTimeoutMS: 45000,
  // Deshabilitar la validación estricta de TLS para pruebas
  // (no recomendado para producción)
  tlsAllowInvalidCertificates: true,
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
      // Especificar explícitamente el nombre de la base de datos
      db = client.db("highPerformanceGym")
      console.log("Conexión a MongoDB establecida correctamente")
    }
    return db
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error)
    // Proporcionar información más detallada sobre el error
    const errorMessage = error.message || "Error desconocido"
    const errorCode = error.code || "Sin código"
    const errorName = error.name || "Sin nombre"

    throw new Error(
      `No se pudo conectar a la base de datos. Error: ${errorMessage}. Código: ${errorCode}. Nombre: ${errorName}`,
    )
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

import { MongoClient, type Db } from "mongodb"

const uri =
  "mongodb://dynamicGym_enterocean:7ea3a9e084c6592a9d1317f7c0125d5b5ae1bd79@a9f94.h.filess.io:61003/dynamicGym_enterocean"
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>
let db: Db

if (!uri) {
  throw new Error("Please add your MongoDB URI to .env.local")
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getMongoDb() {
  if (!db) {
    const client = await clientPromise
    db = client.db()
  }
  return db
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

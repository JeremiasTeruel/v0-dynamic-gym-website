import { getMongoDb } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export default async function DiagnosticoPage() {
  let status = "Desconocido"
  let error = null
  let dbInfo = null
  const envVars = {
    MONGODB_URI: process.env.MONGODB_URI ? "Configurado" : "No configurado",
  }

  try {
    // Intentar conectar a la base de datos
    const db = await getMongoDb()
    status = "Conectado"

    // Obtener información de la base de datos
    const admin = db.admin()
    const serverInfo = await admin.serverInfo()
    const dbStats = await db.stats()

    dbInfo = {
      version: serverInfo.version,
      collections: dbStats.collections,
      documents: dbStats.objects,
    }
  } catch (err) {
    status = "Error"
    error = err.message
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Conexión a MongoDB</h1>

      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2">Estado de la Conexión</h2>
        <p className={`font-bold ${status === "Conectado" ? "text-green-600" : "text-red-600"}`}>{status}</p>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {dbInfo && (
        <div className="mb-6 p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">Información de la Base de Datos</h2>
          <ul className="space-y-1">
            <li>
              <span className="font-medium">Versión:</span> {dbInfo.version}
            </li>
            <li>
              <span className="font-medium">Colecciones:</span> {dbInfo.collections}
            </li>
            <li>
              <span className="font-medium">Documentos:</span> {dbInfo.documents}
            </li>
          </ul>
        </div>
      )}

      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2">Variables de Entorno</h2>
        <ul className="space-y-1">
          {Object.entries(envVars).map(([key, value]) => (
            <li key={key}>
              <span className="font-medium">{key}:</span> {value}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <a href="/" className="text-blue-600 hover:underline">
          Volver al inicio
        </a>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"

export default function TestDbPage() {
  const [status, setStatus] = useState("Cargando...")
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testConnection() {
      try {
        setLoading(true)
        const response = await fetch("/api/test-db")
        const data = await response.json()

        if (data.success) {
          setStatus("Conexión exitosa")
        } else {
          setStatus("Error de conexión")
        }

        setDetails(data)
      } catch (error) {
        setStatus("Error al realizar la prueba")
        setDetails({ error: error.message })
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Prueba de Conexión a MongoDB</h1>

      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2">Estado</h2>
        <p className={`font-bold ${status === "Conexión exitosa" ? "text-green-600" : "text-red-600"}`}>
          {loading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Probando conexión...
            </span>
          ) : (
            status
          )}
        </p>
      </div>

      {details && (
        <div className="mb-6 p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">Detalles</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">{JSON.stringify(details, null, 2)}</pre>
        </div>
      )}

      <div className="mt-8">
        <a href="/" className="text-blue-600 hover:underline">
          Volver al inicio
        </a>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { useGymContext } from "@/context/gym-context"
import { exportarDatos, importarDatos } from "@/data/usuarios"

export default function Sincronizar() {
  const { usuarios } = useGymContext()
  const [datosExportados, setDatosExportados] = useState("")
  const [datosImportados, setDatosImportados] = useState("")
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" })

  const handleExportar = () => {
    const datos = exportarDatos()
    setDatosExportados(datos)
    setMensaje({
      texto: "Datos exportados correctamente. Copia este texto y guárdalo para importarlo en otro dispositivo.",
      tipo: "success",
    })
  }

  const handleImportar = () => {
    try {
      if (!datosImportados.trim()) {
        setMensaje({
          texto: "Por favor, ingresa los datos a importar.",
          tipo: "error",
        })
        return
      }

      importarDatos(datosImportados)
      setMensaje({
        texto: "Datos importados correctamente. Recarga la página para ver los cambios.",
        tipo: "success",
      })

      // Recargar la página después de 2 segundos
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setMensaje({
        texto: "Error al importar datos: " + error.message,
        tipo: "error",
      })
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold text-green-600 mb-10">Sincronizar Datos</h1>

      <div className="w-full max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Exportar/Importar Datos</h2>
          <Link
            href="/admin"
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:scale-105 transition-transform"
          >
            Volver a Administración
          </Link>
        </div>

        {mensaje.texto && (
          <div
            className={`p-4 mb-6 rounded-md ${
              mensaje.tipo === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <div className="space-y-8">
          <div className="border rounded-md p-6">
            <h3 className="text-xl font-medium mb-4">Exportar Datos</h3>
            <p className="mb-4 text-gray-600">
              Exporta los datos actuales para guardarlos o transferirlos a otro dispositivo.
            </p>
            <button
              onClick={handleExportar}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:scale-105 transition-transform mb-4"
            >
              Exportar Datos
            </button>
            {datosExportados && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Datos Exportados:</label>
                <textarea
                  value={datosExportados}
                  readOnly
                  className="w-full h-40 p-3 border border-gray-300 rounded-md bg-gray-50"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Haz clic en el cuadro de texto para seleccionar todo el contenido. Luego copia (Ctrl+C) y guárdalo.
                </p>
              </div>
            )}
          </div>

          <div className="border rounded-md p-6">
            <h3 className="text-xl font-medium mb-4">Importar Datos</h3>
            <p className="mb-4 text-gray-600">Importa datos previamente exportados desde otro dispositivo.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Pega los datos a importar:</label>
              <textarea
                value={datosImportados}
                onChange={(e) => setDatosImportados(e.target.value)}
                className="w-full h-40 p-3 border border-gray-300 rounded-md"
                placeholder="Pega aquí los datos exportados..."
              />
            </div>
            <button
              onClick={handleImportar}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:scale-105 transition-transform"
            >
              Importar Datos
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

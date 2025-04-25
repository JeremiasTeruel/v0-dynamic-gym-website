import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export async function GET() {
  try {
    console.log("Probando conexión a MongoDB...")

    // Usar una cadena de conexión directa para la prueba
    const uri =
      "mongodb+srv://gymadmin:gympassword123@cluster0.dtczv4t.mongodb.net/dynamicGym?retryWrites=true&w=majority&appName=Cluster0"

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    console.log("Creando cliente de prueba...")
    const client = new MongoClient(uri, options)

    console.log("Conectando cliente de prueba...")
    await client.connect()

    console.log("Obteniendo información del servidor...")
    const admin = client.db().admin()
    const serverInfo = await admin.serverInfo()

    console.log("Cerrando conexión de prueba...")
    await client.close()

    return NextResponse.json({
      success: true,
      message: "Conexión a MongoDB exitosa",
      serverVersion: serverInfo.version,
    })
  } catch (error) {
    console.error("Error al probar conexión a MongoDB:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error al conectar con MongoDB",
        error: {
          message: error.message,
          code: error.code,
          name: error.name,
          stack: error.stack,
        },
      },
      { status: 500 },
    )
  }
}

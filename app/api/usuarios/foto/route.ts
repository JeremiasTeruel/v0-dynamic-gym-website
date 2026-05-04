import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const odlUrl = formData.get('oldUrl') as string | null
    const userId = formData.get('userId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }

    // Limitar tamaño a 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no debe superar los 5MB' }, { status: 400 })
    }

    // Si hay una foto anterior, eliminarla
    if (odlUrl) {
      try {
        await del(odlUrl)
      } catch (e) {
        console.log('No se pudo eliminar la foto anterior:', e)
      }
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `usuarios/${userId || 'temp'}_${timestamp}.${extension}`

    // Subir a Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    })

    // Si hay userId, actualizar el usuario en la base de datos
    if (userId) {
      const client = await clientPromise
      const db = client.db('highPerformanceGym')
      await db.collection('usuarios').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { foto: blob.url } }
      )
    }

    return NextResponse.json({
      url: blob.url,
      success: true
    })
  } catch (error) {
    console.error('Error al subir foto:', error)
    return NextResponse.json({ error: 'Error al subir la foto' }, { status: 500 })
  }
}

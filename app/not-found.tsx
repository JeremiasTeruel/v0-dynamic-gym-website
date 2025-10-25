import Link from "next/link"

// Forzar renderizado dinámico
export const dynamic = "force-dynamic"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-green-600 dark:text-green-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Página no encontrada</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">La página que buscas no existe o ha sido movida.</p>
        <Link
          href="/"
          className="bg-green-600 dark:bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

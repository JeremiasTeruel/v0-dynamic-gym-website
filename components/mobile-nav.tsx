"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, UserPlus, CreditCard, Settings, ShoppingCart } from "lucide-react"
import { useState } from "react"
import VentaBebidasModal from "@/components/venta-bebidas-modal"

export default function MobileNav() {
  const pathname = usePathname()
  const [showVentaBebidasModal, setShowVentaBebidasModal] = useState(false)

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around py-2 z-10 transition-colors duration-200">
        <Link
          href="/"
          className={`flex flex-col items-center p-2 transition-colors ${isActive("/") ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs">Inicio</span>
        </Link>
        <Link
          href="/nuevo-usuario"
          className={`flex flex-col items-center p-2 transition-colors ${isActive("/nuevo-usuario") ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
        >
          <UserPlus className="h-6 w-6" />
          <span className="text-xs">Nuevo</span>
        </Link>
        <Link
          href="/pagar-cuota"
          className={`flex flex-col items-center p-2 transition-colors ${isActive("/pagar-cuota") ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
        >
          <CreditCard className="h-6 w-6" />
          <span className="text-xs">Pagos</span>
        </Link>
        <button
          onClick={() => setShowVentaBebidasModal(true)}
          className="flex flex-col items-center p-2 transition-colors text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="text-xs">Bebidas</span>
        </button>
        <Link
          href="/admin"
          className={`flex flex-col items-center p-2 transition-colors ${isActive("/admin") ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs">Admin</span>
        </Link>
      </div>

      {/* Modal de Venta de Bebidas */}
      <VentaBebidasModal isOpen={showVentaBebidasModal} onClose={() => setShowVentaBebidasModal(false)} />
    </>
  )
}

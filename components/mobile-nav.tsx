"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, UserPlus, CreditCard, Settings } from "lucide-react"

export default function MobileNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-10">
      <Link href="/" className={`flex flex-col items-center p-2 ${isActive("/") ? "text-green-600" : "text-gray-500"}`}>
        <Home className="h-6 w-6" />
        <span className="text-xs">Inicio</span>
      </Link>
      <Link
        href="/nuevo-usuario"
        className={`flex flex-col items-center p-2 ${isActive("/nuevo-usuario") ? "text-green-600" : "text-gray-500"}`}
      >
        <UserPlus className="h-6 w-6" />
        <span className="text-xs">Nuevo</span>
      </Link>
      <Link
        href="/pagar-cuota"
        className={`flex flex-col items-center p-2 ${isActive("/pagar-cuota") ? "text-green-600" : "text-gray-500"}`}
      >
        <CreditCard className="h-6 w-6" />
        <span className="text-xs">Pagos</span>
      </Link>
      <Link
        href="/admin"
        className={`flex flex-col items-center p-2 ${isActive("/admin") ? "text-green-600" : "text-gray-500"}`}
      >
        <Settings className="h-6 w-6" />
        <span className="text-xs">Admin</span>
      </Link>
    </div>
  )
}

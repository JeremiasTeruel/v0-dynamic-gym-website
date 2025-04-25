import type React from "react"
import "./globals.css"
import { GymProvider } from "@/context/gym-context"
import MobileNav from "@/components/mobile-nav"

export const metadata = {
  title: "Dynamic Gym",
  description: "Sistema de gestión para Dynamic Gym",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <GymProvider>
          <div className="pb-20 md:pb-0">{children}</div>
          <MobileNav />
        </GymProvider>
      </body>
    </html>
  )
}

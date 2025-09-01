import type React from "react"
import "./globals.css"
import { GymProvider } from "@/context/gym-context"
import { ThemeProvider } from "@/context/theme-context"
import MobileNav from "@/components/mobile-nav"

export const metadata = {
  title: "Dynamic Gym",
  description: "Sistema de gestión para Dynamic Gym",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-white dark:bg-gray-900 transition-colors duration-200">
        <ThemeProvider>
          <GymProvider>
            <div className="pb-20 md:pb-0">{children}</div>
            <MobileNav />
          </GymProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

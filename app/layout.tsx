import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { GymProvider } from "@/context/gym-context"
import { ThemeProvider } from "@/context/theme-context"
import MobileNav from "@/components/mobile-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "High Performance Gym - Sistema de Gestión",
  description: "Sistema de gestión para High Performance Gym",
    generator: 'v0.app'
}

// Forzar renderizado dinámico
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <GymProvider>
            {children}
            <MobileNav />
          </GymProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

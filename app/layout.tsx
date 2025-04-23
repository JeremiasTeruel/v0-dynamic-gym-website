import type React from "react"
import "./globals.css"
import { GymProvider } from "@/context/gym-context"

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
        <GymProvider>{children}</GymProvider>
      </body>
    </html>
  )
}

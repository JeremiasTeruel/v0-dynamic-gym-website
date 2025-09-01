"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    // Cargar tema guardado del localStorage
    const savedTheme = localStorage.getItem("gym-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Detectar preferencia del sistema
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(systemPrefersDark ? "dark" : "light")
    }
  }, [])

  useEffect(() => {
    // Aplicar el tema al documento
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)

    // Guardar en localStorage
    localStorage.setItem("gym-theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme debe ser usado dentro de un ThemeProvider")
  }
  return context
}

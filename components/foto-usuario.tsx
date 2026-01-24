"use client"

import React from "react"

import { useState, useRef } from "react"
import { Camera, Pencil, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface FotoUsuarioProps {
  foto?: string | null
  onFotoChange?: (url: string) => void
  userId?: string
  oldUrl?: string | null
  size?: "sm" | "md" | "lg"
  editable?: boolean
  className?: string
}

export default function FotoUsuario({
  foto,
  onFotoChange,
  userId,
  oldUrl,
  size = "md",
  editable = true,
  className = "",
}: FotoUsuarioProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes")
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB")
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (userId) formData.append("userId", userId)
      if (oldUrl) formData.append("oldUrl", oldUrl)

      const response = await fetch("/api/usuarios/foto", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al subir la foto")
      }

      const data = await response.json()
      if (onFotoChange) {
        onFotoChange(data.url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la foto")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-muted flex items-center justify-center relative border-2 border-border`}
      >
        {isUploading ? (
          <Loader2 className={`${iconSizes[size]} animate-spin text-muted-foreground`} />
        ) : foto ? (
          <Image
            src={foto || "/placeholder.svg"}
            alt="Foto de usuario"
            fill
            className="object-cover"
            sizes={size === "sm" ? "32px" : size === "md" ? "64px" : "96px"}
          />
        ) : (
          <User className={`${iconSizes[size]} text-muted-foreground`} />
        )}
      </div>

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="text-xs bg-transparent"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Subiendo...
              </>
            ) : foto ? (
              <>
                <Pencil className="w-3 h-3 mr-1" />
                Cambiar foto
              </>
            ) : (
              <>
                <Camera className="w-3 h-3 mr-1" />
                Agregar foto
              </>
            )}
          </Button>
        </>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

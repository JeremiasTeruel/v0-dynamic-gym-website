"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface AlertProps {
  message: string
  isOpen: boolean
  onClose: () => void
  autoRedirect?: boolean
  redirectPath?: string
  type?: "success" | "error" | "info"
}

export default function Alert({
  message,
  isOpen,
  onClose,
  autoRedirect = false,
  redirectPath = "/",
  type = "success",
}: AlertProps) {
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
        if (autoRedirect) {
          router.push(redirectPath)
        }
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose, autoRedirect, redirectPath, router])

  if (!isOpen) return null

  const bgColor = {
    success: "bg-green-100 border-green-500 text-green-700",
    error: "bg-red-100 border-red-500 text-red-700",
    info: "bg-blue-100 border-blue-500 text-blue-700",
  }[type]

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className={`p-6 rounded-lg shadow-lg max-w-sm w-full border ${bgColor}`}>
        <p className="text-center text-lg">{message}</p>
      </div>
    </div>
  )
}

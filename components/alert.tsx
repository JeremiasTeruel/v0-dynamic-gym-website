"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface AlertProps {
  message: string
  isOpen: boolean
  onClose: () => void
  autoRedirect?: boolean
  redirectPath?: string
}

export default function Alert({ message, isOpen, onClose, autoRedirect = false, redirectPath = "/" }: AlertProps) {
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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <p className="text-center text-lg">{message}</p>
      </div>
    </div>
  )
}

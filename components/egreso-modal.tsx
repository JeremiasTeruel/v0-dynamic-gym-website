"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface EgresoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEgresoCreado?: () => void
}

export function EgresoModal({ open, onOpenChange, onEgresoCreado }: EgresoModalProps) {
  const [monto, setMonto] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [profe, setProfe] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      // Verificar que hay una caja abierta
      const cajaResponse = await fetch("/api/caja/actual")
      const cajaData = await cajaResponse.json()

      if (!cajaData.caja) {
        setError("No hay una caja abierta. Por favor, abre la caja primero.")
        setLoading(false)
        return
      }

      // Crear el egreso
      const response = await fetch("/api/egresos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monto: Number.parseFloat(monto),
          descripcion,
          fecha,
          profe,
          cajaId: cajaData.caja.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear egreso")
      }

      setSuccess(true)

      // Limpiar formulario
      setMonto("")
      setDescripcion("")
      setFecha(new Date().toISOString().split("T")[0])
      setProfe("")

      // Notificar al padre
      if (onEgresoCreado) {
        onEgresoCreado()
      }

      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear egreso")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Egreso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ingrese el monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Motivo del egreso"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profe">Profe</Label>
            <Input
              id="profe"
              type="text"
              placeholder="Nombre del profesor"
              value={profe}
              onChange={(e) => setProfe(e.target.value)}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <AlertDescription>Egreso registrado exitosamente</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Egreso"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

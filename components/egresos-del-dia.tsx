"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Egreso {
  id: string
  monto: number
  descripcion: string
  fecha: string
  profe: string
}

interface EgresosDelDiaProps {
  egresos: Egreso[]
}

export default function EgresosDelDia({ egresos }: EgresosDelDiaProps) {
  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(monto)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Egresos del Día</CardTitle>
      </CardHeader>
      <CardContent>
        {egresos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No se han registrado egresos todavía</p>
        ) : (
          <>
            {/* Vista Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Monto</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Profe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {egresos.map((egreso) => (
                    <TableRow key={egreso.id}>
                      <TableCell className="font-medium">{formatearMonto(egreso.monto)}</TableCell>
                      <TableCell>{egreso.descripcion}</TableCell>
                      <TableCell>{formatearFecha(egreso.fecha)}</TableCell>
                      <TableCell>{egreso.profe}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Vista Mobile */}
            <div className="md:hidden space-y-4">
              {egresos.map((egreso) => (
                <Card key={egreso.id}>
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monto:</span>
                      <span className="font-semibold">{formatearMonto(egreso.monto)}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Descripción:</span>
                      <span className="text-right max-w-[60%]">{egreso.descripcion}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fecha:</span>
                      <span>{formatearFecha(egreso.fecha)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Profe:</span>
                      <span>{egreso.profe}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

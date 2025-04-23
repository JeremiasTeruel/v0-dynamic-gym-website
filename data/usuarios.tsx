// Definición de la estructura de un usuario
export interface Usuario {
  id: string
  nombreApellido: string
  dni: string
  edad: string
  fechaInicio: string
  fechaVencimiento: string
  metodoPago: string
}

// Array inicial de usuarios
export const usuariosIniciales: Usuario[] = [
  {
    id: "1",
    nombreApellido: "Juan Pérez",
    dni: "12345678",
    edad: "25",
    fechaInicio: "2023-01-15",
    fechaVencimiento: "2023-02-15",
    metodoPago: "Efectivo",
  },
  {
    id: "2",
    nombreApellido: "María López",
    dni: "87654321",
    edad: "30",
    fechaInicio: "2023-03-10",
    fechaVencimiento: "2023-04-10",
    metodoPago: "Mercado Pago",
  },
]

// Función para generar un ID único
export const generarIdUnico = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Función para cargar usuarios desde localStorage o usar los iniciales
export const cargarUsuarios = (): Usuario[] => {
  if (typeof window !== "undefined") {
    const usuariosGuardados = localStorage.getItem("gymUsuarios")
    return usuariosGuardados ? JSON.parse(usuariosGuardados) : usuariosIniciales
  }
  return usuariosIniciales
}

// Función para guardar usuarios en localStorage
export const guardarUsuarios = (usuarios: Usuario[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("gymUsuarios", JSON.stringify(usuarios))
  }
}

// Función para buscar un usuario por DNI
export const buscarUsuarioPorDni = (usuarios: Usuario[], dni: string): Usuario | undefined => {
  return usuarios.find((usuario) => usuario.dni === dni)
}

// Función para agregar un nuevo usuario
export const agregarUsuario = (usuarios: Usuario[], nuevoUsuario: Omit<Usuario, "id">): Usuario[] => {
  // Verificar si ya existe un usuario con ese DNI
  const usuarioExistente = buscarUsuarioPorDni(usuarios, nuevoUsuario.dni)
  if (usuarioExistente) {
    throw new Error("Ya existe un usuario con ese DNI")
  }

  // Crear nuevo usuario con ID único
  const usuarioConId: Usuario = {
    ...nuevoUsuario,
    id: generarIdUnico(),
  }

  // Agregar al array y guardar
  const nuevosUsuarios = [...usuarios, usuarioConId]
  guardarUsuarios(nuevosUsuarios)
  return nuevosUsuarios
}

// Función para actualizar el pago de un usuario
export const actualizarPagoUsuario = (
  usuarios: Usuario[],
  dni: string,
  nuevaFechaVencimiento: string,
  metodoPago: string,
): Usuario[] => {
  const nuevosUsuarios = usuarios.map((usuario) =>
    usuario.dni === dni ? { ...usuario, fechaVencimiento: nuevaFechaVencimiento, metodoPago } : usuario,
  )
  guardarUsuarios(nuevosUsuarios)
  return nuevosUsuarios
}

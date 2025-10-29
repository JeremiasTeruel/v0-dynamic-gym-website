// Definición de la estructura de un usuario
export interface Usuario {
  _id: string
  nombreApellido: string
  dni: string
  telefono: string
  edad: string
  fechaInicio: string
  fechaVencimiento: string
  metodoPago: string
  actividad: string
}

// NOTA: En una aplicación real, estos datos estarían en una base de datos
// y no en un archivo estático. Para sincronizar entre dispositivos,
// necesitarías una base de datos como MongoDB, Firebase, etc.

// Array inicial de usuarios
// Este array sirve como datos iniciales, pero no se modifica directamente
// en el archivo. Las modificaciones se guardan en localStorage.
export const usuariosIniciales: Usuario[] = [
  {
    id: "1",
    nombreApellido: "Juan Pérez",
    dni: "12345678",
    edad: "25",
    fechaInicio: "2023-01-15",
    fechaVencimiento: "2023-02-15",
    metodoPago: "Efectivo",
    actividad: "Normal",
  },
  {
    id: "2",
    nombreApellido: "María López",
    dni: "87654321",
    edad: "30",
    fechaInicio: "2023-03-10",
    fechaVencimiento: "2023-04-10",
    metodoPago: "Mercado Pago",
    actividad: "Familiar",
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

    // SIMULACIÓN: En una aplicación real, aquí enviaríamos los datos a un servidor
    console.log("Datos guardados en localStorage. En una aplicación real, estos datos se enviarían a un servidor.")
    console.log("Usuarios actualizados:", usuarios)

    // Para sincronizar entre dispositivos, necesitarías código como este:
    /*
    fetch('/api/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usuarios),
    })
    .then(response => response.json())
    .then(data => console.log('Éxito:', data))
    .catch((error) => console.error('Error:', error));
    */
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

  // SIMULACIÓN: En una aplicación real, aquí enviaríamos el nuevo usuario a un servidor
  console.log("Nuevo usuario agregado:", usuarioConId)

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

  // SIMULACIÓN: En una aplicación real, aquí enviaríamos la actualización a un servidor
  console.log("Pago actualizado para usuario con DNI:", dni)

  return nuevosUsuarios
}

// Función para exportar los datos (simulación)
export const exportarDatos = (): string => {
  const usuarios = cargarUsuarios()
  return JSON.stringify(usuarios, null, 2)
}

// Función para importar datos (simulación)
export const importarDatos = (datosJSON: string): Usuario[] => {
  try {
    const usuarios = JSON.parse(datosJSON) as Usuario[]
    guardarUsuarios(usuarios)
    return usuarios
  } catch (error) {
    console.error("Error al importar datos:", error)
    throw new Error("El formato de los datos importados no es válido")
  }
}

// Opciones de actividades disponibles
export const ACTIVIDADES_OPCIONES = ["Normal", "Familiar", "BJJ", "MMA", "Boxeo", "Convenio"] as const

export type ActividadTipo = (typeof ACTIVIDADES_OPCIONES)[number]

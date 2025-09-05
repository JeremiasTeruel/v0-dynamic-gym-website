// Utilidades para generar sonidos usando Web Audio API
export class SoundGenerator {
  private audioContext: AudioContext | null = null

  constructor() {
    // Inicializar AudioContext solo en el cliente
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  // Sonido de éxito (cuota al día) - tono agradable
  async playSuccessSound() {
    if (!this.audioContext) return

    try {
      // Reanudar el contexto si está suspendido
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Configurar el sonido de éxito (dos tonos ascendentes)
      oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1) // E5

      // Configurar el volumen con fade out
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

      oscillator.type = "sine"
      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn("Error al reproducir sonido de éxito:", error)
    }
  }

  // Sonido de alarma (cuota vencida) - tono de advertencia
  async playAlarmSound() {
    if (!this.audioContext) return

    try {
      // Reanudar el contexto si está suspendido
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      // Crear tres pitidos de alarma
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.createAlarmBeep(i * 0.2)
        }, i * 200)
      }
    } catch (error) {
      console.warn("Error al reproducir sonido de alarma:", error)
    }
  }

  private createAlarmBeep(delay: number) {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // Configurar el pitido de alarma (frecuencia alta y molesta)
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + delay)
    oscillator.type = "square" // Sonido más áspero

    // Configurar el volumen
    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime + delay)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.15)

    oscillator.start(this.audioContext.currentTime + delay)
    oscillator.stop(this.audioContext.currentTime + delay + 0.15)
  }

  // Sonido de búsqueda (opcional) - tono neutro
  async playSearchSound() {
    if (!this.audioContext) return

    try {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime) // A4
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.1)
    } catch (error) {
      console.warn("Error al reproducir sonido de búsqueda:", error)
    }
  }
}

// Instancia singleton del generador de sonidos
export const soundGenerator = new SoundGenerator()

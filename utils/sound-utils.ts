// Generador de sonidos usando Web Audio API
class SoundGenerator {
  private audioContext: AudioContext | null = null

  private async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Reactivar el contexto si está suspendido
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume()
    }

    return this.audioContext
  }

  private async playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.3,
  ): Promise<void> {
    try {
      const audioContext = await this.getAudioContext()

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = type

      // Configurar volumen con fade out
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)

      return new Promise((resolve) => {
        oscillator.onended = () => resolve()
      })
    } catch (error) {
      console.warn("Error al reproducir sonido:", error)
    }
  }

  // Sonido de éxito - dos tonos ascendentes suaves (para cuotas al día, operaciones exitosas)
  async playSuccessSound(): Promise<void> {
    try {
      await this.playTone(523.25, 0.15, "sine", 0.3) // C5
      await new Promise((resolve) => setTimeout(resolve, 50))
      await this.playTone(659.25, 0.3, "sine", 0.3) // E5
    } catch (error) {
      console.warn("Error al reproducir sonido de éxito:", error)
    }
  }

  // Sonido de alarma - tres pitidos para cuotas vencidas o errores
  async playAlarmSound(): Promise<void> {
    try {
      for (let i = 0; i < 3; i++) {
        await this.playTone(800, 0.15, "square", 0.4)
        if (i < 2) {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }
    } catch (error) {
      console.warn("Error al reproducir sonido de alarma:", error)
    }
  }

  // Sonido de búsqueda - tono neutro
  async playSearchSound(): Promise<void> {
    try {
      await this.playTone(440, 0.1, "sine", 0.2) // A4
    } catch (error) {
      console.warn("Error al reproducir sonido de búsqueda:", error)
    }
  }

  // Sonido de operación completada - tono de confirmación más largo
  async playOperationCompleteSound(): Promise<void> {
    try {
      await this.playTone(523.25, 0.2, "sine", 0.35) // C5
      await new Promise((resolve) => setTimeout(resolve, 100))
      await this.playTone(659.25, 0.2, "sine", 0.35) // E5
      await new Promise((resolve) => setTimeout(resolve, 100))
      await this.playTone(783.99, 0.4, "sine", 0.35) // G5
    } catch (error) {
      console.warn("Error al reproducir sonido de operación completada:", error)
    }
  }

  // Sonido de eliminación - tono descendente
  async playDeleteSound(): Promise<void> {
    try {
      await this.playTone(659.25, 0.15, "sine", 0.3) // E5
      await new Promise((resolve) => setTimeout(resolve, 50))
      await this.playTone(523.25, 0.15, "sine", 0.3) // C5
      await new Promise((resolve) => setTimeout(resolve, 50))
      await this.playTone(392.0, 0.3, "sine", 0.3) // G4
    } catch (error) {
      console.warn("Error al reproducir sonido de eliminación:", error)
    }
  }
}

// Instancia singleton
export const soundGenerator = new SoundGenerator()

// Hook para manejar preferencias de sonido
export const useSoundPreferences = () => {
  const getSoundEnabled = (): boolean => {
    if (typeof window === "undefined") return true
    const saved = localStorage.getItem("gym-sound-enabled")
    return saved !== null ? JSON.parse(saved) : true
  }

  const setSoundEnabled = (enabled: boolean): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gym-sound-enabled", JSON.stringify(enabled))
    }
  }

  return { getSoundEnabled, setSoundEnabled }
}

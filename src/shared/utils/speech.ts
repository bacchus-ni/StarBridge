const voiceEnabledStorageKey = 'starbridge-voice-enabled'

let currentAudio: HTMLAudioElement | null = null
let currentAudioUrl: string | null = null

export function isVoiceEnabled() {
  try {
    return window.localStorage.getItem(voiceEnabledStorageKey) !== 'false'
  } catch {
    return true
  }
}

export function setVoiceEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(voiceEnabledStorageKey, String(enabled))
  } catch {
    // The toggle should still work for this interaction even if storage is blocked.
  }

  if (!enabled) {
    stopSpeech()
  }
}

export function getVoiceEnabledStorageKey() {
  return voiceEnabledStorageKey
}

export function stopSpeech() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl)
    currentAudioUrl = null
  }
}

export async function speak(text: string) {
  const trimmedText = text.trim()
  if (!trimmedText || !isVoiceEnabled()) {
    return
  }

  stopSpeech()

  try {
    const response = await fetch('/api/doubao-tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: trimmedText }),
    })

    if (!response.ok) {
      throw new Error(`Doubao TTS request failed with ${response.status}`)
    }

    const audioBlob = await response.blob()
    if (!audioBlob.size || !isVoiceEnabled()) {
      return
    }

    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    currentAudio = audio
    currentAudioUrl = audioUrl
    audio.onended = clearCurrentAudio
    audio.onerror = clearCurrentAudio
    await audio.play()
  } catch (error) {
    console.warn('Doubao TTS playback failed', error)
    clearCurrentAudio()
  }
}

function clearCurrentAudio() {
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl)
  }

  currentAudio = null
  currentAudioUrl = null
}

import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { getVoiceEnabledStorageKey, isVoiceEnabled, speak } from '../utils/speech'

type SpeakButtonProps = {
  text: string
  label?: string
}

export function SpeakButton({ text, label = '朗读' }: SpeakButtonProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(() => isVoiceEnabled())

  useEffect(() => {
    function syncVoiceEnabled(event: StorageEvent) {
      if (event.key === getVoiceEnabledStorageKey()) {
        setVoiceEnabled(isVoiceEnabled())
      }
    }

    window.addEventListener('storage', syncVoiceEnabled)
    return () => window.removeEventListener('storage', syncVoiceEnabled)
  }, [])

  return (
    <button
      className="speak-button"
      type="button"
      aria-label={voiceEnabled ? `${label}：${text}` : '声音已关闭'}
      disabled={!voiceEnabled}
      onClick={() => speak(text)}
    >
      {voiceEnabled ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  )
}

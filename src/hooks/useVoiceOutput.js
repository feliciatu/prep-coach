import { useEffect, useRef, useState } from 'react';

function cleanText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,3}\s/g, '')
    .replace(/✅|⚠️|💡|🏆/g, '')
    .replace(/`[^`]*`/g, '')
    .trim();
}

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  if (lang === 'zh-TW') {
    return voices.find(v => v.lang.startsWith('zh') && v.localService)
        ?? voices.find(v => v.lang.startsWith('zh'))
        ?? null;
  }
  const preferred = ['Ava', 'Samantha', 'Karen', 'Allison', 'Susan', 'Victoria'];
  return preferred.map(name => voices.find(v => v.name === name)).find(Boolean)
      ?? voices.find(v => v.lang.startsWith('en-') && v.localService)
      ?? voices.find(v => v.lang.startsWith('en'))
      ?? null;
}

export function useVoiceOutput(lang) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => 'speechSynthesis' in window || 'Audio' in window);
  const [voicesReady, setVoicesReady] = useState(false);
  const mountedRef = useRef(true);
  const audioRef = useRef(null);

  // Wait for browser voices (used only as fallback)
  useEffect(() => {
    if (!('speechSynthesis' in window)) { setVoicesReady(true); return; }
    const check = () => {
      if (window.speechSynthesis.getVoices().length > 0 && mountedRef.current) {
        setVoicesReady(true);
      }
    };
    check();
    window.speechSynthesis.addEventListener('voiceschanged', check);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', check);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Fallback: browser speech synthesis (Samantha etc.)
  const speakBrowser = (clean) => {
    if (!('speechSynthesis' in window) || !clean) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === 'zh-TW' ? 'zh-TW' : 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 1;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { if (mountedRef.current) setIsSpeaking(true); };
    utterance.onend   = () => { if (mountedRef.current) setIsSpeaking(false); };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && mountedRef.current) setIsSpeaking(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  const speak = async (text) => {
    const clean = cleanText(text || '');
    if (!clean) return;

    // Stop anything currently playing
    stop();

    // Try ElevenLabs first (natural voice via backend)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, lang }),
      });

      if (!res.ok) throw new Error('tts unavailable');

      const blob = await res.blob();
      if (!mountedRef.current) return;

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay  = () => { if (mountedRef.current) setIsSpeaking(true); };
      audio.onended = () => {
        if (mountedRef.current) setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        if (mountedRef.current) setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch {
      // ElevenLabs not available — fall back to browser voice
      speakBrowser(clean);
    }
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (mountedRef.current) setIsSpeaking(false);
  };

  return { speak, stop, isSpeaking, isSupported, voicesReady };
}

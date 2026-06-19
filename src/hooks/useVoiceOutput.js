import { useEffect, useRef, useState } from 'react';

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
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  const [voicesReady, setVoicesReady] = useState(false);
  const mountedRef = useRef(true);

  // Wait for voices to load
  useEffect(() => {
    if (!isSupported) return;
    const check = () => {
      if (window.speechSynthesis.getVoices().length > 0) {
        if (mountedRef.current) setVoicesReady(true);
      }
    };
    check();
    window.speechSynthesis.addEventListener('voiceschanged', check);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', check);
  }, [isSupported]);

  // Chrome bug workaround: speechSynthesis pauses after ~15s of inactivity
  useEffect(() => {
    if (!isSupported) return;
    const id = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(id);
  }, [isSupported]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = (text) => {
    if (!isSupported || !text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume(); // Chrome bug: resume before speaking

    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,3}\s/g, '')
      .replace(/✅|⚠️|💡|🏆/g, '')
      .replace(/`[^`]*`/g, '')
      .trim();

    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === 'zh-TW' ? 'zh-TW' : 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 1;

    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    console.log('[speak] voice:', voice?.name ?? 'default', '| text:', clean.slice(0, 60));

    utterance.onstart = () => { if (mountedRef.current) setIsSpeaking(true); };
    utterance.onend   = () => { if (mountedRef.current) setIsSpeaking(false); };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && mountedRef.current) setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    if (mountedRef.current) setIsSpeaking(false);
  };

  return { speak, stop, isSpeaking, isSupported, voicesReady };
}

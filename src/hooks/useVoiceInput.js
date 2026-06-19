import { useState, useEffect, useRef, useCallback } from 'react';

const SEND_DELAY_MS = 3500;

export function useVoiceInput(lang) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isFinal, setIsFinal] = useState(false);

  const recognitionRef = useRef(null);
  const langRef = useRef(lang);
  const sendTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const mountedRef = useRef(true);
  const firedRef = useRef(false); // prevent double-fire

  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(sendTimerRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    if (mountedRef.current) setIsSupported(true);

    const r = new SR();
    r.continuous = false;     // stop after natural pause — simpler, more stable
    r.interimResults = true;

    r.onresult = (event) => {
      if (!mountedRef.current) return;
      let text = '';
      for (const result of event.results) {
        text += result[0].transcript;
      }
      transcriptRef.current = text;
      setTranscript(text);

      // Reset timer on each new word
      clearTimeout(sendTimerRef.current);
      sendTimerRef.current = setTimeout(() => {
        if (mountedRef.current && transcriptRef.current.trim() && !firedRef.current) {
          firedRef.current = true;
          setIsFinal(true);
        }
      }, SEND_DELAY_MS);
    };

    r.onend = () => {
      if (!mountedRef.current) return;
      setIsListening(false);
      clearTimeout(sendTimerRef.current);
      if (transcriptRef.current.trim() && !firedRef.current) {
        firedRef.current = true;
        setIsFinal(true);
      }
    };

    r.onerror = (e) => {
      if (!mountedRef.current) return;
      if (e.error !== 'no-speech') console.error('Voice error:', e.error);
      setIsListening(false);
    };

    recognitionRef.current = r;
    return () => r.abort();
  }, []);

  const toggle = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    if (isListening) {
      clearTimeout(sendTimerRef.current);
      r.stop();
    } else {
      // Reset everything before starting
      transcriptRef.current = '';
      firedRef.current = false;
      setTranscript('');
      setIsFinal(false);
      r.lang = langRef.current === 'zh-TW' ? 'zh-TW' : 'en-US';
      try {
        r.start();
        setIsListening(true);
      } catch (e) {
        console.error('Could not start recognition:', e);
      }
    }
  }, [isListening]);

  // Called by CallInterface after message is sent, to reset for next turn
  const reset = useCallback(() => {
    transcriptRef.current = '';
    firedRef.current = false;
    setTranscript('');
    setIsFinal(false);
    setIsListening(false);
  }, []);

  return { isListening, isSupported, transcript, isFinal, toggle, reset };
}

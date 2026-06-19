import { useState, useRef, useEffect } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { t } from '../i18n';

export default function MessageInput({ onSend, isStreaming, uiLang }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);
  const voiceStartRef = useRef(0);
  const strings = t[uiLang];

  // Voice recognition language follows the app language automatically.
  // zh-TW handles mixed Chinese/English input natively; no manual toggle needed.
  const { isListening, isSupported, transcript, isFinal, toggle } = useVoiceInput(uiLang);

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus();
  }, [isStreaming]);

  useEffect(() => {
    if (!transcript) return;
    const base = value.slice(0, voiceStartRef.current);
    const separator = base.length > 0 && !base.endsWith(' ') ? ' ' : '';
    setValue(base + separator + transcript);
    resizeTextarea();
  }, [transcript]);

  useEffect(() => {
    if (isFinal && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isFinal]);

  const handleMicToggle = () => {
    if (!isListening) voiceStartRef.current = value.length;
    toggle();
  };

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const text = value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleInput = (e) => {
    setValue(e.target.value);
    resizeTextarea();
  };

  const placeholder = isListening
    ? strings.placeholderListening
    : isStreaming
    ? strings.placeholderStreaming
    : strings.placeholder;

  return (
    <div className="input-area">
      <div className={`input-box ${isListening ? 'listening' : ''}`}>
        <textarea
          ref={textareaRef}
          className="input-textarea"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          rows={1}
        />

        {isSupported && (
          <button
            className={`mic-btn ${isListening ? 'active' : ''}`}
            onClick={handleMicToggle}
            disabled={isStreaming}
            aria-label={isListening ? strings.placeholderListening : 'Voice input'}
          >
            {isListening ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        )}

        <button
          className="send-btn"
          onClick={submit}
          disabled={isStreaming || !value.trim()}
          aria-label="Send"
        >
          {isStreaming ? (
            <span className="send-spinner" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div className="input-footer">
        <span className="input-hint">
          {isListening ? strings.hintListening : strings.hint}
        </span>
      </div>
    </div>
  );
}

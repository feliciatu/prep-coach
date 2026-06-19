import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useVoiceOutput } from '../hooks/useVoiceOutput';
import { t } from '../i18n';
// import SkillsRadar from './SkillsRadar';

const MODE_ICONS = { interview: '🎯', business: '📊' };

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function CallInterface({ mode, uiLang, role, company, searchContext, onEnd }) {
  const strings = t[uiLang];
  const { messages, sendMessage, isStreaming, resetChat } = useChat(mode, uiLang, role, company, 'call', searchContext);
  const { speak, stop: stopSpeaking, isSpeaking, voicesReady } = useVoiceOutput(uiLang);
  const { isListening, isSupported, transcript, isFinal, toggle: toggleMic, reset: resetVoice } = useVoiceInput(uiLang);

  const [elapsed, setElapsed] = useState(0);
  const [transcript2, setTranscript2] = useState('');
  const [callEnded, setCallEnded] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [isFetchingScore, setIsFetchingScore] = useState(false);
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'text'
  const [textInput, setTextInput] = useState('');

  const prevMsgCount = useRef(null);
  const bottomRef = useRef(null);
  const autoSentRef = useRef(false);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speak new AI messages
  useEffect(() => {
    if (isStreaming) return;
    const latest = messages[messages.length - 1];
    if (!latest || latest.role !== 'assistant' || !latest.content) return;
    if (latest.id === prevMsgCount.current) return; // already spoken
    prevMsgCount.current = latest.id;
    const t = setTimeout(() => speak(latest.content), 300);
    return () => clearTimeout(t);
  }, [messages, isStreaming]);

  // Track transcript for display
  useEffect(() => {
    setTranscript2(transcript);
  }, [transcript]);

  // Auto-send when speech is final
  useEffect(() => {
    if (!isFinal) return;
    const text = transcript.trim();
    if (!text || isStreaming || autoSentRef.current) return;
    autoSentRef.current = true;
    stopSpeaking();
    resetVoice();          // clear transcript + firedRef immediately
    setTranscript2('');
    sendMessage(text);
    setTimeout(() => { autoSentRef.current = false; }, 1500);
  }, [isFinal]);

  const handleMicPress = () => {
    if (isStreaming || isSpeaking) return;
    toggleMic();
  };

  const handleEndCall = async () => {
    stopSpeaking();
    if (isListening) toggleMic();
    setCallEnded(true);
    setIsFetchingScore(true);

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, mode, uiLang, role, company }),
      });
      const data = await res.json();
      setScoreData(data);
      // Feedback is shown as text only — no spoken read-out on the score screen.
    } catch {
      setScoreData({ error: true });
    } finally {
      setIsFetchingScore(false);
    }
  };

  const roleLabel = role ? strings.roles[role]?.label : null;
  const companyLabel = company ? strings.companySelector?.types[company.companyType]?.label : null;

  if (callEnded) {
    return (
      <div className="call-score-screen">
        <div className="call-score-header">
          <span className="call-score-icon">📋</span>
          <h2>{strings.call.scoreTitle}</h2>
          <p className="call-score-meta">
            {roleLabel && <span className="role-tag">{roleLabel}</span>}
            {companyLabel && <span className="role-tag">{companyLabel}</span>}
            <span className="call-elapsed">⏱ {formatTime(elapsed)}</span>
          </p>
        </div>

        {isFetchingScore ? (
          <div className="call-score-loading">
            <span className="typing-dots"><span /><span /><span /></span>
            <p>{strings.call.scoring}</p>
          </div>
        ) : scoreData?.error ? (
          <p className="call-score-error">{strings.call.scoreError}</p>
        ) : (
          <div className="call-score-body">
            <div className="call-score-number">
              <span className="score-digit">{scoreData?.score ?? '—'}</span>
              <span className="score-denom">/10</span>
            </div>
            {/* SkillsRadar skills={scoreData?.skills} */}
            {scoreData?.strengths && (
              <div className="call-score-section">
                <div className="call-score-section-title">✅ What you did well</div>
                <p>{scoreData.strengths}</p>
              </div>
            )}
            {scoreData?.improvements && (
              <div className="call-score-section">
                <div className="call-score-section-title">💡 What to work on</div>
                <p>{scoreData.improvements}</p>
              </div>
            )}
            {scoreData?.example && (
              <div className="call-score-section call-score-example">
                <div className="call-score-section-title">🏆 How a top candidate would answer</div>
                <p>{scoreData.example}</p>
              </div>
            )}
          </div>
        )}

        <div className="call-score-actions">
          <button className="call-retry-btn" onClick={onEnd}>
            {strings.call.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="call-layout">
      {/* Header bar */}
      <div className="call-topbar">
        <div className="call-info">
          <span className="call-dot" />
          <span className="call-label">
            {MODE_ICONS[mode]}
            {roleLabel && ` · ${roleLabel}`}
            {companyLabel && ` · ${companyLabel}`}
          </span>
        </div>
        <span className="call-timer">{formatTime(elapsed)}</span>
      </div>

      {/* Transcript scroll */}
      <div className="call-transcript">
        <div className="call-transcript-inner">
          {messages.map((msg, i) => (
            <div key={msg.id ?? i} className={`call-msg ${msg.role}`}>
              <span className="call-msg-who">
                {msg.role === 'assistant'
                  ? (roleLabel ?? strings.call.interviewer)
                  : strings.userAvatar}
              </span>
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content || ' '}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          ))}
          {transcript2 && (
            <div className="call-msg user call-msg-interim">
              <span className="call-msg-who">{strings.userAvatar}</span>
              <p>{transcript2}</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Speaking indicator */}
      {(isSpeaking || isStreaming) && (
        <div className="call-speaking-bar">
          <span className="call-speaking-dots"><span /><span /><span /></span>
          <span>{strings.call.interviewerSpeaking}</span>
        </div>
      )}

      {/* Text input mode */}
      {inputMode === 'text' && (
        <div className="call-text-input-row">
          <input
            className="call-text-input"
            type="text"
            placeholder="Type your answer…"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && textInput.trim() && !isStreaming) {
                sendMessage(textInput.trim());
                setTextInput('');
              }
            }}
            disabled={isStreaming || isSpeaking}
            autoFocus
          />
          <button
            className="call-text-send-btn"
            disabled={!textInput.trim() || isStreaming}
            onClick={() => { sendMessage(textInput.trim()); setTextInput(''); }}
          >
            Send
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="call-controls">
        {inputMode === 'voice' ? (
          <button
            className={`call-mic-btn ${isListening ? 'active' : ''}`}
            onClick={handleMicPress}
            disabled={isStreaming || isSpeaking || !isSupported}
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
            <span>{isListening ? strings.call.stopSpeaking : strings.call.startSpeaking}</span>
          </button>
        ) : (
          <div className="call-mic-btn" style={{opacity:0.3, cursor:'default'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <span>Speak</span>
          </div>
        )}

        {/* Toggle voice/text */}
        <button
          className="call-toggle-btn"
          onClick={() => {
            if (isListening) toggleMic();
            setInputMode(m => m === 'voice' ? 'text' : 'voice');
          }}
          title={inputMode === 'voice' ? 'Switch to typing' : 'Switch to voice'}
        >
          {inputMode === 'voice' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
          <span>{inputMode === 'voice' ? 'Type' : 'Voice'}</span>
        </button>

        <button className="call-end-btn" onClick={handleEndCall}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
          </svg>
          <span>{strings.call.endCall}</span>
        </button>
      </div>

      {!isSupported && (
        <p className="call-no-voice">{strings.call.noVoiceSupport}</p>
      )}
    </div>
  );
}

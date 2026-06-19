import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import { t } from '../i18n';
import CompanySelector from './CompanySelector';
import RoleSelector from './RoleSelector';
import CallInterface from './CallInterface';
import MessageInput from './MessageInput';
import { IconTarget, IconBarChart } from './Icons';

const MODE_ICONS     = { interview: '🎯', business: '📊' };
const MODE_ICON_CMPS = { interview: IconTarget, business: IconBarChart };

function ModeChooser({ onChoose, uiLang }) {
  const strings = t[uiLang];
  return (
    <div className="role-selector">
      <div className="role-selector-header">
        <h2 className="role-selector-heading">How would you like to practice?</h2>
        <p className="role-selector-sub">Choose your preferred format</p>
      </div>
      <div className="role-grid">
        <button className="role-card" onClick={() => onChoose('chat')}>
          <span style={{ fontSize: 28, marginBottom: 8 }}>💬</span>
          <span className="role-card-label">Text Chat</span>
          <span className="role-card-focus">Type your answers, get written feedback</span>
        </button>
        <button className="role-card" onClick={() => onChoose('call')}>
          <span style={{ fontSize: 28, marginBottom: 8 }}>📞</span>
          <span className="role-card-label">Phone Call</span>
          <span className="role-card-focus">Speak your answers, hear the interviewer respond</span>
        </button>
      </div>
    </div>
  );
}

export default function ChatInterface({ mode, uiLang }) {
  const [company, setCompany] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [sessionMode, setSessionMode] = useState(null); // 'chat' | 'call'
  const [prepDone, setPrepDone] = useState(false);
  const [searchContext, setSearchContext] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const { messages, sendMessage, isStreaming, resetChat } = useChat(mode, uiLang, selectedRole, company, sessionMode, searchContext);
  const bottomRef = useRef(null);
  const strings = t[uiLang];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReset = () => {
    resetChat();
    setSelectedRole(null);
    setCompany(null);
    setSessionMode(null);
    setPrepDone(false);
    setSearchContext(null);
  };

  const handleChooseMode = async (chosen) => {
    setSessionMode(chosen);
    setPrepDone(true);

    // Background search using company type + role info (no name needed —
    // the interviewer asks which company as its first question)
    if (company || selectedRole) {
      setIsSearching(true);
      try {
        const res = await fetch('/api/search-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: company?.companyType,
            companyName: null,
            role: selectedRole,
            industry: company?.industry,
          }),
        });
        const { context } = await res.json();
        setSearchContext(context);
      } catch {
        // silently fail — still works without search
      } finally {
        setIsSearching(false);
      }
    }
  };

  const showCompanySelector = mode === 'interview' && !company;
  const showRoleSelector    = mode === 'interview' && company && !selectedRole;
  const showModeChooser     = mode === 'interview' && company && selectedRole && !sessionMode;
  const showSearching       = sessionMode && prepDone && isSearching;

  const companyLabel  = company ? strings.companySelector?.types[company.companyType]?.label : null;
  const industryLabel = company ? strings.companySelector?.industries[company.industry]?.label : null;
  const roleLabel     = selectedRole ? strings.roles[selectedRole]?.label : null;

  // Call mode — full-screen, no toolbar (only after prep is done)
  if (sessionMode === 'call' && prepDone) {
    return (
      <CallInterface
        mode={mode}
        uiLang={uiLang}
        role={selectedRole}
        company={company}
        searchContext={searchContext}
        onEnd={handleReset}
      />
    );
  }

  return (
    <div className="chat-layout">
      <div className="chat-toolbar">
        <div className="toolbar-left">
          {(company || selectedRole) && (
            <button className="back-btn" onClick={handleReset}>
              {strings.backToHome}
            </button>
          )}
          <span className="toolbar-label">
            {(() => { const I = MODE_ICON_CMPS[mode]; return I ? <I size={14} style={{verticalAlign:'middle', marginRight:4}} /> : null; })()}
            {strings.modes[mode].label}
            {companyLabel  && <span className="role-tag">{companyLabel}</span>}
            {industryLabel && <span className="role-tag">{industryLabel}</span>}
            {roleLabel     && <span className="role-tag">{roleLabel}</span>}
          </span>
        </div>
        <button className="reset-btn" onClick={handleReset}>
          {strings.newSession}
        </button>
      </div>

      {showCompanySelector ? (
        <CompanySelector onSelect={setCompany} uiLang={uiLang} />
      ) : showRoleSelector ? (
        <RoleSelector onSelect={setSelectedRole} uiLang={uiLang} />
      ) : showModeChooser ? (
        <ModeChooser onChoose={handleChooseMode} uiLang={uiLang} />
      ) : showSearching ? (
        <div className="role-selector">
          <div className="role-selector-header">
            <span className="typing-dots"><span /><span /><span /></span>
            <p className="role-selector-sub" style={{marginTop:16}}>Researching your interview context…</p>
          </div>
        </div>
      ) : (
        <>
          <div className="messages-scroll">
            <div className="messages-inner">
              {messages.map((msg, i) => (
                <div
                  key={msg.id ?? i}
                  className={`message-row ${msg.role === 'user' ? 'user' : 'assistant'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="avatar assistant-avatar">{MODE_ICONS[mode]}</div>
                  )}
                  <div className={`bubble ${msg.role}`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content || ' '}</ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    {msg.role === 'assistant' &&
                      isStreaming &&
                      i === messages.length - 1 &&
                      msg.content === '' && (
                        <span className="typing-dots">
                          <span /><span /><span />
                        </span>
                      )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="avatar user-avatar">{strings.userAvatar}</div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <MessageInput onSend={sendMessage} isStreaming={isStreaming} uiLang={uiLang} />
        </>
      )}
    </div>
  );
}

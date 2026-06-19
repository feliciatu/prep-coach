import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import { IconSparkle, IconTarget, IconBarChart } from './components/Icons';
import { t } from './i18n';

const MODES = [
  { id: 'interview', Icon: IconTarget, available: true },
  { id: 'business',  Icon: IconBarChart, available: false },
];

export default function App() {
  const [mode, setMode] = useState('interview');
  const [uiLang, setUiLang] = useState('en-US');
  const [sessionKey, setSessionKey] = useState(0);
  const strings = t[uiLang];

  const toggleLang = () => setUiLang(l => l === 'en-US' ? 'zh-TW' : 'en-US');
  const goHome = () => setSessionKey(k => k + 1);

  return (
    <div className="app" data-mode={mode}>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand" onClick={goHome} style={{cursor:'pointer'}}>
            <IconSparkle size={22} className="brand-icon-svg" />
            <span className="brand-name">PrepCoach</span>
          </div>
          <nav className="mode-nav">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`mode-btn ${mode === m.id ? 'active' : ''} ${!m.available ? 'soon' : ''}`}
                onClick={() => m.available && setMode(m.id)}
                disabled={!m.available}
                title={!m.available ? strings.soon : strings.modes[m.id].description}
              >
                <m.Icon size={15} className="mode-icon-svg" />
                <span className="mode-label">{strings.modes[m.id].label}</span>
                {!m.available && <span className="soon-badge">{strings.soon}</span>}
              </button>
            ))}
          </nav>
          <button className="lang-toggle" onClick={toggleLang}>
            {uiLang === 'en-US' ? '中文' : 'EN'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <ChatInterface key={`${mode}-${uiLang}-${sessionKey}`} mode={mode} uiLang={uiLang} />
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ROLE_GREETINGS, INITIAL_GREETINGS } from '../prompts';
import { t } from '../i18n';

function makeWelcome(mode, uiLang, role) {
  let content;
  if (mode === 'interview') {
    if (!role) return null; // show role selector, no pre-populated message
    content = ROLE_GREETINGS[role]?.[uiLang] ?? ROLE_GREETINGS[role]?.['en-US'] ?? '';
  } else {
    content = INITIAL_GREETINGS[mode]?.[uiLang] ?? INITIAL_GREETINGS[mode]?.['en-US'] ?? '';
  }
  return { role: 'assistant', content, id: 'welcome' };
}

export function useChat(mode, uiLang = 'en-US', role = null, company = null, sessionMode = null, searchContext = null) {
  const [messages, setMessages] = useState(() => {
    const w = makeWelcome(mode, uiLang, role);
    return w ? [w] : [];
  });
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const w = makeWelcome(mode, uiLang, role);
    setMessages(w ? [w] : []);
    setIsStreaming(false);
  }, [mode, uiLang, role]);

  const sendMessage = async (content) => {
    if (isStreaming || !content.trim()) return;

    const apiMessages = [
      ...messages.map(({ role, content }) => ({ role, content })),
      { role: 'user', content },
    ];

    setMessages((prev) => [...prev, { role: 'user', content }]);

    const aiId = `ai-${Date.now()}`;
    setMessages((prev) => [...prev, { role: 'assistant', content: '', id: aiId }]);
    setIsStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, mode, uiLang, role, company, sessionMode, searchContext }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId ? { ...m, content: m.content + parsed.text } : m
                )
              );
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? { ...m, content: `${t[uiLang].errorPrefix}${err.message}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const resetChat = () => {
    const w = makeWelcome(mode, uiLang, role);
    setMessages(w ? [w] : []);
    setIsStreaming(false);
  };

  return { messages, sendMessage, isStreaming, resetChat };
}

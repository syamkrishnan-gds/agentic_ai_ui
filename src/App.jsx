import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [intent, setIntent] = useState('');
  const [streamedResults, setStreamedResults] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoSelect, setAutoSelect] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState("Banking");

  const resultsDisplayRef = useRef(null);
  const userScrolling = useRef(false);

  useEffect(() => {
    if (resultsDisplayRef.current && !userScrolling.current) {
      resultsDisplayRef.current.scrollTop = resultsDisplayRef.current.scrollHeight;
    }
  }, [streamedResults]);

  const parseMessage = (() => {
    let currentAgent = null;
    return (data) => {
      const agentHeaderRegex = /----------\s+(?:TextMessage|ToolCallRequestEvent)\s+\((.*?)\)\s+----------/;
      const match = data.match(agentHeaderRegex);
      if (match) {
        currentAgent = match[1].trim();
        return { agent: currentAgent, message: null };
      } else {
        return { agent: currentAgent, message: data.trim() };
      }
    };
  })();

  const handleSubmit = () => {
    if (!intent.trim()) {
      alert("Please enter your intent.");
      return;
    }
    setStreamedResults([]);
    setIsLoading(true);
    setError(null);
    setActiveAgent(null);
    const eventSource = new EventSource(`http://localhost:8000/stream?intent=${encodeURIComponent(intent)}`);

    eventSource.onmessage = (event) => {
      const parsed = parseMessage(event.data);
      if (parsed.agent && parsed.message) {
        setStreamedResults((prev) => [...prev, { agent: parsed.agent, message: parsed.message }]);
        if (autoSelect) {
          setActiveAgent(parsed.agent);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setError('Failed to get response from AI. Please try again.');
      setIsLoading(false);
      eventSource.close();
    };
  };

  const highlightText = (line) => {
    const decodeHtml = (str) => {
      const txt = document.createElement('textarea');
      txt.innerHTML = str;
      return txt.value;
    };

    const decodedLine = decodeHtml(line);
    const cleanedLine = decodedLine.replace(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g,
      ''
    );

    let formatted = cleanedLine
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/###\s*(.*)/g, '<strong>$1</strong>')
      .replace(/"(.*?)"/g, '<span class="highlight-quote">"$1"</span>')
      .replace(
        /(\b(?:https?:\/\/|www\.)[^\s<>]+[^\s.,!?;:<>])/gi,
        (match) => {
          const url = match.startsWith('http') ? match : `https://${match}`;
          return `<a href="${url}" target="_blank" class="highlight-link">${match}</a>`;
        }
      );

    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const renderPlaceholderContent = () => (
    <div className="welcome-section">
      <h2>Welcome to <span className="highlight">EY QEiAgent</span></h2>
      <p className="description">
        ⚡Test Smarter. Chat Better. Elevate Conversations.⚡<br />
        ⚡The better the prompt. The better the answer. The better the world works.⚡
      </p>
    </div>
  );

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="header">
          <img src="/src/ey-logo1.svg" alt="EY Logo" className="ey-logo-small" />
          <span className="app-title">QEiAgent</span>
          <select
            className="domain-select"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
          >
            <option>Banking</option>
            <option>Commercial</option>
            <option>Insurance</option>
          </select>
        </div>

        <div
          className="results-display"
          ref={resultsDisplayRef}
          onScroll={() => {
            const el = resultsDisplayRef.current;
            userScrolling.current = el.scrollTop + el.clientHeight < el.scrollHeight;
          }}
        >
          {!streamedResults.length && !isLoading && renderPlaceholderContent()}

          {isLoading && !streamedResults.length && (
            <p className="loading-message">AI is thinking...</p>
          )}
          {error && <p className="error-message">{error}</p>}

          {(() => {
            const groupedMessages = [];
            let currentGroup = null;

            streamedResults.forEach(({ agent, message }) => {
              if (!currentGroup || currentGroup.agent !== agent) {
                if (currentGroup) groupedMessages.push(currentGroup);
                currentGroup = { agent, messages: [message] };
              } else {
                currentGroup.messages.push(message);
              }
            });

            if (currentGroup) groupedMessages.push(currentGroup);

            return groupedMessages.map((group, index) => {
              const isUser = group.agent.toLowerCase().includes("user");
              const roleClass = isUser
                ? "user"
                : group.agent.toLowerCase().includes("generator")
                ? "generator"
                : group.agent.toLowerCase().includes("reviewer")
                ? "reviewer"
                : "";

              return (
                <div key={index} className={`stream-block ${roleClass}`}>
                  <div className="stream-title">{group.agent}</div>
                  {group.messages.map((msg, i) => (
                    <div key={i} className="chat-line">{highlightText(msg)}</div>
                  ))}
                </div>
              );
            });
          })()}

          {isLoading && activeAgent && streamedResults.length > 0 && (
            <span className="typing-indicator">{activeAgent} typing...</span>
          )}
        </div>

        {!isLoading && (
          <div className="prompt-input-area">
            <span className="prompt-label">&lt; Prompts</span>
            <input
              type="text"
              placeholder="Ask something to EY QEiAgent"
              className="prompt-input"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              disabled={isLoading}
            />
            <button className="submit-button" onClick={handleSubmit} disabled={isLoading}>➤</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

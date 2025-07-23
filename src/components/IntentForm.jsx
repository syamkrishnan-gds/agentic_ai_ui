
import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import 'react-toastify/dist/ReactToastify.css';
import './IntentForm.css';

const IntentForm = () => {
  const [intent, setIntent] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  const handleSubmit = () => {
    setResponse('');
    setIsStreaming(true);
    toast.info("Streaming started");

    const eventSource = new EventSource(`http://localhost:8000/stream?intent=${encodeURIComponent(intent)}`);

    eventSource.onmessage = (event) => {
      setResponse((prev) => prev + event.data);
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
      toast.success("Streaming completed");
    };
  };

  return (
    <div className="intent-container">
      <div className="controls">
        <input
          type="text"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="Enter intent (e.g., Provide John's account details)"
        />
        <button onClick={handleSubmit}>Submit</button>
        <label>
          <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
          Dark Mode
        </label>
      </div>

      <div className="response-box">
        <h3>Streaming Response:</h3>
        {isStreaming && <div className="spinner"></div>}
        <ReactMarkdown>{response}</ReactMarkdown>
      </div>
      <ToastContainer />
    </div>
  );
};

export default IntentForm;

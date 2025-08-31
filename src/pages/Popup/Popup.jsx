import React, { useState, useEffect } from 'react';
import './Popup.css';

const Popup = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [activeTab, setActiveTab] = useState('config'); // 'config' or 'summaries'

  useEffect(() => {
    // Get current state from storage
    chrome.storage.sync.get(['extensionEnabled', 'openaiApiKey', 'savedSummaries'], function (result) {
      setIsEnabled(result.extensionEnabled !== false); // Default to true
      setApiKey(result.openaiApiKey || '');
      setSavedSummaries(result.savedSummaries || []);
    });
  }, []);

  const toggleExtension = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    // Save to storage
    chrome.storage.sync.set({ extensionEnabled: newState });

    // Send message to content script to update state
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleExtension',
          enabled: newState
        });
      }
    });
  };

  const saveApiKey = () => {
    chrome.storage.sync.set({ openaiApiKey: apiKey }, function () {
      // Show feedback that key was saved
      console.log('API key saved');

      // Send message to background script to update API key
      chrome.runtime.sendMessage({
        action: 'updateApiKey',
        apiKey: apiKey
      });
    });
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  const deleteSummary = (index) => {
    const newSummaries = savedSummaries.filter((_, i) => i !== index);
    setSavedSummaries(newSummaries);
    chrome.storage.sync.set({ savedSummaries: newSummaries });
  };

  const copySummary = (summary) => {
    navigator.clipboard.writeText(summary.text);
    // Could add a toast notification here
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1>Copy Cat AI Text Extractor</h1>
        <p>Extract and summarize text from any webpage with AI</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          Configuration
        </button>
        <button
          className={`tab-button ${activeTab === 'summaries' ? 'active' : ''}`}
          onClick={() => setActiveTab('summaries')}
        >
          Saved Summaries ({savedSummaries.length})
        </button>
      </div>

      {activeTab === 'config' && (
        <>
          <div className="api-key-section">
            <h3>OpenAI API Configuration</h3>
            <div className="api-key-input-group">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="api-key-input"
              />
              <button
                onClick={toggleShowApiKey}
                className="show-hide-btn"
                title={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
                    <button
          onClick={saveApiKey}
          className="save-api-key-btn"
          disabled={!apiKey.trim()}
        >
          🐱 Save API Key
        </button>
            <p className="api-key-help">
              Get your API key from{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                OpenAI Platform
              </a>
            </p>
          </div>

          <div className="toggle-section">
            <label className="toggle-label">
              <span>Extension Status:</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={toggleExtension}
                  id="extension-toggle"
                />
                <span className="slider"></span>
              </div>
            </label>

            <div className="status-text">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className="instructions">
            <h3>How to use:</h3>
            <ol>
              <li>Enter your OpenAI API key above and save it</li>
              <li>Navigate to any webpage</li>
              <li>Look for the blue circle icon on the right side</li>
              <li>Click it to generate a Copy Cat summary of the page</li>
              <li>Copy, share, or save the summary as needed</li>
            </ol>
          </div>
        </>
      )}

      {activeTab === 'summaries' && (
        <div className="summaries-section">
          <h3>Saved Summaries</h3>
          {savedSummaries.length === 0 ? (
            <div className="no-summaries">
              <p>No saved summaries yet. Generate summaries on web pages and use the Save button to store them here.</p>
            </div>
          ) : (
            <div className="summaries-list">
              {savedSummaries.map((summary, index) => (
                <div key={index} className="summary-item">
                  <div className="summary-header">
                    <h4 className="summary-title">{summary.title}</h4>
                    <span className="summary-date">{new Date(summary.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="summary-url">{summary.url}</p>
                  <div className="summary-text">{summary.text.substring(0, 150)}...</div>
                  <div className="summary-actions">
                                           <button
                         onClick={() => copySummary(summary)}
                         className="action-btn copy-btn"
                         title="Copy summary"
                       >
                         🐱 Copy
                       </button>
                                           <button
                         onClick={() => deleteSummary(index)}
                         className="action-btn delete-btn"
                         title="Delete summary"
                       >
                         🗑️ Delete
                       </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Popup;

import React, { useState, useEffect } from 'react';
import './Popup.css';

const Popup = () => {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Get current state from storage
    chrome.storage.sync.get(['extensionEnabled'], function (result) {
      setIsEnabled(result.extensionEnabled !== false); // Default to true
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

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1>Web Page Text Extractor</h1>
        <p>Extract text from any webpage with a simple click</p>
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
          <li>Navigate to any webpage</li>
          <li>Look for the blue circle icon on the right side</li>
          <li>Click it to extract the page text</li>
          <li>Copy the extracted text if needed</li>
        </ol>
      </div>
    </div>
  );
};

export default Popup;

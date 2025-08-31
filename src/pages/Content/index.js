// Content script for Web Page Text Extractor
let isEnabled = true;

// Check if extension is enabled from storage
chrome.storage.sync.get(['extensionEnabled'], function (result) {
  isEnabled = result.extensionEnabled !== false; // Default to true
  if (isEnabled) {
    createFloatingIcon();
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.extensionEnabled) {
    isEnabled = changes.extensionEnabled.newValue;
    if (isEnabled) {
      createFloatingIcon();
    } else {
      removeFloatingIcon();
    }
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'toggleExtension') {
    isEnabled = request.enabled;
    if (isEnabled) {
      createFloatingIcon();
    } else {
      removeFloatingIcon();
    }
  }
});

function createFloatingIcon() {
  // Remove existing icon if any
  removeFloatingIcon();

  // Create floating circle icon
  const icon = document.createElement('div');
  icon.id = 'webpage-extractor-icon';
  icon.innerHTML = '📄';
  icon.style.cssText = `
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    background: #4285f4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 20px;
    color: white;
    transition: all 0.3s ease;
  `;

  // Add hover effects
  icon.addEventListener('mouseenter', () => {
    icon.style.transform = 'translateY(-50%) scale(1.1)';
    icon.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
  });

  icon.addEventListener('mouseleave', () => {
    icon.style.transform = 'translateY(-50%) scale(1)';
    icon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  });

  // Add click handler
  icon.addEventListener('click', extractPageText);

  document.body.appendChild(icon);
}

function removeFloatingIcon() {
  const existingIcon = document.getElementById('webpage-extractor-icon');
  if (existingIcon) {
    existingIcon.remove();
  }
}

function extractPageText() {
  // Get all text content from the page
  const textContent = document.body.innerText || document.body.textContent || '';

  // Clean up the text (remove extra whitespace, etc.)
  const cleanText = textContent
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000); // Limit to 5000 characters

  // Show loading dialog first
  showLoadingDialog();

  // Send text to background script for OpenAI processing
  chrome.runtime.sendMessage({
    action: 'summarizeText',
    text: cleanText
  }, function (response) {
    // Remove loading dialog
    removeLoadingDialog();

    if (response.success) {
      // Show summary dialog
      showSummaryDialog(response.summary, cleanText);
    } else {
      // Show error dialog
      showErrorDialog(response.error);
    }
  });
}

function showLoadingDialog() {
  // Remove existing dialog if any
  removeTextDialog();

  // Create dialog container
  const dialog = document.createElement('div');
  dialog.id = 'webpage-extractor-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  // Create dialog content
  const dialogContent = document.createElement('div');
  dialogContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 40px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  `;

  // Create loading spinner
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #4285f4;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  `;

  // Create loading text
  const loadingText = document.createElement('div');
  loadingText.textContent = 'Generating AI Summary...';
  loadingText.style.cssText = `
    color: #333;
    font-size: 16px;
    font-weight: 500;
  `;

  // Add spinner animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Assemble dialog
  dialogContent.appendChild(spinner);
  dialogContent.appendChild(loadingText);
  dialog.appendChild(dialogContent);

  document.body.appendChild(dialog);
}

function showSummaryDialog(summary, originalText) {
  // Remove existing dialog if any
  removeTextDialog();

  // Create dialog container
  const dialog = document.createElement('div');
  dialog.id = 'webpage-extractor-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  // Create dialog content
  const dialogContent = document.createElement('div');
  dialogContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  `;

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e0e0e0;
  `;

  const title = document.createElement('h2');
  title.textContent = 'Copy Cat Summary';
  title.style.cssText = `
    margin: 0;
    color: #333;
    font-size: 20px;
    font-weight: 600;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;
  `;

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#f0f0f0';
  });

  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'none';
  });

  closeBtn.addEventListener('click', removeTextDialog);

  header.appendChild(title);
  header.appendChild(closeBtn);

      // Create summary content
    const summaryContent = document.createElement('div');
    summaryContent.textContent = summary;
    summaryContent.style.cssText = `
    color: #1c2826ff;
    line-height: 1.6;
    font-size: 14px;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin-bottom: 20px;
  `;

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    flex-wrap: wrap;
  `;

      // Create copy button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '🐱 Copy';
    copyBtn.style.cssText = `
    background: #f4a261ff;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
    min-width: 70px;
  `;

  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.background = '#e9c46aff';
  });

  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.background = '#f4a261ff';
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(summary).then(() => {
      copyBtn.textContent = '🐱 Copied!';
      copyBtn.style.background = '#e9c46aff';
      setTimeout(() => {
        copyBtn.textContent = '🐱 Copy';
        copyBtn.style.background = '#f4a261ff';
      }, 2000);
    });
  });

  // Create share button
  const shareBtn = document.createElement('button');
  shareBtn.textContent = '🐾 Share';
  shareBtn.style.cssText = `
    background: #e9c46aff;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
    min-width: 70px;
  `;

  shareBtn.addEventListener('mouseenter', () => {
    shareBtn.style.background = '#f4a261ff';
  });

  shareBtn.addEventListener('mouseleave', () => {
    shareBtn.style.background = '#e9c46aff';
  });

  shareBtn.addEventListener('click', () => {
    if (navigator.share) {
      // Use native Web Share API if available
      navigator.share({
        title: 'AI Summary',
        text: summary,
        url: window.location.href
      }).catch(err => {
        console.log('Error sharing:', err);
        // Fallback to copying share text
        fallbackShare(summary);
      });
    } else {
      // Fallback for browsers without Web Share API
      fallbackShare(summary);
    }
  });

  // Create save button
  const saveBtn = document.createElement('button');
  saveBtn.textContent = '💾 Save';
  saveBtn.style.cssText = `
    background: #f4a261ff;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
    min-width: 70px;
  `;

  saveBtn.addEventListener('mouseenter', () => {
    saveBtn.style.background = '#e9c46aff';
  });

  saveBtn.addEventListener('mouseleave', () => {
    saveBtn.style.background = '#f4a261ff';
  });

  saveBtn.addEventListener('click', () => {
    downloadSummary(summary);
  });

  // Create view original button (smaller, secondary style)
  const viewOriginalBtn = document.createElement('button');
  viewOriginalBtn.textContent = '📄 View Original';
  viewOriginalBtn.style.cssText = `
    background: #ffffff;
    color: #1c2826ff;
    border: 1px solid #e9c46aff;
    padding: 10px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
    min-width: 100px;
  `;

  viewOriginalBtn.addEventListener('mouseenter', () => {
    viewOriginalBtn.style.background = '#f1ebe1ff';
  });

  viewOriginalBtn.addEventListener('mouseleave', () => {
    viewOriginalBtn.style.background = '#ffffff';
  });

  viewOriginalBtn.addEventListener('click', () => {
    showOriginalTextDialog(originalText);
  });

  // Assemble buttons
  buttonContainer.appendChild(copyBtn);
  buttonContainer.appendChild(shareBtn);
  buttonContainer.appendChild(saveBtn);
  buttonContainer.appendChild(viewOriginalBtn);

  // Assemble dialog
  dialogContent.appendChild(header);
  dialogContent.appendChild(summaryContent);
  dialogContent.appendChild(buttonContainer);
  dialog.appendChild(dialogContent);

  // Add click outside to close
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      removeTextDialog();
    }
  });

  document.body.appendChild(dialog);
}

function showOriginalTextDialog(text) {
  // Remove existing dialog if any
  removeTextDialog();

  // Create dialog container
  const dialog = document.createElement('div');
  dialog.id = 'webpage-extractor-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  // Create dialog content
  const dialogContent = document.createElement('div');
  dialogContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 700px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  `;

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e0e0e0;
  `;

  const title = document.createElement('h2');
  title.textContent = 'Original Page Text';
  title.style.cssText = `
    margin: 0;
    color: #333;
    font-size: 20px;
    font-weight: 600;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;
  `;

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#f0f0f0';
  });

  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'none';
  });

  closeBtn.addEventListener('click', removeTextDialog);

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Create text content
  const textContent = document.createElement('div');
  textContent.textContent = text;
  textContent.style.cssText = `
    color: #333;
    line-height: 1.6;
    font-size: 14px;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin-bottom: 20px;
  `;

  // Create copy button
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy Original Text';
  copyBtn.style.cssText = `
    background: #4285f4;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
  `;

  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.background = '#3367d6';
  });

  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.background = '#4285f4';
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      copyBtn.style.background = '#34a853';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Original Text';
        copyBtn.style.background = '#4285f4';
      }, 2000);
    });
  });

  // Assemble dialog
  dialogContent.appendChild(header);
  dialogContent.appendChild(textContent);
  dialogContent.appendChild(copyBtn);
  dialog.appendChild(dialogContent);

  // Add click outside to close
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      removeTextDialog();
    }
  });

  document.body.appendChild(dialog);
}

function showErrorDialog(errorMessage) {
  // Remove existing dialog if any
  removeTextDialog();

  // Create dialog container
  const dialog = document.createElement('div');
  dialog.id = 'webpage-extractor-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  // Create dialog content
  const dialogContent = document.createElement('div');
  dialogContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  `;

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    margin-bottom: 20px;
  `;

  const title = document.createElement('h2');
  title.textContent = 'Error';
  title.style.cssText = `
    margin: 0 0 12px 0;
    color: #d93025;
    font-size: 20px;
    font-weight: 600;
  `;

  const errorText = document.createElement('div');
  errorText.textContent = errorMessage;
  errorText.style.cssText = `
    color: #333;
    line-height: 1.6;
    font-size: 14px;
    margin-bottom: 24px;
  `;

  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = `
    background: #d93025;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
  `;

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#b3261e';
  });

  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = '#d93025';
  });

  closeBtn.addEventListener('click', removeTextDialog);

  // Assemble dialog
  header.appendChild(title);
  dialogContent.appendChild(header);
  dialogContent.appendChild(errorText);
  dialogContent.appendChild(closeBtn);
  dialog.appendChild(dialogContent);

  // Add click outside to close
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      removeTextDialog();
    }
  });

  document.body.appendChild(dialog);
}

function removeTextDialog() {
  const existingDialog = document.getElementById('webpage-extractor-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }
}

function removeLoadingDialog() {
  // Same function as removeTextDialog since they use the same ID
  removeTextDialog();
}

// Helper function for fallback sharing
function fallbackShare(summary) {
  const shareText = `AI Summary from ${window.location.href}\n\n${summary}`;
  navigator.clipboard.writeText(shareText).then(() => {
    // Show temporary notification
    showTemporaryNotification('Share text copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy share text:', err);
    showTemporaryNotification('Failed to copy share text');
  });
}

// Helper function to save summary to storage and download as text file
function downloadSummary(summary) {
  const pageTitle = document.title || 'Webpage';
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const filename = `${pageTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}_summary_${timestamp}.txt`;

  const content = `AI Summary\nGenerated: ${new Date().toLocaleString()}\nSource: ${window.location.href}\n\n${summary}`;

  // Save to Chrome storage for popup access
  const summaryData = {
    title: pageTitle,
    url: window.location.href,
    text: summary,
    timestamp: Date.now()
  };

  chrome.storage.sync.get(['savedSummaries'], function (result) {
    const savedSummaries = result.savedSummaries || [];
    savedSummaries.unshift(summaryData); // Add to beginning of array

    // Keep only last 50 summaries to avoid storage limits
    if (savedSummaries.length > 50) {
      savedSummaries.splice(50);
    }

    chrome.storage.sync.set({ savedSummaries: savedSummaries }, function () {
      console.log('Summary saved to storage');
    });
  });

  // Download as text file
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  showTemporaryNotification('Summary saved to storage and downloaded as text file!');
}

// Helper function to show temporary notifications
function showTemporaryNotification(message) {
  // Remove existing notification
  const existingNotification = document.getElementById('webpage-extractor-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.id = 'webpage-extractor-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    z-index: 10002;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  document.body.appendChild(notification);

  // Fade in
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);

  // Fade out and remove
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

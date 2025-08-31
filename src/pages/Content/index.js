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

    // Create and show dialog
    showTextDialog(cleanText);
}

function showTextDialog(text) {
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
    title.textContent = 'Extracted Page Text';
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
  `;

    // Create copy button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Text';
    copyBtn.style.cssText = `
    background: #4285f4;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    margin-top: 20px;
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
                copyBtn.textContent = 'Copy Text';
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

function removeTextDialog() {
    const existingDialog = document.getElementById('webpage-extractor-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }
}

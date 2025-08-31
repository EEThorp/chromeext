// Background script for Web Page Text Extractor
console.log('Web Page Text Extractor background script loaded');

// Set default extension state on installation
chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({ extensionEnabled: true }, function () {
        console.log('Extension enabled by default');
    });
});

// Handle extension icon click (optional - can open popup or perform actions)
chrome.action.onClicked.addListener(function (tab) {
    // This will only trigger if no popup is defined
    // Since we have a popup, this won't be called
    console.log('Extension icon clicked');
});

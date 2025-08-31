// Background script for Web Page Text Extractor with OpenAI integration
console.log('Web Page Text Extractor background script loaded');

// Global variables
let currentApiKey = null;

// Initialize API key if exists
chrome.storage.sync.get(['openaiApiKey'], function (result) {
    if (result.openaiApiKey) {
        currentApiKey = result.openaiApiKey;
        console.log('OpenAI API key loaded');
    }
});

// Set default extension state on installation
chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({ extensionEnabled: true }, function () {
        console.log('Extension enabled by default');
    });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'updateApiKey') {
        // Update API key from popup
        currentApiKey = request.apiKey;
        console.log('OpenAI API key updated');
        sendResponse({ success: true });
    }

    else if (request.action === 'summarizeText') {
        // Handle text summarization request from content script
        if (!currentApiKey) {
            sendResponse({
                success: false,
                error: 'OpenAI API key not configured. Please set your API key in the extension popup.'
            });
            return;
        }

        if (!request.text || request.text.trim().length === 0) {
            sendResponse({
                success: false,
                error: 'No text provided for summarization.'
            });
            return;
        }

        // Process the text summarization asynchronously
        summarizeTextWithOpenAI(request.text, currentApiKey)
            .then(summary => {
                sendResponse({
                    success: true,
                    summary: summary
                });
            })
            .catch(error => {
                console.error('OpenAI API error:', error);
                sendResponse({
                    success: false,
                    error: error.message || 'Failed to generate summary. Please check your API key and try again.'
                });
            });

        // Return true to indicate we'll send response asynchronously
        return true;
    }
});

// Function to summarize text using OpenAI API directly
async function summarizeTextWithOpenAI(text, apiKey) {
    try {
        // Prepare the text (limit length to avoid token limits)
        const maxLength = 4000; // Conservative limit for gpt-4o-mini
        const truncatedText = text.length > maxLength
            ? text.substring(0, maxLength) + '...'
            : text;

        const prompt = `Please provide a concise, neatly formatted, 50-150 word well-structured summary of the following text. Focus on the main points, key information, and any important conclusions. Use cat emoji's as bulletpoints. Please do not exceed 150 words.:

${truncatedText}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
        } else {
            throw new Error('No response generated from OpenAI');
        }
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw error;
    }
}

// Content script — runs in ISOLATED world
// Bridges window.postMessage (from injected provider) ↔ chrome.runtime.sendMessage (to background)

import type { ExtensionMessage, ExtensionResponse } from '@kibipay/shared-types';

const PAGE_SOURCE = 'kibipay-page';
const CONTENT_SOURCE = 'kibipay-content';

// Listen for messages from the injected provider (page context)
window.addEventListener('message', (event) => {
  if (
    event.source !== window ||
    !event.data ||
    event.data.source !== PAGE_SOURCE
  ) {
    return;
  }

  const message = event.data as ExtensionMessage;

  chrome.runtime.sendMessage(
    { ...message, source: CONTENT_SOURCE },
    (response: ExtensionResponse | undefined) => {
      if (chrome.runtime.lastError) {
        // Background may have been restarted — post error back to page
        window.postMessage({
          source: CONTENT_SOURCE,
          id: message.id,
          success: false,
          error: 'Extension background not available',
        }, '*');
        return;
      }
      if (response) {
        window.postMessage({ source: CONTENT_SOURCE, ...response }, '*');
      }
    },
  );
});

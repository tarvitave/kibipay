import { useCallback } from 'react';
import type { MessageType, ExtensionMessage, ExtensionResponse } from '@kibipay/shared-types';

export function useMessaging() {
  const sendMessage = useCallback(
    <T = unknown>(type: MessageType, payload: unknown = {}): Promise<T> => {
      return new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        const message: ExtensionMessage = {
          source: 'kibipay-popup',
          type,
          id,
          payload,
        };

        // Timeout in case the service worker crashes before registering its listener
        // (Chrome MV3 may never call the callback in that case)
        const timer = setTimeout(() => {
          reject(new Error('Background service worker did not respond'));
        }, 5000);

        chrome.runtime.sendMessage(message, (response: ExtensionResponse<T> | undefined) => {
          clearTimeout(timer);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response) {
            reject(new Error('No response from background'));
            return;
          }
          if (response.success) {
            resolve(response.data as T);
          } else {
            reject(new Error(response.error ?? 'Unknown error'));
          }
        });
      });
    },
    [],
  );

  return { sendMessage };
}

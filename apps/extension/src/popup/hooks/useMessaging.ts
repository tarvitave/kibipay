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
        chrome.runtime.sendMessage(message, (response: ExtensionResponse<T> | undefined) => {
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

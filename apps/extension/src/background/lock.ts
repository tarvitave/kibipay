import { lock as lockKeyring } from './keyring.js';
import { loadSettings } from './vault.js';

const ALARM_NAME = 'kibipay_auto_lock';

export async function scheduleAutoLock(): Promise<void> {
  const settings = await loadSettings();
  await chrome.alarms.clear(ALARM_NAME);
  if (settings.autoLockMinutes > 0) {
    chrome.alarms.create(ALARM_NAME, { delayInMinutes: settings.autoLockMinutes });
  }
}

export async function resetAutoLockTimer(): Promise<void> {
  await scheduleAutoLock();
}

export function cancelAutoLock(): void {
  chrome.alarms.clear(ALARM_NAME);
}

export function handleAlarmFired(alarm: chrome.alarms.Alarm): void {
  if (alarm.name === ALARM_NAME) {
    lockKeyring();
  }
}

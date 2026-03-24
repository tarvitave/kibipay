// Polyfill Node.js globals for service worker environment
import { Buffer as _Buffer } from 'buffer';
import _process from 'process';
(globalThis as typeof globalThis & { Buffer: typeof _Buffer; process: typeof _process }).Buffer = _Buffer;
(globalThis as typeof globalThis & { Buffer: typeof _Buffer; process: typeof _process }).process = _process;

import { registerMessageRouter } from './router.js';
import { handleAlarmFired, scheduleAutoLock } from './lock.js';

// Register all message handlers
registerMessageRouter();

// Handle auto-lock alarm
chrome.alarms.onAlarm.addListener(handleAlarmFired);

// On install/startup, schedule auto-lock if wallet exists
chrome.runtime.onInstalled.addListener(() => {
  scheduleAutoLock();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleAutoLock();
});

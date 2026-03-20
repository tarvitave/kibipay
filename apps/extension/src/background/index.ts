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

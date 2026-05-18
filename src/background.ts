// Background service worker for reminder notifications
chrome.runtime.onInstalled.addListener(() => {
  console.log('Habit Tracker installed');
  initializeReminders();
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('habit-reminder-')) {
    const habitId = alarm.name.replace('habit-reminder-', '');
    sendReminderNotification(habitId);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SET_REMINDER':
      setReminder(message.habitId, message.time);
      sendResponse({ success: true });
      break;
    case 'CLEAR_REMINDER':
      clearReminder(message.habitId);
      sendResponse({ success: true });
      break;
    case 'GET_REMINDERS':
      getReminders().then(sendResponse);
      return true; // Keep channel open for async response
    default:
      sendResponse({ success: false });
  }
  return false;
});

async function initializeReminders() {
  const result = await chrome.storage.local.get(['reminders']);
  const reminders = result.reminders || {};
  
  for (const [habitId, reminderTime] of Object.entries(reminders)) {
    if (reminderTime) {
      setReminder(habitId, reminderTime as string);
    }
  }
}

function setReminder(habitId: string, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Calculate next occurrence
  const now = new Date();
  const alarmTime = new Date();
  alarmTime.setHours(hours, minutes, 0, 0);
  
  if (alarmTime <= now) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }
  
  const periodInMinutes = 24 * 60; // Daily reminder
  
  chrome.alarms.create(`habit-reminder-${habitId}`, {
    when: alarmTime.getTime(),
    periodInMinutes: periodInMinutes
  });
  
  // Store reminder config
  chrome.storage.local.get(['reminders']).then((result) => {
    const reminders = result.reminders || {};
    reminders[habitId] = time;
    chrome.storage.local.set({ reminders });
  });
}

function clearReminder(habitId: string) {
  chrome.alarms.clear(`habit-reminder-${habitId}`);
  
  chrome.storage.local.get(['reminders']).then((result) => {
    const reminders = result.reminders || {};
    delete reminders[habitId];
    chrome.storage.local.set({ reminders });
  });
}

async function getReminders() {
  const result = await chrome.storage.local.get(['reminders']);
  return result.reminders || {};
}

function sendReminderNotification(habitId: string) {
  // Get habit name
  chrome.storage.local.get(['habits']).then((result) => {
    const habits = result.habits || [];
    const habit = habits.find((h: any) => h.id === habitId);
    
    if (habit) {
      // Check if already completed today
      const todayStr = new Date().toISOString().split('T')[0];
      const alreadyCompleted = habit.completions?.[todayStr] || false;
      
      if (!alreadyCompleted) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'logo128.png',
          title: 'Habit Reminder 🎯',
          message: `Don't forget to "${habit.name}" today!`,
          priority: 2,
          buttons: [{ title: 'Mark Complete' }, { title: 'Dismiss' }]
        });
      }
    }
  });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Open popup to mark complete
    chrome.action.openPopup();
  }
});
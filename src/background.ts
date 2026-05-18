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
      return true;
    case 'COMPLETE_HABIT':
      completeHabit(message.habitId).then(sendResponse);
      return true;
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
  
  const now = new Date();
  const alarmTime = new Date();
  alarmTime.setHours(hours, minutes, 0, 0);
  
  if (alarmTime <= now) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }
  
  const periodInMinutes = 24 * 60;
  
  chrome.alarms.create(`habit-reminder-${habitId}`, {
    when: alarmTime.getTime(),
    periodInMinutes: periodInMinutes
  });
  
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

// NEW: Function to complete a habit from notification
async function completeHabit(habitId: string) {
  const result = await chrome.storage.local.get(['habits']);
  const habits = result.habits || [];
  const todayStr = new Date().toISOString().split('T')[0];
  
  const updatedHabits = habits.map((habit: any) => {
    if (habit.id === habitId) {
      return {
        ...habit,
        completions: {
          ...habit.completions,
          [todayStr]: true
        }
      };
    }
    return habit;
  });
  
  await chrome.storage.local.set({ habits: updatedHabits });
  
  // Show confirmation notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('logo192.png'),
    title: '✅ Habit Completed!',
    message: 'Great job! Keep up the streak! 🔥',
    priority: 1
  });
}

function sendReminderNotification(habitId: string) {
  chrome.storage.local.get(['habits']).then((result) => {
    const habits = result.habits || [];
    const habit = habits.find((h: any) => h.id === habitId);
    
    if (habit) {
      const todayStr = new Date().toISOString().split('T')[0];
      const alreadyCompleted = habit.completions?.[todayStr] || false;
      
      if (!alreadyCompleted) {
        // Store habitId in a way we can retrieve it
        const notificationId = `habit-reminder-${habitId}-${Date.now()}`;
        
        chrome.notifications.create(notificationId, {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('logo192.png'),
          title: 'Habit Reminder 🎯',
          message: `Don't forget to "${habit.name}" today!`,
          priority: 2,
          buttons: [{ title: 'Mark Complete' }, { title: 'Dismiss' }]
        });
        
        // Store mapping from notification ID to habit ID
        chrome.storage.local.get(['notificationMap']).then((mapResult) => {
          const map = mapResult.notificationMap || {};
          map[notificationId] = habitId;
          chrome.storage.local.set({ notificationMap: map });
        });
      }
    }
  });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Get habit ID from stored mapping
    chrome.storage.local.get(['notificationMap']).then((mapResult) => {
      const map = mapResult.notificationMap || {};
      const habitId = map[notificationId];
      
      if (habitId) {
        // Complete the habit
        completeHabit(habitId);
        
        // Clean up the mapping
        delete map[notificationId];
        chrome.storage.local.set({ notificationMap: map });
      }
      
      // Close the notification
      chrome.notifications.clear(notificationId);
    });
  } else {
    // Just close the notification on dismiss
    chrome.notifications.clear(notificationId);
  }
});

// Clean up old notification mappings when notification is closed
chrome.notifications.onClosed.addListener((notificationId) => {
  chrome.storage.local.get(['notificationMap']).then((mapResult) => {
    const map = mapResult.notificationMap || {};
    if (map[notificationId]) {
      delete map[notificationId];
      chrome.storage.local.set({ notificationMap: map });
    }
  });
});
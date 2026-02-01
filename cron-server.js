/**
 * Standalone cron server for local development
 * Run this alongside your Next.js app: npm run dev:cron
 * 
 * This will automatically send reminders based on your schedule
 */

const cron = require('node-cron');

// Note: Automatic reminders are now controlled via Shop Settings in the UI
// The API endpoint will check the database settings automatically
// This cron server just triggers the endpoint - the endpoint handles the enable/disable check

// Get configuration
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const cronSchedule = process.env.REMINDER_CRON_SCHEDULE || '0 9 * * *'; // Default: 9 AM daily
const cronSecret = process.env.CRON_SECRET;

console.log('='.repeat(50));
console.log('[CRON SERVER] Starting Automatic Reminder Service');
console.log('='.repeat(50));
console.log(`Schedule: ${cronSchedule} (${getScheduleDescription(cronSchedule)})`);
console.log(`API URL: ${apiUrl}/api/cron/send-reminders`);
console.log(`Timezone: ${process.env.TZ || 'Asia/Karachi'}`);
console.log('='.repeat(50));

// Function to get human-readable schedule description
function getScheduleDescription(schedule) {
  const parts = schedule.split(' ');
  if (parts.length === 5) {
    const [minute, hour, day, month, weekday] = parts;
    if (minute === '0' && day === '*' && month === '*' && weekday === '*') {
      return `Daily at ${hour}:00`;
    }
    if (minute === '0' && weekday === '*') {
      return `Monthly on day ${day} at ${hour}:00`;
    }
  }
  return schedule;
}

// Create cron job
const job = cron.schedule(cronSchedule, async () => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Running automatic reminder job...`);
    
    const url = `${apiUrl}/api/cron/send-reminders`;
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add secret if configured
    if (cronSecret) {
      headers['x-cron-secret'] = cronSecret;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`[SUCCESS] ${result.message}`);
    
    if (result.results) {
      console.log(`  - Total: ${result.results.total}`);
      console.log(`  - Sent: ${result.results.sent}`);
      console.log(`  - Failed: ${result.results.failed}`);
      console.log(`  - Skipped: ${result.results.skipped}`);
    }
  } catch (error) {
    console.error(`[ERROR] Failed to run reminder job:`, error.message);
  }
}, {
  scheduled: true,
  timezone: process.env.TZ || 'Asia/Karachi',
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[CRON SERVER] Shutting down...');
  job.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[CRON SERVER] Shutting down...');
  job.stop();
  process.exit(0);
});

console.log('[CRON SERVER] Running... Press Ctrl+C to stop.\n');


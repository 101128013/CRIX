export type LogType = 'info' | 'success' | 'warn' | 'error';

export function logToSystem(message: string, type: LogType = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = {
    info: 'ℹ️',
    success: '✅',
    warn: '⚠️',
    error: '❌'
  }[type];
  
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

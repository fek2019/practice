export async function sendClientNotification(phoneOrEmail: string, message: string) {
  console.info(`[Notification][client] ${phoneOrEmail}: ${message}`);
}

export async function sendMasterNotification(masterId: string, message: string) {
  console.info(`[Notification][master] ${masterId}: ${message}`);
}

export async function sendSmsCode(phone: string, code: string) {
  console.info(`[Notification][sms-code] ${phone}: ${code}`);
}

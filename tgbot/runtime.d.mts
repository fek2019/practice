export function getTelegramToken(): string;
export function linkTelegramChat(input: { chatId: string | number; username?: string; email: string }): { ok: boolean; message: string };
export function unlinkTelegramChat(chatId: string | number): { ok: boolean; message: string };
export function sendTelegramMessage(chatId: string | number, text: string): Promise<unknown>;
export function sendDueTelegramNotifications(): Promise<{ sent: number; skipped: boolean }>;
export function getUpdates(offset?: number): Promise<Array<{ update_id: number; message?: { text?: string; chat: { id: number; username?: string } } }>>;
export function getStoredUpdateOffset(): number;
export function rememberUpdateOffset(offset: number): void;
export function claimUpdate(updateId: number): boolean;

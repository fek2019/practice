import {
  claimUpdate,
  getStoredUpdateOffset,
  getTelegramToken,
  getUpdates,
  linkTelegramChat,
  rememberUpdateOffset,
  sendDueTelegramNotifications,
  sendTelegramMessage,
  unlinkTelegramChat
} from "./runtime.mjs";

const HELP_TEXT = [
  "WatchLab уведомления",
  "",
  "Команды:",
  "/link email@example.com — привязать Telegram к аккаунту сайта",
  "/unlink — отвязать Telegram",
  "/help — показать помощь"
].join("\n");

const LINK_SUCCESS_TEXT = [
  "Здравствуйте!",
  "",
  "Telegram успешно привязан к вашему аккаунту WatchLab.",
  "Этот бот будет оповещать вас о предстоящих записях: подтверждении записи, напоминании за день и напоминании за 2 часа до обслуживания."
].join("\n");

let offset = getStoredUpdateOffset();

function parseCommand(text) {
  const [command, ...rest] = String(text || "").trim().split(/\s+/);
  return {
    command: command.toLowerCase(),
    argument: rest.join(" ")
  };
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const username = message.chat.username;
  const { command, argument } = parseCommand(message.text);

  if (command === "/start" || command === "/help") {
    await sendTelegramMessage(chatId, HELP_TEXT);
    return;
  }

  if (command === "/link") {
    const result = linkTelegramChat({ chatId, username, email: argument });
    await sendTelegramMessage(chatId, result.message);
    if (result.ok) {
      await sendTelegramMessage(chatId, LINK_SUCCESS_TEXT);
    }
    return;
  }

  if (command === "/unlink") {
    const result = unlinkTelegramChat(chatId);
    await sendTelegramMessage(chatId, result.message);
    return;
  }

  await sendTelegramMessage(chatId, "Не понял команду. Отправьте /help.");
}

async function main() {
  if (!getTelegramToken()) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured. Set it in tgbot/.env or environment variables.");
  }

  console.log("[tgbot] WatchLab Telegram bot started");

  while (true) {
    try {
      await sendDueTelegramNotifications();
      const updates = await getUpdates(offset);
      for (const update of updates) {
        offset = update.update_id + 1;
        rememberUpdateOffset(offset);
        if (!claimUpdate(update.update_id)) {
          continue;
        }
        if (update.message?.text) {
          await handleMessage(update.message);
        }
      }
    } catch (error) {
      console.error("[tgbot]", error instanceof Error ? error.message : error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main().catch((error) => {
  console.error("[tgbot] fatal:", error instanceof Error ? error.message : error);
  process.exit(1);
});

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type Runtime = {
  sendDueTelegramNotifications: () => Promise<{ sent: number; skipped: boolean }>;
};

const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<Runtime>;

const runtimeUrl = pathToFileURL(resolve(process.cwd(), "tgbot/runtime.mjs")).href;

const loadRuntime = async (): Promise<Runtime> => dynamicImport(runtimeUrl);

export async function sendDueTelegramNotifications() {
  const runtime = await loadRuntime();
  return runtime.sendDueTelegramNotifications();
}

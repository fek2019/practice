import { getDataSource, isSupabaseConfigured } from "@/server/config";
import { jsonOk } from "@/server/http";

export async function GET() {
  return jsonOk({
    ok: true,
    dataSource: getDataSource(),
    supabaseConfigured: isSupabaseConfigured()
  });
}

import { getDataSource, isSupabaseConfigured } from "../config";
import { mockRepository } from "./mock-repository";
import { sqliteRepository } from "./sqlite-repository";
import { supabaseRepository } from "./supabase-repository";
import { WorkshopRepository } from "./types";

export const getRepository = (): WorkshopRepository => {
  const source = getDataSource();

  if (source === "supabase" || source === "sqlite") {
    // Prefer Supabase when configured
    if (isSupabaseConfigured()) {
      return supabaseRepository;
    }
  }

  if (source === "supabase") {
    throw new Error(
      "APP_DATA_SOURCE=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  if (source === "mock") {
    return mockRepository;
  }

  return sqliteRepository;
};

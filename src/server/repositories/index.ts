import { getDataSource, isSupabaseConfigured } from "../config";
import { mockRepository } from "./mock-repository";
import { supabaseRepository } from "./supabase-repository";
import { WorkshopRepository } from "./types";

export const getRepository = (): WorkshopRepository => {
  if (getDataSource() === "supabase") {
    if (!isSupabaseConfigured()) {
      throw new Error("APP_DATA_SOURCE=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }
    return supabaseRepository;
  }

  return mockRepository;
};

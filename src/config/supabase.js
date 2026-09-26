

import "react-native-url-polyfill/auto";
import "react-native-get-random-values";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const { supabaseUrl, supabaseAnonKey } = Constants.expoConfig.extra;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Variáveis SUPABASE_URL / SUPABASE_ANON_KEY não configuradas. " +
      "Verifique o arquivo .env na raiz do projeto."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
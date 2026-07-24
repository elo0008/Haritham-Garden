/**
 * lib/supabase.ts
 *
 * Simple singleton client for non-auth server-side queries (e.g. seeding scripts).
 *
 * For auth-aware usage in the app, use the purpose-built helpers instead:
 *   - Client Components  →  import { createClient } from "@/lib/supabase/client"
 *   - Server Components  →  import { createClient } from "@/lib/supabase/server"
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

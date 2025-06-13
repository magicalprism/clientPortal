import { createBrowserClient } from "@supabase/ssr";


export function createClient() {
	return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY);
}
/*

// TEMPORARY MOCK SUPABASE CLIENT
export const createClient = () => ({
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
  }),
  auth: {
    getUser: async () => ({ data: { user: { id: 'mock-user' } }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: {}, error: null }),
    signOut: async () => ({}),
  },
});
*/
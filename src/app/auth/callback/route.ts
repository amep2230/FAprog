import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role") || "athlete";
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if profile exists, if not create it with the selected role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
         
         if (!profile) {
            // Fallback if trigger didn't run
            const name = user.user_metadata.name || user.user_metadata.full_name || user.email?.split('@')[0] || 'Utilisateur';
            
            await supabase.from('profiles').insert({
                id: user.id,
                email: user.email,
                name: name,
                role: role
            });
         }
      }
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Auth error during code exchange:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Erreur de confirmation: " + error.message)}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Code de confirmation manquant`);
}

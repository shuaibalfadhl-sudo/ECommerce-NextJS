import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );
  const { data: authData } = await userClient.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "You must be signed in to view users." }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY. Please add it to your .env.local file." },
      { status: 500 },
    );
  }

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = data.users.map((user) => user.id);
  const { data: profiles, error: profileError } = userIds.length
    ? await adminClient.from("profile").select("id, first_name, last_name, role").in("id", userIds)
    : { data: [], error: null };

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return NextResponse.json({
    users: data.users.map((user) => ({
      id: user.id,
      email: user.email ?? "",
      role: profilesById.get(user.id)?.role ?? null,
      fullName: [profilesById.get(user.id)?.first_name, profilesById.get(user.id)?.last_name].filter(Boolean).join(" "),
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      emailConfirmedAt: user.email_confirmed_at ?? null,
    })),
  });
}

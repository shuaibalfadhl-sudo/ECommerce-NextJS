"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Please add it to your .env.local file.");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );
}

async function getUserClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in server action
          }
        },
      },
    }
  );
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const mode = formData.get("mode") as string;
  const isRegistering = mode === "register";
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (isRegistering && (!firstName?.trim() || !lastName?.trim())) {
    return { error: "First name and last name are required." };
  }

  if (!isRegistering) {
    let adminClient;
    try {
      adminClient = getAdminClient();
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Unable to prepare login." };
    }

    const { data: record } = await adminClient
      .from("login_attempts")
      .select("*")
      .eq("email", email)
      .single();

    if (record && record.lockout_until) {
      const lockoutTime = new Date(record.lockout_until).getTime();
      if (lockoutTime > Date.now()) {
        const remainingMins = Math.ceil((lockoutTime - Date.now()) / 60000);
        return { error: `Account locked due to too many failed attempts. Try again in ${remainingMins} minute(s).` };
      }
    }

    const userClient = await getUserClient();
    const { error } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let attempts = record?.attempts || 0;
      let duration = record?.lockout_duration_ms || 300000;
      attempts += 1;

      let lockoutUntil = null;
      if (attempts >= 3) {
        if (attempts > 3) {
          duration *= 2;
        } else {
          duration = 300000;
        }
        lockoutUntil = new Date(Date.now() + duration).toISOString();
      }

      await adminClient.from("login_attempts").upsert({
        email,
        attempts,
        lockout_duration_ms: duration,
        lockout_until: lockoutUntil,
      });

      if (attempts >= 3) {
        return { error: `Account locked due to too many failed attempts. Try again in ${duration / 60000} minutes.` };
      } else {
        const remaining = 3 - attempts;
        return { error: `${error.message} (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)` };
      }
    } else {
      if (record) {
        await adminClient.from("login_attempts").delete().eq("email", email);
      }
      return { success: true };
    }
  } else {
    // Registering
    const userClient = await getUserClient();
    const { data, error } = await userClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: `${firstName.trim()} ${lastName.trim()}` }
      }
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      let adminClient;
      try {
        adminClient = getAdminClient();
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : "Unable to prepare profile." };
      }

      const { error: profileError } = await adminClient.from("profile").upsert({
        id: data.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });

      if (profileError) {
        return { error: profileError.message };
      }
    }
    
    if (!data.session) {
      return { success: true, message: "Account created. Check your email to confirm your account." };
    }

    return { success: true };
  }
}

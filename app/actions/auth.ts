"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(data: { email: string; password: string }) {
  try {
    // Basic sanitization before calling Supabase
    const email = data.email?.trim().toLowerCase();
    const password = data.password?.trim();

    if (!email || !password) {
      return { success: false, error: "Completa todos los campos." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "El correo electrónico no es válido." };
    }

    if (password.length < 1) {
      return { success: false, error: "La contraseña es requerida." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Generic message — never reveal which field is wrong
      return { success: false, error: "Correo o contraseña incorrectos." };
    }

    revalidatePath("/", "layout");
    return { success: true, message: "Bienvenido de vuelta a Vensato." };
  } catch (err) {
    console.error("[auth/login]", err);
    return { success: false, error: "Error de conexión. Inténtalo de nuevo." };
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function register(data: { fullName: string; email: string; password: string }) {
  try {
    const fullName = data.fullName?.trim();
    const email = data.email?.trim().toLowerCase();
    const password = data.password?.trim();

    if (!fullName || !email || !password) {
      return { success: false, error: "Completa todos los campos." };
    }

    if (fullName.length < 2) {
      return { success: false, error: "El nombre debe tener al menos 2 caracteres." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "El correo electrónico no es válido." };
    }

    if (password.length < 8) {
      return { success: false, error: "La contraseña debe tener al menos 8 caracteres." };
    }

    const supabase = await createClient();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      let msg = "No pudimos crear tu cuenta. Inténtalo de nuevo.";
      const m = signUpError.message;
      if (m.includes("User already registered") || m.includes("already been registered")) {
        msg = "Este correo ya tiene una cuenta. Intenta iniciar sesión.";
      } else if (m.includes("Password should be")) {
        msg = "La contraseña debe tener al menos 6 caracteres.";
      } else if (m.includes("rate limit") || m.includes("too many")) {
        msg = "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
      }
      return { success: false, error: msg };
    }

    // If Supabase returned a session directly (email confirmation disabled), we're done
    if (authData.session) {
      revalidatePath("/", "layout");
      return { success: true, requiresVerification: false, message: "¡Cuenta creada! Bienvenido a Vensato." };
    }

    // Email confirmation is ON — attempt an immediate signIn anyway
    // (this will work if Supabase auto-confirms on signup, otherwise it'll fail gracefully)
    const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });

    if (signInData?.session) {
      revalidatePath("/", "layout");
      return { success: true, requiresVerification: false, message: "¡Cuenta creada! Bienvenido a Vensato." };
    }

    // Truly requires email confirmation
    return {
      success: true,
      requiresVerification: true,
      message: "¡Cuenta creada! Revisa tu correo electrónico y confirma tu cuenta para acceder.",
    };
  } catch (err) {
    console.error("[auth/register]", err);
    return { success: false, error: "Error de conexión. Inténtalo de nuevo." };
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export async function forgotPassword(data: { email: string }) {
  try {
    const email = data.email?.trim().toLowerCase();
    if (!email) return { success: false, error: "Ingresa tu correo electrónico." };

    const supabase = await createClient();
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${base}/auth/callback?next=/reset-password`,
    });

    if (error) {
      return { success: false, error: "No pudimos enviar el correo. Inténtalo de nuevo." };
    }

    return { success: true, message: "Si ese correo existe, recibirás un enlace en breve." };
  } catch (err) {
    console.error("[auth/forgotPassword]", err);
    return { success: false, error: "Error de conexión. Inténtalo de nuevo." };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[auth/logout]", err);
    return { success: false };
  }
}

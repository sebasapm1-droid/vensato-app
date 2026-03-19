"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function login(formData: unknown) {
  // ✅ Zod validation - protects against malformed input / injection
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: msg };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Return generic message (don't leak which of email/pass is wrong)
    return { success: false, error: "Correo o contraseña incorrectos." };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Bienvenido de vuelta a Vensato." };
}

export async function register(formData: unknown) {
  // ✅ Zod validation
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: msg };
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) {
    let msg = "Error al crear la cuenta. Inténtalo de nuevo.";
    if (error.message.includes("User already registered")) msg = "Este correo ya se encuentra registrado.";
    else if (error.message.includes("Password should be")) msg = "La contraseña debe tener al menos 6 caracteres.";
    else if (error.message.includes("rate limit")) msg = "Demasiados intentos. Espera unos minutos.";
    return { success: false, error: msg };
  }

  revalidatePath("/", "layout");

  // ⚠️ If Supabase requires email confirmation, session will be null
  if (authData.user && !authData.session) {
    return {
      success: true,
      requiresVerification: true,
      message: "¡Cuenta creada! Revisa tu correo y confirma tu email para acceder.",
    };
  }

  return {
    success: true,
    requiresVerification: false,
    message: "¡Cuenta creada con éxito! Bienvenido a Vensato.",
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { success: true };
}

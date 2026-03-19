"use server";

import { createClient } from "@/lib/supabase/server";
import { RegisterInput, LoginInput } from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";

export async function login(data: LoginInput) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { success: false, error: "Credenciales incorrectas o error de conexión." };
  }

  revalidatePath('/', 'layout');
  return { success: true, message: "Bienvenido de vuelta a Vensato." };
}

export async function register(data: RegisterInput) {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
    },
  });

  if (error) {
    // Traducciones basícas de errores comunes
    let msg = error.message;
    if (msg.includes("User already registered")) msg = "Este correo ya se encuentra registrado.";
    else if (msg.includes("Password should be")) msg = "La contraseña es muy débil.";
    return { success: false, error: msg };
  }

  revalidatePath('/', 'layout');
  
  if (authData.user && !authData.session) {
    return { success: true, requiresVerification: true, message: "Te hemos enviado un correo. Por favor confírmalo para acceder." };
  }

  return { success: true, requiresVerification: false, message: "Tu cuenta ha sido creada con éxito." };
}

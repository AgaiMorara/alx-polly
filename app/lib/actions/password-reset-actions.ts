'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export async function requestPasswordReset(email: string) {
  const result = emailSchema.safeParse({ email });

  if (!result.success) {
    return { error: "Invalid email address" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: 'http://localhost:3000/reset-password',
  });

  if (error) {
    // Even if there is an error, we don't want to reveal if an email is in the system or not
    // So we return a generic success message
    console.error('Error requesting password reset:', error.message);
    return { success: "If an account with that email exists, a password reset link has been sent." };
  }

  return { success: "If an account with that email exists, a password reset link has been sent." };
}

export async function resetPassword(code: string, password: string) {
  const supabase = await createClient();

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Error exchanging code for session:', exchangeError.message);
    return { error: "Invalid or expired password reset token." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    console.error('Error updating password:', updateError.message);
    return { error: "There was an error updating your password." };
  }

  return { success: true };
}


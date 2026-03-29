import { NextResponse } from 'next/server';
import crypto from 'crypto'; // Node.js crypto module
import { sql } from '@/lib/db';
import { sendEmail } from '@/lib/email'; // Import the new email sending function

// Configuration for the sender email address
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@lottotally.com'; // Default to a placeholder

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // 1. Verify if the email exists in the database
    const userResult = await sql`SELECT id FROM lt_users WHERE email = ${normalizedEmail}`;
    if (userResult.length === 0) {
      console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
      // Return success to avoid revealing which emails exist.
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    const userId = userResult[0].id;

    // 2. Generate a password reset token
    const token = crypto.randomBytes(20).toString('hex');
    // Token expires in 1 hour
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    // 3. Update the user record with the token and expiry
    await sql`
      UPDATE lt_users
      SET
        reset_token = ${token},
        reset_token_expires = ${expires.toISOString()}
      WHERE id = ${userId}
    `;

    // 4. Construct the reset link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password/${token}`;

    // 5. Send the password reset email using Resend
    try {
      await sendEmail({
        from: FROM_EMAIL,
        to: normalizedEmail,
        subject: "LottoTally Password Reset Request",
        text: `You requested to reset your LottoTally password. Click the link below to reset it:\n\n${resetLink}`, // Plain text body
        html: `<p>You requested to reset your LottoTally password. Click the link below to reset it:</p><p><a href="${resetLink}">Reset Password</a></p>`, // HTML body
      });
      console.log(`Password reset email sent to ${normalizedEmail}`);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // It's important NOT to return an error here if the token was successfully saved,
      // as the user would be blocked from resetting their password.
      // Log the error and inform the user that the link might be on its way.
      return NextResponse.json({ message: 'Password reset link has been generated, but an error occurred sending the email. Please try again or contact support.' });
    }

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error: unknown) {
    console.error('Password reset API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: `Password reset failed: ${errorMessage}` }, { status: 500 });
  }
}

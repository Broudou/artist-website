import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db';
import { User } from '../../../lib/models/User';
import { comparePassword, signToken, makeAuthCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const email = (formData.get('email') as string)?.toLowerCase().trim();
    const password = formData.get('password') as string;

    if (!email || !password) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/admin?error=missing_fields' },
      });
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user || !(await comparePassword(password, user.password))) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/admin?error=invalid_credentials' },
      });
    }

    const token = signToken(user._id.toString());

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/admin/dashboard',
        'Set-Cookie': makeAuthCookie(token),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin?error=server_error' },
    });
  }
};

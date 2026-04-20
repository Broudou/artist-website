import type { APIRoute } from 'astro';
import { connectDB } from '../../lib/db';
import { ContactMessage } from '../../lib/models/ContactMessage';

export const POST: APIRoute = async ({ request }) => {
  try {
    await connectDB();
    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const message = (formData.get('message') as string)?.trim();

    if (!name || !email || !message) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/contact?error=missing_fields' },
      });
    }

    await ContactMessage.create({ name, email, message });

    return new Response(null, {
      status: 302,
      headers: { Location: '/contact?success=1' },
    });
  } catch (err) {
    console.error('Contact form error:', err);
    return new Response(null, {
      status: 302,
      headers: { Location: '/contact?error=server_error' },
    });
  }
};

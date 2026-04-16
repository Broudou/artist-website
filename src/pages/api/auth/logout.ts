import type { APIRoute } from 'astro';
import { makeClearCookie } from '../../../lib/auth';

export const POST: APIRoute = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin',
      'Set-Cookie': makeClearCookie(),
    },
  });
};

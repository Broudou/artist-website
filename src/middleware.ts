import { defineMiddleware } from 'astro:middleware';
import { verifyToken, getTokenFromCookie } from './lib/auth';
import { connectDB } from './lib/db';
import { User } from './lib/models/User';

// Routes that are exempt from auth checks
function isExempt(pathname: string): boolean {
  return pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/api/auth');
}

// Routes that require a valid session
function isProtected(pathname: string): boolean {
  if (isExempt(pathname)) return false;
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/artworks') ||
    pathname.startsWith('/api/content')
  );
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, redirect } = context;
  const pathname = url.pathname;

  if (!isProtected(pathname)) return next();

  const token = getTokenFromCookie(request.headers.get('cookie'));

  const deny = () =>
    isApiRoute(pathname)
      ? new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      : redirect('/admin');

  if (!token) return deny();

  let userId: string;
  try {
    const payload = verifyToken(token);
    userId = payload.sub;
  } catch {
    return deny();
  }

  // Validate the session against the database — if the user is deleted,
  // the session is immediately invalid even if the JWT is still in date.
  try {
    await connectDB();
    const user = await User.findById(userId).select('email role').lean();
    if (!user) return deny();

    context.locals.user = {
      userId,
      email: user.email,
      role: user.role,
    };
  } catch {
    return deny();
  }

  return next();
});

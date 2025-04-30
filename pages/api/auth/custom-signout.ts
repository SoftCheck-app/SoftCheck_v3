import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions, sessionTokenCookieName } from '@/lib/nextAuth';
import { prisma } from '@/lib/prisma';
import { getCookie, deleteCookie } from 'cookies-next';
import env from '@/lib/env';
import { deleteSession } from 'models/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authOptions = getAuthOptions(req, res);
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Even if there's no session, we still want to clean up cookies
    
    // Handle database session strategy
    if (env.nextAuth.sessionStrategy === 'database') {
      const sessionToken = await getCookie(sessionTokenCookieName, {
        req,
        res,
      });
      
      if (sessionToken) {
        const sessionDBEntry = await prisma.session.findFirst({
          where: {
            sessionToken: sessionToken,
          },
        });

        if (sessionDBEntry) {
          await deleteSession({
            where: {
              sessionToken: sessionToken,
            },
          });
        }
      }
    }

    // Clear all auth-related cookies with all possible domain configurations
    const cookies = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.csrf-token',
      '__Host-next-auth.csrf-token'
    ];

    // Get hostname from request to handle correct domain cookie clearing
    const host = req.headers.host || '';
    const domain = host.includes('localhost') ? 'localhost' : host.split(':')[0];

    // Delete cookies using cookies-next for better compatibility
    cookies.forEach(cookieName => {
      deleteCookie(cookieName, { req, res, path: '/' });
      
      // Also set the header manually to ensure the cookie is cleared
      res.setHeader(
        'Set-Cookie',
        `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; Secure; SameSite=Lax`
      );
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Signout error:', error);
    return res.status(500).json({ error: 'Failed to sign out' });
  }
}

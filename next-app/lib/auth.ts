import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

async function logAuthEvent(
  eventType: 'login_success' | 'login_failed',
  email: string | null,
  userId: string | null,
  message: string,
  details?: Record<string, any>
) {
  try {
    await db.execute(sql`
      INSERT INTO activity_logs (user_email, user_id, event_type, event_message, event_details)
      VALUES (${email}, ${userId}, ${eventType}, ${message}, ${details ? JSON.stringify(details) : null}::jsonb)
    `);
  } catch (e) {
    console.error('Failed to log auth event:', e);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Auth: Missing credentials');
            await logAuthEvent('login_failed', null, null, 'Login attempt with missing credentials');
            return null;
          }

          console.log('Auth: Looking up user:', credentials.email);
          const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email),
          });

          if (!user) {
            console.log('Auth: User not found');
            await logAuthEvent('login_failed', credentials.email, null, `Login failed - user not found: ${credentials.email}`);
            return null;
          }

          if (!user.passwordHash) {
            console.log('Auth: No password hash for user');
            await logAuthEvent('login_failed', credentials.email, user.id, `Login failed - no password set for: ${credentials.email}`);
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            console.log('Auth: Invalid password');
            await logAuthEvent('login_failed', credentials.email, user.id, `Login failed - incorrect password for: ${credentials.email}`);
            return null;
          }

          console.log('Auth: Success for user:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            isAdmin: user.isAdmin || false,
          };
        } catch (error) {
          console.error('Auth error:', error);
          await logAuthEvent('login_failed', credentials?.email || null, null, `Login error: ${error}`);
          return null;
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          // For Google sign-in, use dbId (database user ID), otherwise use user.id
          token.id = (user as any).dbId || user.id;
          token.isAdmin = (user as any).isAdmin || false;
        }
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          (session.user as any).id = token.id;
          (session.user as any).isAdmin = token.isAdmin || false;
        }
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        let existingUser = await db.query.users.findFirst({
          where: eq(users.googleId, user.id),
        });

        const isNewUser = !existingUser;
        
        if (!existingUser) {
          const [newUser] = await db.insert(users).values({
            googleId: user.id,
            email: user.email || '',
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            profileImageUrl: user.image || '',
          }).returning();
          existingUser = newUser;
        }
        
        // Set the database user ID on the user object so it flows to the JWT
        (user as any).dbId = existingUser.id;
        (user as any).isAdmin = existingUser.isAdmin || false;
        
        await logAuthEvent(
          'login_success',
          user.email || null,
          existingUser.id,
          `Google login successful for ${user.email}`,
          { provider: 'google', isNewUser }
        );
      } else {
        // Credentials login success
        await logAuthEvent(
          'login_success',
          user.email || null,
          user.id,
          `Email login successful for ${user.email}`,
          { provider: 'credentials' }
        );
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token-v2' 
        : 'next-auth.session-token-v2',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
};

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
            return null;
          }

          console.log('Auth: Looking up user:', credentials.email);
          const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email),
          });

          if (!user) {
            console.log('Auth: User not found');
            return null;
          }

          if (!user.passwordHash) {
            console.log('Auth: No password hash for user');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            console.log('Auth: Invalid password');
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
      if (user) {
        // For Google sign-in, use dbId (database user ID), otherwise use user.id
        token.id = (user as any).dbId || user.id;
        token.isAdmin = (user as any).isAdmin || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin || false;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        let existingUser = await db.query.users.findFirst({
          where: eq(users.googleId, user.id),
        });

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
  secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
};

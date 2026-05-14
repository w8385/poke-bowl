import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const authEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const nextAuth = authEnabled
  ? NextAuth({
      providers: [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ],
      session: {
        strategy: 'jwt',
      },
      callbacks: {
        async jwt({ token, profile }) {
          if (profile?.email) {
            token.email = profile.email;
          }
          return token;
        },
        async session({ session, token }) {
          if (session.user && token.email) {
            session.user.email = token.email as string;
          }
          return session;
        },
      },
      pages: {
        signIn: '/login',
      },
    })
  : null;

export { authEnabled };
export const handlers = nextAuth?.handlers;
export const auth = nextAuth?.auth ?? (async () => null);
export const signIn = nextAuth?.signIn ?? (async () => {
  throw new Error('Google auth is not configured');
});
export const signOut = nextAuth?.signOut ?? (async () => undefined);

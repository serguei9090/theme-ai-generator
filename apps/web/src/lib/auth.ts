import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENTID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email copilot",
        },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

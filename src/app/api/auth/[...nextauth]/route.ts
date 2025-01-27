import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Aqui você pode adicionar restrições de domínio se quiser
      return true;
    },
    async session({ session, token }) {
      return session;
    },
  },
});

export { handler as GET, handler as POST }; 
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.id = profile?.sub
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session && token) {
        (session as any).accessToken = token.accessToken as string
        if (session.user) {
          (session.user as any).id = token.id as string
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // You can add custom logic here to sync with your Appwrite database
      // For now, we'll just allow all Google sign-ins
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      sessionId?: string;
    };
  }
}

// Cuentas suspendidas hace más de 90 días se eliminan definitivamente.
export const SUSPENSION_GRACE_MS = 90 * 24 * 60 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash
        );
        if (!passwordMatches) return null;

        if (user.suspendedAt) {
          // Pasado el período de gracia, la cuenta se elimina y el login falla.
          if (Date.now() - user.suspendedAt.getTime() > SUSPENSION_GRACE_MS) {
            await prisma.user.delete({ where: { id: user.id } });
            return null;
          }
          // Dentro del período: iniciar sesión reactiva la cuenta.
          await prisma.user.update({
            where: { id: user.id },
            data: { suspendedAt: null },
          });
        }

        // Registra la sesión de este dispositivo (visible en /perfil).
        const userAgent = request?.headers?.get("user-agent") ?? null;
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          null;
        const deviceSession = await prisma.userSession.create({
          data: { userId: user.id, userAgent, ip },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          sessionId: deviceSession.id,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sessionId = (user as { sessionId?: string }).sessionId;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.sessionId) {
        session.user.sessionId = token.sessionId as string;
      }
      return session;
    },
  },
});

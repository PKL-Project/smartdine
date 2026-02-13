import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { prisma } from "./prisma";

const isDevelopment = process.env.NODE_ENV === "development";

// Mock Resend API for local development
const resend = isDevelopment
  ? {
      emails: {
        send: async (params: { from: string; to: string; subject: string; html: string; text: string }) => {
          const urlMatch = params.text.match(/(https?:\/\/[^\s]+)/);
          const magicLink = urlMatch ? urlMatch[1] : null;

          console.log("\n=== 📧 WIADOMOŚĆ EMAIL (Tryb deweloperski) ===");
          console.log(`Od: ${params.from}`);
          console.log(`Do: ${params.to}`);
          console.log(`Temat: ${params.subject}`);

          if (magicLink) {
            console.log(
              `\n🔗 Link logowania (kliknij aby się zalogować):\n\x1b]8;;${magicLink}\x1b\\${magicLink}\x1b]8;;\x1b\\\n`,
            );
          }

          console.log("============================================\n");
          return { id: "mock-email-id" };
        },
      },
    }
  : new Resend(process.env.RESEND_API_KEY!);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: identifier,
          subject: "Zaloguj się do SmartDine",
          html: `
            <p>Kliknij link poniżej, aby się zalogować:</p>
            <p><a href="${url}">Zaloguj się</a></p>
            <p>Link wygaśnie wkrótce. Jeśli nie prosiłeś o logowanie, zignoruj tę wiadomość.</p>
          `,
          text: `Zaloguj się do SmartDine: ${url}`,
        });
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in: copy data from DB
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, name: true, role: true },
        });
        token.id = dbUser?.id;
        token.name = dbUser?.name;
        token.role = dbUser?.role ?? null;
        return token;
      }

      // When the client calls session.update()
      if (trigger === "update") {
        if (session?.role) {
          token.role = session.role;
        }
        if (session?.name !== undefined) {
          token.name = session.name;
        }
        return token;
      }

      // Keep token in sync with DB
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true, name: true, role: true },
        });
        token.id = dbUser?.id;
        token.name = dbUser?.name;
        token.role = dbUser?.role ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      session.user.name = (token.name as string | null) ?? null;
      session.user.role = token.role ?? null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/auth/verify-request",
  },
};

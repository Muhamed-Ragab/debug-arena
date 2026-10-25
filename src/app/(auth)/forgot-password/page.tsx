import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  description: "Reset your Debug Arena account password.",
  path: "/forgot-password",
  robots: {
    follow: false,
    index: false,
  },
  title: "Reset Password",
});

export default function Page() {
  return <ForgotPasswordPage />;
}

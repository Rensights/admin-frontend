import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rensights Admin Login",
  description: "Sign in to the Rensights admin dashboard.",
};

export default function SignIn() {
  return <SignInForm />;
}

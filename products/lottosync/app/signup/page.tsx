import type { Metadata } from "next";
import SignupClient from "./SignupClient";

export const metadata: Metadata = {
  title: "Start Free Trial | LottoTally",
};

export default function SignupPage() {
  return <SignupClient />;
}

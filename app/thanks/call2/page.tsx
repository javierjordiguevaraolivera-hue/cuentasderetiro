import type { Metadata } from "next";
import { Suspense } from "react";
import VercelThankYouTracker from "../../../components/vercel-thank-you-tracker";
import ThanksCall2Client from "./thanks-call2-client";

export const metadata: Metadata = {
  title: "Habla con un especialista",
  description: "Tu solicitud está lista para continuar por teléfono.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThanksCall2Page() {
  return (
    <Suspense fallback={null}>
      <VercelThankYouTracker thankYouType="call" />
      <ThanksCall2Client />
    </Suspense>
  );
}

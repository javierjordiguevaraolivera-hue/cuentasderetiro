"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RejectionActions() {
  const router = useRouter();

  return (
    <div className="grid gap-4">
      <button
        className="min-h-13 rounded-md border border-[#e99a12] bg-gradient-to-b from-[#ffd34f] via-[#ffb32c] to-[#f28e22] px-5 text-[14px] font-black uppercase text-[#173453] shadow-[0_3px_0_#a85d11,inset_0_1px_rgba(255,255,255,0.55)]"
        onClick={() => router.back()}
        type="button"
      >
        Cambiar mi respuesta
      </button>
      <Link
        className="text-center text-[13px] font-bold text-white/80 underline decoration-white/50 underline-offset-4"
        href="/iul-v4"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

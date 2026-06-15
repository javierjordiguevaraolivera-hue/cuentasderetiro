import type { Metadata } from "next";
import Image from "next/image";
import retirementLogo from "../../../public/media/logo-cuentas-de-retiro.png";

export const metadata: Metadata = {
  title: "Revisión de opciones disponibles",
  description:
    "Información sobre las opciones disponibles según las respuestas proporcionadas.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StatusUnavailablePage() {
  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_18%_14%,rgba(40,142,241,0.55),transparent_30%),linear-gradient(145deg,#0d4b9d_0%,#082d62_58%,#041b3d_100%)]">
      <header className="border-b border-[#d8e1eb] bg-white shadow-[0_1px_0_rgba(10,43,84,0.1)]">
        <div className="mx-auto flex min-h-16 w-[calc(100%-24px)] max-w-[500px] items-center justify-center py-2">
          <Image
            alt="Cuentas de Retiro"
            className="h-[52px] w-auto"
            priority
            src={retirementLogo}
          />
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100svh-64px)] w-full max-w-[500px] flex-col items-center justify-center px-6 py-12 text-center text-white">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ffd96a] before:h-[2px] before:w-6 before:rounded-full before:bg-[#ffc438] after:h-[2px] after:w-6 after:rounded-full after:bg-[#ffc438]">
          Gracias por tu interés
        </p>

        <div className="mt-7 grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/12 text-[#ffd04a] shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <svg
            aria-hidden="true"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
        </div>

        <h1 className="mt-7 max-w-[390px] text-[30px] font-black leading-[1.04] tracking-[-0.045em]">
          Por ahora, estas opciones podrían no estar disponibles para ti
        </h1>
        <p className="mt-5 max-w-[365px] text-[16px] leading-[1.6] text-[#d9e9fb]">
          Según la información seleccionada, no encontramos una alternativa
          adecuada dentro de este programa en este momento.
        </p>
        <p className="mt-3 max-w-[350px] text-[14px] leading-[1.55] text-[#aec9e8]">
          Agradecemos tu tiempo y el interés en conocer opciones para tu futuro.
        </p>
      </section>
    </main>
  );
}

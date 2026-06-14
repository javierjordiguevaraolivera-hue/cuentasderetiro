import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "../site-config";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Términos aplicables al uso de CuentasDeRetiro.com.",
  alternates: {
    canonical: "/terminos",
  },
};

export default function TermsPage() {
  return (
    <main className="legal-main">
      <article className="shell legal-document">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            CR
          </span>
          <span>{siteConfig.name}</span>
        </Link>
        <h1>Términos de uso</h1>
        <p className="legal-meta">Última actualización: 13 de junio de 2026</p>

        <h2>Finalidad del sitio</h2>
        <p>
          {siteConfig.shortName} ofrece información educativa general sobre
          temas relacionados con el ahorro y las cuentas de retiro. El contenido
          no constituye asesoría financiera, de inversión, legal o fiscal, ni
          una recomendación de comprar o vender un producto.
        </p>

        <h2>Sin relación gubernamental ni fiduciaria</h2>
        <p>
          No somos una agencia gubernamental, institución financiera, corredor,
          fiduciario ni asesor de inversiones. El uso del sitio no crea una
          relación profesional, fiduciaria o de cliente.
        </p>

        <h2>Decisiones y resultados</h2>
        <p>
          Las decisiones financieras implican riesgos y dependen de
          circunstancias individuales. No garantizamos elegibilidad,
          disponibilidad, ahorro, rendimiento ni resultados. Debes revisar la
          información y consultar a profesionales calificados antes de actuar.
        </p>

        <h2>Uso permitido</h2>
        <p>
          Aceptas no usar el sitio para actividades ilícitas, interferir con su
          funcionamiento, intentar acceder a sistemas sin autorización o enviar
          información falsa o de terceros sin permiso.
        </p>

        <h2>Servicios y enlaces de terceros</h2>
        <p>
          El sitio puede mencionar o enlazar servicios de terceros. Cada tercero
          es responsable de sus propios productos, declaraciones, términos y
          prácticas de privacidad. Una referencia no implica garantía ni
          respaldo.
        </p>

        <h2>Cambios y contacto</h2>
        <p>
          Podemos actualizar estos términos y publicaremos la fecha de la
          revisión. Para preguntas, escribe a{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
      </article>
    </main>
  );
}

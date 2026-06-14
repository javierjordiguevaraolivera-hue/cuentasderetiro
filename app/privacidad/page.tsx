import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "../site-config";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Conoce qué información puede recopilar Cuentas de Retiro, para qué se utiliza y cuáles son tus opciones.",
  alternates: {
    canonical: "/privacidad",
  },
};

export default function PrivacyPage() {
  return (
    <main className="legal-main">
      <article className="shell legal-document">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            CR
          </span>
          <span>{siteConfig.name}</span>
        </Link>
        <h1>Política de privacidad</h1>
        <p className="legal-meta">Última actualización: 13 de junio de 2026</p>

        <p>
          Esta política explica cómo {siteConfig.shortName} recopila, utiliza,
          comparte y protege información cuando visitas nuestro sitio o decides
          comunicarte con nosotros.
        </p>

        <h2>Información que podemos recopilar</h2>
        <p>
          Podemos recibir datos de contacto que proporciones voluntariamente,
          como nombre, correo electrónico, teléfono y estado de residencia.
          También podemos recibir información técnica básica, como dirección IP,
          tipo de navegador, páginas visitadas y parámetros de campaña.
        </p>
        <p>
          No solicitamos contraseñas, números completos de cuentas bancarias,
          credenciales de acceso ni números completos de Seguro Social mediante
          este sitio.
        </p>

        <h2>Cómo usamos la información</h2>
        <ul>
          <li>Responder solicitudes y proporcionar la información solicitada.</li>
          <li>Coordinar contactos que hayas autorizado expresamente.</li>
          <li>Operar, proteger y mejorar el sitio y nuestras campañas.</li>
          <li>Cumplir obligaciones legales y prevenir fraude o abuso.</li>
        </ul>

        <h2>Cuándo compartimos información</h2>
        <p>
          Podemos compartir datos con proveedores que operan servicios en
          nuestro nombre, con profesionales o empresas claramente identificados
          cuando hayas consentido el contacto, o cuando la ley lo exija. No
          vendemos información personal a cambio de dinero.
        </p>

        <h2>Publicidad, analítica y cookies</h2>
        <p>
          Si incorporamos herramientas de analítica o publicidad, mostraremos
          los avisos y controles que correspondan antes de activar tecnologías
          no esenciales. Esas herramientas podrían medir visitas, atribuir
          campañas o crear audiencias según la configuración elegida. No
          enviaremos a plataformas publicitarias información financiera
          sensible, credenciales ni contenido introducido libremente en campos.
        </p>

        <h2>Tus opciones</h2>
        <p>
          Puedes solicitar acceso, corrección o eliminación de la información
          que mantengamos sobre ti, retirar un consentimiento o pedir que no te
          contactemos. Algunas solicitudes pueden requerir verificación de
          identidad y estar sujetas a excepciones legales.
        </p>

        <h2>Conservación y seguridad</h2>
        <p>
          Conservamos información solo durante el tiempo necesario para las
          finalidades descritas o para cumplir obligaciones legales. Aplicamos
          medidas razonables de seguridad, aunque ningún sistema de transmisión
          o almacenamiento puede garantizar protección absoluta.
        </p>

        <h2>Menores de edad</h2>
        <p>
          Este sitio está dirigido a adultos y no está diseñado para recopilar
          intencionalmente información de menores de 18 años.
        </p>

        <h2>Contacto</h2>
        <p>
          Para preguntas o solicitudes de privacidad, escribe a{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
      </article>
    </main>
  );
}

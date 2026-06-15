"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import retirementLogo from "../public/media/logo-cuentas-de-retiro.png";

const retirementGoals = [
  {
    id: "protect-savings",
    label: "Proteger mis ahorros",
  },
  {
    id: "grow-money",
    label: "Hacer crecer mi dinero",
  },
  {
    id: "retirement-income",
    label: "Generar ingresos al retirarme",
  },
] as const;

const slotValues = Array.from({ length: 61 }, (_, index) => {
  if (index === 0) return 20000;
  if (index === 60) return 102000;

  const progress = index / 60;
  const irregularOffset = Math.sin(index * 1.73) * 310;

  return Math.round(20000 + 82000 * progress + irregularOffset);
});

function getSlotDigits(value: number) {
  return value.toString().padStart(6, " ").split("");
}

const slotReels = Array.from({ length: 6 }, (_, digitIndex) =>
  slotValues.map((value) => getSlotDigits(value)[digitIndex]),
);

type FunnelStepOneProps = {
  phoneDisplay: string;
  phoneHref: string;
};

export default function FunnelStepOne({
  phoneDisplay,
  phoneHref,
}: FunnelStepOneProps) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  function selectGoal(goal: (typeof retirementGoals)[number]) {
    setSelectedGoal(goal.id);
    sessionStorage.setItem("retirement_goal", goal.id);
    window.dispatchEvent(
      new CustomEvent("funnel:step-complete", {
        detail: { step: 1, retirementGoal: goal.id },
      }),
    );
  }

  return (
    <main className="funnel-page">
      <header className="funnel-header">
        <div className="funnel-bar-inner">
          <Link className="funnel-logo" href="/" aria-label="Cuentas de Retiro">
            <Image
              alt=""
              className="funnel-logo-image"
              priority
              src={retirementLogo}
            />
          </Link>

          <a className="header-call" href={phoneHref}>
            <span className="phone-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.7 3.8.7.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.7 21 3 13.3 3 3.8c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.7 3.8.1.4 0 .8-.3 1.1l-2.3 2.1Z" />
              </svg>
            </span>
            <span>
              <small>Habla con un especialista</small>
              <strong>{phoneDisplay}</strong>
            </span>
          </a>
        </div>
      </header>

      <div className="funnel-shell">
        <section className="funnel-content">
          <div className="hero-lockup">
            <div className="hero-copy-block">
              <p className="hero-kicker">Planifica con más claridad</p>
              <h1>
                Cuidamos de ti
                <span> y tu familia</span>
              </h1>
            </div>
          </div>

          <div className="prompt-banner">
            <span className="prompt-copy">
              <span>Potencial Pago Cash Value</span>
              <strong>Sujeto a evaluación final</strong>
            </span>
            <span className="price-odometer" aria-hidden="true">
              <span className="currency">$</span>
              <span className="odometer-digits">
                {slotReels.map((reel, index) => (
                  <span className="odometer-group" key={index}>
                    <span className="odometer-column">
                      <span className="odometer-reel">
                        {reel.map((reelDigit, reelIndex) => (
                          <span key={reelIndex}>{reelDigit}</span>
                        ))}
                      </span>
                    </span>
                    {index === 2 ? (
                      <span className="odometer-separator">,</span>
                    ) : null}
                  </span>
                ))}
              </span>
            </span>
          </div>

          <section className="question-card" aria-labelledby="step-one-title">
            <div className="question-heading">
              <p>Paso 1 de 5</p>
              <h2 id="step-one-title">
                ¿Cuál es tu principal objetivo para el retiro?
              </h2>
              <div className="progress-dots" aria-label="Paso 1 de 5">
                <span className="active" />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="answer-list">
              {retirementGoals.map((goal) => (
                <button
                  className={selectedGoal === goal.id ? "selected" : ""}
                  key={goal.id}
                  onClick={() => selectGoal(goal)}
                  type="button"
                >
                  <span>{goal.label}</span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>

            <p className="selection-status" aria-live="polite">
              {selectedGoal
                ? "Respuesta guardada. El siguiente paso se conectará aquí."
                : "Selecciona una opción para continuar."}
            </p>
          </section>

          <aside className="trust-panel">
            <h2>Más que solo un seguro aislado</h2>
            <ul>
              <li>Protege a tu familia con hasta $350,000</li>
              <li>Asegura tu casa con Mortgage Protection</li>
              <li>Haz crecer tus ahorros para tu jubilación</li>
              <li>Disfruta de tu seguro en vida con tu familia</li>
            </ul>
          </aside>

          <p className="funnel-disclaimer">
            CuentasDeRetiro.com ofrece información educativa general y
            resultados simulados a tasas fijas en escenarios optimistas para
            ilustrar el potencial de crecimiento con un seguro de tipo IUL. No
            somos una agencia gubernamental, institución financiera, fiduciario
            ni asesor de inversiones. Para tener costos y beneficios reales es
            necesario consultar con un agente licenciado y autorizado por el
            estado.
          </p>
        </section>

      </div>

    </main>
  );
}

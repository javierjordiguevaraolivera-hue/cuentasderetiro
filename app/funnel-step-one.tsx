"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

const MAX_REEL_ADVANCE = slotValues.length * 10 + 100;

const digitReel = Array.from({ length: MAX_REEL_ADVANCE }, (_, index) =>
  String(index % 10),
);

function getSlotDigits(value: number) {
  return value.toString().padStart(6, " ").split("");
}

function getInitialReelPositions(value: number) {
  return getSlotDigits(value).map((digit) =>
    digit === " " ? 10 : Number(digit) + 10,
  );
}

type FunnelStepOneProps = {
  phoneDisplay: string;
  phoneHref: string;
};

export default function FunnelStepOne({
  phoneDisplay,
  phoneHref,
}: FunnelStepOneProps) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [slotValue, setSlotValue] = useState(slotValues[0]);
  const [reelPositions, setReelPositions] = useState<(number | null)[]>(() =>
    getInitialReelPositions(slotValues[0]),
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedMotionTimer = window.setTimeout(() => {
        const finalValue = slotValues.at(-1) ?? 102000;
        setSlotValue(finalValue);
        setReelPositions(getInitialReelPositions(finalValue));
      }, 0);

      return () => window.clearTimeout(reducedMotionTimer);
    }

    const timers = slotValues.slice(1).map((value, index) =>
      window.setTimeout(
        () => {
          setSlotValue(value);
          setReelPositions((currentPositions) =>
            getSlotDigits(value).map((digit, digitIndex) => {
              if (digit === " ") {
                return null;
              }

              const targetDigit = Number(digit);
              const currentPosition = currentPositions[digitIndex];

              if (currentPosition === null || digit === " ") {
                return targetDigit + 10;
              }

              const currentDigit = currentPosition % 10;
              const distance = (targetDigit - currentDigit + 10) % 10;

              return currentPosition + (distance || 10);
            }),
          );
        },
        ((index + 1) * 6000) / (slotValues.length - 1),
      ),
    );

    return () => timers.forEach(window.clearTimeout);
  }, []);

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
            <span className="logo-symbol" aria-hidden="true">
              <svg viewBox="0 0 32 32" role="img">
                <path d="M5 25V12l11-7 11 7v13h-7v-8h-8v8H5Z" />
                <path d="M3 26h26v3H3z" />
              </svg>
            </span>
            <span>
              <b>CUENTAS</b>
              <strong>DE RETIRO</strong>
            </span>
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
            <div className="retirement-illustration">
              <Image
                alt="Casa, árbol y alcancía protegidos por unas manos"
                className="retirement-image"
                height={198}
                priority
                sizes="(max-width: 519px) 36vw, 160px"
                src="/media/imagen-ilustrativa-transparent.png"
                width={168}
              />
            </div>

            <div className="hero-copy-block">
              <p className="hero-kicker">Planifica con más claridad</p>
              <h1>
                Protege a tu familia
                <span> si un día no estás</span>
              </h1>
            </div>
          </div>

          <p className="eligibility-note">
            Las opciones y disponibilidad pueden variar. Consulta los detalles.
          </p>

          <div className="prompt-banner">
            <span className="prompt-copy">
              <span>Potencial Pago Cash Value</span>
              <strong>Sujeto a evaluación final</strong>
            </span>
            <span className="price-odometer" aria-hidden="true">
              <span className="currency">$</span>
              <span className="odometer-digits">
                {getSlotDigits(slotValue).map((digit, index) => (
                  <span className="odometer-group" key={index}>
                    <span className="odometer-column">
                      {digit === " " ? null : (
                        <span
                          className="odometer-reel"
                          style={{
                            transform: `translateY(-${(reelPositions[index] ?? 0) * 30}px)`,
                            transitionDuration: `${62 + index * 4}ms`,
                          }}
                        >
                          {digitReel.map((reelDigit, reelIndex) => (
                            <span key={reelIndex}>{reelDigit}</span>
                          ))}
                        </span>
                      )}
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
            <h2>Tu información importa</h2>
            <ul>
              <li>Orientación general basada en tus respuestas</li>
              <li>Sin promesas de rendimiento ni resultados</li>
              <li>Sin solicitar datos bancarios o contraseñas</li>
              <li>Privacidad y consentimiento antes del contacto</li>
            </ul>
          </aside>

          <p className="funnel-disclaimer">
            CuentasDeRetiro.com ofrece información educativa general. No somos
            una agencia gubernamental, institución financiera, fiduciario ni
            asesor de inversiones.
          </p>
        </section>

      </div>

    </main>
  );
}

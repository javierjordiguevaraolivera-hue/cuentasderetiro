"use client";

import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import retirementLogo from "../public/media/logo-cuentas-de-retiro.png";

const retirementGoals = [
  {
    id: "protect-savings",
    label: "Proteger a mi familia si no estoy",
    amount: 31000,
  },
  {
    id: "grow-money",
    label: "Ahorrar mi dinero con intereses",
    amount: 29000,
  },
  {
    id: "retirement-income",
    label: "Planificar mi retiro",
    amount: 32253,
  },
  {
    id: "not-sure",
    label: "No estoy seguro aún",
    amount: 27894,
  },
] as const;

const ageRanges = [
  {
    id: "25-34",
    label: "25 a 34 años",
    amount: 392000,
  },
  {
    id: "35-44",
    label: "35 a 44 años",
    amount: 204000,
  },
  {
    id: "45-54",
    label: "45 a 54 años",
    amount: 117000,
  },
  {
    id: "55-65",
    label: "55 a 65 años",
    amount: 69000,
  },
  {
    id: "65-plus",
    label: "65+",
    amount: 27000,
  },
] as const;

function buildSlotValues(start: number, end: number, stepCount: number) {
  const weights = Array.from({ length: stepCount }, (_, index) => {
    const step = index + 1;
    return 1 + Math.sin(step * 1.73) * 0.24 + Math.sin(step * 0.61) * 0.11;
  });
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  let accumulatedWeight = 0;

  return [
    start,
    ...weights.map((weight, index) => {
      if (index === weights.length - 1) return end;

      accumulatedWeight += weight;
      return Math.round(
        start + (end - start) * (accumulatedWeight / totalWeight),
      );
    }),
  ];
}

const initialSlotValues = buildSlotValues(10000, 65000, 60);
const zipCodeAmount = 5389;

function getSlotDigits(value: number) {
  return value.toString().padStart(6, " ").split("");
}

function getSlotReels(values: number[]) {
  return Array.from({ length: 6 }, (_, digitIndex) =>
    values.map((value) => getSlotDigits(value)[digitIndex]),
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [zipSubmitted, setZipSubmitted] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(65000);
  const [odometerValues, setOdometerValues] = useState(initialSlotValues);
  const [odometerRun, setOdometerRun] = useState(0);

  function selectGoal(goal: (typeof retirementGoals)[number]) {
    const nextAmount = currentAmount + goal.amount;
    const stepCount = Math.max(1, Math.round(goal.amount / 1000));

    setSelectedGoal(goal.id);
    setOdometerValues(buildSlotValues(currentAmount, nextAmount, stepCount));
    setCurrentAmount(nextAmount);
    setOdometerRun((run) => run + 1);
    sessionStorage.setItem("retirement_goal", goal.id);
    sessionStorage.setItem("retirement_goal_value", String(goal.amount));
    window.dispatchEvent(
      new CustomEvent("funnel:step-complete", {
        detail: {
          step: 1,
          retirementGoal: goal.id,
          retirementGoalValue: goal.amount,
          projectedAmount: nextAmount,
        },
      }),
    );
    setCurrentStep(2);
  }

  function selectAge(ageRange: (typeof ageRanges)[number]) {
    if (selectedAge) return;

    const nextAmount = currentAmount + ageRange.amount;
    const stepCount = Math.max(1, Math.round(ageRange.amount / 1000));

    setSelectedAge(ageRange.id);
    setOdometerValues(buildSlotValues(currentAmount, nextAmount, stepCount));
    setCurrentAmount(nextAmount);
    setOdometerRun((run) => run + 1);
    sessionStorage.setItem("age_range", ageRange.id);
    sessionStorage.setItem("age_range_value", String(ageRange.amount));
    window.dispatchEvent(
      new CustomEvent("funnel:step-complete", {
        detail: {
          step: 2,
          ageRange: ageRange.id,
          ageRangeValue: ageRange.amount,
          projectedAmount: nextAmount,
        },
      }),
    );
    setCurrentStep(3);
  }

  function updateZipCode(value: string) {
    setZipCode(value.replace(/\D/g, "").slice(0, 5));
    setZipError("");
    setZipSubmitted(false);
  }

  function submitZipCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (zipSubmitted) return;

    const numericZip = Number(zipCode);
    const isValidUsZip =
      /^\d{5}$/.test(zipCode) && numericZip >= 501 && numericZip <= 99950;

    if (!isValidUsZip) {
      setZipError("Ingresa un ZIP code válido de 5 dígitos.");
      return;
    }

    const nextAmount = currentAmount + zipCodeAmount;
    const stepCount = Math.max(1, Math.round(zipCodeAmount / 1000));

    setZipSubmitted(true);
    setOdometerValues(buildSlotValues(currentAmount, nextAmount, stepCount));
    setCurrentAmount(nextAmount);
    setOdometerRun((run) => run + 1);
    sessionStorage.setItem("zip_code", zipCode);
    sessionStorage.setItem("zip_code_value", String(zipCodeAmount));
    window.dispatchEvent(
      new CustomEvent("funnel:step-complete", {
        detail: {
          step: 3,
          zipCode,
          zipCodeValue: zipCodeAmount,
          projectedAmount: nextAmount,
        },
      }),
    );
    setCurrentStep(4);
  }

  function updateName(
    field: "firstName" | "lastName",
    value: string,
  ) {
    const cleanValue = value
      .replace(/[^\p{L}' -]/gu, "")
      .replace(/\s{2,}/g, " ")
      .slice(0, 40);

    if (field === "firstName") {
      setFirstName(cleanValue);
    } else {
      setLastName(cleanValue);
    }

    setNameError("");
    setNameSubmitted(false);
  }

  function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (nameSubmitted) return;

    const validNamePattern = /^[\p{L}][\p{L}' -]+$/u;
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (
      !validNamePattern.test(cleanFirstName) ||
      !validNamePattern.test(cleanLastName)
    ) {
      setNameError("Ingresa un nombre y apellido válidos.");
      return;
    }

    setFirstName(cleanFirstName);
    setLastName(cleanLastName);
    setNameSubmitted(true);
    sessionStorage.setItem("first_name", cleanFirstName);
    sessionStorage.setItem("last_name", cleanLastName);
    window.dispatchEvent(
      new CustomEvent("funnel:step-complete", {
        detail: {
          step: 4,
          firstName: cleanFirstName,
          lastName: cleanLastName,
        },
      }),
    );
  }

  const slotReels = getSlotReels(odometerValues);
  const odometerSteps = odometerValues.length - 1;
  const odometerStyle = {
    "--odometer-distance": `${odometerSteps * -30}px`,
    animationTimingFunction: `steps(${odometerSteps}, jump-start)`,
  } as CSSProperties;

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
                  <span
                    className="odometer-group"
                    key={`${odometerRun}-${index}`}
                  >
                    <span className="odometer-column">
                      <span className="odometer-reel" style={odometerStyle}>
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

          <section
            className={`question-card step-${currentStep}-card`}
            aria-labelledby={`step-${currentStep}-title`}
          >
            <div className="question-heading">
              <p>Paso {currentStep} de 5</p>
            </div>

            <div className="question-stage">
              <div
                className={`question-step-content${
                  currentStep > 1 ? " entering-from-right" : ""
                }`}
                key={currentStep}
              >
                {currentStep === 1 ? (
                  <>
                    <h2 id="step-1-title">
                      ¿Cuál es tu principal objetivo para el retiro?
                    </h2>
                    <div className="answer-list">
                      {retirementGoals.map((goal) => (
                        <button
                          className={
                            selectedGoal === goal.id ? "selected" : ""
                          }
                          key={goal.id}
                          onClick={() => selectGoal(goal)}
                          type="button"
                        >
                          <span>{goal.label}</span>
                          <span aria-hidden="true">›</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : currentStep === 2 ? (
                  <>
                    <h2 id="step-2-title">¿Cuál es tu rango de edad?</h2>
                    <div className="answer-list age-answer-list">
                      {ageRanges.map((ageRange) => (
                        <button
                          className={
                            selectedAge === ageRange.id ? "selected" : ""
                          }
                          key={ageRange.id}
                          onClick={() => selectAge(ageRange)}
                          type="button"
                        >
                          <span>{ageRange.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <h2 id="step-3-title">¿Cuál es tu ZIP code?</h2>
                    <form className="zip-form" onSubmit={submitZipCode}>
                      <label className="sr-only" htmlFor="zip-code">
                        ZIP code de Estados Unidos
                      </label>
                      <input
                        aria-describedby={zipError ? "zip-error" : undefined}
                        aria-invalid={Boolean(zipError)}
                        autoComplete="postal-code"
                        id="zip-code"
                        inputMode="numeric"
                        maxLength={5}
                        onChange={(event) => updateZipCode(event.target.value)}
                        pattern="[0-9]{5}"
                        placeholder="Ej. 33101"
                        type="text"
                        value={zipCode}
                      />
                      <button type="submit">Continuar</button>
                      <p
                        className={zipError ? "zip-feedback error" : "zip-feedback"}
                        id="zip-error"
                        role={zipError ? "alert" : undefined}
                      >
                        {zipError ||
                          (zipSubmitted ? "ZIP code guardado correctamente." : "")}
                      </p>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 id="step-4-title">¿Cuál es tu nombre?</h2>
                    <form className="name-form" onSubmit={submitName}>
                      <label className="sr-only" htmlFor="first-name">
                        Nombre
                      </label>
                      <input
                        aria-describedby={
                          nameError ? "name-error" : undefined
                        }
                        aria-invalid={Boolean(nameError)}
                        autoComplete="given-name"
                        id="first-name"
                        maxLength={40}
                        onChange={(event) =>
                          updateName("firstName", event.target.value)
                        }
                        placeholder="Nombre"
                        type="text"
                        value={firstName}
                      />
                      <label className="sr-only" htmlFor="last-name">
                        Apellido
                      </label>
                      <input
                        aria-describedby={
                          nameError ? "name-error" : undefined
                        }
                        aria-invalid={Boolean(nameError)}
                        autoComplete="family-name"
                        id="last-name"
                        maxLength={40}
                        onChange={(event) =>
                          updateName("lastName", event.target.value)
                        }
                        placeholder="Apellido"
                        type="text"
                        value={lastName}
                      />
                      <button type="submit">Continuar</button>
                      <p
                        className={
                          nameError ? "form-feedback error" : "form-feedback"
                        }
                        id="name-error"
                        role={nameError ? "alert" : undefined}
                      >
                        {nameError ||
                          (nameSubmitted
                            ? "Nombre guardado correctamente."
                            : "")}
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>

            <div
              className="progress-dots"
              aria-label={`Paso ${currentStep} de 5`}
            >
              {Array.from({ length: 5 }, (_, index) => (
                <span
                  className={index === currentStep - 1 ? "active" : ""}
                  key={index}
                />
              ))}
            </div>
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

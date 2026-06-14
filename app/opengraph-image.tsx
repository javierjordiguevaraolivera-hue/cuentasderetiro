import { ImageResponse } from "next/og";

export const alt =
  "Cuentas de Retiro, información clara para planificar tu futuro";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #f7fbff 0%, #dcefff 55%, #b9ddf6 100%)",
          color: "#102a43",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: "30px",
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: "flex",
              width: "64px",
              height: "64px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "18px",
              background: "#1769aa",
              color: "white",
              fontSize: "22px",
            }}
          >
            CR
          </div>
          Cuentas de Retiro
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              maxWidth: "940px",
              fontSize: "72px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-3px",
            }}
          >
            Entiende mejor tus opciones para el retiro
          </div>
          <div style={{ fontSize: "28px", color: "#365d78" }}>
            Información clara para tomar decisiones más informadas.
          </div>
        </div>
      </div>
    ),
    size,
  );
}

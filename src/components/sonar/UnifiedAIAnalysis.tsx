import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

type Detection = {
  class_id: number;
  class_name: string;
  confidence: number;
  pixel_count: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type AIResponse = {
  status: string;
  model: string;
  classes: string[] | number;
  result: {
    image: string;
    image_size: string | { width: number; height: number } | { width: number; height: number };
    input_size: number;
  };
  detections: Detection[];
};

type Props = {
  imageUrl: string | null;
  fileName: string;
};

function formatImageSize(
  value: string | { width: number; height: number }
): string {
  if (typeof value === "string") {
    return value;
  }

  return `${value.width} × ${value.height}px`;
}

export default function UnifiedAIAnalysis({
  imageUrl,
  fileName,
}: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState("");

  const runAnalysis = async () => {
    if (!imageUrl) {
      setError("Upload a sonar image first.");
      return;
    }

    setRunning(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Unable to read sonar image.");
      }

      const blob = await response.blob();

      const formData = new FormData();

      formData.append(
        "file",
        new File(
          [blob],
          fileName || "sonar.png",
          {
            type: blob.type || "image/png",
          }
        )
      );

      const apiResponse = await fetch(
        `${API}/infer`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!apiResponse.ok) {
        const message = await apiResponse.text();

        throw new Error(
          `AI inference failed (${apiResponse.status}): ${message}`
        );
      }

      const data = await apiResponse.json();

      if (data.status !== "success") {
        throw new Error(
          data.message ||
            "AI inference service returned an unsuccessful result."
        );
      }

      setResult({
        status: data.status,
        model:
          data.model ||
          "BlueSentinel Multi-Class U-Net",
        classes: data.classes || [],
        result: {
          image:
            data.result?.image ||
            fileName ||
            "sonar.png",
          image_size:
            data.result?.image_size ||
            "Unknown",
          input_size:
            data.result?.input_size ||
            256,
        },
        detections: Array.isArray(data.detections)
          ? data.detections
          : [],
      });

      window.dispatchEvent(
        new CustomEvent("bluesentinel-ai-complete")
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI analysis failed."
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <section
      className="lab-panel"
      style={{
        marginTop: "24px",
        padding: "20px",
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <span className="lab-eyebrow">
          REAL AI ANALYSIS
        </span>

        <h3 style={{ marginTop: "6px" }}>
          BlueSentinel Multi-Class AI
        </h3>

        <p
          style={{
            opacity: 0.7,
            marginBottom: 0,
          }}
        >
          Multi-class U-Net analysis of the uploaded
          side-scan sonar image.
        </p>
      </div>

      <button
        onClick={runAnalysis}
        disabled={!imageUrl || running}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          border:
            "1px solid rgba(56,189,248,.35)",
          cursor:
            !imageUrl || running
              ? "not-allowed"
              : "pointer",
          fontWeight: 700,
          opacity:
            !imageUrl || running ? 0.55 : 1,
        }}
      >
        {running
          ? "RUNNING MULTI-CLASS U-NET..."
          : "RUN AI ANALYSIS"}
      </button>

      {error && (
        <div
          style={{
            marginTop: "14px",
            padding: "12px",
            borderRadius: "10px",
            background:
              "rgba(127,29,29,.35)",
          }}
        >
          <strong>AI ERROR</strong>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: "20px",
            display: "grid",
            gap: "18px",
          }}
        >
          <div>
            <span className="lab-eyebrow">
              REAL MODEL RESULT
            </span>

            <h3 style={{ margin: "6px 0" }}>
              {result.model}
            </h3>

            <small>
              Image: {formatImageSize(result.result.image_size)}
              {" · "}
              Inference: {result.result.input_size}px
            </small>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(160px,1fr))",
              gap: "12px",
            }}
          >
            <Metric
              value={result.detections.length}
              label="Detected Regions"
            />

            <Metric
              value={
                Array.isArray(result.classes)
                  ? result.classes.length
                  : result.classes
              }
              label="Model Classes"
            />

            <Metric
              value={
                result.detections.length
                  ? `${(
                      Math.max(
                        ...result.detections.map(
                          (d) => d.confidence
                        )
                      ) * 100
                    ).toFixed(1)}%`
                  : "—"
              }
              label="Highest Confidence"
            />
          </div>

          <div>
            <h4>DETECTION CLASSES</h4>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              {[
                "Submarine Pipeline",
                "Shipwreck",
                "Ghost Net",
                "Mine / Cylinder",
              ].map((name) => {
                const detected =
                  result.detections.find(
                    (d) => d.class_name === name
                  );

                return (
                  <div
                    key={name}
                    style={{
                      padding: "13px",
                      borderRadius: "10px",
                      background:
                        "rgba(15,23,42,.65)",
                      border:
                        "1px solid rgba(255,255,255,.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                      }}
                    >
                      <strong>{name}</strong>

                      <strong>
                        {detected
                          ? `${(
                              detected.confidence *
                              100
                            ).toFixed(1)}%`
                          : "Not detected"}
                      </strong>
                    </div>

                    {detected && (
                      <small
                        style={{
                          display: "block",
                          marginTop: "6px",
                          opacity: 0.65,
                        }}
                      >
                        Region{" "}
                        {detected.bbox.x},{" "}
                        {detected.bbox.y}
                        {" · "}
                        {detected.bbox.width} ×{" "}
                        {detected.bbox.height}px
                        {" · "}
                        {detected.pixel_count.toLocaleString()}{" "}
                        pixels
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4>DETECTED REGIONS</h4>

            {result.detections.length === 0 ? (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  background:
                    "rgba(15,23,42,.65)",
                  opacity: 0.75,
                }}
              >
                No anomaly regions detected for
                this input.
              </div>
            ) : (
              result.detections.map(
                (detection, index) => (
                  <div
                    key={`${detection.class_id}-${index}`}
                    style={{
                      display: "grid",
                      gap: "7px",
                      padding: "14px",
                      marginBottom: "8px",
                      borderRadius: "10px",
                      background:
                        "rgba(15,23,42,.65)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                      }}
                    >
                      <strong>
                        {detection.class_name}
                      </strong>

                      <strong>
                        {(
                          detection.confidence * 100
                        ).toFixed(1)}
                        %
                      </strong>
                    </div>

                    <small>
                      Bounding region:{" "}
                      {detection.bbox.width} ×{" "}
                      {detection.bbox.height}px
                    </small>

                    <small>
                      Position: X{" "}
                      {detection.bbox.x}, Y{" "}
                      {detection.bbox.y}
                    </small>

                    <small>
                      Segmented pixels:{" "}
                      {detection.pixel_count.toLocaleString()}
                    </small>
                  </div>
                )
              )
            )}
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background:
                "rgba(15,23,42,.5)",
              fontSize: "13px",
              opacity: 0.7,
            }}
          >
            <strong>REAL AI:</strong>{" "}
            {result.model} · Multi-class U-Net
            inference · 4 anomaly categories.
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div>
      <small>{label}</small>

      <strong
        style={{
          display: "block",
          fontSize: "20px",
          marginTop: "4px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

import { useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  ScanLine,
  WandSparkles,
  RotateCw,
  FlipHorizontal,
  SunMedium,
  Contrast,
  CheckCircle2,
  LoaderCircle,
  FileImage,
} from "lucide-react";

type ProcessedImage = {
  title: string;
  description: string;
  url: string;
};

type AugmentedImage = {
  title: string;
  url: string;
};



export default function SonarLaboratory() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [original, setOriginal] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState<ProcessedImage[]>([]);
  const [augmented, setAugmented] = useState<AugmentedImage[]>([]);
  const [activeStage, setActiveStage] = useState("Upload");

  const [cnnSource, setCnnSource] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const [cnnRunning, setCnnRunning] = useState(false);
  const [cnnResult, setCnnResult] = useState<{
    model: string;
    detections: Array<{
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
    }>;
  } | null>(null);
  const [cnnError, setCnnError] = useState("");
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a sonar image.");
      return;
    }

    const url = URL.createObjectURL(file);

    setFileName(file.name);
    setOriginal(url);
    setProcessed([]);
    setAugmented([]);
    setCnnSource({
      title: "Original Sonar Image",
      url,
    });
    setCnnResult(null);
    setCnnError("");
    setAiAnalysisComplete(false);
    setActiveStage("Upload");
  };

  const runCNN = async () => {
    if (!cnnSource?.url && !original) {
      alert("Upload a sonar image first.");
      return;
    }

    setCnnRunning(true);
    setCnnError("");
    setActiveStage("AI Detection");

    try {
      const sourceUrl = cnnSource?.url || original;

      if (!sourceUrl) {
        throw new Error("No sonar image available.");
      }

      const response = await fetch(sourceUrl);

      if (!response.ok) {
        throw new Error("Unable to read the selected sonar image.");
      }

      const blob = await response.blob();

      const formData = new FormData();

      formData.append(
        "file",
        new File([blob], fileName || "sonar-image.png", {
          type: blob.type || "image/png",
        })
      );

      const apiResponse = await fetch(
        "http://127.0.0.1:8001/infer",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();

        throw new Error(
          `AI inference service error ${apiResponse.status}: ${errorText}`
        );
      }

      const result = await apiResponse.json();

      if (result.status !== "success") {
        throw new Error(
          result.message ||
            "The AI inference service did not return a successful result."
        );
      }

      setCnnResult({
        model:
          result.model ||
          "BlueSentinel Multi-Class U-Net",
        detections: Array.isArray(result.result?.detections)
          ? result.result.detections
          : [],
      });

      setAiAnalysisComplete(true);
    } catch (error) {
      setCnnError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the BlueSentinel AI inference service."
      );

      setAiAnalysisComplete(false);
    } finally {
      setCnnRunning(false);
    }
  };

  const runPreprocessing = async () => {
    if (!original) {
      alert("Upload a sonar image first.");
      return;
    }

    setProcessing(true);
    setActiveStage("Preprocessing");

    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    const img = await loadImage(original);

    const stages: ProcessedImage[] = [
      {
        title: "Resized",
        description: "Standardized sonar dimensions",
        url: processImage(img, "resize"),
      },
      {
        title: "Grayscale",
        description: "Converted sonar intensity information",
        url: processImage(img, "grayscale"),
      },
      {
        title: "Denoised",
        description: "Reduced high-frequency sonar noise",
        url: processImage(img, "denoise"),
      },
      {
        title: "Contrast Enhanced",
        description: "Improved seabed and target visibility",
        url: processImage(img, "contrast"),
      },
    ];

    setProcessed(stages);
    setProcessing(false);
  };

  const runAugmentation = async () => {
    if (!original) {
      alert("Upload a sonar image first.");
      return;
    }

    setProcessing(true);
    setActiveStage("Augmentation");

    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    const img = await loadImage(original);

    const results: AugmentedImage[] = [
      {
        title: "Horizontal Flip",
        url: processImage(img, "flip"),
      },
      {
        title: "Rotation +12°",
        url: processImage(img, "rotate"),
      },
      {
        title: "Brightness Variation",
        url: processImage(img, "brightness"),
      },
      {
        title: "Contrast Variation",
        url: processImage(img, "contrastStrong"),
      },
    ];

    setAugmented(results);
    setProcessing(false);
  };

  return (
    <div className="sonar-lab-page">
      <div className="lab-header">
        <div className="lab-title-row">
          <div className="lab-title-icon">
            <ScanLine />
          </div>

          <div>
            <span className="lab-eyebrow">
              SONAR LABORATORY
            </span>

            <h1>Sonar Image Processing</h1>

            <p>
              Upload, preprocess and augment side-scan sonar
              imagery before AI analysis.
            </p>
          </div>
        </div>

        <div className="lab-status">
          <span />
          AI PROCESSING ENGINE READY
        </div>
      </div>

      <div className="pipeline">
        <PipelineStep
          number="01"
          title="Upload"
          active={activeStage === "Upload"}
          complete={!!original}
        />

        <div className="pipeline-line" />

        <PipelineStep
          number="02"
          title="Preprocessing"
          active={activeStage === "Preprocessing"}
          complete={processed.length > 0}
        />

        <div className="pipeline-line" />

        <PipelineStep
          number="03"
          title="Augmentation"
          active={activeStage === "Augmentation"}
          complete={augmented.length > 0}
        />

        <div className="pipeline-line" />

        <PipelineStep
          number="04"
          title="Anomaly Detection"
          active={activeStage === "AI Detection"}
          complete={aiAnalysisComplete}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            handleFile(file);
          }
        }}
      />

      <section className="lab-grid">
        <div className="lab-main">

          <section className="lab-panel upload-panel">
            <PanelHeading
              icon={<Upload />}
              title="01 / SONAR IMAGE UPLOAD"
              description="Input side-scan sonar imagery"
            />

            {!original ? (
              <button
                className="upload-zone"
                onClick={openFilePicker}
              >
                <div className="upload-icon">
                  <Upload />
                </div>

                <strong>Upload Sonar Image</strong>

                <span>
                  Drag & drop or click to select
                </span>

                <small>
                  PNG, JPG, JPEG or WEBP
                </small>
              </button>
            ) : (
              <div className="original-preview">
                <div className="image-card-header">
                  <div>
                    <FileImage size={17} />
                    <strong>
                      Original Sonar Image
                    </strong>
                  </div>

                  <button onClick={openFilePicker}>
                    Replace
                  </button>
                </div>

                <div className="sonar-image-wrapper">
                  <img
                    src={original}
                    alt="Original sonar"
                  />

                  <div className="image-overlay">
                    ORIGINAL
                  </div>
                </div>

                <div className="file-details">
                  <span>
                    <ImageIcon size={14} />
                    {fileName}
                  </span>

                  <span>INPUT</span>
                </div>
              </div>
            )}
          </section>

          <section className="lab-panel">
            <PanelHeading
              icon={<ScanLine />}
              title="02 / PREPROCESSING PIPELINE"
              description="Prepare sonar imagery for AI"
            />

            <div className="methodology-grid">
              <MethodCard
                number="01"
                icon={<ScanLine />}
                title="Resize"
                description="Standardize image dimensions"
              />

              <MethodCard
                number="02"
                icon={<Contrast />}
                title="Grayscale"
                description="Preserve sonar intensity"
              />

              <MethodCard
                number="03"
                icon={<WandSparkles />}
                title="Denoising"
                description="Reduce sonar noise"
              />

              <MethodCard
                number="04"
                icon={<Contrast />}
                title="Contrast"
                description="Enhance target visibility"
              />
            </div>

            <button
              className="lab-primary-button"
              onClick={runPreprocessing}
              disabled={!original || processing}
            >
              {processing &&
              activeStage === "Preprocessing" ? (
                <LoaderCircle className="spin" />
              ) : (
                <ScanLine />
              )}

              Run Preprocessing
            </button>
          </section>

          {processed.length > 0 && (
            <section className="lab-panel">
              <PanelHeading
                icon={<CheckCircle2 />}
                title="03 / PREPROCESSING RESULTS"
                description="Transformation stages generated from the uploaded image"
              />

              <div className="processed-grid">
                {processed.map((item) => (
                  <div
                    className="processed-card"
                    key={item.title}
                  >
                    <div className="processed-image">
                      <img
                        src={item.url}
                        alt={item.title}
                      />
                    </div>

                    <div className="processed-info">
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="lab-panel">
            <PanelHeading
              icon={<WandSparkles />}
              title="04 / DATA AUGMENTATION"
              description="Generate varied training examples"
            />

            <div className="augmentation-methods">
              <MethodChip
                icon={<FlipHorizontal />}
                text="Horizontal Flip"
              />

              <MethodChip
                icon={<RotateCw />}
                text="Rotation"
              />

              <MethodChip
                icon={<SunMedium />}
                text="Brightness"
              />

              <MethodChip
                icon={<Contrast />}
                text="Contrast"
              />
            </div>

            <button
              className="lab-secondary-button"
              onClick={runAugmentation}
              disabled={!original || processing}
            >
              {processing &&
              activeStage === "Augmentation" ? (
                <LoaderCircle className="spin" />
              ) : (
                <WandSparkles />
              )}

              Generate Augmented Images
            </button>

            {augmented.length > 0 && (
              <div className="augmented-grid">
                {augmented.map((item) => (
                  <div
                    className="augmented-card"
                    key={item.title}
                  >
                    <div className="augmented-image">
                      <img
                        src={item.url}
                        alt={item.title}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setCnnSource({
                            title: item.title,
                            url: item.url,
                          })
                        }
                        style={{
                          marginTop: "8px",
                          width: "100%",
                        }}
                      >
                        {cnnSource?.url === item.url
                          ? "✓ SELECTED FOR AI"
                          : "USE FOR AI"}
                      </button>
                    </div>

                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        Training variation
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            className="lab-panel"
            style={{ marginBottom: "20px" }}
          >
            <PanelHeading
              icon={<ScanLine />}
              title="05 / AI ANOMALY DETECTION"
              description="Run the trained BlueSentinel multi-class U-Net on the selected sonar image"
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              {[
                "Submarine Pipeline",
                "Shipwreck",
                "Ghost Net",
                "Mine / Cylinder",
              ].map((name) => (
                <div
                  key={name}
                  style={{
                    padding: "12px 14px",
                    border:
                      "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                  }}
                >
                  <strong>{name}</strong>
                  <small
                    style={{
                      display: "block",
                      marginTop: "4px",
                    }}
                  >
                    Detection class
                  </small>
                </div>
              ))}
            </div>

            <button
              className="lab-primary-button"
              onClick={runCNN}
              disabled={cnnRunning || !original}
              style={{
                width: "100%",
                opacity:
                  cnnRunning || !original ? 0.6 : 1,
              }}
            >
              {cnnRunning ? (
                <>
                  <LoaderCircle className="spin" />
                  Running Multi-Class U-Net...
                </>
              ) : (
                <>
                  <ScanLine />
                  Run AI Detection
                </>
              )}
            </button>

            {cnnError && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "14px",
                  borderRadius: "10px",
                  border:
                    "1px solid rgba(255,80,80,0.25)",
                }}
              >
                <strong>AI INFERENCE ERROR</strong>

                <p>{cnnError}</p>
              </div>
            )}

            {cnnResult && (
          <div
            className="ai-result-panel"
            style={{
              marginTop: "20px",
              display: "grid",
              gap: "18px",
            }}
          >
            <div className="ai-result-header">
              <div>
                <span className="lab-eyebrow">REAL MODEL RESULT</span>
                <h3>{cnnResult.model}</h3>
                <small>{fileName || "Selected sonar image"}</small>
              </div>

              <div className="ai-live-badge">
                ● REAL INFERENCE
              </div>
            </div>

            <div className="ai-metrics-grid">
              <div className="ai-metric">
                <span>DETECTED REGIONS</span>
                <strong>{cnnResult.detections?.length ?? 0}</strong>
              </div>

              <div className="ai-metric">
                <span>ANOMALY CLASSES</span>
                <strong>4</strong>
              </div>

              <div className="ai-metric">
                <span>HIGHEST CONFIDENCE</span>
                <strong>
                  {cnnResult.detections?.length
                    ? `${(
                        Math.max(
                          ...cnnResult.detections.map(
                            (d: any) => d.confidence
                          )
                        ) * 100
                      ).toFixed(1)}%`
                    : "—"}
                </strong>
              </div>
            </div>

            <div>
              <h4>DETECTION CLASSES</h4>

              <div className="ai-class-grid">
                {[
                  "Submarine Pipeline",
                  "Shipwreck",
                  "Ghost Net",
                  "Mine / Cylinder",
                ].map((className) => {
                  const detection = cnnResult.detections?.find(
                    (d: any) => d.class_name === className
                  );

                  return (
                    <div
                      className={`ai-class-card ${
                        detection ? "detected" : ""
                      }`}
                      key={className}
                    >
                      <div>
                        <strong>{className}</strong>
                        <small>
                          {detection
                            ? "Detected by model"
                            : "No region detected"}
                        </small>
                      </div>

                      <strong>
                        {detection
                          ? `${(
                              detection.confidence * 100
                            ).toFixed(1)}%`
                          : "—"}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {cnnResult.detections?.length ? (
              <div>
                <h4>DETECTED REGIONS</h4>

                <div className="ai-detection-list">
                  {cnnResult.detections.map(
                    (detection: any, index: number) => (
                      <div
                        className="ai-detection-row"
                        key={`${detection.class_id}-${index}`}
                      >
                        <div>
                          <strong>{detection.class_name}</strong>
                          <small>
                            Bounding region:{" "}
                            {detection.bbox?.width ?? 0} ×{" "}
                            {detection.bbox?.height ?? 0}px
                            {" · "}
                            X {detection.bbox?.x ?? 0}, Y{" "}
                            {detection.bbox?.y ?? 0}
                          </small>
                        </div>

                        <div className="ai-confidence">
                          {(
                            detection.confidence * 100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="ai-empty-state">
                <strong>No anomaly region detected</strong>
                <span>
                  The trained model did not produce a segmented
                  foreground region for this input. This is a real
                  model result, not a simulated value.
                </span>
              </div>
            )}

            <div className="ai-result-footnote">
              <strong>MODEL:</strong>{" "}
              BlueSentinel Multi-Class U-Net · PyTorch · 4 anomaly
              categories
            </div>
          </div>
        )}
          </section>
        </div>

        <aside className="lab-side">
          <section className="lab-panel methodology-panel">
            <PanelHeading
              icon={<ScanLine />}
              title="METHODOLOGY"
              description="Current processing stage"
            />

            <MethodologyStatus
              number="01"
              title="Sonar Input"
              status={
                original ? "Complete" : "Waiting"
              }
              active={!!original}
            />

            <MethodologyStatus
              number="02"
              title="Preprocessing"
              status={
                processed.length
                  ? "Complete"
                  : "Waiting"
              }
              active={processed.length > 0}
            />

            <MethodologyStatus
              number="03"
              title="Augmentation"
              status={
                augmented.length
                  ? "Complete"
                  : "Waiting"
              }
              active={augmented.length > 0}
            />

            <MethodologyStatus
              number="04"
              title="Multi-Class AI Analysis"
              status={
                aiAnalysisComplete
                  ? "Complete"
                  : "Ready"
              }
              active={aiAnalysisComplete}
            />

            <MethodologyStatus
              number="05"
              title="Anomaly Detection"
              status={
                aiAnalysisComplete
                  ? "Complete"
                  : "Ready"
              }
              active={aiAnalysisComplete}
            />

            <MethodologyStatus
              number="06"
              title="Geospatial Analysis"
              status={
                aiAnalysisComplete
                  ? "Next Stage"
                  : "Upcoming"
              }
              active={false}
            />
          </section>

          <section className="lab-panel explanation-panel">
            <span className="lab-eyebrow">
              WHY THIS MATTERS
            </span>

            <h3>
              Sonar images are not immediately ready for AI.
            </h3>

            <p>
              Side-scan sonar imagery can contain noise,
              shadows and variations in intensity.
              Preprocessing improves the useful visual
              patterns before they reach the AI model.
            </p>

            <div className="explanation-flow">
              <span>RAW</span>
              <b>→</b>
              <span>CLEAN</span>
              <b>→</b>
              <span>AUGMENTED</span>
              <b>→</b>
              <span>AI</span>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}


function PipelineStep({
  number,
  title,
  active,
  complete,
}: {
  number: string;
  title: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`pipeline-step ${
        active ? "active" : ""
      } ${complete ? "complete" : ""}`}
    >
      <div className="pipeline-number">
        {complete ? "✓" : number}
      </div>

      <span>{title}</span>
    </div>
  );
}

function PanelHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="panel-heading">
      <div className="panel-heading-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </div>
  );
}

function MethodCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="method-card">
      <span>{number}</span>

      <div className="method-card-icon">
        {icon}
      </div>

      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function MethodChip({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="method-chip">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function MethodologyStatus({
  number,
  title,
  status,
  active,
}: {
  number: string;
  title: string;
  status: string;
  active: boolean;
}) {
  return (
    <div
      className={`methodology-status ${
        active ? "active" : ""
      }`}
    >
      <div>{number}</div>

      <section>
        <strong>{title}</strong>
        <span>{status}</span>
      </section>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function processImage(
  img: HTMLImageElement,
  mode: string
): string {
  const canvas = document.createElement("canvas");

  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return img.src;
  }

  if (mode === "resize") {
    canvas.width = Math.min(img.width, 1024);
    canvas.height = Math.min(img.height, 1024);
  }

  ctx.filter = "none";

  if (mode === "grayscale") {
    ctx.filter = "grayscale(1)";
  }

  if (mode === "denoise") {
    ctx.filter = "blur(0.7px)";
  }

  if (mode === "contrast") {
    ctx.filter = "contrast(1.25)";
  }

  if (mode === "contrastStrong") {
    ctx.filter = "contrast(1.4)";
  }

  if (mode === "brightness") {
    ctx.filter = "brightness(1.18)";
  }

  if (mode === "flip") {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  if (mode === "rotate") {
    const angle = 12 * Math.PI / 180;

    canvas.width =
      Math.abs(img.width * Math.cos(angle)) +
      Math.abs(img.height * Math.sin(angle));

    canvas.height =
      Math.abs(img.width * Math.sin(angle)) +
      Math.abs(img.height * Math.cos(angle));

    ctx.translate(
      canvas.width / 2,
      canvas.height / 2
    );

    ctx.rotate(angle);

    ctx.translate(
      -img.width / 2,
      -img.height / 2
    );
  }

  ctx.drawImage(img, 0, 0);

  return canvas.toDataURL("image/png");
}

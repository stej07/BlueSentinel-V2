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

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a sonar image.");
      return;
    }

    setFileName(file.name);
    setOriginal(URL.createObjectURL(file));
    setProcessed([]);
    setAugmented([]);
    setActiveStage("Upload");
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const runPreprocessing = async () => {
    if (!original) {
      alert("Upload a sonar image first.");
      return;
    }

    setProcessing(true);
    setActiveStage("Preprocessing");

    await new Promise((resolve) => setTimeout(resolve, 700));

    const img = await loadImage(original);

    const stages: ProcessedImage[] = [];

    stages.push({
      title: "Resized",
      description: "Standardized sonar dimensions",
      url: processImage(img, "resize"),
    });

    stages.push({
      title: "Grayscale",
      description: "Converted sonar intensity information",
      url: processImage(img, "grayscale"),
    });

    stages.push({
      title: "Denoised",
      description: "Reduced high-frequency sonar noise",
      url: processImage(img, "denoise"),
    });

    stages.push({
      title: "Contrast Enhanced",
      description: "Improved seabed and target visibility",
      url: processImage(img, "contrast"),
    });

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

    await new Promise((resolve) => setTimeout(resolve, 700));

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
        <div>
          <div className="lab-title-row">
            <div className="lab-title-icon">
              <ScanLine />
            </div>

            <div>
              <span className="lab-eyebrow">SONAR LABORATORY</span>
              <h1>Sonar Image Processing</h1>
              <p>
                Upload, preprocess and augment side-scan sonar imagery before
                AI analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="lab-status">
          <span />
          PROCESSING ENGINE READY
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
          title="CNN Ready"
          active={false}
          complete={false}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
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
              <button className="upload-zone" onClick={openFilePicker}>
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
                    <strong>Original Sonar Image</strong>
                  </div>

                  <button onClick={openFilePicker}>
                    Replace
                  </button>
                </div>

                <div className="sonar-image-wrapper">
                  <img src={original} alt="Original sonar" />
                  <div className="image-overlay">
                    ORIGINAL
                  </div>
                </div>

                <div className="file-details">
                  <span>
                    <ImageIcon size={14} />
                    {fileName}
                  </span>

                  <span>
                    INPUT
                  </span>
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
              {processing && activeStage === "Preprocessing" ? (
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
                  <div className="processed-card" key={item.title}>
                    <div className="processed-image">
                      <img src={item.url} alt={item.title} />
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
              <MethodChip icon={<FlipHorizontal />} text="Horizontal Flip" />
              <MethodChip icon={<RotateCw />} text="Rotation" />
              <MethodChip icon={<SunMedium />} text="Brightness" />
              <MethodChip icon={<Contrast />} text="Contrast" />
            </div>

            <button
              className="lab-secondary-button"
              onClick={runAugmentation}
              disabled={!original || processing}
            >
              {processing && activeStage === "Augmentation" ? (
                <LoaderCircle className="spin" />
              ) : (
                <WandSparkles />
              )}

              Generate Augmented Images
            </button>

            {augmented.length > 0 && (
              <div className="augmented-grid">
                {augmented.map((item) => (
                  <div className="augmented-card" key={item.title}>
                    <div className="augmented-image">
                      <img src={item.url} alt={item.title} />
                    </div>

                    <div>
                      <strong>{item.title}</strong>
                      <span>Training variation</span>
                    </div>
                  </div>
                ))}
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
              status={original ? "Complete" : "Waiting"}
              active={!!original}
            />

            <MethodologyStatus
              number="02"
              title="Preprocessing"
              status={processed.length ? "Complete" : "Waiting"}
              active={processed.length > 0}
            />

            <MethodologyStatus
              number="03"
              title="Augmentation"
              status={augmented.length ? "Complete" : "Waiting"}
              active={augmented.length > 0}
            />

            <MethodologyStatus
              number="04"
              title="CNN Training"
              status="Next Stage"
              active={false}
            />

            <MethodologyStatus
              number="05"
              title="AI Detection"
              status="Upcoming"
              active={false}
            />

            <MethodologyStatus
              number="06"
              title="Geolocation"
              status="Upcoming"
              active={false}
            />
          </section>

          <section className="lab-panel explanation-panel">
            <span className="lab-eyebrow">WHY THIS MATTERS</span>

            <h3>Sonar images are not immediately ready for AI.</h3>

            <p>
              Side-scan sonar imagery can contain noise, shadows and variations
              in intensity. Preprocessing improves the useful visual patterns
              before they reach the CNN.
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
    <div className={`pipeline-step ${active ? "active" : ""} ${complete ? "complete" : ""}`}>
      <div>{complete ? <CheckCircle2 size={17} /> : number}</div>
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
    <div className="lab-panel-heading">
      <div className="lab-panel-icon">{icon}</div>

      <div>
        <h2>{title}</h2>
        <p>{description}</p>
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
      <div className="method-icon">{icon}</div>
      <strong>{title}</strong>
      <small>{description}</small>
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
    <div className={`methodology-status ${active ? "active" : ""}`}>
      <div>{number}</div>

      <span>{title}</span>

      <small>{status}</small>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;

    image.src = src;
  });
}

function processImage(
  image: HTMLImageElement,
  mode:
    | "resize"
    | "grayscale"
    | "denoise"
    | "contrast"
    | "flip"
    | "rotate"
    | "brightness"
    | "contrastStrong"
): string {
  const canvas = document.createElement("canvas");

  const maxWidth = 900;
  const scale = Math.min(1, maxWidth / image.width);

  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const ctx = canvas.getContext("2d");

  if (!ctx) return image.src;

  if (mode === "flip") {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  if (mode === "rotate") {
    canvas.width = Math.max(1, Math.round(image.height * scale));
    canvas.height = Math.max(1, Math.round(image.width * scale));

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((12 * Math.PI) / 180);
    ctx.translate(-canvas.height / 2, -canvas.width / 2);
  }

  if (mode === "brightness") {
    ctx.filter = "brightness(1.3)";
  }

  if (mode === "contrast") {
    ctx.filter = "contrast(1.35)";
  }

  if (mode === "contrastStrong") {
    ctx.filter = "contrast(1.55)";
  }

  ctx.drawImage(
    image,
    0,
    0,
    mode === "rotate" ? canvas.height : canvas.width,
    mode === "rotate" ? canvas.width : canvas.height
  );

  if (
    mode === "grayscale" ||
    mode === "denoise" ||
    mode === "resize"
  ) {
    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (mode === "grayscale") {
        const gray =
          0.299 * data[i] +
          0.587 * data[i + 1] +
          0.114 * data[i + 2];

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      if (mode === "denoise") {
        const avg =
          (data[i] + data[i + 1] + data[i + 2]) / 3;

        data[i] = avg * 0.88;
        data[i + 1] = avg * 0.96;
        data[i + 2] = avg;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  return canvas.toDataURL("image/jpeg", 0.9);
}

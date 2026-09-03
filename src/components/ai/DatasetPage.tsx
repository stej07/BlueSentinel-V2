import {
  Database,
  Image,
  Layers,
  ShieldCheck,
  Target,
} from "lucide-react";

export default function DatasetPage() {
  return (
    <div className="module-page dataset-page">

      <div className="module-icon">
        <Database size={40} />
      </div>

      <span>AI LABORATORY</span>

      <h1>DATASET</h1>

      <p>
        AI4Shipwrecks side-scan sonar dataset with expert segmentation
        masks. Dataset statistics shown here are based on the files
        currently available to the BlueSentinel AI pipeline.
      </p>

      <div className="dataset-grid">

        <div className="dataset-card">
          <Database size={24} />
          <span>DATASET</span>
          <strong>AI4Shipwrecks</strong>
        </div>

        <div className="dataset-card">
          <Image size={24} />
          <span>TRAINING IMAGES</span>
          <strong>141</strong>
        </div>

        <div className="dataset-card">
          <Image size={24} />
          <span>TEST IMAGES</span>
          <strong>120</strong>
        </div>

        <div className="dataset-card">
          <Layers size={24} />
          <span>LABEL MASKS</span>
          <strong>261</strong>
        </div>

      </div>

      <div className="dataset-analysis">

        <div className="analysis-card">
          <div className="analysis-header">
            <Target size={21} />
            <h3>GROUND-TRUTH LABELS</h3>
          </div>

          <div className="label-row">
            <span>
              <i className="label-dot background" />
              Background
            </span>
            <strong>98.77%</strong>
          </div>

          <div className="progress">
            <span style={{ width: "98.77%" }} />
          </div>

          <div className="label-row">
            <span>
              <i className="label-dot shipwreck" />
              Shipwreck
            </span>
            <strong>1.23%</strong>
          </div>

          <div className="progress">
            <span style={{ width: "1.23%" }} />
          </div>

        </div>

        <div className="analysis-card">

          <div className="analysis-header">
            <ShieldCheck size={21} />
            <h3>DATASET STATUS</h3>
          </div>

          <div className="status-line">
            <span>Image / label pairing</span>
            <strong>VERIFIED</strong>
          </div>

          <div className="status-line">
            <span>Training split</span>
            <strong>141</strong>
          </div>

          <div className="status-line">
            <span>Testing split</span>
            <strong>120</strong>
          </div>

          <div className="status-line">
            <span>Other label values</span>
            <strong>0</strong>
          </div>

        </div>

      </div>

      <div className="dataset-note">
        <ShieldCheck size={18} />
        <span>
          Ground-truth distribution is highly imbalanced. The CNN training
          stage will account for this instead of relying on raw pixel
          accuracy alone.
        </span>
      </div>

    </div>
  );
}

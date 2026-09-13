import {
  BrainCircuit,
  Database,
  Layers3,
  Activity,
  Target,
  BarChart3,
  ShieldCheck,
  Cpu,
  GitBranch,
  ScanLine,
  CircleCheck,
} from "lucide-react";

export default function DatasetPage() {
  return (
    <div className="module-page dataset-page">
      <div className="lab-header">
        <div>
          <div className="lab-title-row">
            <div className="lab-title-icon">
              <BrainCircuit />
            </div>
            <div>
              <span className="lab-eyebrow">AI LABORATORY</span>
              <h1>Marine Anomaly Intelligence</h1>
              <p>
                Dataset management, CNN architecture, training and evaluation
                workspace for underwater sonar analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="lab-status">
          <span />
          AI PIPELINE READY
        </div>
      </div>

      <div className="ai-overview-grid">
        <div className="ai-stat-card">
          <Database />
          <span>DATASET</span>
          <strong>Side-Scan Sonar</strong>
          <small>Annotated imagery</small>
        </div>

        <div className="ai-stat-card">
          <Layers3 />
          <span>MODEL TYPE</span>
          <strong>CNN / U-Net</strong>
          <small>Image segmentation</small>
        </div>

        <div className="ai-stat-card">
          <Cpu />
          <span>FRAMEWORK</span>
          <strong>PyTorch</strong>
          <small>Deep learning engine</small>
        </div>

        <div className="ai-stat-card">
          <Activity />
          <span>INFERENCE</span>
          <strong>READY</strong>
          <small>Analysis service</small>
        </div>
      </div>

      <div className="ai-workspace-grid">
        <section className="lab-panel">
          <div className="analysis-header">
            <Database size={21} />
            <div>
              <span className="lab-eyebrow">DATA PIPELINE</span>
              <h3>Dataset Workspace</h3>
            </div>
          </div>

          <div className="ai-pipeline">
            <PipelineItem
              number="01"
              icon={<Database />}
              title="Dataset"
              text="Sonar imagery and annotations"
            />
            <div className="ai-pipeline-line" />
            <PipelineItem
              number="02"
              icon={<Target />}
              title="Labels"
              text="Target regions and classes"
            />
            <div className="ai-pipeline-line" />
            <PipelineItem
              number="03"
              icon={<BrainCircuit />}
              title="CNN"
              text="Feature extraction and prediction"
            />
            <div className="ai-pipeline-line" />
            <PipelineItem
              number="04"
              icon={<ScanLine />}
              title="Detection"
              text="Anomaly regions and confidence"
            />
          </div>
        </section>

        <section className="lab-panel">
          <div className="analysis-header">
            <GitBranch size={21} />
            <div>
              <span className="lab-eyebrow">MODEL WORKFLOW</span>
              <h3>Training Lifecycle</h3>
            </div>
          </div>

          <div className="workflow-list">
            <WorkflowRow
              icon={<Database />}
              title="Training Dataset"
              status="CONFIGURED"
            />
            <WorkflowRow
              icon={<BrainCircuit />}
              title="CNN Training"
              status="READY"
            />
            <WorkflowRow
              icon={<BarChart3 />}
              title="Model Evaluation"
              status="READY"
            />
            <WorkflowRow
              icon={<ShieldCheck />}
              title="Held-out Validation"
              status="REQUIRED"
            />
          </div>
        </section>
      </div>

      <div className="ai-section-title">
        <div>
          <span className="lab-eyebrow">ANOMALY TAXONOMY</span>
          <h2>Detection Classes</h2>
        </div>
        <span className="taxonomy-note">MODEL-DEPENDENT</span>
      </div>

      <div className="class-grid">
        <ClassCard title="Shipwreck" icon={<ScanLine />} />
        <ClassCard title="Submarine Pipeline" icon={<GitBranch />} />
        <ClassCard title="Ghost Net" icon={<Layers3 />} />
        <ClassCard title="Mine / Cylinder" icon={<Target />} />
        <ClassCard title="Mine / Cylinder" icon={<Database />} />
      </div>

      <div className="ai-bottom-grid">
        <section className="lab-panel evaluation-panel">
          <div className="analysis-header">
            <BarChart3 size={21} />
            <div>
              <span className="lab-eyebrow">MODEL EVALUATION</span>
              <h3>Evaluation Metrics</h3>
            </div>
          </div>

          <div className="metric-grid">
            <Metric label="Precision" value="—" />
            <Metric label="Recall" value="—" />
            <Metric label="F1 Score" value="—" />
            <Metric label="IoU / Dice" value="—" />
          </div>

          <div className="evaluation-note">
            <ShieldCheck size={17} />
            <span>
              Metrics will be populated from the trained model and held-out
              evaluation data.
            </span>
          </div>
        </section>

        <section className="lab-panel readiness-panel">
          <div className="analysis-header">
            <CircleCheck size={21} />
            <div>
              <span className="lab-eyebrow">DEPLOYMENT READINESS</span>
              <h3>AI System Checklist</h3>
            </div>
          </div>

          <Checklist text="Dataset pipeline" />
          <Checklist text="CNN architecture" />
          <Checklist text="Training pipeline" />
          <Checklist text="Evaluation pipeline" />
          <Checklist text="API inference integration" />
        </section>
      </div>
    </div>
  );
}

function PipelineItem({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="ai-pipeline-item">
      <span className="pipeline-number">{number}</span>
      <div className="pipeline-icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
    </div>
  );
}

function WorkflowRow({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
}) {
  return (
    <div className="workflow-row">
      {icon}
      <strong>{title}</strong>
      <span>{status}</span>
    </div>
  );
}

function ClassCard({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="class-card">
      <div>{icon}</div>
      <strong>{title}</strong>
      <small>AI anomaly class</small>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Checklist({ text }: { text: string }) {
  return (
    <div className="checklist-row">
      <CircleCheck size={17} />
      <span>{text}</span>
      <small>PIPELINE</small>
    </div>
  );
}

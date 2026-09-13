import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Database,
  FileText,
  Globe2,
  Map,
  MapPin,
  Menu,
  Radar,
  Route,
  ScanLine,
  Search,
  ShieldCheck,
  Ship,
  Upload,
  Waves,
  X,
} from "lucide-react";
import "./index.css";
import SonarLaboratory from "./components/sonar/SonarLaboratory";
import DatasetPage from "./components/ai/DatasetPage";
import { OperationsModules } from "./components/modules/OperationsModules";


type Detection = {
  type: string;
  confidence: number;
  time: string;
  scan: string;
  className: string;
};

const demoDetections: Detection[] = [
  {
    type: "Ghost Net",
    confidence: 92.1,
    time: "10:42:18",
    scan: "SONAR-1042",
    className: "ghost-net",
  },
  {
    type: "Shipwreck",
    confidence: 88.7,
    time: "10:45:31",
    scan: "SONAR-1045",
    className: "shipwreck",
  },
  {
    type: "Pipe",
    confidence: 81.3,
    time: "10:49:07",
    scan: "SONAR-1049",
    className: "pipe",
  },
  {
    type: "Anomaly",
    confidence: 74.2,
    time: "10:53:44",
    scan: "SONAR-1053",
    className: "anomaly",
  },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDetection, setSelectedDetection] =
    useState<Detection | null>(null);

  const [openSections, setOpenSections] = useState({
    sonar: true,
    ai: true,
    geo: true,
  });

  const [activePage, setActivePage] = useState("Dashboard");
  const [demoMode, setDemoMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [demoTime, setDemoTime] = useState(() => {    const now = new Date();    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
      if (demoMode) {
        setDemoTime((time) => (time + 1) % (24 * 60 * 60));
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [demoMode]);

  const toggleSection = (name: keyof typeof openSections) => {
    setOpenSections((current) => ({
      ...current,
      [name]: !current[name],
    }));
  };

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="brand">
          <div className="brand-logo">
            <Waves size={30} />
            <Ship className="brand-ship" size={17} />
          </div>

          {sidebarOpen && (
            <div className="brand-text">
              <h1>BlueSentinel</h1>
              <p>AI Powered Marine Anomaly Detection</p>
              <p>& Anomaly Detection</p>
            </div>
          )}
        </div>

        <div className="sidebar-content">
          <NavButton
            icon={<Activity />}
            label="Dashboard"
            active={activePage === "Dashboard"}
            collapsed={!sidebarOpen}
            onClick={() => setActivePage("Dashboard")}
          />

          <Section
            title="Sonar Laboratory"
            icon={<Radar />}
            open={openSections.sonar}
            collapsed={!sidebarOpen}
            onToggle={() => toggleSection("sonar")}
          >
            <SubButton
              icon={<Upload />}
              label="Upload Sonar"
              onClick={() => setActivePage("Upload Sonar")}
            />
            <SubButton
              icon={<ScanLine />}
              label="Preprocessing"
              onClick={() => setActivePage("Preprocessing")}
            />
            <SubButton
              icon={<BarChart3 />}
              label="Augmentation"
              onClick={() => setActivePage("Augmentation")}
            />
          </Section>

          <Section
            title="AI Laboratory"
            icon={<BrainCircuit />}
            open={openSections.ai}
            collapsed={!sidebarOpen}
            onToggle={() => toggleSection("ai")}
          >
            <SubButton
              icon={<Database />}
              label="Dataset"
              onClick={() => setActivePage("Dataset")}
            />
            <SubButton
              icon={<BrainCircuit />}
              label="CNN Training"
              onClick={() => setActivePage("CNN Training")}
            />
            <SubButton
              icon={<BarChart3 />}
              label="Model Evaluation"
              onClick={() => setActivePage("Model Evaluation")}
            />
            <SubButton
              icon={<Search />}
              label="Detection"
              onClick={() => setActivePage("Detection")}
            />
          </Section>

          <Section
            title="Geospatial"
            icon={<Globe2 />}
            open={openSections.geo}
            collapsed={!sidebarOpen}
            onToggle={() => toggleSection("geo")}
          >
            <SubButton
              icon={<MapPin />}
              label="Location"
              onClick={() => setActivePage("Location")}
            />
            <SubButton
              icon={<Route />}
              label="Survey Track"
              onClick={() => setActivePage("Survey Track")}
            />
            <SubButton
              icon={<Map />}
              label="GIS Map"
              onClick={() => setActivePage("GIS Map")}
            />
          </Section>

          <NavButton
            icon={<FileText />}
            label="Reports"
            active={activePage === "Reports"}
            collapsed={!sidebarOpen}
            onClick={() => setActivePage("Reports")}
          />
        </div>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="underwater-scene">
              <div className="underwater-glow" />
              <Ship size={46} />
              <span className="seaweed s1" />
              <span className="seaweed s2" />
              <span className="seaweed s3" />
            </div>

            <span>BlueSentinel V2.0</span>
          </div>
        )}
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={21} />
          </button>

          <div className="heading">
            <h2>BLUESENTINEL AI DASHBOARD</h2>
            <p>AI-powered underwater sonar analysis and anomaly detection</p>
          </div>

          <div className="operator-area">
            <button
              className={`mode-toggle ${demoMode ? "demo" : "real"}`}
              onClick={() => setDemoMode(!demoMode)}
              title={demoMode ? "Switch to real mode" : "Switch to demo mode"}
            >
              <span className="mode-dot" />
              <span>{demoMode ? "DEMO MODE" : "REAL MODE"}</span>
            </button>

            <div className="survey-unit">
              <Waves size={21} />
              <span>Oceanic Survey Unit</span>
              <ChevronDown size={15} />
            </div>

            <div className="operator">
              <CircleUserRound size={36} />
              <div>
                <strong>Operator</strong>
                <small>Level 2</small>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        {activePage === "Dashboard" ? (
          <Dashboard
            detections={demoMode ? demoDetections : []}
            demoMode={demoMode}
            onDetection={setSelectedDetection}
            currentTime={currentTime}
            demoTime={demoTime}
          />
        ) : activePage === "Upload Sonar" ||
          activePage === "Preprocessing" ||
          activePage === "Augmentation" ? (
          <SonarLaboratory />
        ) : activePage === "Dataset" ? (
          <DatasetPage />
        ) : (
          <ModulePage name={activePage} />
        )}
      </main>

      {selectedDetection && (
        <div
          className="modal-background"
          onClick={() => setSelectedDetection(null)}
        >
          <div className="detection-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedDetection(null)}
            >
              <X size={19} />
            </button>

            <div className={`modal-detection-icon ${selectedDetection.className}`}>
              <ScanLine />
            </div>

            <span className="modal-label">AI DETECTION RESULT</span>

            <h2>{selectedDetection.type}</h2>

            <div className="modal-confidence">
              <span>Confidence Score</span>
              <strong>{selectedDetection.confidence}%</strong>
            </div>

            <div className="confidence-bar">
              <span
                style={{
                  width: `${selectedDetection.confidence}%`,
                }}
              />
            </div>

            <div className="modal-details">
              <div>
                <small>Survey Time</small>
                <strong>{selectedDetection.time}</strong>
              </div>

              <div>
                <small>Source</small>
                <strong>{selectedDetection.scan}</strong>
              </div>

              <div>
                <small>Segmentation</small>
                <strong>Available</strong>
              </div>

              <div>
                <small>Status</small>
                <strong>
                  {selectedDetection.confidence >= 80
                    ? "High Confidence"
                    : "Review Required"}
                </strong>
              </div>
            </div>

            <button className="primary-action">
              <MapPin size={17} />
              View Geospatial Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-button ${active ? "active" : ""}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

function Section({
  title,
  icon,
  open,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="nav-section">
      <button className="nav-button section-button" onClick={onToggle}>
        {icon}
        {!collapsed && <span>{title}</span>}
        {!collapsed &&
          (open ? (
            <ChevronDown className="section-chevron" />
          ) : (
            <ChevronRight className="section-chevron" />
          ))}
      </button>

      {!collapsed && open && <div className="sub-menu">{children}</div>}
    </div>
  );
}

function SubButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="sub-button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Dashboard({
  detections,
  onDetection,
  currentTime,
}: {
  detections: Detection[];
  demoMode?: boolean;
  onDetection: (d: Detection) => void;
  currentTime: Date;
  demoTime?: number;
}) {
  const formatDate = currentTime.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="dashboard">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">UNDERWATER SONAR INTELLIGENCE</span>
          <h1>Analysis Workspace</h1>
          <p>
            Process side-scan sonar imagery, inspect CNN results and review
            detected underwater anomalies.
          </p>
        </div>

        <div className="system-indicator">
          <span className="status-dot" />
          <div>
            <strong>AI SYSTEM ONLINE</strong>
            <small>{formatDate} · IST</small>
          </div>
        </div>
      </section>

      <section className="kpi-grid">
        <KPI
          icon={<Waves />}
          label="SONAR INPUT"
          value="READY"
          text="Awaiting analysis image"
        />
        <KPI
          icon={<ScanLine />}
          label="AI ANALYSIS"
          value={detections.length ? String(detections.length) : "—"}
          text={detections.length ? "Detection results available" : "No analysis results"}
          cyan
        />
        <KPI
          icon={<ShieldCheck />}
          label="MODEL STATUS"
          value="ONLINE"
          text="CNN inference service"
          gold
        />
        <KPI
          icon={<AlertTriangle />}
          label="ANOMALIES"
          value={detections.length ? String(detections.length) : "—"}
          text={detections.length ? "Review detected regions" : "No results available"}
          red
        />
      </section>

      <section className="analysis-workspace">
        <div className="workspace-card pipeline-card">
          <div className="card-header">
            <div>
              <span className="eyebrow">AI PIPELINE</span>
              <h3>Sonar Analysis Flow</h3>
            </div>
            <span className="pipeline-status">READY</span>
          </div>

          <div className="pipeline">
            {[
              ["01", "INPUT", "Sonar Image"],
              ["02", "QUALITY", "Image Check"],
              ["03", "PROCESS", "Preprocessing"],
              ["04", "CNN", "AI Inference"],
              ["05", "RESULTS", "Detection"],
              ["06", "GEO", "Geospatial"],
              ["07", "REPORT", "Evidence"],
            ].map(([number, title, subtitle], index) => (
              <div className="pipeline-group" key={title}>
                <div className="pipeline-step">
                  <span>{number}</span>
                  <strong>{title}</strong>
                  <small>{subtitle}</small>
                </div>
                {index < 6 && <div className="pipeline-line" />}
              </div>
            ))}
          </div>
        </div>

        <div className="workspace-card action-card">
          <span className="eyebrow">START ANALYSIS</span>
          <h3>Upload Sonar Imagery</h3>
          <p>
            Begin a real analysis by providing a side-scan sonar image.
          </p>
          <button
            className="primary-action"
            onClick={() => window.dispatchEvent(new CustomEvent("navigate-page", { detail: "Upload Sonar" }))}
          >
            <Waves size={17} />
            Open Sonar Laboratory
          </button>
        </div>
      </section>

      <section className="results-grid">
        <div className="workspace-card findings-card">
          <div className="card-header">
            <div>
              <span className="eyebrow">AI RESULTS</span>
              <h3>Latest Detection Results</h3>
            </div>
            <span className="result-count">
              {detections.length} result{detections.length === 1 ? "" : "s"}
            </span>
          </div>

          {detections.length === 0 ? (
            <div className="empty-analysis">
              <ScanLine size={32} />
              <strong>No analysis results</strong>
              <p>
                Upload a sonar image to generate CNN detection results.
              </p>
            </div>
          ) : (
            <div className="detection-list">
              {detections.slice(0, 5).map((detection) => (
                <button
                  key={`${detection.type}-${detection.scan}-${detection.confidence}`}
                  className="detection-row"
                  onClick={() => onDetection(detection)}
                >
                  <div className={`detection-icon ${detection.className}`}>
                    <ScanLine size={18} />
                  </div>
                  <div className="detection-info">
                    <strong>{detection.type}</strong>
                    <small>{detection.scan}</small>
                  </div>
                  <strong className="detection-score">
                    {detection.confidence}%
                  </strong>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="workspace-card intelligence-card">
          <span className="eyebrow">DECISION SUPPORT</span>
          <h3>Anomaly Intelligence</h3>

          <div className="intelligence-item">
            <div>
              <small>DETECTION ENGINE</small>
              <strong>CNN / U-Net</strong>
            </div>
            <span className="status-badge">ACTIVE</span>
          </div>

          <div className="intelligence-item">
            <div>
              <small>SEGMENTATION</small>
              <strong>Analysis dependent</strong>
            </div>
            <span className="status-badge neutral">READY</span>
          </div>

          <div className="intelligence-item">
            <div>
              <small>GEOSPATIAL OUTPUT</small>
              <strong>Available after detection</strong>
            </div>
            <span className="status-badge neutral">READY</span>
          </div>

          <div className="intelligence-note">
            <AlertTriangle size={17} />
            <span>
              AI results should be reviewed before operational decisions.
            </span>
          </div>
        </div>
      </section>

      <section className="workspace-card system-card">
        <div className="card-header">
          <div>
            <span className="eyebrow">SYSTEM OVERVIEW</span>
            <h3>BlueSentinel Processing Stack</h3>
          </div>
        </div>

        <div className="system-grid">
          <div>
            <Waves />
            <strong>Sonar Laboratory</strong>
            <small>Input & preprocessing</small>
          </div>
          <div>
            <ScanLine />
            <strong>AI Laboratory</strong>
            <small>CNN training & evaluation</small>
          </div>
          <div>
            <Map />
            <strong>Geospatial</strong>
            <small>Detection mapping</small>
          </div>
          <div>
            <FileText />
            <strong>Reports</strong>
            <small>Analysis evidence</small>
          </div>
        </div>
      </section>
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  unit,
  text,
  cyan,
  gold,
  red,
  aqua,
  purple,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  text: string;
  cyan?: boolean;
  gold?: boolean;
  red?: boolean;
  aqua?: boolean;
  purple?: boolean;
}) {
  const color = cyan
    ? "cyan"
    : gold
      ? "gold"
      : red
        ? "red"
        : aqua
          ? "aqua"
          : purple
            ? "purple"
            : "blue";

  return (
    <div className={`kpi ${color}`}>
      <div className="kpi-icon">{icon}</div>

      <div>
        <span className="kpi-label">{label}</span>

        <div className="kpi-value">
          {value}
          {unit && <small>{unit}</small>}
        </div>

        <span className="kpi-text">{text}</span>
      </div>
    </div>
  );
}



function ModulePage({ name }: { name: string }) {
  return <OperationsModules name={name} />;

}

export default App;

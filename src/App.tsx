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
            onNavigate={setActivePage}
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
  onNavigate,
}: {

  detections: Detection[];
  demoMode?: boolean;
  onDetection: (d: Detection) => void;
  currentTime: Date;
  demoTime?: number;
  onNavigate: (page: string) => void;
}) {
  const formatDate = currentTime.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const detectedTypes = [...new Set(detections.map((d) => d.type))];

  return (
    <div className="dashboard-v2">
      <section className="dashboard-v2-hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="live-pulse" />
            BLUESENTINEL · AI SONAR INTELLIGENCE
          </div>
          <h1>
            Underwater
            <span> Intelligence.</span>
          </h1>
          <p>
            Analyze side-scan sonar imagery with BlueSentinel's
            multi-class CNN/U-Net pipeline and turn acoustic data into
            actionable anomaly intelligence.
          </p>

          <div className="hero-actions">
            <button
              className="hero-primary"
              onClick={() => onNavigate("Upload Sonar")}
            >
              <Waves size={18} />
              Analyze Sonar
              <ChevronRight size={17} />
            </button>

            <div className="hero-meta">
              <span>AI ENGINE</span>
              <strong>U-Net</strong>
            </div>
            <div className="hero-meta">
              <span>CLASSES</span>
              <strong>04</strong>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="sonar-radar">
            <div className="radar-ring radar-ring-1" />
            <div className="radar-ring radar-ring-2" />
            <div className="radar-ring radar-ring-3" />
            <div className="radar-cross horizontal" />
            <div className="radar-cross vertical" />
            <div className="radar-sweep" />
            <div className="radar-point point-a" />
            <div className="radar-point point-b" />
            <div className="radar-center" />
          </div>
          <div className="radar-label">
            <span>SONAR FIELD</span>
            <strong>READY FOR ANALYSIS</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-v2-stats">
        <div className="stat-card">
          <div className="stat-icon"><Waves size={19} /></div>
          <div>
            <span>SONAR INPUT</span>
            <strong>READY</strong>
            <small>Awaiting imagery</small>
          </div>
        </div>

        <div className="stat-card stat-accent">
          <div className="stat-icon"><ScanLine size={19} /></div>
          <div>
            <span>AI ANALYSIS</span>
            <strong>{detections.length || "—"}</strong>
            <small>{detections.length ? "Regions detected" : "No active result"}</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><ShieldCheck size={19} /></div>
          <div>
            <span>MODEL ENGINE</span>
            <strong>ONLINE</strong>
            <small>Multi-class U-Net</small>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon"><AlertTriangle size={19} /></div>
          <div>
            <span>ANOMALIES</span>
            <strong>{detections.length || "—"}</strong>
            <small>{detections.length ? "Requires review" : "No results yet"}</small>
          </div>
        </div>
      </section>

      <section className="dashboard-v2-main">
        <div className="intel-panel">
          <div className="panel-topline">
            <div>
              <span className="section-kicker">AI ANALYSIS PIPELINE</span>
              <h2>From Sonar to Intelligence</h2>
            </div>
            <div className="system-ready">
              <span />
              SYSTEM READY
            </div>
          </div>

          <div className="pipeline-v2">
            {[
              ["01", "INPUT", "Side-scan sonar"],
              ["02", "QUALITY", "Image validation"],
              ["03", "PROCESS", "Preprocessing"],
              ["04", "CNN", "U-Net inference"],
              ["05", "DETECT", "Anomaly regions"],
              ["06", "GEO", "Coordinates"],
              ["07", "REPORT", "Evidence output"],
            ].map(([num, title, sub], index) => (
              <div className="pipeline-v2-item" key={title}>
                <div className="pipeline-v2-node">
                  <span>{num}</span>
                  <strong>{title}</strong>
                  <small>{sub}</small>
                </div>
                {index < 6 && <div className="pipeline-v2-connector" />}
              </div>
            ))}
          </div>

          <div className="coverage-strip">
            <div>
              <span>SUPPORTED ANOMALIES</span>
              <strong>Submarine Pipeline · Shipwreck · Ghost Net · Mine / Cylinder</strong>
            </div>
            <div className="coverage-status">
              <span className="live-pulse" />
              INFERENCE SERVICE ONLINE
            </div>
          </div>
        </div>

        <aside className="system-panel">
          <span className="section-kicker">SYSTEM OVERVIEW</span>
          <h2>Analysis Stack</h2>

          <div className="stack-row">
            <div className="stack-symbol"><ScanLine size={17} /></div>
            <div><span>SONAR LABORATORY</span><strong>INPUT READY</strong></div>
            <i />
          </div>

          <div className="stack-row">
            <div className="stack-symbol"><ShieldCheck size={17} /></div>
            <div><span>AI INFERENCE</span><strong>U-NET ONLINE</strong></div>
            <i />
          </div>

          <div className="stack-row">
            <div className="stack-symbol"><Waves size={17} /></div>
            <div><span>GEOSPATIAL</span><strong>GIS AVAILABLE</strong></div>
            <i />
          </div>

          <div className="stack-row">
            <div className="stack-symbol"><AlertTriangle size={17} /></div>
            <div><span>DETECTION FEED</span><strong>{detections.length ? `${detections.length} ACTIVE` : "STANDBY"}</strong></div>
            <i />
          </div>

          <div className="stack-footer">
            <span>LAST SYSTEM CHECK</span>
            <strong>{formatDate} · IST</strong>
          </div>
        </aside>
      </section>

      <section className="dashboard-v2-bottom">
        <div className="results-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">LIVE INTELLIGENCE</span>
              <h2>Latest Detection Results</h2>
            </div>
            <span className="result-pill">
              {detections.length} RESULT{detections.length === 1 ? "" : "S"}
            </span>
          </div>

          {detections.length === 0 ? (
            <div className="empty-v2">
              <div className="empty-icon"><ScanLine size={25} /></div>
              <div>
                <strong>No sonar analysis yet</strong>
                <p>Upload an image to generate real CNN/U-Net detection results.</p>
              </div>
              <button
                onClick={() => onNavigate("Upload Sonar")}
              >
                Start Analysis <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <div className="detection-grid-v2">
              {detections.slice(0, 6).map((detection) => (
                <button
                  key={`${detection.type}-${detection.scan}-${detection.confidence}`}
                  className="detection-card-v2"
                  onClick={() => onDetection(detection)}
                >
                  <div className={`detection-v2-icon ${detection.className}`}>
                    <ScanLine size={18} />
                  </div>
                  <div className="detection-v2-copy">
                    <strong>{detection.type}</strong>
                    <span>{detection.scan}</span>
                  </div>
                  <div className="detection-v2-score">
                    <strong>{detection.confidence}%</strong>
                    <span>CONFIDENCE</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="decision-panel">
          <span className="section-kicker">DECISION SUPPORT</span>
          <h2>Detection Intelligence</h2>

          <div className="decision-highlight">
            <div className="decision-number">{detections.length}</div>
            <div>
              <span>DETECTED REGIONS</span>
              <strong>{detections.length ? "Review recommended" : "Awaiting sonar input"}</strong>
            </div>
          </div>

          <div className="decision-line">
            <span>Detected classes</span>
            <strong>{detectedTypes.length || "—"}</strong>
          </div>

          <div className="decision-line">
            <span>AI engine</span>
            <strong>CNN / U-Net</strong>
          </div>

          <div className="decision-line">
            <span>Geospatial layer</span>
            <strong>AVAILABLE</strong>
          </div>

          <div className="decision-note">
            <AlertTriangle size={15} />
            <span>AI detections should be reviewed alongside sonar context before operational decisions.</span>
          </div>
        </div>
      </section>
    </div>
  );
}




function ModulePage({ name }: { name: string }) {
  return <OperationsModules name={name} />;

}

export default App;

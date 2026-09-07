import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Anchor,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  CircleDot,
  CircleUserRound,
  Clock3,
  Database,
  FileText,
  Gauge,
  Globe2,
  Map,
  MapPin,
  Menu,
  Navigation,
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
    mission: true,
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
              <p>AI Powered Marine Debris</p>
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
            title="Mission"
            icon={<Navigation />}
            open={openSections.mission}
            collapsed={!sidebarOpen}
            onToggle={() => toggleSection("mission")}
          >
            <SubButton
              icon={<Route />}
              label="New Mission"
              onClick={() => setActivePage("New Mission")}
            />
            <SubButton
              icon={<Clock3 />}
              label="Mission History"
              onClick={() => setActivePage("Mission History")}
            />
          </Section>

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
            <h2>MISSION CONTROL DASHBOARD</h2>
            <p>Real-time overview of underwater survey operations</p>
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
  demoMode,
  onDetection,
  currentTime,
  demoTime,
}: {
  detections: Detection[];
  demoMode: boolean;
  onDetection: (d: Detection) => void;
  currentTime: Date;
  demoTime: number;
}) {
  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });

  const formatDemoTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600) % 24;
    const m = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;

    return [h, m, sec]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  return (
    <div className="dashboard">
      <div className="kpi-grid">
        <KPI
          icon={<Waves />}
          label="SONAR SCANS"
          value={demoMode ? "128" : "—"}
          text={demoMode ? "Simulated mission scans" : "No live mission data"}
        />
        <KPI
          icon={<ScanLine />}
          label="DETECTIONS"
          value={demoMode ? String(detections.length) : "—"}
          text={demoMode ? "Simulated AI findings" : "Model not trained"}
          cyan
        />
        <KPI
          icon={<ShieldCheck />}
          label="HIGH CONFIDENCE"
          value={demoMode ? "3" : "—"}
          text={demoMode ? "≥ 80% confidence" : "No AI results"}
          gold
        />
        <KPI
          icon={<AlertTriangle />}
          label="ANOMALIES"
          value={demoMode ? "1" : "—"}
          text={demoMode ? "Simulated anomaly finding" : "No AI results"}
          red
        />
        <KPI
          icon={<Map />}
          label="AREA COVERED"
          value={demoMode ? "2.45" : "—"}
          unit={demoMode ? "km²" : undefined}
          text={demoMode ? "Simulated survey area" : "Navigation data required"}
          aqua
        />
        <KPI
          icon={<Clock3 />}
          label="MISSION TIME"
          value={demoMode ? "01:42" : "—"}
          text={demoMode ? "Simulated mission duration" : "No active mission"}
          purple
        />
      </div>

      <div className="top-grid">
        <SonarViewer />
        <AIFindings
          detections={detections}
          onDetection={onDetection}
        />
        <DetectionSummary demoMode={demoMode} detections={detections} />
      </div>

      <div className="bottom-grid">
        <GISMap demoMode={demoMode} />
        <MissionTimeline demoMode={demoMode} />
        <SystemStatus demoMode={demoMode} />
      </div>

      <div className="mission-footer">
        <FooterItem
          label="DATE"
          value={currentTime.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          })}
          icon={<Clock3 />}
        />
        <FooterItem label="TIME (IST)" value={demoMode ? formatDemoTime(demoTime) : formatTime(currentTime)} icon={<Clock3 />} />
        <FooterItem
          label="LOCATION"
          value={demoMode ? "SIMULATED" : "Not available"}
          icon={<MapPin />}
        />
        <FooterItem label="SEA STATE" value={demoMode ? "CALM (SIM)" : "Not available"} icon={<Waves />} />
        <FooterItem label="VESSEL" value={demoMode ? "DEMO AUV" : "Not configured"} icon={<Anchor />} />
      </div>
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

function PanelHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: string;
}) {
  return (
    <div className="panel-header">
      <div>
        {icon}
        <h3>{title}</h3>
      </div>

      {action && <button>{action}</button>}
    </div>
  );
}

function SonarViewer() {
  return (
    <section className="panel sonar-panel">
      <PanelHeader icon={<Radar />} title="SONAR VIEWER" action="LIVE FEED" />

      <div className="sonar">
        <div className="sonar-noise n1" />
        <div className="sonar-noise n2" />
        <div className="sonar-noise n3" />

        <div className="sonar-grid" />
        <div className="sonar-sweep" />
        <div className="sonar-center" />

        <div className="sonar-object object-one">
          <CircleDot />
        </div>

        <div className="sonar-object object-two">
          <CircleDot />
        </div>

        <div className="sonar-controls">
          <button><Search size={16} /></button>
          <button><Gauge size={16} /></button>
          <button><Globe2 size={16} /></button>
          <button><ScanLine size={16} /></button>
        </div>

        <div className="live-indicator">
          <span />
          LIVE SONAR
        </div>

        <div className="sonar-info left-info">
          Range: <b>75 m</b>
        </div>

        <div className="sonar-info right-info">
          Frequency: <b>900 kHz</b>
        </div>
      </div>
    </section>
  );
}

function AIFindings({
  detections,
  onDetection,
}: {
  detections: Detection[];
  onDetection: (d: Detection) => void;
}) {
  return (
    <section className="panel">
      <PanelHeader
        icon={<BrainCircuit />}
        title="AI FINDINGS"
        action="NO RESULTS"
      />

      {detections.length === 0 ? (
        <div className="empty-state">
          <BrainCircuit size={34} />
          <strong>No AI detections yet</strong>
          <span>
            Train the CNN model and run inference on a sonar image
            before detection results are displayed here.
          </span>
        </div>
      ) : (
        <div className="findings">
          {detections.map((detection) => (
            <button
              className="finding"
              key={detection.scan}
              onClick={() => onDetection(detection)}
            >
              <div className={`finding-image ${detection.className}`}>
                <ScanLine size={24} />
              </div>

              <div className="finding-info">
                <div>
                  <strong>{detection.type}</strong>
                  <span className={`badge ${detection.className}`}>
                    {detection.confidence >= 80 ? "HIGH" : "MEDIUM"}
                  </span>
                </div>

                <small>
                  Confidence: {detection.confidence}%
                </small>
              </div>

              <div className="finding-time">
                <strong>{detection.time}</strong>
                <small>{detection.scan}</small>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function DetectionSummary({
  demoMode,
  detections,
}: {
  demoMode: boolean;
  detections: Detection[];
}) {
  const high = detections.filter((d) => d.confidence >= 80).length;
  const medium = detections.filter((d) => d.confidence < 80).length;

  return (
    <section className="panel summary">
      <PanelHeader
        icon={<BarChart3 />}
        title="DETECTION SUMMARY"
        action={demoMode ? "SIMULATED" : "NO RESULTS"}
      />

      {demoMode ? (
        <div className="demo-summary">
          <div className="summary-total">
            <strong>{detections.length}</strong>
            <span>TOTAL FINDINGS</span>
          </div>

          <div className="summary-bars">
            <div className="summary-row">
              <span>
                <i className="summary-dot high" />
                High confidence
              </span>
              <strong>{high}</strong>
            </div>

            <div className="summary-row">
              <span>
                <i className="summary-dot medium" />
                Medium confidence
              </span>
              <strong>{medium}</strong>
            </div>
          </div>

          <div className="summary-disclaimer">
            DEMO DATA — NOT CNN RESULTS
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <BarChart3 size={34} />
          <strong>Awaiting CNN inference</strong>
          <span>
            Detection statistics will appear after the trained model
            processes a sonar image.
          </span>
        </div>
      )}
    </section>
  );
}

function GISMap({ demoMode }: { demoMode: boolean }) {
  return (
    <section className="panel map-panel">
      <PanelHeader
        icon={<Globe2 />}
        title="GIS MAP"
        action={demoMode ? "SIMULATED LOCATION" : "LOCATION UNAVAILABLE"}
      />

      <div className="map">
        <div className="coastline" />
        <div className="map-grid" />

        {demoMode ? (
          <>
            <div className="demo-map-label">SIMULATED SURVEY TRACK</div>

            <div className="demo-track">
              <span className="track-point p1" />
              <span className="track-point p2" />
              <span className="track-point p3" />
              <span className="track-point p4" />
            </div>

            <button
              className="demo-marker marker-1"
              title="Ghost Net — simulated"
            >
              <MapPin size={22} />
            </button>

            <button
              className="demo-marker marker-2"
              title="Shipwreck — simulated"
            >
              <MapPin size={22} />
            </button>

            <button
              className="demo-marker marker-3"
              title="Pipe — simulated"
            >
              <MapPin size={22} />
            </button>

            <button
              className="demo-marker marker-4"
              title="Anomaly — simulated"
            >
              <MapPin size={22} />
            </button>
          </>
        ) : (
          <div className="empty-map-state">
            <MapPin size={32} />
            <strong>No georeferenced detections</strong>
            <span>
              GPS or navigation data is required to place sonar
              detections on the GIS map.
            </span>
          </div>
        )}

        <div className="map-tools">
          <button title="Zoom in">+</button>
          <button title="Zoom out">−</button>
          <button title="Current position">
            <Navigation size={15} />
          </button>
        </div>

        <div className="coordinates">
          <small>SELECTED DETECTION</small>
          <b>LAT —</b>
          <b>LON —</b>
        </div>
      </div>
    </section>
  );
}

function MissionTimeline({ demoMode }: { demoMode: boolean }) {
  const events = [
    ["09:00", "Mission initialized", "Survey mission started"],
    ["09:12", "Sonar acquisition", "Survey scan stream active"],
    ["10:42", "AI detection", "Ghost Net detected — 92.1%"],
    ["10:45", "AI detection", "Shipwreck detected — 88.7%"],
    ["10:49", "AI detection", "Pipe detected — 81.3%"],
    ["10:53", "Anomaly detected", "Anomaly detected — 74.2%"],
  ];

  return (
    <section className="panel timeline">
      <PanelHeader
        icon={<Clock3 />}
        title="MISSION TIMELINE"
        action={demoMode ? "SIMULATED MISSION" : "NO ACTIVE MISSION"}
      />

      {demoMode ? (
        <div className="demo-timeline">
          {events.map(([time, title, description], index) => (
            <div className="timeline-event" key={`${time}-${title}`}>
              <div className="timeline-marker">
                <span />
              </div>

              <div className="timeline-content">
                <div>
                  <strong>{title}</strong>
                  <time>{time}</time>
                </div>
                <small>{description}</small>
              </div>

              {index === events.length - 1 && (
                <span className="timeline-simulated">SIMULATED</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Clock3 size={34} />
          <strong>No mission events</strong>
          <span>
            Create a new survey mission to begin recording
            acquisition and processing events.
          </span>
        </div>
      )}
    </section>
  );
}

function SystemStatus({ demoMode }: { demoMode: boolean }) {
  return (
    <section className="panel system">
      <PanelHeader
        icon={<Activity />}
        title="SYSTEM STATUS"
      />

      <Status
        icon={<Waves />}
        name="Sonar Processing"
        value="READY"
      />

      <Status
        icon={<BrainCircuit />}
        name="AI Engine"
        value={demoMode ? "SIMULATED" : "PYTORCH PENDING"}
      />

      <Status
        icon={<Navigation />}
        name="GPS / Navigation"
        value={demoMode ? "SIMULATED" : "DATA REQUIRED"}
      />

      <div className="resource">
        <div>
          <Database size={18} />
          <span>Dataset</span>
          <b>AI4Shipwrecks</b>
        </div>
      </div>

      <div className="resource">
        <div>
          <Activity size={18} />
          <span>Mission</span>
          <b>{demoMode ? "DEMO ACTIVE" : "INACTIVE"}</b>
        </div>
      </div>
    </section>
  );
}

function Status({
  icon,
  name,
  value,
}: {
  icon: React.ReactNode;
  name: string;
  value: string;
}) {
  return (
    <div className="status">
      <div>{icon}</div>
      <span>{name}</span>
      <b>{value}</b>
    </div>
  );
}

function FooterItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="footer-item">
      {icon}
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ModulePage({ name }: { name: string }) {
  return <OperationsModules name={name} />;

}

export default App;

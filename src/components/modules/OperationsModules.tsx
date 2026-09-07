import { useState } from "react";
import {
  Activity,
  Anchor,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  Map,
  MapPin,
  Navigation,
  Radar,
  Route,
  ScanLine,
  ShieldCheck,
  Target,
  Waves,
} from "lucide-react";

const MODEL = {
  name: "BlueSentinel CNN U-Net v1",
  checkpoint: "bluesentinel_cnn_v1.pt",
  epoch: 6,
  validationDice: 0.6742,
  testDice: 0.1292,
  testIoU: 0.0691,
  precision: 0.0779,
  recall: 0.3783,
  threshold: 0.80,
  parameters: 482449,
};

function Card({
  title,
  value,
  text,
  icon,
}: {
  title: string;
  value: string;
  text?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "12px",
        background: "rgba(3,25,38,.72)",
        border: "1px solid rgba(56,189,248,.14)",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", opacity: .7 }}>
        {icon}
        <small>{title}</small>
      </div>
      <strong style={{ display: "block", fontSize: "22px", marginTop: 9 }}>
        {value}
      </strong>
      {text && <small style={{ opacity: .55 }}>{text}</small>}
    </div>
  );
}

function Ready() {
  return (
    <span style={{ color: "#34d399", fontSize: "11px", fontWeight: 700 }}>
      ● READY
    </span>
  );
}

export default function OperationsModules({ name }: { name: string }) {
  const [missionActive, setMissionActive] = useState(
    () => localStorage.getItem("bluesentinel-mission-active") === "true"
  );

  const startMission = () => {
    localStorage.setItem("bluesentinel-mission-active", "true");
    setMissionActive(true);
  };

  if (name === "New Mission") {
    const mission = {
      mission_id: "BS-DEMO-001",
      mission_name: "MV Sentinel Deep Survey",
      type: "DEMO MISSION — Shipwreck Detection",
      vessel: "DEMO AUV",
      sonar: "Side-scan Sonar",
      frequency_khz: 900,
      depth_m: 42,
      latitude: 17.6868,
      longitude: 83.2185,
      end_latitude: 17.6902,
      end_longitude: 83.2241,
      heading: 127,
      speed_knots: 3.5,
      sonar_image: "MV_Sentinel_Deep_Survey.png"
    };

    return (
      <ModuleShell
        eyebrow="MISSION CONTROL"
        title="New Mission"
        subtitle="Create and initialize an underwater sonar survey mission."
      >
        <div className="panel" style={{ padding: 20 }}>
          <PanelTitle icon={<Navigation />} title="MISSION INITIALIZATION" />

          <div style={grid}>
            <Card
              title="MISSION ID"
              value={mission.mission_id}
              text="Demo mission identifier"
              icon={<FileText size={17} />}
            />
            <Card
              title="VESSEL"
              value={mission.vessel}
              text="Simulation profile"
              icon={<Anchor size={17} />}
            />
            <Card
              title="SONAR"
              value={`${mission.frequency_khz} kHz`}
              text="Side-scan configuration"
              icon={<Waves size={17} />}
            />
            <Card
              title="STATUS"
              value={missionActive ? "ACTIVE" : "READY"}
              text={missionActive ? "Mission initialized" : "Ready to initialize"}
              icon={<Activity size={17} />}
            />
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 18,
              borderRadius: 12,
              background: "rgba(15,23,42,.55)"
            }}
          >
            <h4>DEMO MISSION</h4>
            <p style={{ opacity: .65 }}>
              Simulated operational mission data. CNN inference remains real
              when the sonar image is analyzed in Sonar Laboratory.
            </p>

            <div style={grid}>
              <Card
                title="GPS LATITUDE"
                value={mission.latitude.toFixed(4)}
                text="Mission start"
                icon={<MapPin size={17} />}
              />
              <Card
                title="GPS LONGITUDE"
                value={mission.longitude.toFixed(4)}
                text="Mission start"
                icon={<MapPin size={17} />}
              />
              <Card
                title="SURVEY DEPTH"
                value={`${mission.depth_m} m`}
                text="Planned operating depth"
                icon={<Waves size={17} />}
              />
              <Card
                title="HEADING"
                value={`${mission.heading}°`}
                text="Survey heading"
                icon={<Navigation size={17} />}
              />
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 14,
                border: "1px solid rgba(34,211,238,.2)",
                borderRadius: 10
              }}
            >
              <strong>SONAR IMAGE</strong>
              <div style={{ marginTop: 6, opacity: .7 }}>
                {mission.sonar_image}
              </div>
              <div style={{ marginTop: 6, opacity: .55, fontSize: 12 }}>
                Upload this image through Sonar Laboratory → Upload Sonar.
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 14,
                border: "1px solid rgba(34,211,238,.2)",
                borderRadius: 10
              }}
            >
              <strong>SURVEY TRACK</strong>
              <div style={{ marginTop: 8, fontFamily: "monospace", opacity: .8 }}>
                {mission.latitude.toFixed(4)}, {mission.longitude.toFixed(4)}
                {"  →  "}
                {mission.end_latitude.toFixed(4)}, {mission.end_longitude.toFixed(4)}
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 10,
                border: "1px solid rgba(34,211,238,.25)",
                background: "rgba(2,15,25,.55)"
              }}
            >
              <strong>SONAR IMAGE UPLOAD</strong>
              <div style={{ marginTop: 8, opacity: .65, fontSize: 12 }}>
                Upload the side-scan sonar image for this mission.
              </div>
              <input
                type="file"
                accept="image/*"
                style={{ marginTop: 12 }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = () => {
                    const mission = JSON.parse(
                      localStorage.getItem("bluesentinel-active-mission") ||
                      JSON.stringify({
                        mission_id: "BS-DEMO-001",
                        mission_name: "MV Sentinel Deep Survey",
                        latitude: 17.6868,
                        longitude: 83.2185,
                        end_latitude: 17.6902,
                        end_longitude: 83.2241,
                        status: "ACTIVE"
                      })
                    );

                    mission.sonar_image_name = file.name;
                    mission.sonar_image_data = reader.result;

                    localStorage.setItem(
                      "bluesentinel-active-mission",
                      JSON.stringify(mission)
                    );

                    alert(
                      "Sonar image uploaded to the active mission. Go to Sonar Laboratory → Upload Sonar."
                    );
                  };

                  reader.readAsDataURL(file);
                }}
              />
            </div>

            <button className="primary-action" onClick={startMission} style={{ marginTop: 18 }}>
              <Navigation size={17} />
              {missionActive ? "MISSION ACTIVE" : "INITIALIZE DEMO MISSION"}
            </button>
          </div>
        </div>
      </ModuleShell>
    );
  }
  if (name === "Mission History") {
    return (
      <ModuleShell eyebrow="MISSION CONTROL" title="Mission History" subtitle="Survey mission records and operational status.">
        <div className="panel" style={{ padding: 20 }}>
          <PanelTitle icon={<Clock3 />} title="MISSION RECORDS" />
          <div style={grid}>
            <Card title="TOTAL MISSIONS" value="01" text="Current project demo record" icon={<FileText size={17} />} />
            <Card title="LAST MISSION" value="BS-DEMO-001" text="Demo mission" icon={<Navigation size={17} />} />
            <Card title="STATUS" value={missionActive ? "ACTIVE" : "READY"} text="Mission control" icon={<CheckCircle2 size={17} />} />
          </div>
          <div style={row}>
            <strong>BS-DEMO-001</strong>
            <span>Demo Survey · CNN Analysis Available · <Ready /></span>
          </div>
        </div>
      </ModuleShell>
    );
  }

  if (name === "CNN Training") {
    return (
      <ModuleShell eyebrow="AI LABORATORY" title="CNN Training" subtitle="BlueSentinel U-Net training configuration and completed training record.">
        <div className="panel" style={{ padding: 20 }}>
          <PanelTitle icon={<BrainCircuit />} title="TRAINING STATUS" />
          <div style={grid}>
            <Card title="MODEL" value="U-Net" text="CNN segmentation architecture" icon={<BrainCircuit size={17} />} />
            <Card title="BEST EPOCH" value={`${MODEL.epoch}/10`} text="Best validation checkpoint" icon={<BarChart3 size={17} />} />
            <Card title="VAL DICE" value={MODEL.validationDice.toFixed(4)} text="Best validation score" icon={<Target size={17} />} />
            <Card title="PARAMETERS" value={MODEL.parameters.toLocaleString()} text="Trainable parameters" icon={<Activity size={17} />} />
          </div>

          <div style={{ ...row, marginTop: 20 }}>
            <span>Training from scratch</span><Ready />
          </div>
          <div style={{ ...row }}>
            <span>Group-aware train/validation split</span><Ready />
          </div>
          <div style={{ ...row }}>
            <span>Patch-based training</span><Ready />
          </div>
          <div style={{ ...row }}>
            <span>Dice + weighted BCE loss</span><Ready />
          </div>
          <div style={{ ...row }}>
            <span>Adam optimizer</span><Ready />
          </div>
          <div style={{ ...row }}>
            <span>Checkpoint: {MODEL.checkpoint}</span><Ready />
          </div>
        </div>
      </ModuleShell>
    );
  }

  if (name === "Model Evaluation") {
    return (
      <ModuleShell eyebrow="AI LABORATORY" title="Model Evaluation" subtitle="Validation calibration and independent test evaluation.">
        <div className="panel" style={{ padding: 20 }}>
          <PanelTitle icon={<BarChart3 />} title="REAL EVALUATION RESULTS" />
          <div style={grid}>
            <Card title="VALIDATION DICE" value={MODEL.validationDice.toFixed(4)} text="Best checkpoint" icon={<ShieldCheck size={17} />} />
            <Card title="TEST DICE" value={MODEL.testDice.toFixed(4)} text="120-image untouched test set" icon={<BarChart3 size={17} />} />
            <Card title="TEST IoU" value={MODEL.testIoU.toFixed(4)} text="Independent test result" icon={<Target size={17} />} />
            <Card title="PRECISION" value={MODEL.precision.toFixed(4)} text="Independent test result" icon={<ScanLine size={17} />} />
            <Card title="RECALL" value={MODEL.recall.toFixed(4)} text="Independent test result" icon={<Radar size={17} />} />
            <Card title="THRESHOLD" value={`${MODEL.threshold * 100}%`} text="Selected on validation" icon={<Activity size={17} />} />
          </div>

          <div style={{ marginTop: 18, padding: 16, borderRadius: 10, background: "rgba(127,29,29,.18)" }}>
            <strong>RESEARCH STATUS</strong>
            <p style={{ marginBottom: 0, opacity: .65 }}>
              The current model is a binary shipwreck-segmentation model
              trained on AI4Shipwrecks. It should not be presented as a
              six-class debris classifier.
            </p>
          </div>
        </div>
      </ModuleShell>
    );
  }

  if (name === "Detection") {
    return (
      <ModuleShell eyebrow="AI LABORATORY" title="Detection" subtitle="CNN segmentation-derived region detection.">
        <div className="panel" style={{ padding: 20 }}>
          <PanelTitle icon={<ScanLine />} title="CNN DETECTION ENGINE" />
          <div style={grid}>
            <Card title="METHOD" value="CNN + U-Net" text="Pixel-level segmentation" icon={<BrainCircuit size={17} />} />
            <Card title="REGION EXTRACTION" value="ACTIVE" text="Connected components" icon={<Target size={17} />} />
            <Card title="NOISE FILTER" value="100 px" text="Minimum region area" icon={<ShieldCheck size={17} />} />
            <Card title="API" value="READY" text="127.0.0.1:8000" icon={<Activity size={17} />} />
          </div>
          <div style={{ ...row, marginTop: 20 }}>
            <span>Upload an image in Sonar Laboratory to run live CNN inference.</span>
            <Ready />
          </div>
          <div style={{ marginTop: 12, padding: 16, borderRadius: 10, background: "rgba(15,23,42,.6)" }}>
            <strong>OUTPUT PIPELINE</strong>
            <p style={{ opacity: .65 }}>
              Probability Map → Binary Mask → Connected Components →
              Bounding Region → Area + Confidence
            </p>
          </div>
        </div>
      </ModuleShell>
    );
  }

  if (name === "Location") {
    const saved = localStorage.getItem("bluesentinel-active-mission");
    const mission = saved ? JSON.parse(saved) : null;

    const lat = mission?.latitude ?? 17.6868;
    const lon = mission?.longitude ?? 83.2185;

    return (
      <ModuleShell
        eyebrow="GEOSPATIAL"
        title="Mission Location"
        subtitle="GPS position associated with the active sonar mission."
      >
        <div className="panel" style={{ padding: 20 }}>
          <PanelTitle icon={<MapPin />} title="GPS POSITION" />

          <div style={grid}>
            <Card title="MISSION" value={mission?.mission_id ?? "BS-DEMO-001"} text="Active mission" icon={<Navigation size={17} />} />
            <Card title="LATITUDE" value={Number(lat).toFixed(4)} text="GPS latitude" icon={<MapPin size={17} />} />
            <Card title="LONGITUDE" value={Number(lon).toFixed(4)} text="GPS longitude" icon={<MapPin size={17} />} />
            <Card title="STATUS" value={mission ? "CONNECTED" : "READY"} text="Mission GPS link" icon={<Activity size={17} />} />
          </div>

          <div
            style={{
              marginTop: 20,
              minHeight: 260,
              borderRadius: 14,
              padding: 24,
              background: "radial-gradient(circle at 50% 50%, rgba(8,145,178,.25), rgba(2,15,25,.95))",
              border: "1px solid rgba(34,211,238,.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column"
            }}
          >
            <MapPin size={42} />
            <h3 style={{ marginTop: 12 }}>ACTIVE GPS POSITION</h3>
            <strong style={{ fontFamily: "monospace", fontSize: 18 }}>
              {Number(lat).toFixed(4)}°, {Number(lon).toFixed(4)}°
            </strong>
            <span style={{ marginTop: 8, opacity: .6 }}>
              Visakhapatnam Offshore — DEMO COORDINATES
            </span>
          </div>
        </div>
      </ModuleShell>
    );
  }
  if (name === "Survey Track") {
    const saved = localStorage.getItem("bluesentinel-active-mission");
    const mission = saved ? JSON.parse(saved) : null;

    const startLat = mission?.latitude ?? 17.6868;
    const startLon = mission?.longitude ?? 83.2185;
    const endLat = mission?.end_latitude ?? 17.6902;
    const endLon = mission?.end_longitude ?? 83.2241;

    return (
      <ModuleShell
        eyebrow="GEOSPATIAL"
        title="Survey Track"
        subtitle="Planned sonar survey path linked to the active mission."
      >
        <div className="panel" style={{ padding: 20 }}>
          <PanelTitle icon={<Route />} title="SURVEY TRACK" />

          <div style={grid}>
            <Card title="START" value={`${Number(startLat).toFixed(4)}, ${Number(startLon).toFixed(4)}`} text="GPS start point" icon={<MapPin size={17} />} />
            <Card title="END" value={`${Number(endLat).toFixed(4)}, ${Number(endLon).toFixed(4)}`} text="GPS end point" icon={<MapPin size={17} />} />
            <Card title="HEADING" value={`${mission?.heading ?? 127}°`} text="Survey direction" icon={<Navigation size={17} />} />
            <Card title="SPEED" value={`${mission?.speed_knots ?? 3.5} kn`} text="Survey speed" icon={<Activity size={17} />} />
          </div>

          <div
            style={{
              marginTop: 20,
              height: 300,
              borderRadius: 14,
              padding: 20,
              position: "relative",
              overflow: "hidden",
              background: "linear-gradient(135deg, rgba(6,78,99,.35), rgba(2,15,25,.95))",
              border: "1px solid rgba(34,211,238,.2)"
            }}
          >
            <div style={{ position: "absolute", left: "15%", top: "70%", width: "70%", height: 3, transform: "rotate(-12deg)", background: "rgba(34,211,238,.8)" }} />
            <div style={{ position: "absolute", left: "14%", top: "67%" }}>
              <MapPin size={28} />
              <div style={{ fontSize: 11, marginTop: 4 }}>START</div>
            </div>
            <div style={{ position: "absolute", right: "14%", top: "30%" }}>
              <MapPin size={28} />
              <div style={{ fontSize: 11, marginTop: 4 }}>END</div>
            </div>
            <div style={{ position: "absolute", left: 20, top: 18, opacity: .55 }}>
              DEMO SONAR SURVEY TRACK
            </div>
          </div>
        </div>
      </ModuleShell>
    );
  }
  if (name === "GIS Map") {
    const saved = localStorage.getItem("bluesentinel-active-mission");
    const mission = saved ? JSON.parse(saved) : null;

    const lat = mission?.latitude ?? 17.6868;
    const lon = mission?.longitude ?? 83.2185;
    const endLat = mission?.end_latitude ?? 17.6902;
    const endLon = mission?.end_longitude ?? 83.2241;

    return (
      <ModuleShell
        eyebrow="GEOSPATIAL"
        title="GIS Mission Map"
        subtitle="Mission GPS, survey track and sonar analysis location."
      >
        <div className="panel" style={{ padding: 20 }}>
          <PanelTitle icon={<Map />} title="MISSION GIS VIEW" />

          <div style={grid}>
            <Card title="MISSION" value={mission?.mission_id ?? "BS-DEMO-001"} text="Mission linked to GIS" icon={<Navigation size={17} />} />
            <Card title="GPS" value={`${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`} text="Detection reference point" icon={<MapPin size={17} />} />
            <Card title="TRACK" value="CONNECTED" text="Survey path available" icon={<Route size={17} />} />
            <Card title="GIS STATUS" value="READY" text="Geospatial module" icon={<Globe2 size={17} />} />
          </div>

          <div
            style={{
              marginTop: 20,
              height: 430,
              borderRadius: 16,
              position: "relative",
              overflow: "hidden",
              border: "1px solid rgba(34,211,238,.25)",
              background: "linear-gradient(135deg, #062b3a 0%, #041923 45%, #031019 100%)"
            }}
          >
            <div style={{ position: "absolute", inset: 0, opacity: .15, backgroundImage: "linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)", backgroundSize: "45px 45px" }} />

            <div style={{ position: "absolute", left: "18%", top: "68%", width: "64%", height: 4, transform: "rotate(-17deg)", borderRadius: 4, background: "rgba(34,211,238,.9)", boxShadow: "0 0 16px rgba(34,211,238,.5)" }} />

            <div style={{ position: "absolute", left: "15%", top: "65%", textAlign: "center" }}>
              <MapPin size={34} />
              <div style={{ fontWeight: 700 }}>START</div>
              <small>{Number(lat).toFixed(4)}, {Number(lon).toFixed(4)}</small>
            </div>

            <div style={{ position: "absolute", right: "12%", top: "25%", textAlign: "center" }}>
              <MapPin size={34} />
              <div style={{ fontWeight: 700 }}>SURVEY END</div>
              <small>{Number(endLat).toFixed(4)}, {Number(endLon).toFixed(4)}</small>
            </div>

            <div
              style={{
                position: "absolute",
                left: "48%",
                top: "45%",
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(2,15,25,.9)",
                border: "1px solid rgba(34,211,238,.35)",
                textAlign: "center"
              }}
            >
              <strong>SONAR MISSION</strong>
              <div style={{ fontSize: 11, opacity: .65, marginTop: 4 }}>
                CNN analysis reference
              </div>
            </div>

            <div style={{ position: "absolute", left: 18, bottom: 16, opacity: .65, fontSize: 12 }}>
              DEMO GIS • GPS + SURVEY TRACK CONNECTED
            </div>
          </div>
        </div>
      </ModuleShell>
    );
  }
  if (name === "Reports") {
    return (
      <ModuleShell eyebrow="REPORTING" title="Reports" subtitle="BlueSentinel mission and CNN analysis summary.">
        <div className="panel" style={{ padding: 20 }}>
          <PanelTitle icon={<FileText />} title="PROJECT ANALYSIS REPORT" />
          <div style={grid}>
            <Card title="MODEL" value="U-Net CNN" text="BlueSentinel CNN v1" icon={<BrainCircuit size={17} />} />
            <Card title="VAL DICE" value={MODEL.validationDice.toFixed(4)} text="Best validation" icon={<BarChart3 size={17} />} />
            <Card title="TEST DICE" value={MODEL.testDice.toFixed(4)} text="120 unseen test images" icon={<Target size={17} />} />
            <Card title="STATUS" value="READY" text="Report data available" icon={<CheckCircle2 size={17} />} />
          </div>
          <div style={{ marginTop: 20, padding: 18, borderRadius: 12, background: "rgba(15,23,42,.6)" }}>
            <h4>END-TO-END METHODOLOGY</h4>
            <p style={{ opacity: .65 }}>
              Side-Scan Sonar → Preprocessing → CNN/U-Net → Probability Map
              → Segmentation Mask → Connected Regions → Confidence and Area.
            </p>
            <p style={{ opacity: .65 }}>
              Current AI4Shipwrecks training supports binary shipwreck
              segmentation. Marine-debris classes require appropriately
              labeled debris data before classification claims are made.
            </p>
          </div>
        </div>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell eyebrow="BLUESENTINEL" title={name} subtitle="BlueSentinel module status and operational readiness.">
      <div className="panel" style={{ padding: 20 }}>
        <PanelTitle icon={<Activity />} title="MODULE STATUS" />
        <div style={grid}>
          <Card title="STATUS" value="READY" text="Module initialized" icon={<CheckCircle2 size={17} />} />
          <Card title="SYSTEM" value="ONLINE" text="BlueSentinel V2" icon={<Activity size={17} />} />
        </div>
      </div>
    </ModuleShell>
  );
}

function ModuleShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: "32px 24px 60px" }}>
      <div style={{ marginBottom: 22 }}>
        <span className="lab-eyebrow">{eyebrow}</span>
        <h2 style={{ margin: "7px 0 4px" }}>{title}</h2>
        <p style={{ opacity: .6 }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      {icon}
      <h3 style={{ margin: 0 }}>{title}</h3>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
  gap: "12px",
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 15,
  padding: "14px 16px",
  marginTop: 8,
  borderRadius: 10,
  background: "rgba(15,23,42,.55)",
};

export { OperationsModules };

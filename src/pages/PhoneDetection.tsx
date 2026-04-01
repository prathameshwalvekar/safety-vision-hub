import { useState, useRef, useEffect, useCallback } from 'react';
import DetectionLayout from '@/components/DetectionLayout';

const PhoneDetectionPage = () => {
  const [activeTab, setActiveTab] = useState('upload');
  return (
    <DetectionLayout title="Phone Detection System" subtitle="Real-time cell phone detection using YOLOv11" icon="📱">
      <div className="space-y-6">
        <div className="flex gap-3">
          <button className={`detection-tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>📤 Upload Image</button>
          <button className={`detection-tab-btn ${activeTab === 'webcam' ? 'active' : ''}`} onClick={() => setActiveTab('webcam')}>📹 Live Detection</button>
        </div>
        {activeTab === 'upload' && <PhoneUploadSection />}
        {activeTab === 'webcam' && <PhoneWebcamSection />}
      </div>
    </DetectionLayout>
  );
};

const PhoneUploadSection = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [detections, setDetections] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { setSelectedImage(file); setDetections(null); setError(''); }
  };

  const detect = async () => {
    if (!selectedImage) return;
    setLoading(true); setError('');
    try {
      const formData = new FormData(); formData.append('file', selectedImage);
      const response = await fetch('http://localhost:8001/detect-phones', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setDetections(await response.json());
    } catch (err: any) { setError(`Phone detection failed: ${err.message}`); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <button className="detection-upload-btn" onClick={() => fileInputRef.current?.click()}>📷 Choose Image</button>
        {selectedImage && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-body">{selectedImage.name}</span>
            <button className="detection-detect-btn" onClick={detect} disabled={loading}>{loading ? '🔄 Detecting...' : '🔍 Detect Phones'}</button>
          </div>
        )}
      </div>
      {error && <div className="detection-error">❌ {error}</div>}
      {detections && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-surface p-4">
              <h3 className="font-display text-sm text-muted-foreground mb-3 uppercase tracking-wider">Original Image</h3>
              {selectedImage && <img src={URL.createObjectURL(selectedImage)} alt="Original" className="w-full rounded-md" />}
            </div>
            <div className="card-surface p-4">
              <h3 className="font-display text-sm text-muted-foreground mb-3 uppercase tracking-wider">Detection Results</h3>
              <p className={detections.phone_count > 0 ? 'detection-message-warning' : 'detection-message-success'}>{detections.message}</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="detection-stat-card"><span className="stat-icon">📱</span><span className="stat-value">{detections.phone_count}</span><span className="stat-label">Phones</span></div>
                <div className="detection-stat-card"><span className="stat-icon">📺</span><span className="stat-value">{detections.remote_count}</span><span className="stat-label">Remotes</span></div>
              </div>
            </div>
          </div>
          {detections.detections?.length > 0 && (
            <div className="card-surface p-4">
              <h3 className="font-display text-sm text-muted-foreground mb-3 uppercase tracking-wider">Detection Details</h3>
              <div className="space-y-2">
                {detections.detections.map((d: any, i: number) => (
                  <div key={i} className="detection-item-row">
                    <span className="label">{d.label === 'cell phone' ? '📱' : '📺'} {d.label}</span>
                    <span className="confidence">{(d.confidence * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── helpers ──────────────────────────────────────────────────
function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** IoU between two boxes [x1,y1,x2,y2] */
function iou(a: number[], b: number[]): number {
  const ix1 = Math.max(a[0], b[0]), iy1 = Math.max(a[1], b[1]);
  const ix2 = Math.min(a[2], b[2]), iy2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  if (inter === 0) return 0;
  const areaA = (a[2] - a[0]) * (a[3] - a[1]);
  const areaB = (b[2] - b[0]) * (b[3] - b[1]);
  return inter / (areaA + areaB - inter);
}

const TRACK_IOU_THRESHOLD = 0.25; // min IoU to consider same phone
const PHONE_COLORS = ['#ff9800','#e040fb','#00bcd4','#76ff03','#ff4081','#ffeb3b','#18ffff','#ff6d00'];

interface TrackedPhone {
  id: number;
  box: number[];
  sessionStart: Date;
  elapsedMs: number;         // live elapsed (updated by ticker)
  missedFrames: number;      // consecutive frames not matched
  color: string;
}

interface SessionEntry {
  phoneId: number;
  start: Date;
  end: Date;
  durationMs: number;
  snapshot: string;
}

// ── Webcam Section ────────────────────────────────────────────
const PhoneWebcamSection = () => {
  const [isStreaming, setIsStreaming]  = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError]             = useState('');
  const [stats, setStats]             = useState({ phone: 0, remote: 0 });

  // multi-phone tracking state (display copy of the ref)
  const [trackedPhones, setTrackedPhones] = useState<TrackedPhone[]>([]);
  const [sessions, setSessions]           = useState<SessionEntry[]>([]);
  const [hoveredSnapshot, setHoveredSnapshot] = useState<string | null>(null);

  // refs
  const trackedRef       = useRef<TrackedPhone[]>([]);   // canonical live state
  const nextIdRef        = useRef(1);
  const tickerRef        = useRef<any>(null);
  const videoRef         = useRef<HTMLVideoElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const detectionRef     = useRef<any>(null);
  const isStreamingRef   = useRef(false);
  const isDetectingRef   = useRef(false);

  // keep refs in sync with state
  useEffect(() => { isStreamingRef.current = isStreaming; }, [isStreaming]);
  useEffect(() => { isDetectingRef.current = isDetecting; }, [isDetecting]);

  // ── live ticker: update elapsedMs for all tracked phones ──
  useEffect(() => {
    tickerRef.current = setInterval(() => {
      if (trackedRef.current.length === 0) return;
      const now = Date.now();
      trackedRef.current = trackedRef.current.map(p => ({
        ...p,
        elapsedMs: now - p.sessionStart.getTime(),
      }));
      setTrackedPhones([...trackedRef.current]);
    }, 1000);
    return () => clearInterval(tickerRef.current);
  }, []);

  // ── snapshot helper ──────────────────────────────────────
  const captureSnapshot = useCallback((): string => {
    if (!canvasRef.current) return '';
    return canvasRef.current.toDataURL('image/jpeg', 0.80);
  }, []);

  // ── match new YOLO detections to existing tracked phones ─
  const reconcileTracking = useCallback((newDetections: any[]) => {
    const now = Date.now();
    const phoneDets = newDetections.filter(d => d.label === 'cell phone');
    const existing  = trackedRef.current;
    const matched   = new Set<number>(); // indices into phoneDets that got matched

    // update existing tracks
    let updated: TrackedPhone[] = existing.map(track => {
      let bestIou = TRACK_IOU_THRESHOLD;
      let bestIdx = -1;
      phoneDets.forEach((det, idx) => {
        if (matched.has(idx)) return;
        const score = iou(track.box, det.box);
        if (score > bestIou) { bestIou = score; bestIdx = idx; }
      });

      if (bestIdx !== -1) {
        matched.add(bestIdx);
        return { ...track, box: phoneDets[bestIdx].box, missedFrames: 0, elapsedMs: now - track.sessionStart.getTime() };
      } else {
        return { ...track, missedFrames: track.missedFrames + 1 };
      }
    });

    // close sessions for phones that have vanished (≥2 missed frames)
    const snapshot = captureSnapshot();
    const terminated: TrackedPhone[] = [];
    updated = updated.filter(t => {
      if (t.missedFrames >= 2) { terminated.push(t); return false; }
      return true;
    });

    if (terminated.length > 0) {
      const end = new Date();
      setSessions(prev => {
        const newEntries: SessionEntry[] = terminated.map(t => ({
          phoneId: t.id,
          start: t.sessionStart,
          end,
          durationMs: now - t.sessionStart.getTime(),
          snapshot,
        }));
        return [...newEntries, ...prev].slice(0, 20);
      });
    }

    // create new tracks for unmatched detections
    phoneDets.forEach((det, idx) => {
      if (matched.has(idx)) return;
      const newTrack: TrackedPhone = {
        id: nextIdRef.current++,
        box: det.box,
        sessionStart: new Date(),
        elapsedMs: 0,
        missedFrames: 0,
        color: PHONE_COLORS[(nextIdRef.current - 2) % PHONE_COLORS.length],
      };
      updated.push(newTrack);
    });

    trackedRef.current = updated;
    setTrackedPhones([...updated]);
  }, [captureSnapshot]);

  // ── draw canvas with per-phone colour + timer overlays ───
  const drawDetections = useCallback((data: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const v = videoRef.current, c = canvasRef.current, ctx = c.getContext('2d')!;
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(v, 0, 0, c.width, c.height);

    // draw non-phone detections (remotes etc.) in blue
    data.detections?.filter((d: any) => d.label !== 'cell phone').forEach((d: any) => {
      const [x1, y1, x2, y2] = d.box;
      ctx.strokeStyle = '#2196f3'; ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.font = '14px Arial';
      const lbl = `📺 ${(d.confidence * 100).toFixed(0)}%`;
      const tw = ctx.measureText(lbl).width;
      ctx.fillStyle = '#2196f3'; ctx.fillRect(x1, y1 - 22, tw + 8, 22);
      ctx.fillStyle = 'white'; ctx.fillText(lbl, x1 + 4, y1 - 6);
    });

    // draw tracked phones with their assigned colour + timer
    trackedRef.current.forEach(track => {
      const [x1, y1, x2, y2] = track.box;
      const elapsed = Date.now() - track.sessionStart.getTime();
      const color = track.color;
      const borderColor = elapsed >= 60_000 ? '#dc2626' : elapsed >= 15_000 ? '#eab308' : color;

      ctx.strokeStyle = borderColor; ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // label box
      const lbl = `📱 #${track.id} — ${formatDuration(elapsed)}`;
      ctx.font = 'bold 14px Arial';
      const tw = ctx.measureText(lbl).width;
      ctx.fillStyle = borderColor; ctx.fillRect(x1, y1 - 26, tw + 10, 26);
      ctx.fillStyle = 'white'; ctx.fillText(lbl, x1 + 5, y1 - 8);
    });

    // HUD bar
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, c.width, 40);
    ctx.fillStyle = 'white'; ctx.font = 'bold 15px Arial';
    ctx.fillText(`📱 ${trackedRef.current.length} active   📺 ${data.remote_count || 0}`, 10, 26);
  }, []);

  // ── webcam controls ──────────────────────────────────────
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play();
          setIsStreaming(true); setError('');
        };
      }
    } catch { setError('Failed to access webcam.'); }
  };

  const clearTracking = useCallback(() => {
    trackedRef.current = [];
    setTrackedPhones([]);
  }, []);

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (detectionRef.current) { clearInterval(detectionRef.current); detectionRef.current = null; }
    setIsStreaming(false); setIsDetecting(false);
    setStats({ phone: 0, remote: 0 });
    clearTracking();
  }, [clearTracking]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !isStreamingRef.current) return null;
    const v = videoRef.current, c = canvasRef.current, ctx = c.getContext('2d')!;
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  }, []);

  const runDetection = useCallback(async () => {
    if (!isStreamingRef.current || !isDetectingRef.current) return;
    try {
      const img = captureFrame(); if (!img) return;
      const r = await fetch(img); const blob = await r.blob();
      const fd = new FormData(); fd.append('file', blob, 'webcam_frame.jpg');
      const dr = await fetch('http://localhost:8001/detect-phones', { method: 'POST', body: fd });
      if (!dr.ok) throw new Error(`${dr.status}`);
      const result = await dr.json();
      setStats({ phone: result.phone_count || 0, remote: result.remote_count || 0 });
      reconcileTracking(result.detections || []);
      drawDetections(result);
    } catch (err) { console.error('Detection error:', err); }
  }, [captureFrame, reconcileTracking, drawDetections]);

  const startDetection = async () => {
    if (!isStreaming) return;
    try {
      const hr = await fetch('http://localhost:8001/health');
      if (!hr.ok) throw new Error();
      const hd = await hr.json();
      if (!hd.phone_detector_loaded) { setError('Backend phone detector not loaded.'); return; }
    } catch { setError('Cannot connect to backend at http://localhost:8001'); return; }
    setIsDetecting(true);
  };

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (detectionRef.current) { clearInterval(detectionRef.current); detectionRef.current = null; }
    // close all active sessions
    if (trackedRef.current.length > 0) {
      const snapshot = captureSnapshot();
      const end = new Date();
      setSessions(prev => {
        const entries: SessionEntry[] = trackedRef.current.map(t => ({
          phoneId: t.id,
          start: t.sessionStart,
          end,
          durationMs: Date.now() - t.sessionStart.getTime(),
          snapshot,
        }));
        return [...entries, ...prev].slice(0, 20);
      });
    }
    clearTracking();
  }, [captureSnapshot, clearTracking]);

  useEffect(() => () => { stopWebcam(); }, []);

  useEffect(() => {
    if (isDetecting) {
      if (detectionRef.current) clearInterval(detectionRef.current);
      detectionRef.current = setInterval(runDetection, 500);
      setTimeout(runDetection, 100);
    } else if (detectionRef.current) {
      clearInterval(detectionRef.current);
      detectionRef.current = null;
    }
  }, [isDetecting, runDetection]);

  // compute overall alert level from any active phone
  const maxElapsed = trackedPhones.reduce((max, p) => Math.max(max, p.elapsedMs), 0);
  const globalAlert = maxElapsed >= 60_000 ? 'danger' : maxElapsed >= 15_000 ? 'warn' : trackedPhones.length > 0 ? 'active' : 'none';
  const alertBorderColor = globalAlert === 'danger' ? '#dc2626' : globalAlert === 'warn' ? '#eab308' : globalAlert === 'active' ? '#22c55e' : 'transparent';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="font-display text-sm text-foreground uppercase tracking-wider">📹 Real-time Phone Detection</h3>
        {!isStreaming ? (
          <button onClick={startWebcam} className="detection-webcam-btn-primary">📷 Start Webcam</button>
        ) : (
          <>
            <button onClick={stopWebcam} className="detection-webcam-btn-danger">⏹️ Stop</button>
            {!isDetecting
              ? <button onClick={startDetection} className="detection-webcam-btn-success">🔍 Start Detection</button>
              : <button onClick={stopDetection} className="detection-webcam-btn-warning">⏸️ Stop Detection</button>
            }
            {sessions.length > 0 && (
              <button
                onClick={() => setSessions([])}
                className="detection-webcam-btn-primary"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                🗑 Reset Log
              </button>
            )}
          </>
        )}
      </div>

      {error && <div className="detection-error">❌ {error}</div>}

      {/* Alert banner */}
      {(globalAlert === 'danger' || globalAlert === 'warn') && (
        <div style={{
          background: globalAlert === 'danger' ? 'rgba(220,38,38,0.15)' : 'rgba(234,179,8,0.15)',
          border: `1px solid ${globalAlert === 'danger' ? '#dc2626' : '#eab308'}`,
          borderRadius: '10px', padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'pulse 1.5s infinite'
        }}>
          <span style={{ fontSize: '1.4rem' }}>{globalAlert === 'danger' ? '🚨' : '⚠️'}</span>
          <span style={{ color: globalAlert === 'danger' ? '#fca5a5' : '#fde047', fontWeight: 600, fontSize: '0.9rem' }}>
            {globalAlert === 'danger'
              ? `${trackedPhones.filter(p => p.elapsedMs >= 60_000).length} phone(s) in use for over 1 minute!`
              : `Phone(s) in active use — please put them away`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Video / Canvas */}
        <div
          className="lg:col-span-3 detection-video-container relative overflow-hidden"
          style={{
            outline: trackedPhones.length > 0 ? `3px solid ${alertBorderColor}` : 'none',
            borderRadius: '12px', transition: 'outline-color 0.3s',
            position: 'relative',
          }}
        >
          <video ref={videoRef} autoPlay playsInline muted style={{ display: isStreaming && !isDetecting ? 'block' : 'none' }} className="w-full" />
          <canvas ref={canvasRef} style={{ display: isDetecting ? 'block' : 'none' }} className="w-full" />
          {!isStreaming && <div className="detection-placeholder">📷 Click "Start Webcam" to begin</div>}

          {/* Hover Snapshot Preview Overlay */}
          {hoveredSnapshot && (
            <div className="absolute inset-0 z-[40] flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <img
                src={hoveredSnapshot}
                className="max-w-full max-h-full object-contain shadow-2xl"
                alt="Snapshot Preview"
              />
              <div className="absolute top-4 right-4 bg-primary/20 backdrop-blur-md border border-primary/30 text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                Snapshot View
              </div>
            </div>
          )}
        </div>

        {/* Side stats */}
        <div className="flex flex-col gap-3">
          <div className="detection-stat-card">
            <span className="stat-icon">📱</span>
            <span className="stat-value">{stats.phone}</span>
            <span className="stat-label">Active Phones</span>
          </div>
          <div className="detection-stat-card">
            <span className="stat-icon">📺</span>
            <span className="stat-value">{stats.remote}</span>
            <span className="stat-label">Remotes</span>
          </div>
          <div className="detection-stat-card">
            <span className="stat-icon">📋</span>
            <span className="stat-value">{sessions.length}</span>
            <span className="stat-label">Sessions Logged</span>
          </div>

          {/* Live per-phone sessions */}
          {trackedPhones.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Live Phones</span>
              {trackedPhones.map(p => {
                const elapsed = p.elapsedMs;
                const lvl = elapsed >= 60_000 ? 'danger' : elapsed >= 15_000 ? 'warn' : 'ok';
                const col = lvl === 'danger' ? '#f87171' : lvl === 'warn' ? '#fbbf24' : '#4ade80';
                return (
                  <div key={p.id} style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderLeft: `3px solid ${p.color}`,
                    borderRadius: '8px', padding: '6px 10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>📱 #{p.id}</span>
                    <span style={{ fontSize: '0.78rem', color: col, fontWeight: 700 }}>{formatDuration(elapsed)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div className="card-surface p-4">
          <h4 className="font-display text-sm text-muted-foreground mb-3 uppercase tracking-wider">
            📋 Phone Usage Log ({sessions.length} session{sessions.length > 1 ? 's' : ''})
          </h4>
          <div className="space-y-3">
            {sessions.map((s, i) => {
              const severityColor     = s.durationMs >= 60_000 ? '#dc2626' : s.durationMs >= 15_000 ? '#eab308' : '#22c55e';
              const severityTextColor = s.durationMs >= 60_000 ? '#f87171' : s.durationMs >= 15_000 ? '#fbbf24' : '#4ade80';
              const severityIcon      = s.durationMs >= 60_000 ? '🚨' : s.durationMs >= 15_000 ? '⚠️' : '✅';
              const downloadName      = `phone-${s.phoneId}-session-${s.start.toISOString().replace(/[:.]/g, '-')}.jpg`;
              return (
                <div
                  key={i}
                  onMouseEnter={() => s.snapshot && setHoveredSnapshot(s.snapshot)}
                  onMouseLeave={() => setHoveredSnapshot(null)}
                  className="transition-all duration-200 hover:bg-white/10 cursor-help"
                  style={{
                    display: 'flex', gap: '14px', alignItems: 'flex-start',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '10px', padding: '10px 12px',
                    borderLeft: `3px solid ${severityColor}`,
                  }}
                >
                  {/* Snapshot thumbnail */}
                  {s.snapshot ? (
                    <div style={{ flexShrink: 0, position: 'relative' }}>
                      <img
                        src={s.snapshot}
                        alt={`Session ${i + 1} snapshot`}
                        style={{
                          width: '110px', height: '74px',
                          objectFit: 'cover', borderRadius: '6px',
                          border: `2px solid ${severityColor}`, display: 'block',
                        }}
                      />
                      <a
                        href={s.snapshot}
                        download={downloadName}
                        title="Download snapshot"
                        style={{
                          position: 'absolute', bottom: '4px', right: '4px',
                          background: 'rgba(0,0,0,0.7)', borderRadius: '4px',
                          padding: '2px 6px', fontSize: '0.65rem', color: '#e2e8f0',
                          textDecoration: 'none', lineHeight: 1.5,
                        }}
                      >⬇ save</a>
                    </div>
                  ) : (
                    <div style={{
                      flexShrink: 0, width: '110px', height: '74px',
                      borderRadius: '6px', border: '2px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', color: 'rgba(255,255,255,0.2)',
                    }}>📷</div>
                  )}

                  {/* Text info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <span style={{
                        background: PHONE_COLORS[(s.phoneId - 1) % PHONE_COLORS.length] + '33',
                        border: `1px solid ${PHONE_COLORS[(s.phoneId - 1) % PHONE_COLORS.length]}`,
                        borderRadius: '4px', padding: '1px 7px',
                        fontSize: '0.7rem', fontWeight: 700,
                        color: PHONE_COLORS[(s.phoneId - 1) % PHONE_COLORS.length],
                      }}>📱 #{s.phoneId}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: severityTextColor }}>
                        {severityIcon} {formatDuration(s.durationMs)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>
                      🕐 {s.start.toLocaleTimeString()} → {s.end.toLocaleTimeString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {s.start.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '12px', paddingTop: '10px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem',
          }}>
            <span style={{ color: '#94a3b8' }}>
              Total across {sessions.length} session{sessions.length > 1 ? 's' : ''}
            </span>
            <span style={{ fontWeight: 700, color: '#e2e8f0' }}>
              {formatDuration(sessions.reduce((acc, s) => acc + s.durationMs, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneDetectionPage;

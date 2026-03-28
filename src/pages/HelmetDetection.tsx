import { useState, useRef, useEffect, useCallback } from 'react';
import DetectionLayout from '@/components/DetectionLayout';

const HelmetDetectionPage = () => {
  return (
    <DetectionLayout title="Helmet & PPE Detection" subtitle="Real-time helmet, safety vest, and PPE compliance detection" icon="🦺">
      <HelmetWebcamSection />
    </DetectionLayout>
  );
};

const HelmetWebcamSection = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');
  const [detections, setDetections] = useState<any[]>([]);
  const [stats, setStats] = useState({ helmet: 0, no_helmet: 0, person: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<any>(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; videoRef.current.onloadedmetadata = () => { videoRef.current!.play(); setIsStreaming(true); setError(''); }; }
    } catch { setError('Failed to access webcam.'); }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; }
    setIsStreaming(false); setIsDetecting(false); setDetections([]); setStats({ helmet: 0, no_helmet: 0, person: 0 });
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return null;
    const v = videoRef.current, c = canvasRef.current, ctx = c.getContext('2d')!;
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  }, [isStreaming]);

  const drawDetections = useCallback((data: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const v = videoRef.current, c = canvasRef.current, ctx = c.getContext('2d')!;
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(v, 0, 0, c.width, c.height);
    data.detections?.forEach((d: any) => {
      const [x1, y1, x2, y2] = d.box;
      const color = d.label === 'helmet' ? '#28a745' : d.label === 'no_helmet' ? '#dc3545' : '#fd7e14';
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      const label = `${d.label} ${(d.confidence * 100).toFixed(0)}%`;
      ctx.font = '16px Arial'; const tw = ctx.measureText(label).width;
      ctx.fillStyle = color; ctx.fillRect(x1, y1 - 25, tw + 8, 25);
      ctx.fillStyle = 'white'; ctx.fillText(label, x1 + 4, y1 - 8);
    });
    const personCount = data.detections?.filter((d: any) => d.label === 'person').length || 0;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, c.width, 40);
    ctx.fillStyle = 'white'; ctx.font = 'bold 18px Arial';
    ctx.fillText(`🦺 ${data.helmet_count || 0}  ⚠️ ${data.no_helmet_count || 0}  👤 ${personCount}`, 10, 25);
    const status = (data.no_helmet_count || 0) === 0 && (data.helmet_count || 0) > 0 ? '✅ All helmets on' : (data.no_helmet_count || 0) > 0 ? '⚠️ HELMET MISSING!' : '🔍 Scanning...';
    const sc = (data.no_helmet_count || 0) === 0 && (data.helmet_count || 0) > 0 ? '#28a745' : (data.no_helmet_count || 0) > 0 ? '#ffc107' : '#6c757d';
    ctx.fillStyle = sc; ctx.font = 'bold 20px Arial';
    const sw = ctx.measureText(status).width;
    ctx.fillText(status, (c.width - sw) / 2, 25);
  }, []);

  const runDetection = useCallback(async () => {
    if (!isStreaming || !isDetecting) return;
    try {
      const img = captureFrame(); if (!img) return;
      const r = await fetch(img); const blob = await r.blob();
      const fd = new FormData(); fd.append('file', blob, 'webcam_frame.jpg');
      const dr = await fetch('http://localhost:8001/detect', { method: 'POST', body: fd });
      if (!dr.ok) throw new Error(`${dr.status}`);
      const result = await dr.json();
      setDetections(result.detections || []);
      setStats({ helmet: result.helmet_count || 0, no_helmet: result.no_helmet_count || 0, person: result.detections?.filter((d: any) => d.label === 'person').length || 0 });
      drawDetections(result);
    } catch (err) { console.error('Detection error:', err); }
  }, [isStreaming, isDetecting, captureFrame, drawDetections]);

  const startDetection = async () => {
    if (!isStreaming) return;
    try {
      const hr = await fetch('http://localhost:8001/health');
      if (!hr.ok) throw new Error();
      const hd = await hr.json();
      if (!hd.helmet_detector_loaded) { setError('Backend helmet detector not loaded.'); return; }
    } catch { setError('Cannot connect to backend at http://localhost:8001'); return; }
    setIsDetecting(true);
  };

  const stopDetection = () => { setIsDetecting(false); if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; } };

  useEffect(() => () => { stopWebcam(); }, []);
  useEffect(() => {
    if (isDetecting) { if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = setInterval(runDetection, 200); setTimeout(runDetection, 100); }
    else if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; }
  }, [isDetecting]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="font-display text-sm text-foreground uppercase tracking-wider">📹 Real-time Helmet & PPE Detection</h3>
        {!isStreaming ? <button onClick={startWebcam} className="detection-webcam-btn-primary">📷 Start Webcam</button> : (
          <>
            <button onClick={stopWebcam} className="detection-webcam-btn-danger">⏹️ Stop</button>
            {!isDetecting ? <button onClick={startDetection} className="detection-webcam-btn-success">🔍 Start Detection</button> : <button onClick={stopDetection} className="detection-webcam-btn-warning">⏸️ Stop Detection</button>}
          </>
        )}
      </div>
      {error && <div className="detection-error">❌ {error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 detection-video-container">
          <video ref={videoRef} autoPlay playsInline muted style={{ display: isStreaming && !isDetecting ? 'block' : 'none' }} className="w-full" />
          <canvas ref={canvasRef} style={{ display: isDetecting ? 'block' : 'none' }} className="w-full" />
          {!isStreaming && <div className="detection-placeholder">📷 Click "Start Webcam" to begin</div>}
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
          <div className="detection-stat-card"><span className="stat-icon">🦺</span><span className="stat-value">{stats.helmet}</span><span className="stat-label">Helmets</span></div>
          <div className="detection-stat-card"><span className="stat-icon">⚠️</span><span className="stat-value">{stats.no_helmet}</span><span className="stat-label">No Helmet</span></div>
          <div className="detection-stat-card"><span className="stat-icon">👤</span><span className="stat-value">{stats.person}</span><span className="stat-label">Persons</span></div>
        </div>
      </div>
      {detections.length > 0 && (
        <div className="card-surface p-4">
          <h4 className="font-display text-sm text-muted-foreground mb-3 uppercase tracking-wider">Current Detections</h4>
          <div className="space-y-2">
            {detections.map((d: any, i: number) => (
              <div key={i} className="detection-item-row">
                <span className="label">{d.label === 'helmet' ? '🦺' : d.label === 'no_helmet' ? '⚠️' : '👤'} {d.label}</span>
                <span className="confidence">{(d.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelmetDetectionPage;

import { useState, useRef, useEffect, useCallback } from 'react';
import DetectionLayout from '@/components/DetectionLayout';

const FireSmokeDetectionPage = () => {
  const [activeTab, setActiveTab] = useState('upload');
  return (
    <DetectionLayout title="Fire & Smoke Detection" subtitle="Real-time fire and smoke detection using YOLOv8" icon="🔥">
      <div className="space-y-6">
        <div className="flex gap-3">
          <button className={`detection-tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>📤 Upload Image</button>
          <button className={`detection-tab-btn ${activeTab === 'webcam' ? 'active' : ''}`} onClick={() => setActiveTab('webcam')}>📹 Live Detection</button>
        </div>
        {activeTab === 'upload' && <FireSmokeUploadSection />}
        {activeTab === 'webcam' && <FireSmokeWebcamSection />}
      </div>
    </DetectionLayout>
  );
};

const FireSmokeUploadSection = () => {
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
      const response = await fetch('http://localhost:8001/detect-fire-smoke', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setDetections(await response.json());
    } catch (err: any) { setError(`Fire/Smoke detection failed: ${err.message}`); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <button className="detection-upload-btn" onClick={() => fileInputRef.current?.click()}>📷 Choose Image</button>
        {selectedImage && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-body">{selectedImage.name}</span>
            <button className="detection-detect-btn" onClick={detect} disabled={loading}>{loading ? '🔄 Detecting...' : '🔍 Detect Fire & Smoke'}</button>
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
              <p className={detections.fire_count > 0 ? 'detection-message-danger' : detections.smoke_count > 0 ? 'detection-message-warning' : 'detection-message-success'}>{detections.message}</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="detection-stat-card"><span className="stat-icon">🔥</span><span className="stat-value">{detections.fire_count}</span><span className="stat-label">Fires</span></div>
                <div className="detection-stat-card"><span className="stat-icon">💨</span><span className="stat-value">{detections.smoke_count}</span><span className="stat-label">Smoke</span></div>
              </div>
            </div>
          </div>
          {detections.detections?.length > 0 && (
            <div className="card-surface p-4">
              <h3 className="font-display text-sm text-muted-foreground mb-3 uppercase tracking-wider">Detection Details</h3>
              <div className="space-y-2">
                {detections.detections.map((d: any, i: number) => (
                  <div key={i} className="detection-item-row">
                    <span className="label">{d.label === 'fire' ? '🔥' : '💨'} {d.label}</span>
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

const FireSmokeWebcamSection = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');
  const [detections, setDetections] = useState<any[]>([]);
  const [stats, setStats] = useState({ fire: 0, smoke: 0 });
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
    setIsStreaming(false); setIsDetecting(false); setDetections([]); setStats({ fire: 0, smoke: 0 });
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
      const color = d.label === 'fire' ? '#ff0000' : '#808080';
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      const label = `${d.label} ${(d.confidence * 100).toFixed(0)}%`;
      ctx.font = '16px Arial'; const tw = ctx.measureText(label).width;
      ctx.fillStyle = color; ctx.fillRect(x1, y1 - 25, tw + 8, 25);
      ctx.fillStyle = 'white'; ctx.fillText(label, x1 + 4, y1 - 8);
    });
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, c.width, 40);
    ctx.fillStyle = 'white'; ctx.font = 'bold 18px Arial';
    ctx.fillText(`🔥 ${data.fire_count || 0}  💨 ${data.smoke_count || 0}`, 10, 25);
  }, []);

  const runDetection = useCallback(async () => {
    if (!isStreaming || !isDetecting) return;
    try {
      const img = captureFrame(); if (!img) return;
      const r = await fetch(img); const blob = await r.blob();
      const fd = new FormData(); fd.append('file', blob, 'webcam_frame.jpg');
      const dr = await fetch('http://localhost:8001/detect-fire-smoke', { method: 'POST', body: fd });
      if (!dr.ok) throw new Error(`${dr.status}`);
      const result = await dr.json();
      setDetections(result.detections || []); setStats({ fire: result.fire_count || 0, smoke: result.smoke_count || 0 });
      drawDetections(result);
    } catch (err) { console.error('Detection error:', err); }
  }, [isStreaming, isDetecting, captureFrame, drawDetections]);

  const startDetection = async () => {
    if (!isStreaming) return;
    try {
      const hr = await fetch('http://localhost:8001/health');
      if (!hr.ok) throw new Error();
      const hd = await hr.json();
      if (!hd.fire_smoke_detector_loaded) { setError('Backend fire/smoke detector not loaded.'); return; }
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
        <h3 className="font-display text-sm text-foreground uppercase tracking-wider">📹 Real-time Fire & Smoke Detection</h3>
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
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="detection-stat-card"><span className="stat-icon">🔥</span><span className="stat-value">{stats.fire}</span><span className="stat-label">Fires</span></div>
          <div className="detection-stat-card"><span className="stat-icon">💨</span><span className="stat-value">{stats.smoke}</span><span className="stat-label">Smoke</span></div>
        </div>
      </div>
      {detections.length > 0 && (
        <div className="card-surface p-4">
          <h4 className="font-display text-sm text-muted-foreground mb-3 uppercase tracking-wider">Current Detections</h4>
          <div className="space-y-2">
            {detections.map((d: any, i: number) => (
              <div key={i} className="detection-item-row"><span className="label">{d.label === 'fire' ? '🔥' : '💨'} {d.label}</span><span className="confidence">{(d.confidence * 100).toFixed(1)}%</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FireSmokeDetectionPage;

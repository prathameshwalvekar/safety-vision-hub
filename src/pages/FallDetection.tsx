import { useState, useRef, useEffect, useCallback } from 'react';
import DetectionLayout from '@/components/DetectionLayout';

const FallDetectionPage = () => {
  const [activeTab, setActiveTab] = useState('fall-upload');
  return (
    <DetectionLayout title="Fall Detection System" subtitle="Real-time fall detection using YOLOv11" icon="🚨">
      <div className="space-y-6">
        <div className="flex gap-3">
          <button className={`detection-tab-btn ${activeTab === 'fall-upload' ? 'active' : ''}`} onClick={() => setActiveTab('fall-upload')}>📤 Upload Image</button>
          <button className={`detection-tab-btn ${activeTab === 'fall-webcam' ? 'active' : ''}`} onClick={() => setActiveTab('fall-webcam')}>📹 Live Detection</button>
        </div>
        {activeTab === 'fall-upload' && <FallUploadSection />}
        {activeTab === 'fall-webcam' && <FallWebcamSection />}
      </div>
    </DetectionLayout>
  );
};

const FallUploadSection = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [detections, setDetections] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { setSelectedImage(file); setDetections(null); setError(''); }
  };

  const detectFalls = async () => {
    if (!selectedImage) return;
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      const response = await fetch('http://localhost:8001/detect-falls', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setDetections(await response.json());
    } catch (err: any) {
      setError(`Fall detection failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <button className="detection-upload-btn" onClick={() => fileInputRef.current?.click()}>📷 Choose Image</button>
        {selectedImage && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-body">{selectedImage.name}</span>
            <button className="detection-detect-btn" onClick={detectFalls} disabled={loading}>
              {loading ? '🔄 Detecting...' : '🚨 Detect Falls'}
            </button>
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
              <p className={detections.fall_count > 0 ? 'detection-message-danger' : 'detection-message-success'}>{detections.message}</p>
              <div className="grid grid-cols-4 gap-3 mt-4">
                <div className="detection-stat-card"><span className="stat-icon">🚨</span><span className="stat-value">{detections.fall_count}</span><span className="stat-label">Falls</span></div>
                <div className="detection-stat-card"><span className="stat-icon">👥</span><span className="stat-value">{detections.standing_count}</span><span className="stat-label">Standing</span></div>
                <div className="detection-stat-card"><span className="stat-icon">🪑</span><span className="stat-value">{detections.sitting_count}</span><span className="stat-label">Sitting</span></div>
                <div className="detection-stat-card"><span className="stat-icon">😴</span><span className="stat-value">{detections.lying_down_count}</span><span className="stat-label">Lying</span></div>
              </div>
            </div>
          </div>
          {detections.detections?.length > 0 && (
            <div className="card-surface p-4">
              <h3 className="font-display text-sm text-muted-foreground mb-3 uppercase tracking-wider">Detection Details</h3>
              <div className="space-y-2">
                {detections.detections.map((d: any, i: number) => (
                  <div key={i} className="detection-item-row">
                    <span className="label">{d.label === 'fall' ? '🚨' : d.label === 'standing' ? '👥' : d.label === 'sitting' ? '🪑' : '😴'} {d.label}</span>
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

const FallWebcamSection = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');
  const [detections, setDetections] = useState<any[]>([]);
  const [stats, setStats] = useState({ fall: 0, standing: 0, sitting: 0, lying_down: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<any>(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => { videoRef.current!.play(); setIsStreaming(true); setError(''); };
      }
    } catch { setError('Failed to access webcam. Please ensure camera permissions are granted.'); }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; }
    setIsStreaming(false); setIsDetecting(false); setDetections([]); setStats({ fall: 0, standing: 0, sitting: 0, lying_down: 0 });
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return null;
    const video = videoRef.current, canvas = canvasRef.current, ctx = canvas.getContext('2d')!;
    canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, [isStreaming]);

  const drawDetections = useCallback((data: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const video = videoRef.current, canvas = canvasRef.current, ctx = canvas.getContext('2d')!;
    canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    data.detections?.forEach((d: any) => {
      const [x1, y1, x2, y2] = d.box;
      const color = d.label === 'fall' ? '#ff0000' : d.label === 'standing' ? '#00ff00' : d.label === 'sitting' ? '#ffff00' : '#ff00ff';
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      const label = `${d.label} ${(d.confidence * 100).toFixed(0)}%`;
      ctx.font = '16px Arial'; const tw = ctx.measureText(label).width;
      ctx.fillStyle = color; ctx.fillRect(x1, y1 - 25, tw + 8, 25);
      ctx.fillStyle = 'white'; ctx.fillText(label, x1 + 4, y1 - 8);
    });
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, canvas.width, 40);
    ctx.fillStyle = 'white'; ctx.font = 'bold 18px Arial';
    ctx.fillText(`🚨 ${data.fall_count || 0}  👥 ${data.standing_count || 0}  🪑 ${data.sitting_count || 0}  😴 ${data.lying_down_count || 0}`, 10, 25);
  }, []);

  const runDetection = useCallback(async () => {
    if (!isStreaming || !isDetecting) return;
    try {
      const imageData = captureFrame(); if (!imageData) return;
      const resp = await fetch(imageData); const blob = await resp.blob();
      const formData = new FormData(); formData.append('file', blob, 'webcam_frame.jpg');
      const dr = await fetch('http://localhost:8001/detect-falls', { method: 'POST', body: formData });
      if (!dr.ok) throw new Error(`Detection failed: ${dr.status}`);
      const result = await dr.json();
      setDetections(result.detections || []);
      setStats({ fall: result.fall_count || 0, standing: result.standing_count || 0, sitting: result.sitting_count || 0, lying_down: result.lying_down_count || 0 });
      drawDetections(result);
    } catch (err) { console.error('Detection error:', err); }
  }, [isStreaming, isDetecting, captureFrame, drawDetections]);

  const startDetection = async () => {
    if (!isStreaming) return;
    try {
      const hr = await fetch('http://localhost:8001/health');
      if (!hr.ok) throw new Error('Backend not responding');
      const hd = await hr.json();
      if (!hd.fall_detector_loaded) { setError('Backend fall detector not loaded.'); return; }
    } catch { setError('Cannot connect to backend at http://localhost:8001'); return; }
    setIsDetecting(true);
  };

  const stopDetection = () => { setIsDetecting(false); if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; } };

  useEffect(() => { return () => { stopWebcam(); }; }, []);
  useEffect(() => {
    if (isDetecting) {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = setInterval(runDetection, 200);
      setTimeout(runDetection, 100);
    } else if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; }
  }, [isDetecting]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="font-display text-sm text-foreground uppercase tracking-wider">📹 Real-time Fall Detection</h3>
        {!isStreaming ? (
          <button onClick={startWebcam} className="detection-webcam-btn-primary">📷 Start Webcam</button>
        ) : (
          <>
            <button onClick={stopWebcam} className="detection-webcam-btn-danger">⏹️ Stop Webcam</button>
            {!isDetecting ? <button onClick={startDetection} className="detection-webcam-btn-success">🚨 Start Detection</button>
              : <button onClick={stopDetection} className="detection-webcam-btn-warning">⏸️ Stop Detection</button>}
          </>
        )}
      </div>
      {error && <div className="detection-error">❌ {error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 detection-video-container">
          <video ref={videoRef} autoPlay playsInline muted style={{ display: isStreaming && !isDetecting ? 'block' : 'none' }} className="w-full" />
          <canvas ref={canvasRef} style={{ display: isDetecting ? 'block' : 'none' }} className="w-full" />
          {!isStreaming && <div className="detection-placeholder">📷 Click "Start Webcam" to begin</div>}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="detection-stat-card"><span className="stat-icon">🚨</span><span className="stat-value">{stats.fall}</span><span className="stat-label">Falls</span></div>
          <div className="detection-stat-card"><span className="stat-icon">👥</span><span className="stat-value">{stats.standing}</span><span className="stat-label">Standing</span></div>
          <div className="detection-stat-card"><span className="stat-icon">🪑</span><span className="stat-value">{stats.sitting}</span><span className="stat-label">Sitting</span></div>
          <div className="detection-stat-card"><span className="stat-icon">😴</span><span className="stat-value">{stats.lying_down}</span><span className="stat-label">Lying Down</span></div>
        </div>
      </div>
      {detections.length > 0 && (
        <div className="card-surface p-4">
          <h4 className="font-display text-sm text-muted-foreground mb-3 uppercase tracking-wider">Current Detections</h4>
          <div className="space-y-2">
            {detections.map((d: any, i: number) => (
              <div key={i} className="detection-item-row">
                <span className="label">{d.label === 'fall' ? '🚨' : d.label === 'standing' ? '👥' : d.label === 'sitting' ? '🪑' : '😴'} {d.label}</span>
                <span className="confidence">{(d.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FallDetectionPage;

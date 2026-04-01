import { useState, useRef, useEffect, useCallback } from 'react';
import DetectionLayout from '@/components/DetectionLayout';

const RestrictedAreaDetectionPage = () => {
  return (
    <DetectionLayout 
      title="Restricted Area Detection" 
      subtitle="Real-time monitoring with customizable restricted zones" 
      icon="🚫"
    >
      <RestrictedAreaWebcamSection />
    </DetectionLayout>
  );
};

const RestrictedAreaWebcamSection = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');
  const [detections, setDetections] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, near_restricted: 0, alert_triggered: false });
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [alertClasses, setAlertClasses] = useState<string[]>([]);
  const [areaType, setAreaType] = useState<'polygon' | 'ellipse'>('ellipse');
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [areaPoints, setAreaPoints] = useState<{x: number, y: number}[]>([]);
  const [ellipseCenter, setEllipseCenter] = useState<{x: number, y: number} | null>(null);
  const [ellipseAxes, setEllipseAxes] = useState<{width: number, height: number} | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<any>(null);

  // Load available classes on component mount
  useEffect(() => {
    loadAvailableClasses();
  }, []);

  const loadAvailableClasses = async () => {
    try {
      const response = await fetch('http://localhost:8001/restricted-area/classes');
      const data = await response.json();
      if (data.classes) {
        setAvailableClasses(data.classes);
        if (data.classes.length > 0) {
          setSelectedClasses([data.classes[0]]);
        }
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: 'user' 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play();
          setIsStreaming(true);
          setError('');
        };
      }
    } catch {
      setError('Failed to access webcam.');
    }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsStreaming(false);
    setIsDetecting(false);
    setDetections([]);
    setStats({ total: 0, near_restricted: 0, alert_triggered: false });
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return null;
    const v = videoRef.current, c = canvasRef.current, ctx = c.getContext('2d')!;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  }, [isStreaming]);

  const drawRestrictedArea = useCallback(() => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    const v = videoRef.current, c = overlayCanvasRef.current, ctx = c.getContext('2d')!;
    // Always sync canvas resolution to actual video resolution
    const vw = v.videoWidth || 640;
    const vh = v.videoHeight || 480;
    if (c.width !== vw || c.height !== vh) {
      c.width = vw;
      c.height = vh;
    }
    ctx.clearRect(0, 0, c.width, c.height);
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
    
    if (areaType === 'polygon' && areaPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(areaPoints[0].x, areaPoints[0].y);
      areaPoints.forEach(point => ctx.lineTo(point.x, point.y));
      if (areaPoints.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();
      
      // Draw control points
      areaPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
      });
    } else if (areaType === 'ellipse' && ellipseCenter && ellipseAxes) {
      ctx.beginPath();
      ctx.ellipse(ellipseCenter.x, ellipseCenter.y, ellipseAxes.width/2, ellipseAxes.height/2, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }, [areaType, areaPoints, ellipseCenter, ellipseAxes]);

  useEffect(() => {
    if (isStreaming) {
      drawRestrictedArea();
    }
  }, [isStreaming, drawRestrictedArea]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingArea || !overlayCanvasRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Scale from CSS display pixels → actual canvas pixel coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (areaType === 'polygon') {
      setAreaPoints([...areaPoints, { x, y }]);
    } else if (areaType === 'ellipse') {
      if (!ellipseCenter) {
        setEllipseCenter({ x, y });
      } else if (!ellipseAxes) {
        const width = Math.abs(x - ellipseCenter.x) * 2;
        const height = Math.abs(y - ellipseCenter.y) * 2;
        setEllipseAxes({ width, height });
      }
    }
  };

  const startDrawingArea = () => {
    setIsDrawingArea(true);
    setAreaPoints([]);
    setEllipseCenter(null);
    setEllipseAxes(null);
  };

  const finishDrawingArea = async () => {
    // Validate the drawing is complete before sending
    if (areaType === 'ellipse') {
      if (!ellipseCenter) {
        setError('Please click to set the ellipse center first.');
        return;
      }
      if (!ellipseAxes) {
        setError('Please click again to set the ellipse radius.');
        return;
      }
    } else if (areaType === 'polygon') {
      if (areaPoints.length < 3) {
        setError('Please add at least 3 points to define the polygon.');
        return;
      }
    }

    setIsDrawingArea(false);
    setError('');

    try {
      if (areaType === 'ellipse') {
        const response = await fetch('http://localhost:8001/restricted-area/set-ellipse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            center: [Math.round(ellipseCenter!.x), Math.round(ellipseCenter!.y)],
            axes: [Math.round(ellipseAxes!.width), Math.round(ellipseAxes!.height)],
            selected_classes: selectedClasses,
            alert_classes: alertClasses
          })
        });
        if (response.ok) console.log('Elliptical restricted area set successfully');
      } else {
        const response = await fetch('http://localhost:8001/restricted-area/set-polygon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            area_coords: areaPoints.map(p => [Math.round(p.x), Math.round(p.y)]),
            selected_classes: selectedClasses,
            alert_classes: alertClasses
          })
        });
        if (response.ok) console.log('Polygon restricted area set successfully');
      }
    } catch (err) {
      setError('Failed to set restricted area. Is the backend running?');
      console.error('Failed to set restricted area:', err);
    }
  };

  const detectFrame = async () => {
    const imageData = captureFrame();
    if (!imageData) return;
    
    try {
      const blob = await (await fetch(imageData)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');
      
      const response = await fetch('http://localhost:8001/restricted-area/detect-visual', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        setDetections(data.detections || []);
        setStats({
          total: data.detections?.length || 0,
          near_restricted: data.near_restricted ? 1 : 0,
          alert_triggered: data.alert_triggered
        });
        
        // Draw annotated image
        if (canvasRef.current && data.annotated_image) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvasRef.current!.getContext('2d')!;
            ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = data.annotated_image;
        }
      }
    } catch (err) {
      console.error('Detection failed:', err);
    }
  };

  const startDetection = () => {
    if (!isStreaming) return;
    setIsDetecting(true);
    detectFrame(); // Initial detection
    detectionIntervalRef.current = setInterval(detectFrame, 1000); // Detect every second
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card-surface p-4">
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-primary">Camera Controls</h3>
          <div className="space-y-3">
            {!isStreaming ? (
              <button
                onClick={startWebcam}
                className="detection-webcam-btn-primary w-full"
              >
                Start Camera
              </button>
            ) : (
              <button
                onClick={stopWebcam}
                className="detection-webcam-btn-danger w-full"
              >
                Stop Camera
              </button>
            )}
            {isStreaming && !isDetecting ? (
              <button
                onClick={startDetection}
                className="detection-webcam-btn-success w-full"
              >
                Start Detection
              </button>
            ) : (
              isStreaming && (
                <button
                  onClick={stopDetection}
                  className="detection-webcam-btn-warning w-full"
                >
                  Stop Detection
                </button>
              )
            )}
          </div>
        </div>

        <div className="card-surface p-4">
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-accent">Restricted Area</h3>
          <div className="space-y-3">
            <select
              value={areaType}
              onChange={(e) => setAreaType(e.target.value as 'polygon' | 'ellipse')}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ellipse">Ellipse</option>
              <option value="polygon">Polygon</option>
            </select>
            {!isDrawingArea ? (
              <button
                onClick={startDrawingArea}
                className="detection-webcam-btn-primary w-full bg-accent hover:brightness-110"
              >
                Draw Area
              </button>
            ) : (
              <button
                onClick={finishDrawingArea}
                disabled={
                  areaType === 'ellipse'
                    ? !ellipseCenter || !ellipseAxes
                    : areaPoints.length < 3
                }
                className="detection-webcam-btn-success w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Finish Area
              </button>
            )}
            {isDrawingArea && (
              <p className="text-xs font-body" style={{ color: areaType === 'ellipse' ? (ellipseCenter && ellipseAxes ? '#22c55e' : '#facc15') : (areaPoints.length >= 3 ? '#22c55e' : '#facc15') }}>
                {areaType === 'ellipse'
                  ? !ellipseCenter
                    ? '① Click on live feed to set center'
                    : !ellipseAxes
                      ? '② Click again to set radius — then press Finish'
                      : '✅ Ellipse ready — press Finish Area'
                  : areaPoints.length < 3
                    ? `① Click to add points (${areaPoints.length}/3 minimum)`
                    : `✅ ${areaPoints.length} points — press Finish Area`
                }
              </p>
            )}
          </div>
        </div>

        <div className="card-surface p-4">
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-primary">Detection Classes</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableClasses.map(cls => (
              <label key={cls} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClasses.includes(cls)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClasses([...selectedClasses, cls]);
                    } else {
                      setSelectedClasses(selectedClasses.filter(c => c !== cls));
                    }
                  }}
                  className="rounded border-border bg-secondary text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-body text-foreground">{cls}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Video Feed */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="detection-video-container flex-1">
          <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-3 text-primary">Live Feed</h4>
          <video
            ref={videoRef}
            className="w-full h-auto"
            style={{ display: isStreaming ? 'block' : 'none' }}
          />
          <canvas
            ref={overlayCanvasRef}
            onClick={handleCanvasClick}
            className="absolute top-0 left-0 w-full h-auto cursor-crosshair"
            style={{ display: isStreaming ? 'block' : 'none' }}
          />
          {!isStreaming && (
            <div className="detection-placeholder">
              Camera not started
            </div>
          )}
        </div>
        <div className="detection-video-container flex-1">
          <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-3 text-accent">Detection Result</h4>
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{ display: isDetecting ? 'block' : 'none' }}
          />
          {!isDetecting && (
            <div className="detection-placeholder">
              Detection not started
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="detection-stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Detections</div>
        </div>
        <div className="detection-stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{stats.near_restricted}</div>
          <div className="stat-label">Near Restricted</div>
        </div>
        <div className="detection-stat-card">
          <div className="stat-icon">{stats.alert_triggered ? '🚨' : '✅'}</div>
          <div className="stat-value">{stats.alert_triggered ? 'ALERT' : 'Clear'}</div>
          <div className="stat-label">Alert Status</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="detection-error">
          {error}
        </div>
      )}

      {/* Detections List */}
      {detections.length > 0 && (
        <div className="card-surface p-4">
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-primary">Current Detections</h3>
          <div className="space-y-2">
            {detections.map((det, idx) => (
              <div key={idx} className="detection-item-row">
                <span className="label font-medium">{det.class}</span>
                <span className="confidence">
                  {(det.confidence * 100).toFixed(1)}%
                </span>
                {det.near_restricted && (
                  <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded font-display font-semibold">
                    Near Restricted
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestrictedAreaDetectionPage;

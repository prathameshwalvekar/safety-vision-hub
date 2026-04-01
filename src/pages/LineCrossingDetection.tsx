import DetectionLayout from '@/components/DetectionLayout';

const LineCrossingDetection = () => {
  return (
    <DetectionLayout 
      title="Line Crossing Detection" 
      subtitle="Virtual fence monitoring with Lakshman Rekha technology" 
      icon="🚧"
    >
      <div className="card-surface p-8 text-center border-dashed border-2 border-border">
        <h3 className="text-xl font-display font-bold mb-4">Line Crossing Detection System</h3>
        <p className="text-muted-foreground font-body max-w-md mx-auto mb-6">
          Monitor virtual perimeters and get instant alerts when any object or person crosses the defined boundary lines.
        </p>
        <div className="flex justify-center gap-4">
          <div className="px-4 py-2 bg-secondary rounded-lg text-xs font-semibold uppercase tracking-wider text-primary">Feature Coming Soon</div>
        </div>
      </div>
    </DetectionLayout>
  );
};

export default LineCrossingDetection;

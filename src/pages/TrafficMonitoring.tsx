import DetectionLayout from '@/components/DetectionLayout';

const TrafficMonitoring = () => {
  return (
    <DetectionLayout 
      title="Traffic Monitoring" 
      subtitle="Vehicle flow analysis and classification" 
      icon="🚦"
    >
      <div className="card-surface p-8 text-center border-dashed border-2 border-border">
        <h3 className="text-xl font-display font-bold mb-4">Traffic Analysis & Counting</h3>
        <p className="text-muted-foreground font-body max-w-md mx-auto mb-6">
          Real-time vehicle counting, classification and traffic flow analysis with heatmaps and historical data.
        </p>
        <div className="flex justify-center gap-4">
          <div className="px-4 py-2 bg-secondary rounded-lg text-xs font-semibold uppercase tracking-wider text-primary">Feature Coming Soon</div>
        </div>
      </div>
    </DetectionLayout>
  );
};

export default TrafficMonitoring;

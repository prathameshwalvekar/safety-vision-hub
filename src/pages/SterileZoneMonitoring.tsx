import DetectionLayout from '@/components/DetectionLayout';

const SterileZoneMonitoring = () => {
  return (
    <DetectionLayout 
      title="Sterile & Zone Monitoring" 
      subtitle="Comprehensive area surveillance and access control" 
      icon="🛡️"
    >
      <div className="card-surface p-8 text-center border-dashed border-2 border-border">
        <h3 className="text-xl font-display font-bold mb-4">Sterile Zone Monitoring System</h3>
        <p className="text-muted-foreground font-body max-w-md mx-auto mb-6">
          Monitor sensitive zones and areas and automatically detect any unauthorized entry or presence with real-time analytics.
        </p>
        <div className="flex justify-center gap-4">
          <div className="px-4 py-2 bg-secondary rounded-lg text-xs font-semibold uppercase tracking-wider text-primary">Feature Coming Soon</div>
        </div>
      </div>
    </DetectionLayout>
  );
};

export default SterileZoneMonitoring;

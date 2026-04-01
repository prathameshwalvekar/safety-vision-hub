import DetectionLayout from '@/components/DetectionLayout';

const NoParkingDetection = () => {
  return (
    <DetectionLayout 
      title="No Parking Detection" 
      subtitle="Automated enforcement for restricted parking zones" 
      icon="⛔"
    >
      <div className="card-surface p-8 text-center border-dashed border-2 border-border">
        <h3 className="text-xl font-display font-bold mb-4">Parking Enforcement System</h3>
        <p className="text-muted-foreground font-body max-w-md mx-auto mb-6">
          Instantly detect vehicles parked in no-parking zones or blocking access with license plate capture and time tracking.
        </p>
        <div className="flex justify-center gap-4">
          <div className="px-4 py-2 bg-secondary rounded-lg text-xs font-semibold uppercase tracking-wider text-primary">Feature Coming Soon</div>
        </div>
      </div>
    </DetectionLayout>
  );
};

export default NoParkingDetection;

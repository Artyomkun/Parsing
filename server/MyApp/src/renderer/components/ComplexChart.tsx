import { useEffect, useState } from "react";

const ProgressComponent = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 95));
    }, 100);
    return () => {
      clearInterval(interval);
      setProgress(100); 
    };
  }, []); 

  return (
    <div>
      <div style={{ width: `${progress}%`, backgroundColor: 'blue', height: '20px' }} />
      <p>Progress: {progress}%</p>
    </div>
  );
};

export default ProgressComponent;
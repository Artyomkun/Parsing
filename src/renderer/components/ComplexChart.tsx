import { useState } from "react";

const [progress, setProgress] = useState(0);

// В обработчике
const interval = setInterval(() => {
  setProgress(prev => Math.min(prev + 5, 95));
}, 100);

// После завершения
clearInterval(interval);
setProgress(100);


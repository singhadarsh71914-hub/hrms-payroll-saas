const fs = require('fs');

const file = 'client/src/pages/EmployeeDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (session?.checkedIn && !session?.checkOut) {
      interval = setInterval(() => setDuration(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (showCamera && !modelsLoaded && !BYPASS_LIVENESS) {
      const initModels = async () => {
        try {
          const faceapi = await import('@vladmandic/face-api');
          await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
          ]);
          setModelsLoaded(true);
        } catch (err) {
          console.error("Failed to load face-api models", err);
        }
      };
      initModels();
    }
  }, [showCamera, modelsLoaded]);

  const initiateAttendance = (type: 'IN' | 'OUT') => {
    setActionType(type);
    setShowCamera(true);
  };`;

content = content.replace(/  useEffect\(\(\) \=\> \{\n    let interval\: ReturnType\<typeof setInterval\>\;\n  \}\;/, replacement);
fs.writeFileSync(file, content);
console.log('Restored deleted lines in EmployeeDashboard.tsx');

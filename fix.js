const fs = require('fs');
let c = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

const target = `  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    soundFx.setAmbientVolume(vol);
  };
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType | 'none'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [isAmbientMenuOpen, setIsAmbientMenuOpen] = useState(false);
  useEffect(() => { return () => { soundFx.stopAmbient(); }; }, []);
  const handleAmbientChange = (type: AmbientSoundType | 'none') => { setAmbientSound(type); if (type === 'none') { soundFx.stopAmbient(); } else { soundFx.startAmbient(type, ambientVolume); } };
  const handleVolumeChange = (vol: number) => { setAmbientVolume(vol); soundFx.setAmbientVolume(vol); };`;

const replacement = `  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    soundFx.setAmbientVolume(vol);
  };`;

c = c.replace(target, replacement);
fs.writeFileSync('src/components/timer/StudyTimer.tsx', c);

$file = 'src/context/StudyContext.tsx'
$content = Get-Content $file -Raw

# 1. Add isBlockedByOtherTab to Context Type
$content = $content.Replace('  isIdleCheckActive: boolean;', "  isIdleCheckActive: boolean;
  isBlockedByOtherTab: boolean;")

# 2. Add state
$targetState = '  const [isIdleCheckActive, setIsIdleCheckActive] = useState(false);'
$replacementState = '  const [isIdleCheckActive, setIsIdleCheckActive] = useState(false);
  const [isBlockedByOtherTab, setIsBlockedByOtherTab] = useState(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);'
$content = $content.Replace($targetState, $replacementState)

# 3. Add to provider value
$content = $content.Replace('      isIdleCheckActive,', "      isIdleCheckActive,
      isBlockedByOtherTab,")

Set-Content $file -Value $content

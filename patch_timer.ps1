$file = 'src/components/timer/StudyTimer.tsx'
$content = Get-Content $file -Raw

$targetDestructure = '    isStudying,
    isPaused,
    isRunning,'
$replacementDestructure = '    isStudying,
    isPaused,
    isRunning,
    isBlockedByOtherTab,'
$content = $content.Replace($targetDestructure, $replacementDestructure)

$targetBanner = '{/* Focus Mode Toggle */}'
$replacementBanner = '{isBlockedByOtherTab && !isStudying && (
        <div className="w-full max-w-xl mx-auto mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-center text-center animate-in fade-in slide-in-from-top-4">
          <span className="text-amber-500 text-sm font-medium">
            ?? Study session active in another tab. Switch to your active tab or close it to continue here.
          </span>
        </div>
      )}

      {/* Focus Mode Toggle */}'
$content = $content.Replace($targetBanner, $replacementBanner)

# Disable start buttons
$targetBtn1 = '<button
                onClick={handleStart}'
$replacementBtn1 = '<button
                disabled={isBlockedByOtherTab}
                onClick={handleStart}'
$content = $content.Replace($targetBtn1, $replacementBtn1)

$targetBtn2 = '<button
                onClick={resumeTimer}'
$replacementBtn2 = '<button
                disabled={isBlockedByOtherTab}
                onClick={resumeTimer}'
$content = $content.Replace($targetBtn2, $replacementBtn2)

Set-Content $file -Value $content

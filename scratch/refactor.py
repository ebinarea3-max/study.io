import re

with open('src/components/RankSettlementModal.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
content = content.replace("import Image from 'next/image';", "import Image from 'next/image';\nimport { AnimatePresence, motion } from 'framer-motion';")

# 2. State cleanup
content = content.replace("const [revealMode, setRevealMode] = useState<'idle' | 'impact-hit-small' | 'impact-hit-large'>('idle');", "const [punchMode, setPunchMode] = useState<'idle' | 'small' | 'large'>('idle');")
content = content.replace("setRevealMode('idle')", "setPunchMode('idle')")
content = content.replace("setRevealMode('impact-hit-small')", "setPunchMode('small')")
content = content.replace("setRevealMode('impact-hit-large')", "setPunchMode('large')")
content = re.sub(r'const \[revealDuration.*?350\);', '', content, flags=re.DOTALL)
content = re.sub(r'const \[showRevealFlash.*?\]\);', '', content, flags=re.DOTALL) # remove showRevealFlash, revealParticles
content = re.sub(r'const \[showPulseGlow.*?false\);', '', content, flags=re.DOTALL)

# Cleanup in useEffect
content = content.replace("setShowRevealFlash(false);", "")
content = content.replace("setRevealParticles([]);", "")
content = content.replace("setShowPulseGlow(false);", "")
content = content.replace("setRevealMode('idle');", "setPunchMode('idle');")

content = re.sub(r'// Flash\s+setShowRevealFlash\(true\);\s+timers\.push\(setTimeout\(\(\) => setShowRevealFlash\(false\), \d+\)\);', '', content)
content = re.sub(r'// Flash\s+setShowRevealFlash\(true\);\s+timers\.push\(setTimeout\(\(\) => setShowRevealFlash\(false\), \d+\)\);', '', content)

content = re.sub(r'// Final resolve particles.*?timers\.push\(setTimeout\(\(\) => setRevealParticles\(\[\]\), 500\)\);', '', content, flags=re.DOTALL)

# 3. Replace the badge rendering area
new_container = """
          {/* CHROMATIC ABERRATION PULSE & MASS SLAM REPLACED WITH NEW CREST */}
          <div className="relative mx-auto mb-4 flex items-center justify-center perspective-[1000px] w-full h-[280px]">
            <motion.div 
              className="relative w-full h-full flex items-center justify-center transform-gpu z-10"
              animate={
                punchMode === 'small' 
                  ? { scale: [1, 0.88, 1.05, 1], transition: { duration: 0.3, type: "spring", stiffness: 400, damping: 12 } }
                  : punchMode === 'large'
                  ? { scale: [1, 0.75, 1.12, 1], transition: { duration: 0.5, type: "spring", stiffness: 300, damping: 10 } }
                  : { scale: 1 }
              }
            >
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={displayRank.fullTitle}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    enter: { duration: 0.25 },
                    exit: { duration: 0.2 }
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <RankCrestBadge
                    tier={displayRank.tier}
                    division={displayRank.division}
                    size={192}
                    className={animPhase !== 'slam' && animPhase !== 'impact' && punchMode === 'idle' ? "animate-in zoom-in spin-in-12 duration-700 ease-out" : ""}
                    isSettled={animPhase !== 'slam' && animPhase !== 'impact' && punchMode === 'idle'}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
            
            {/* SHEDDING SHARDS */}
            {shatterShards.length > 0 && !prefersReducedMotion && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                {shatterShards.map((s) => (
                  <div
                    key={s.id}
                    className="absolute pointer-events-none rounded-sm"
                    style={{
                      width: `${s.size}px`,
                      height: `${s.size}px`,
                      background: `linear-gradient(135deg, ${s.color} 0%, ${s.color}99 100%)`,
                      boxShadow: `0 0 8px ${s.color}66`,
                      animation: `shatterOutAnim ${s.dur}ms cubic-bezier(0.1, 1, 0.3, 1) forwards ${s.delay}ms`,
                      opacity: 0,
                      ['--target-x' as string]: `${s.x}px`,
                      ['--target-y' as string]: `${s.y}px`,
                      ['--target-rot' as string]: `${s.rot}deg`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
"""

content = re.sub(r'\{\/\* CHROMATIC ABERRATION PULSE & MASS SLAM REPLACED WITH NEW CREST \*\/}.*?\{\/\* ==========================================\s*TEXT REVEAL:', new_container + '\n        {/* ==========================================\n            TEXT REVEAL:', content, flags=re.DOTALL)


# 4. Remove `getContainerStyle`
content = re.sub(r'const getContainerStyle = \(\) => \{.*?\};\n', '', content, flags=re.DOTALL)

# 5. CSS cleanup
content = re.sub(r'/\* 10\. SIMPLE FADE IN \(Reduced Motion Mode\) \*/.*?@keyframes simpleFadeIn \{.*?\}.*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'@keyframes impactPunchSmall \{.*?\}.*?@keyframes fadeOutOldBadge \{.*?\}.*?@keyframes pulseGlowRing \{.*?\}', '', content, flags=re.DOTALL)


with open('src/components/RankSettlementModal.tsx', 'w') as f:
    f.write(content)

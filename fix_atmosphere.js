const fs = require('fs');
let c = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

const targetUI = `              {/* Atmosphere UI */}
              <div className="relative">
                <button
                  onClick={() => setIsAmbientMenuOpen(!isAmbientMenuOpen)}
                  className="bg-white/[0.04] border border-white/10 hover:border-[var(--tier-border)] text-neutral-300 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer select-none"
                >
                  <Music className={\`w-3.5 h-3.5 \${ambientSound !== 'none' ? 'text-[var(--tier-accent)]' : 'text-neutral-400'}\`} />
                  <span className="tracking-tight hidden sm:inline">
                    Atmosphere: {
                      ambientSound === 'pinknoise' ? 'Pink Noise' :
                      ambientSound === 'brownnoise' ? 'Brown Noise' :
                      ambientSound === 'whitenoise' ? 'White Noise' :
                      ambientSound === 'rain' ? 'Rain' :
                      ambientSound === 'campfire' ? 'Fireplace' : 'Silent'
                    }
                  </span>
                  <span className="tracking-tight sm:hidden">
                    Sound
                  </span>
                  {ambientSound !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--tier-accent)] animate-pulse ml-0.5" />}
                  <ChevronUp className={\`w-3.5 h-3.5 text-neutral-500 transition-transform \${isAmbientMenuOpen ? 'rotate-180' : ''}\`} />
                </button>

                {isAmbientMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsAmbientMenuOpen(false)} 
                    />
                    <div className="absolute top-full right-0 mt-2 z-[100] bg-[#0e1015]/95 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 shadow-2xl min-w-[220px] animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="flex flex-col gap-1">
                        {[
                          { id: 'none', label: 'Silent', icon: <span className="w-3.5 h-3.5 rounded-full bg-neutral-300 mx-0.5" /> },
                          { id: 'pinknoise', label: 'Pink Noise', icon: <Radio className="w-4 h-4" /> },
                          { id: 'brownnoise', label: 'Brown Noise', icon: <Headphones className="w-4 h-4" /> },
                          { id: 'whitenoise', label: 'White Noise', icon: <Radio className="w-4 h-4" /> },
                          { id: 'rain', label: 'Rain', icon: <CloudRain className="w-4 h-4" /> },
                          { id: 'campfire', label: 'Fireplace', icon: <Flame className="w-4 h-4" /> }
                        ].map(option => (
                          <button
                            key={option.id}
                            onClick={(e) => {
                              // setTimeout prevents the click-through issue where an element underneath gets clicked
                              e.preventDefault();
                              e.stopPropagation();
                              handleAmbientChange(option.id as any);
                              setTimeout(() => setIsAmbientMenuOpen(false), 50);
                            }}
                            className={\`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer \${
                              ambientSound === option.id 
                                ? 'bg-[var(--tier-accent)]/[0.15] text-[var(--tier-accent)]' 
                                : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                            }\`}
                          >
                            <div className="flex items-center gap-2.5">
                              {option.icon}
                              <span>{option.label}</span>
                            </div>
                            {ambientSound === option.id && <Check className="w-4 h-4 text-[var(--tier-accent)]" />}
                          </button>
                        ))}
                      </div>

                      {ambientSound !== 'none' && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-3 px-2">
                          <Volume2 className="w-4 h-4 text-neutral-500" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={ambientVolume}
                            onClick={e => e.stopPropagation()}
                            onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                            className="flex-1 accent-[var(--tier-accent)] bg-white/10 rounded-lg cursor-pointer h-1.5"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>`;

const target1 = \`              {/* Atmosphere UI */}
              <div className="relative">
                <button
                  onClick={() => setIsAmbientMenuOpen(!isAmbientMenuOpen)}
                  className="bg-white/[0.04] border border-white/10 hover:border-[var(--tier-border)] text-neutral-300 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer select-none"
                >
                  <Music className={\\\`w-3.5 h-3.5 \${ambientSound !== 'none' ? 'text-[var(--tier-accent)]' : 'text-neutral-400'}\\\`} />
                  <span className="tracking-tight hidden sm:inline">
                    Atmosphere: {
                      ambientSound === 'pinknoise' ? 'Pink Noise' :
                      ambientSound === 'brownnoise' ? 'Brown Noise' :
                      ambientSound === 'whitenoise' ? 'White Noise' :
                      ambientSound === 'rain' ? 'Rain' :
                      ambientSound === 'campfire' ? 'Fireplace' : 'Silent'
                    }
                  </span>
                  <span className="tracking-tight sm:hidden">
                    Sound
                  </span>
                  {ambientSound !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--tier-accent)] animate-pulse ml-0.5" />}
                  <ChevronUp className={\\\`w-3.5 h-3.5 text-neutral-500 transition-transform \${isAmbientMenuOpen ? 'rotate-180' : ''}\\\`} />
                </button>

                {isAmbientMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsAmbientMenuOpen(false)} 
                    />
                    <div className="absolute top-full right-0 mt-2 z-50 bg-[#0e1015]/95 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 shadow-2xl min-w-[220px] animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="flex flex-col gap-1">
                        {[
                          { id: 'none', label: 'Silent', icon: <span className="w-3.5 h-3.5 rounded-full bg-neutral-300 mx-0.5" /> },
                          { id: 'pinknoise', label: 'Pink Noise', icon: <Radio className="w-4 h-4" /> },
                          { id: 'brownnoise', label: 'Brown Noise', icon: <Headphones className="w-4 h-4" /> },
                          { id: 'whitenoise', label: 'White Noise', icon: <Radio className="w-4 h-4" /> },
                          { id: 'rain', label: 'Rain', icon: <CloudRain className="w-4 h-4" /> },
                          { id: 'campfire', label: 'Fireplace', icon: <Flame className="w-4 h-4" /> }
                        ].map(option => (
                          <button
                            key={option.id}
                            onClick={() => {
                              handleAmbientChange(option.id as any);
                              setIsAmbientMenuOpen(false);
                            }}
                            className={\\\`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer \${
                              ambientSound === option.id 
                                ? 'bg-[var(--tier-accent)]/[0.15] text-[var(--tier-accent)]' 
                                : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                            }\\\`}
                          >
                            <div className="flex items-center gap-2.5">
                              {option.icon}
                              <span>{option.label}</span>
                            </div>
                            {ambientSound === option.id && <Check className="w-4 h-4 text-[var(--tier-accent)]" />}
                          </button>
                        ))}
                      </div>

                      {ambientSound !== 'none' && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-3 px-2">
                          <Volume2 className="w-4 h-4 text-neutral-500" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={ambientVolume}
                            onClick={e => e.stopPropagation()}
                            onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                            className="flex-1 accent-[var(--tier-accent)] bg-white/10 rounded-lg cursor-pointer h-1.5"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>\`;

const rep1 = \`              <div className="hidden sm:block">
\${targetUI}
              </div>\`;

let cReplaced = c.replace(target1, rep1);
if (cReplaced === c) {
  // try replacing CRLF if needed
  cReplaced = c.replace(target1.replace(/\\n/g, '\\r\\n'), rep1);
}
c = cReplaced;

const targetBottom = \`                  <button
                    onClick={handleReset}
                    disabled={isSaving || isRemoteTransitioning}
                    className="p-3 rounded-xl bg-[var(--surface)] backdrop-blur-xl hover:bg-[#1B2028] border border-[var(--border)] text-slate-400 hover:text-white transition-colors active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>\`;

const repBottom = \`                  <button
                    onClick={handleReset}
                    disabled={isSaving || isRemoteTransitioning}
                    className="p-3 rounded-xl bg-[var(--surface)] backdrop-blur-xl hover:bg-[#1B2028] border border-[var(--border)] text-slate-400 hover:text-white transition-colors active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="sm:hidden mt-6 flex justify-center w-full">
\${targetUI.replace('right-0 mt-2', 'left-1/2 -translate-x-1/2 mt-2')}
          </div>
        </div>\`;

cReplaced = c.replace(targetBottom, repBottom);
if (cReplaced === c) {
  cReplaced = c.replace(targetBottom.replace(/\\n/g, '\\r\\n'), repBottom);
}
c = cReplaced;

fs.writeFileSync('src/components/timer/StudyTimer.tsx', c);

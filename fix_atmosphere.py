import sys

with open('src/components/timer/StudyTimer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_ui = '''              {/* Atmosphere UI */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setIsAmbientMenuOpen(!isAmbientMenuOpen)}
                  className="bg-white/[0.04] border border-white/10 hover:border-[var(--tier-border)] text-neutral-300 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer select-none"
                >
                  <Music className={`w-3.5 h-3.5 ${ambientSound !== 'none' ? 'text-[var(--tier-accent)]' : 'text-neutral-400'}`} />
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
                  <ChevronUp className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${isAmbientMenuOpen ? 'rotate-180' : ''}`} />
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
                              e.preventDefault();
                              e.stopPropagation();
                              handleAmbientChange(option.id as any);
                              setTimeout(() => setIsAmbientMenuOpen(false), 50);
                            }}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer ${
                              ambientSound === option.id 
                                ? 'bg-[var(--tier-accent)]/[0.15] text-[var(--tier-accent)]' 
                                : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                            }`}
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
                            onChange={e => handleVolumeChange(float(e.target.value))}
                            className="flex-1 accent-[var(--tier-accent)] bg-white/10 rounded-lg cursor-pointer h-1.5"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>'''

old_top = '''              {/* Atmosphere UI */}
              <div className="relative">
                <button
                  onClick={() => setIsAmbientMenuOpen(!isAmbientMenuOpen)}'''
new_top = '''              {/* Atmosphere UI (Desktop) */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setIsAmbientMenuOpen(!isAmbientMenuOpen)}'''

content = content.replace(old_top, new_top)

# find the block to replace the click handler
old_click = '''                            onClick={() => {
                              handleAmbientChange(option.id as any);
                              setIsAmbientMenuOpen(false);
                            }}'''

new_click = '''                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAmbientChange(option.id as any);
                              setTimeout(() => setIsAmbientMenuOpen(false), 50);
                            }}'''

content = content.replace(old_click, new_click)

# replace z-50 with z-[100] for desktop atmosphere menu
content = content.replace('className="absolute top-full right-0 mt-2 z-50', 'className="absolute top-full right-0 mt-2 z-[100]')

# Add mobile UI
old_bottom = '''                  </button>
                </>
              )}
            </div>
          </div>
        </div>'''

mobile_ui = target_ui.replace('hidden sm:block', 'sm:hidden mt-6 flex justify-center w-full')
mobile_ui = mobile_ui.replace('right-0 mt-2 z-[100]', 'left-1/2 -translate-x-1/2 mt-2 z-[100]')
mobile_ui = mobile_ui.replace('{/* Atmosphere UI */}', '{/* Atmosphere UI (Mobile) */}')
mobile_ui = mobile_ui.replace('float(', 'parseFloat(')

new_bottom = '''                  </button>
                </>
              )}
            </div>
          </div>
''' + mobile_ui + '''
        </div>'''

content = content.replace(old_bottom, new_bottom)

with open('src/components/timer/StudyTimer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")

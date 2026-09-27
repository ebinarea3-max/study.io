const fs = require('fs');
const path = require('path');

function updateTimer() {
    const timerPath = path.join(__dirname, 'src/components/timer/StudyTimer.tsx');
    let content = fs.readFileSync(timerPath, 'utf8');

    // 1. Inner Dial Glassmorphism
    content = content.replace(
        /className="w-\[78%\] h-\[78%\] rounded-full bg-\[var\(--bg\)\] flex flex-col items-center justify-center p-2\.5 sm:p-6 text-center relative z-10 shadow-inner"\s+style={{ border: "2px solid rgba\(255, 255, 255, 0\.12\)", boxShadow: "inset 0 2px 10px rgba\(0, 0, 0, 0\.8\)" }}/g,
        `className="w-[78%] h-[78%] rounded-full bg-black/40 backdrop-blur-2xl flex flex-col items-center justify-center p-2.5 sm:p-6 text-center relative z-10 shadow-2xl"
                  style={{ border: "1px solid rgba(255, 255, 255, 0.15)", boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.05), 0 10px 40px rgba(0,0,0,0.5)" }}`
    );

    // 2. Start Button floating/glow
    content = content.replace(
        /style={{ background: '#10B981', color: '#021C11', fontWeight: 800, border: 'none', boxShadow: '0 4px 20px rgba\(16, 185, 129, 0\.4\)' }}/g,
        `style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#021C11', fontWeight: 800, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)' }}`
    );
    
    // Add hover scale to start button class
    content = content.replace(
        /'cursor-pointer hover:scale-\[1\.02\]'/g,
        `'cursor-pointer hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]'`
    );

    fs.writeFileSync(timerPath, content, 'utf8');
    console.log('Updated StudyTimer.tsx');
}

function updateTodoList() {
    const todoPath = path.join(__dirname, 'src/components/todo/DailyTodoList.tsx');
    let content = fs.readFileSync(todoPath, 'utf8');

    if (!content.includes('framer-motion')) {
        content = content.replace(
            /import React, \{ useState, useEffect, useRef \} from 'react';/,
            `import React, { useState, useEffect, useRef } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';`
        );
    }

    // Active tasks mapping
    content = content.replace(
        /\{activeTodos\.map\(item => \(\s*<div\s*key=\{item\.id\}\s*className="group flex items-center gap-2 px-2 py-1\.5 rounded-lg hover:bg-white\/\[0\.04\] transition-colors"\s*>/g,
        `{activeTodos.map(item => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
            key={item.id}
            className="group flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1.5 bg-black/20 border border-white/5 transition-colors"
          >`
    );
    
    // Wrap active and completed loops in AnimatePresence
    content = content.replace(
        /\{activeTodos\.map\(/g,
        `<AnimatePresence>{activeTodos.map(`
    );
    // Find the end of activeTodos map
    content = content.replace(
        /<\/button>\s*<\/div>\s*\)\)}\s*\{\/\* Empty State message if 0 todos \*\/\}/g,
        `</button>
          </motion.div>
        ))}</AnimatePresence>

        {/* Empty State message if 0 todos */}`
    );

    // Completed tasks mapping
    content = content.replace(
        /\{completedTodos\.map\(item => \(\s*<div\s*key=\{item\.id\}\s*className="group flex items-center gap-2 px-2 py-1\.5 rounded-lg hover:bg-neutral-800\/20 transition-colors"\s*>/g,
        `<AnimatePresence>
                {completedTodos.map(item => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id}
                    className="group flex items-center gap-2 px-3 py-2 rounded-xl mb-1 hover:bg-neutral-800/40 transition-colors"
                  >`
    );

    content = content.replace(
        /<\/button>\s*<\/div>\s*\)\)}\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\);\s*\}/g,
        `</button>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}`
    );

    fs.writeFileSync(todoPath, content, 'utf8');
    console.log('Updated DailyTodoList.tsx');
}

updateTimer();
updateTodoList();

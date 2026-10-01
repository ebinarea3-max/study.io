const fs = require('fs');
const path = './src/components/common/Navbar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update displayName useMemo
const oldDisplayNameMemo = /const displayName = useMemo\(\(\) => \{[\s\S]*?\}\];\s*\n/;
const newDisplayNameMemo = `  const displayName = useMemo(() => {
    return (
      user?.name ||
      user?.displayName ||
      user?.user_metadata?.full_name ||
      (user as any)?.user_metadata?.name ||
      (user as any)?.user_metadata?.display_name ||
      (user?.email ? user.email.split('@')[0] : 'Student')
    );
  }, [
    user?.name,
    user?.displayName,
    user?.user_metadata?.full_name,
    (user as any)?.user_metadata?.name,
    (user as any)?.user_metadata?.display_name,
    user?.email,
  ]);
`;
content = content.replace(oldDisplayNameMemo, newDisplayNameMemo);

// Update Header Badge display
const oldHeaderBadge = /\{\/\* User Identity & Level Display \*\/\}[\s\S]*?<\/button>/;
const newHeaderBadge = `{/* User Identity & Level Display */}
              <div className="text-left hidden lg:flex lg:flex-col lg:justify-center">
                <div className="flex items-baseline gap-1.5">
                  <div className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                    {displayName}
                  </div>
                  {user?.username && (
                    <div className="text-[10px] text-neutral-400 font-mono truncate max-w-[80px]">
                      @{user.username}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-extrabold text-primary font-mono leading-none">
                    Lv. {effectiveLevel}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium leading-tight border border-slate-200 dark:border-transparent">
                    {effectiveTierBadge.icon} {effectiveTitle}
                  </span>
                </div>
              </div>
            </button>`;
content = content.replace(oldHeaderBadge, newHeaderBadge);

// Update dropdown menu
const oldDropdown = /<div className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-\[180px\]">\{displayName\}<\/div>\s*<div className="text-\[10px\] text-slate-500 dark:text-slate-400 truncate max-w-\[180px\]">\{user\.email\}<\/div>/;
const newDropdown = `<div className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[180px]">{displayName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                        {user?.username ? \`@\${user.username} • \` : ''}{user?.email}
                      </div>`;
content = content.replace(oldDropdown, newDropdown);

fs.writeFileSync(path, content, 'utf8');
console.log('Navbar updated');

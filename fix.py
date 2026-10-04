import sys

file_path = 'src/components/timer/StudyTimer.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Remove mobile editor
    if "isEditingCountdown ? (" in line and "initialSeconds={" in lines[i+1]:
        skip = True
        # Keep the false branch (span)
        continue
    
    if skip and ") : (" in line and "span onClick" in lines[i+1]:
        skip = False
        continue

    # End of file logic
    if line.strip() == "</div>" and i == len(lines) - 4:
        new_lines.append(line)
        new_lines.append("""
      {isEditingCountdown && (
        <CountdownEditor
          initialSeconds={countdownTarget}
          onSave={(seconds) => { setCountdownTarget(seconds); setIsEditingCountdown(false); }}
          onCancel={() => setIsEditingCountdown(false)}
        />
      )}
""")
        continue

    if not skip:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)
print('Done')

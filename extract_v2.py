import cv2
import numpy as np
import os

img_path = r'C:\Users\Lenovo\.gemini\antigravity-ide\brain\7e11865a-8b2d-4f31-8acb-55f5960d55c1\.user_uploaded\media_1790244036751.png'
out_dir = r'public\ranks'
os.makedirs(out_dir, exist_ok=True)

img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)

# Add alpha channel if not present
if img.shape[2] == 3:
    img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

height, width = img.shape[:2]

rows = [
    {'count': 6, 'names': ['bronze-1', 'bronze-2', 'bronze-3', 'silver-1', 'silver-2', 'silver-3']},
    {'count': 8, 'names': ['gold-1', 'gold-2', 'gold-3', 'gold-4', 'platinum-1', 'platinum-2', 'platinum-3', 'platinum-4']},
    {'count': 7, 'names': ['diamond-1', 'diamond-2', 'diamond-3', 'diamond-4', 'champion', 'master', 'grandmaster']}
]

cell_height = height / 3
crop_height = int(cell_height * 0.84)

for r_idx, row in enumerate(rows):
    cell_width = width / row['count']
    y_start = int(r_idx * cell_height)
    
    for c_idx, name in enumerate(row['names']):
        x_start = int(c_idx * cell_width)
        x_end = int((c_idx + 1) * cell_width)
        
        # Crop the top 84% of the cell
        crop = img[y_start:y_start+crop_height, x_start:x_end].copy()
        
        # Make black pixels transparent
        # Find pixels that are close to black
        b_ch, g_ch, r_ch, a_ch = cv2.split(crop)
        # Threshold: if r, g, b are all < 20, set alpha to 0
        mask = ((b_ch < 20) & (g_ch < 20) & (r_ch < 20))
        a_ch[mask] = 0
        
        rgba = cv2.merge((b_ch, g_ch, r_ch, a_ch))
        
        out_path = os.path.join(out_dir, f"{name}.png")
        cv2.imwrite(out_path, rgba)

print("Extraction complete")

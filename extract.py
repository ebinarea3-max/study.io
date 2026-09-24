import cv2
import numpy as np
import os
import zipfile

img_path = r'C:\Users\Lenovo\.gemini\antigravity-ide\brain\7e11865a-8b2d-4f31-8acb-55f5960d55c1\.user_uploaded\media_1790239790068.jpg'
out_dir = r'public\ranks'
os.makedirs(out_dir, exist_ok=True)

img = cv2.imread(img_path)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Threshold to get mask
_, thresh = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)

# Find contours
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

bounding_boxes = []
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    # Filter out text / small artifacts
    if w > 50 and h > 50 and w < 200 and h < 200:
        bounding_boxes.append((x, y, w, h))

print(f"Found {len(bounding_boxes)} boxes")

# Group by row (y-coordinate)
# Sort by y first
bounding_boxes.sort(key=lambda b: b[1])
rows = []
current_row = []
last_y = -100

for b in bounding_boxes:
    if abs(b[1] - last_y) > 50 and last_y != -100:
        rows.append(current_row)
        current_row = []
    current_row.append(b)
    last_y = b[1]
if current_row:
    rows.append(current_row)

print(f"Found {len(rows)} rows")

names = [
    ['bronze-1', 'bronze-2', 'bronze-3', 'silver-1', 'silver-2', 'silver-3'],
    ['gold-1', 'gold-2', 'gold-3', 'gold-4', 'platinum-1', 'platinum-2', 'platinum-3', 'platinum-4'],
    ['diamond-1', 'diamond-2', 'diamond-3', 'diamond-4', 'champion', 'master', 'grandmaster']
]

# Ensure we have 3 rows
if len(rows) == 3:
    for i, row in enumerate(rows):
        # Sort left to right
        row.sort(key=lambda b: b[0])
        print(f"Row {i} has {len(row)} icons, expected {len(names[i])}")
        
        for j, b in enumerate(row):
            if j < len(names[i]):
                x, y, w, h = b
                # Crop
                crop = img[y:y+h, x:x+w]
                # the bounding box might include text if it's connected, let's assume it doesn't or we can trim it.
                # Actually, the user wants PNGs. It would be better to save with transparent background if possible.
                # Since the original is a jpg on a black background, we can convert black to transparent.
                
                # convert to BGRA
                b_ch, g_ch, r_ch = cv2.split(crop)
                alpha = np.where((b_ch < 15) & (g_ch < 15) & (r_ch < 15), 0, 255).astype(np.uint8)
                
                # Morphological operation to smooth alpha? No, let's just do a basic mask
                # Maybe a slightly softer mask
                gray_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
                _, mask = cv2.threshold(gray_crop, 10, 255, cv2.THRESH_BINARY)
                # optionally dilate/erode, but basic is fine.
                
                rgba = cv2.merge((b_ch, g_ch, r_ch, mask))
                
                out_path = os.path.join(out_dir, f"{names[i][j]}.png")
                cv2.imwrite(out_path, rgba)

# Create zip
zip_path = 'rank_icons.zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, _, files in os.walk(out_dir):
        for file in files:
            file_path = os.path.join(root, file)
            zipf.write(file_path, arcname=os.path.join('ranks', file))
print("Zip created successfully")

import cv2
import numpy as np
import os

rank_names = [
    'bronze-1', 'bronze-2', 'bronze-3', 'silver-1', 'silver-2', 'silver-3',
    'gold-1', 'gold-2', 'gold-3', 'gold-4', 'platinum-1', 'platinum-2', 'platinum-3', 'platinum-4',
    'diamond-1', 'diamond-2', 'diamond-3', 'diamond-4', 'champion', 'master', 'grandmaster'
]

img_path = r"C:\Users\Lenovo\.gemini\antigravity-ide\scratch\studypulse-app\scratch\ranks_sheet.png"
img = cv2.imread(img_path)
if img is None:
    print("Error: Could not load image")
    exit(1)

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 20, 255, cv2.THRESH_BINARY)
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

boxes = []
for cnt in contours:
    x, y, w, h = cv2.boundingRect(cnt)
    if w * h > 1000 and w > 30 and h > 30:
        boxes.append((x, y, w, h))

filtered_boxes = []
for (x, y, w, h) in boxes:
    aspect = w / float(h)
    if aspect > 3.0: 
        continue
    if h < 20: 
        continue
    filtered_boxes.append((x, y, w, h))

def group_boxes(boxes):
    grouped = []
    for box in boxes:
        x1, y1, w1, h1 = box
        matched = False
        for i, gbox in enumerate(grouped):
            gx, gy, gw, gh = gbox
            if not (x1 > gx + gw + 2 or x1 + w1 + 2 < gx or y1 > gy + gh + 2 or y1 + h1 + 2 < gy):
                nx = min(x1, gx)
                ny = min(y1, gy)
                nw = max(x1 + w1, gx + gw) - nx
                nh = max(y1 + h1, gy + gh) - ny
                grouped[i] = (nx, ny, nw, nh)
                matched = True
                break
        if not matched:
            grouped.append(box)
    return grouped

for _ in range(3):
    filtered_boxes = group_boxes(filtered_boxes)

final_boxes = []
for (x, y, w, h) in filtered_boxes:
    if h > w * 1.2:
        h = int(w * 1.05) # Force square to chop off text at bottom
    if w > 50 and h > 50:
        final_boxes.append((x, y, w, h))

final_boxes.sort(key=lambda b: b[1])
rows = []
current_row = []
current_y = final_boxes[0][1]

for box in final_boxes:
    if abs(box[1] - current_y) > 40:
        rows.append(current_row)
        current_row = [box]
        current_y = box[1]
    else:
        current_row.append(box)
rows.append(current_row)

sorted_boxes = []
for row in rows:
    row.sort(key=lambda b: b[0])
    sorted_boxes.extend(row)

print("Found", len(sorted_boxes), "badges")

out_dir = r"C:\Users\Lenovo\.gemini\antigravity-ide\scratch\studypulse-app\public\ranks"
os.makedirs(out_dir, exist_ok=True)

for i, box in enumerate(sorted_boxes):
    if i >= len(rank_names): break
    x, y, w, h = box
    
    cx, cy = x + w//2, y + h//2
    size = max(w, h)
    size = int(size * 1.02) 
    half = size // 2
    
    x1 = max(0, cx - half)
    y1 = max(0, cy - half)
    x2 = min(img.shape[1], cx + half)
    y2 = min(img.shape[0], cy + half)
    
    crop = img[y1:y2, x1:x2]
    
    bgra = cv2.cvtColor(crop, cv2.COLOR_BGR2BGRA)
    b, g, r, _ = cv2.split(bgra)
    
    # Calculate luminance or max color for alpha
    alpha = np.maximum(np.maximum(b, g), r)
    
    # Non-linear curve to keep the glow opaque but make dark black fully transparent
    alpha = cv2.pow(alpha / 255.0, 0.6) * 255
    
    # Hard threshold to completely remove the pure black box
    alpha = np.where(alpha < 15, 0, alpha)
    
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)
    bgra[:, :, 3] = alpha
    
    name = rank_names[i]
    out_path = os.path.join(out_dir, f"{name}.png")
    cv2.imwrite(out_path, bgra)
    print(f"Saved {name} to {out_path}")

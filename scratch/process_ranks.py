import cv2
import numpy as np
import os
from PIL import Image
from rembg import remove

# Names of the ranks in order of their appearance (Row 1, Row 2, Row 3)
rank_names = [
    # Row 1 (6 badges)
    'bronze-1', 'bronze-2', 'bronze-3', 'silver-1', 'silver-2', 'silver-3',
    # Row 2 (8 badges)
    'gold-1', 'gold-2', 'gold-3', 'gold-4', 'platinum-1', 'platinum-2', 'platinum-3', 'platinum-4',
    # Row 3 (7 badges)
    'diamond-1', 'diamond-2', 'diamond-3', 'diamond-4', 'champion', 'master', 'grandmaster'
]

# Path to the uploaded image
img_path = r"C:\Users\Lenovo\.gemini\antigravity-ide\scratch\studypulse-app\scratch\ranks_sheet.png"

print("Loading image from", img_path)
img = cv2.imread(img_path)
if img is None:
    print("Error loading image. Check path.")
    exit(1)

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Threshold to isolate the glowing badges from the black background
# Lower threshold to capture glow, but high enough to avoid noise
_, thresh = cv2.threshold(gray, 25, 255, cv2.THRESH_BINARY)

# Find contours
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

boxes = []
for cnt in contours:
    x, y, w, h = cv2.boundingRect(cnt)
    area = w * h
    # Filter out text (text will be small and wide)
    # The image is 1000x683, so badges are around 100x100
    if area > 1500 and w > 40 and h > 40:
        boxes.append((x, y, w, h))

print(f"Found {len(boxes)} potential badges before grouping.")

# Group overlapping or close boxes (since a badge might have multiple disconnected glowing parts)
def group_boxes(boxes):
    grouped = []
    for box in boxes:
        x1, y1, w1, h1 = box
        matched = False
        for i, gbox in enumerate(grouped):
            gx, gy, gw, gh = gbox
            # Check if boxes intersect or are very close
            if not (x1 > gx + gw + 10 or x1 + w1 + 10 < gx or y1 > gy + gh + 10 or y1 + h1 + 10 < gy):
                # Merge
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

# Group multiple times to ensure full convergence
for _ in range(5):
    boxes = group_boxes(boxes)

print(f"Found {len(boxes)} badges after grouping.")

# Filter out text again just in case (text is very wide and short, or small area)
final_boxes = []
for box in boxes:
    x, y, w, h = box
    aspect = w / float(h)
    if w * h > 3000 and 0.5 < aspect < 2.0:
        final_boxes.append(box)

print(f"Found {len(final_boxes)} badges after aspect ratio filter.")

# Sort boxes into rows
# Sort by y-coordinate first
final_boxes.sort(key=lambda b: b[1])

rows = []
current_row = []
current_y = final_boxes[0][1]

for box in final_boxes:
    # If the y difference is large, it's a new row
    if abs(box[1] - current_y) > 50:
        rows.append(current_row)
        current_row = [box]
        current_y = box[1]
    else:
        current_row.append(box)

rows.append(current_row)

# Sort each row by x coordinate
sorted_boxes = []
for row in rows:
    row.sort(key=lambda b: b[0])
    sorted_boxes.extend(row)

print(f"Total sorted badges: {len(sorted_boxes)}")
if len(sorted_boxes) != 21:
    print("WARNING: Expected 21 badges, but found", len(sorted_boxes))

# Save them
out_dir = r"C:\Users\Lenovo\.gemini\antigravity-ide\scratch\studypulse-app\public\ranks"
os.makedirs(out_dir, exist_ok=True)

for i, box in enumerate(sorted_boxes):
    if i >= len(rank_names):
        break
        
    x, y, w, h = box
    
    # Add a bit of padding to not clip glows
    pad = 10
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(img.shape[1], x + w + pad)
    y2 = min(img.shape[0], y + h + pad)
    
    crop = img[y1:y2, x1:x2]
    
    # Convert BGR to RGB for PIL
    crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(crop_rgb)
    
    # Remove background using rembg
    out_img = remove(pil_img)
    
    name = rank_names[i]
    out_path = os.path.join(out_dir, f"{name}.png")
    out_img.save(out_path, format="PNG")
    print(f"Saved {name} to {out_path}")

print("Done processing badges.")


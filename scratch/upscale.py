import cv2
import os
import glob

in_dir = r"C:\Users\Lenovo\.gemini\antigravity-ide\scratch\studypulse-app\public\ranks"
files = glob.glob(os.path.join(in_dir, "*.png"))

for f in files:
    img = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    if img is None:
        continue
    
    # Upscale 4x
    h, w = img.shape[:2]
    new_h, new_w = h * 4, w * 4
    
    # Use Lanczos interpolation for high quality upscaling
    upscaled = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
    
    # Sharpen slightly to counter the blur from upscaling
    gaussian = cv2.GaussianBlur(upscaled, (0, 0), 2.0)
    sharpened = cv2.addWeighted(upscaled, 1.5, gaussian, -0.5, 0)
    
    cv2.imwrite(f, sharpened)
    print(f"Upscaled {os.path.basename(f)} from {w}x{h} to {new_w}x{new_h}")

print("Done upscaling.")

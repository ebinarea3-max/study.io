import os
import subprocess

out_dir = "public/audio/ambience"
os.makedirs(out_dir, exist_ok=True)

def download_audio(query, filename):
    filepath = os.path.join(out_dir, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
    
    cmd = [
        "python", "-m", "yt_dlp",
        f"ytsearch1:{query}",
        "--extract-audio",
        "--audio-format", "wav",
        "--output", filepath,
        "--max-downloads", "1",
        "--download-sections", "*00:00-02:00",
        "--force-keyframes-at-cuts"
    ]
    
    print(f"Downloading {query} -> {filename}...")
    subprocess.run(cmd)

download_audio("pink noise 432hz", "pink-noise.wav")
download_audio("heavy white noise deep", "white-noise.wav")
download_audio("aesthetic fireplace crackling", "fireplace.wav")
download_audio("heavy rainstorm thunder", "rain.wav")

print("Done downloading youtube audio.")

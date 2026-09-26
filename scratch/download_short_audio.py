import os
import subprocess
import glob

out_dir = "public/audio/ambience"
os.makedirs(out_dir, exist_ok=True)

def download_audio(query, filename_base):
    for ext in ['wav', 'm4a', 'webm', 'opus']:
        fp = os.path.join(out_dir, f"{filename_base}.{ext}")
        if os.path.exists(fp):
            os.remove(fp)
    
    cmd = [
        "python", "-m", "yt_dlp",
        f"ytsearch1:{query} under 2 minutes",
        "-f", "bestaudio",
        "--output", os.path.join(out_dir, f"{filename_base}.%(ext)s"),
        "--max-downloads", "1",
        "--match-filter", "duration < 180"
    ]
    
    print(f"Downloading {query} -> {filename_base}...")
    subprocess.run(cmd)

download_audio("pure brown noise", "brown-noise")
download_audio("heavy white noise deep", "white-noise")
download_audio("aesthetic fireplace crackling", "fireplace")
download_audio("heavy rainstorm thunder", "rain")

print("Done downloading youtube audio.")

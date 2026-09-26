import os
import subprocess
import imageio_ffmpeg

out_dir = "public/audio/ambience"
os.makedirs(out_dir, exist_ok=True)

ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

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
        "--download-sections", "*00:00-01:00",
        "--force-keyframes-at-cuts",
        "--ffmpeg-location", ffmpeg_path
    ]
    
    print(f"Downloading {query} -> {filename}...")
    subprocess.run(cmd)

download_audio("deep brown noise 12 hours", "brown-noise.wav")
download_audio("heavy white noise deep", "white-noise.wav")
download_audio("aesthetic fireplace crackling", "fireplace.wav")
download_audio("heavy rainstorm thunder", "rain.wav")

print("Done downloading youtube audio.")

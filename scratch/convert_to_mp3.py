import os
import subprocess
import imageio_ffmpeg

ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
directory = 'public/audio/ambience'

for file in os.listdir(directory):
    if file.endswith('.wav'):
        wav_path = os.path.join(directory, file)
        mp3_path = os.path.join(directory, file.replace('.wav', '.mp3'))
        
        print(f"Converting {file} to mp3...")
        subprocess.run([
            ffmpeg_path,
            '-y',
            '-i', wav_path,
            '-codec:a', 'libmp3lame',
            '-b:a', '128k',
            mp3_path
        ])
        
        os.remove(wav_path)
        print(f"Done converting {file}.")

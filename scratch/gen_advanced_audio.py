import wave
import numpy as np
import scipy.signal as signal
import math
import struct
import os

os.makedirs('public/audio/ambience', exist_ok=True)
sample_rate = 44100
duration = 30 # 30 seconds for a good loop
t = np.linspace(0, duration, int(sample_rate * duration), False)

def save_wav(filename, data):
    # Normalize to -3dB
    max_val = np.max(np.abs(data))
    if max_val > 0:
        data = data / max_val * 0.707
    
    # Apply fade in/out to prevent clicks when looping
    fade_len = int(sample_rate * 0.1) # 100ms
    fade_in = np.linspace(0, 1, fade_len)
    fade_out = np.linspace(1, 0, fade_len)
    data[:fade_len] = data[:fade_len] * fade_in
    data[-fade_len:] = data[-fade_len:] * fade_out
    
    # 16-bit PCM
    data_int = np.int16(data * 32767)
    
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        f.writeframes(data_int.tobytes())

print("Generating White Noise (Deep/Boosted)...")
# Generate dense white noise, apply a gentle shelf filter to boost lows and cut highs slightly for a "deep" sound
white_noise = np.random.normal(0, 1, len(t))
b, a = signal.butter(1, 10000 / (sample_rate / 2), 'low')
deep_white = signal.lfilter(b, a, white_noise)
# Boost it
save_wav('public/audio/ambience/white-noise.wav', deep_white * 1.5)

print("Generating Pink Noise (432Hz Boost)...")
# 1/f noise algorithm (Voss-McCartney approximation)
def generate_pink(n):
    nrows = 16
    ncols = n // nrows + 1
    array = np.random.randn(nrows, ncols)
    return np.cumsum(array, 0).sum(0)[:n]

pink = generate_pink(len(t))
# Add 432 Hz tone very subtly
tone_432 = np.sin(2 * np.pi * 432 * t)
# Apply a slow LFO to the 432 tone so it breathes
lfo = (np.sin(2 * np.pi * 0.05 * t) + 1) / 2
tone_432 = tone_432 * (0.08 * lfo)
pink_432 = pink * 0.3 + tone_432
save_wav('public/audio/ambience/pink-noise.wav', pink_432)

print("Generating Aesthetic Fireplace Crackle...")
# Low frequency rumble (fire roar)
fire_rumble = np.random.normal(0, 1, len(t))
b_r, a_r = signal.butter(2, 200 / (sample_rate / 2), 'low')
fire_rumble = signal.lfilter(b_r, a_r, fire_rumble) * 2.0

# Crackles (sparse high amplitude impulses passed through a short decay filter)
crackles = np.zeros(len(t))
# Random crackle events
crackle_idx = np.random.choice(len(t), int(duration * 25), replace=False) # 25 crackles per second
crackles[crackle_idx] = np.random.normal(0, 1, len(crackle_idx))
# Filter crackles to sound woody
b_c, a_c = signal.butter(2, [2000 / (sample_rate / 2), 8000 / (sample_rate / 2)], 'bandpass')
crackles = signal.lfilter(b_c, a_c, crackles) * 4.0

fireplace = fire_rumble + crackles
save_wav('public/audio/ambience/fireplace.wav', fireplace)

print("Generating Heavy Rainstorm with Thunder...")
# Rain: dense noise through bandpass
rain_noise = np.random.normal(0, 1, len(t))
b_rain, a_rain = signal.butter(1, [400 / (sample_rate / 2), 6000 / (sample_rate / 2)], 'bandpass')
rain = signal.lfilter(b_rain, a_rain, rain_noise)

# Thunder: low frequency bursts
thunder = np.zeros(len(t))
# A couple of thunder claps
thunder_times = [5.0, 18.0]
for tt in thunder_times:
    idx = int(tt * sample_rate)
    length = int(4.0 * sample_rate) # 4 seconds thunder
    if idx + length < len(t):
        clap = np.random.normal(0, 1, length)
        # Envelope for thunder (sharp attack, long decay)
        env = np.exp(-np.linspace(0, 10, length))
        clap = clap * env
        # Lowpass heavily for distant thunder
        b_t, a_t = signal.butter(2, 100 / (sample_rate / 2), 'low')
        clap = signal.lfilter(b_t, a_t, clap)
        thunder[idx:idx+length] += clap * 8.0

rainstorm = rain * 0.6 + thunder
save_wav('public/audio/ambience/rain.wav', rainstorm)

print("Audio generation complete.")

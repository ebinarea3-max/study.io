import wave
import random
import math
import struct
import os

os.makedirs('public/audio/ambience', exist_ok=True)
sample_rate = 44100

def save_wav(filename, samples):
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        for s in samples:
            val = int(max(-1.0, min(1.0, s)) * 32767)
            f.writeframesraw(struct.pack('<h', val))

# 1. Rain
print("Generating rain.wav...")
samples = []
for i in range(sample_rate * 5):
    val = random.uniform(-1, 1) * 0.3
    samples.append(val)
save_wav('public/audio/ambience/rain.wav', samples)

# 2. Fireplace
print("Generating fireplace.wav...")
samples = []
for i in range(sample_rate * 5):
    val = random.uniform(-1, 1) * (0.8 if random.random() < 0.005 else 0.05)
    samples.append(val)
save_wav('public/audio/ambience/fireplace.wav', samples)

# 3. Waves
print("Generating waves.wav...")
samples = []
for i in range(sample_rate * 5):
    lfo = (math.sin(2 * math.pi * 0.2 * (i / sample_rate)) + 1) / 2
    samples.append(random.uniform(-1, 1) * 0.2 * lfo)
save_wav('public/audio/ambience/waves.wav', samples)

# 4. Lofi Cafe
print("Generating lofi.wav...")
samples = []
for i in range(sample_rate * 5):
    val = (math.sin(2 * math.pi * 261.63 * (i/sample_rate)) + math.sin(2 * math.pi * 329.63 * (i/sample_rate)) + math.sin(2 * math.pi * 392.00 * (i/sample_rate))) * 0.1
    samples.append(val)
save_wav('public/audio/ambience/lofi.wav', samples)
print("Done.")

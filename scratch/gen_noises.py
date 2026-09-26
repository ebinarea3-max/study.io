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

# 1. White Noise
print("Generating white-noise.wav...")
samples = []
for i in range(sample_rate * 5):
    samples.append(random.uniform(-1, 1) * 0.2)
save_wav('public/audio/ambience/white-noise.wav', samples)

# 2. Pink Noise (1/f)
print("Generating pink-noise.wav...")
samples = []
b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0
for i in range(sample_rate * 5):
    white = random.uniform(-1, 1)
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    val = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
    b6 = white * 0.115926
    samples.append(val * 0.1)
save_wav('public/audio/ambience/pink-noise.wav', samples)

# 3. Brown Noise (1/f^2)
print("Generating brown-noise.wav...")
samples = []
lastOut = 0.0
for i in range(sample_rate * 5):
    white = random.uniform(-1, 1)
    lastOut = (lastOut * 0.99) + (white * 0.05)
    samples.append(lastOut * 0.8)
save_wav('public/audio/ambience/brown-noise.wav', samples)

print("Done generating noises.")

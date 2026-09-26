import wave
import random
import math
import struct
import os

os.makedirs('public/audio/ambience', exist_ok=True)
sample_rate = 44100
duration = 10

def save_wav(filename, samples):
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        # Normalize
        max_val = max(abs(s) for s in samples) if samples else 1
        scale = 32767.0 / (max_val if max_val > 0 else 1) * 0.8
        
        # Fade in/out 500 samples
        for i in range(500):
            samples[i] *= (i / 500.0)
            samples[-(i+1)] *= (i / 500.0)
            
        data = bytearray(len(samples) * 2)
        for i, s in enumerate(samples):
            val = int(s * scale)
            val = max(-32768, min(32767, val))
            struct.pack_into('<h', data, i*2, val)
        f.writeframes(data)

# White Noise
print("Gen White Noise")
samples = [random.uniform(-1, 1) for _ in range(sample_rate * duration)]
save_wav('public/audio/ambience/white-noise.wav', samples)

# Pink Noise + 432 Hz
print("Gen Pink Noise 432")
b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0
samples = []
for i in range(sample_rate * duration):
    white = random.uniform(-1, 1)
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
    b6 = white * 0.115926
    
    t = i / sample_rate
    # 432 hz tone
    tone = math.sin(2 * math.pi * 432 * t) * 0.2
    samples.append(pink * 0.1 + tone)
save_wav('public/audio/ambience/pink-noise.wav', samples)

# Fireplace (Crackle)
print("Gen Fireplace")
samples = []
for i in range(sample_rate * duration):
    if random.random() < 0.01:
        samples.append(random.uniform(-1, 1) * 1.5)
    else:
        samples.append(random.uniform(-1, 1) * 0.1)
save_wav('public/audio/ambience/fireplace.wav', samples)

# Rainstorm
print("Gen Rain")
samples = []
for i in range(sample_rate * duration):
    t = i / sample_rate
    rumble = math.sin(2 * math.pi * 50 * t) * 0.5 if random.random() < 0.05 else 0
    samples.append(random.uniform(-1, 1) * 0.4 + rumble)
save_wav('public/audio/ambience/rain.wav', samples)

print("Done")

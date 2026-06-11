"""Synthesize a seamless 2.0 s engine-idle loop (pure mechanical rumble, no melody)."""
import math
import random
import struct
import wave

SR = 22050
DUR = 2.0
N = int(SR * DUR)  # 44100 samples
OUT = "/Users/ahmedhdeawy/dev/ideas/kids-games/src/sdk/assets/audio/EngineLoop.wav"

rng = random.Random(20260611)  # deterministic

# (freq Hz, amplitude, phase) — every frequency is an integer (hence an integer
# multiple of 0.5 Hz), so each component completes a whole number of cycles in
# the 2.0 s window -> mathematically seamless loop.
comps = []

# Engine fundamentals: low harmonics with decreasing amplitude.
for f, a in [(52, 1.00), (104, 0.55), (156, 0.35), (208, 0.22)]:
    comps.append((f, a, 0.0))

# "Periodic noise": ~60 sine components at integer frequencies 30-500 Hz with
# deterministic pseudo-random phases/amplitudes (low-frequency weighted).
noise_freqs = sorted(rng.sample(range(30, 501), 60))
for f in noise_freqs:
    amp = rng.uniform(0.03, 0.10) * (80.0 / (f + 50.0))
    phase = rng.uniform(0.0, 2.0 * math.pi)
    comps.append((f, amp, phase))

TWO_PI = 2.0 * math.pi
AM_FREQ = 13.0   # integer Hz -> 26 whole cycles in 2 s, loop-safe
AM_DEPTH = 0.15

samples = []
for n in range(N):
    t = n / SR
    s = 0.0
    for f, a, p in comps:
        s += a * math.sin(TWO_PI * f * t + p)
    s *= 1.0 + AM_DEPTH * math.sin(TWO_PI * AM_FREQ * t)
    samples.append(s)

peak = max(abs(x) for x in samples)
scale = 0.5 / peak  # normalize peak to ~0.5 full scale
pcm = [max(-32768, min(32767, int(round(x * scale * 32767.0)))) for x in samples]

with wave.open(OUT, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(struct.pack("<%dh" % N, *pcm))

print("samples:", N)
print("peak (normalized):", max(abs(v) for v in pcm) / 32767.0)
print("first sample:", pcm[0], "({:+.5f} FS)".format(pcm[0] / 32767.0))
print("last sample: ", pcm[-1], "({:+.5f} FS)".format(pcm[-1] / 32767.0))
# Loop wraps last -> first; show the synthetic sample at t=2.0 (must equal t=0):
t = DUR
s = sum(a * math.sin(TWO_PI * f * t + p) for f, a, p in comps)
s *= 1.0 + AM_DEPTH * math.sin(TWO_PI * AM_FREQ * t)
print("synthetic sample at t=2.0 (== t=0):", int(round(s * scale * 32767.0)))

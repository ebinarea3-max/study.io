# Study.io Premium Scholar Avatars — Artwork Generation Guide

> **Collection**: 12 Collectible Elite Scholar Character Portraits  
> **Target Dimensions**: 512×512 PNG with Transparent Background (Alpha Channel)  
> **Destination Directory**: `/public/images/avatars/premium/`  
> **Backup Directory**: `/public/images/avatars/premium/original/`  

---

## 1. Master Art Direction & Shared Style Prefix

### Visual Style
- **Aesthetic**: Polished, painted, glossy, slightly dark-fantasy game-profile character portrait (similar to high-tier RPG rank badges and legendary hero icons).
- **Not flat vector, not cartoon, not 3D plastic**.
- **Framing & Camera**: Head-and-shoulders bust, centered, facing slightly toward the viewer with confident, expressive intellectual posture. Consistent camera distance and lighting angle across all 12 portraits.
- **Lighting**: Dramatic cinematic key light from upper-left, sharp volumetric rim lighting in each character's signature color, soft ambient occlusion, rich dimensional shading.
- **Knowledge Motif**: Every scholar integrates a distinct study or knowledge artifact (floating runes, celestial star maps, flame quills, holographic codices, alchemical vials, or ancient scrolls).
- **Background**: Isolated character portrait on **clean transparent background** (or pure black `#000000` for effortless one-click alpha extraction in Photoshop / rembg). No borders, no circles, no frames, no text, no logos.

### Shared Prompt Prefix (Copy-Paste for all 12)
```text
high-end digital character portrait of [CHARACTER DESCRIPTION], head-and-shoulders composition, centered framing, facing slightly forward, confident expressive gaze, painted glossy dark-fantasy illustration style, dramatic volumetric rim light, rich atmospheric glow in [SIGNATURE COLOR], detailed textured clothing and hair, study knowledge artifact, isolated character, clean transparent background, no text, no watermark, no frame, 8k resolution, Unreal Engine 5 concept art --ar 1:1 --style raw
```

---

## 2. The 12 Premium Avatar Prompts

### Epic Tier (Purple Gem & Border)

#### 1. Arcane Scholar
- **File Name**: `arcane-scholar.png`
- **Rarity**: Epic
- **Signature Color**: Deep Violet (`#A855F7`, `#7C3AED`)
- **Character**: Young prodigy mage in high-collared enchanted robes, glowing violet irises, subtle arcane sigils etched into cheekbones, floating radiant runes revolving around their shoulders.
- **Prompt**:
  ```text
  high-end digital character portrait of a young arcane scholar mage, wearing deep violet scholar robes with silver embroidery, glowing amethyst eyes, glowing luminous violet magical runes floating and orbiting around the shoulders, holding an open leather tome with glowing pages, dramatic volumetric violet rim lighting, painted glossy dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

#### 2. Astral Monk
- **File Name**: `astral-monk.png`
- **Rarity**: Epic
- **Signature Color**: Cosmic Indigo & Silver (`#6366F1`, `#E0E7FF`)
- **Character**: Serene monk with shaved head, closed eyes in deep meditative flow, silver geometric constellation lines gently illuminated across the indigo meditation robes.
- **Prompt**:
  ```text
  high-end digital character portrait of a serene astral monk with shaved head, calm closed eyes in deep meditation, glowing silver constellation dots and geometric star lines tracing across deep indigo meditation robes, celestial indigo aura and silver rim light, painted glossy dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

#### 3. Cyber Librarian
- **File Name**: `cyber-librarian.png`
- **Rarity**: Epic
- **Signature Color**: Electric Cyan (`#22D3EE`, `#06B6D4`)
- **Character**: Sleek futuristic archivist with a glowing neon cyber-visor, high-tech circuit-pattern collar, holding a floating holographic digital codex radiating cyan light.
- **Prompt**:
  ```text
  high-end digital character portrait of a cyber librarian archivist, wearing a sleek neon-cyan visor across the eyes, dark futuristic coat with glowing circuit board thread embroidery on the collar, inspecting a floating luminous cyan holographic data book, sharp cyan neon rim light, painted glossy cyberpunk dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

#### 4. Alchemist
- **File Name**: `alchemist.png`
- **Rarity**: Epic
- **Signature Color**: Emerald Green (`#10B981`, `#059669`)
- **Character**: Sharp-eyed scholar with brass and leather goggles pushed up on the forehead, holding an ornate glass vial filled with swirling bioluminescent emerald elixir, stained leather apron.
- **Prompt**:
  ```text
  high-end digital character portrait of a master alchemist scholar, brass and leather research goggles pushed up on the forehead, holding an ornate glass flask with swirling luminescent emerald liquid emitting glowing green vapor, deep emerald rim lighting and soft green caustic highlights, painted glossy dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

#### 5. Dragon Sage
- **File Name**: `dragon-sage.png`
- **Rarity**: Epic
- **Signature Color**: Imperial Gold & Crimson (`#F59E0B`, `#DC2626`)
- **Character**: Venerable elder scholar with braided silver beard/hair, crimson brocade vestments, and an inquisitive miniature red-and-gold wyrmling dragon perched gently on the shoulder.
- **Prompt**:
  ```text
  high-end digital character portrait of a wise dragon sage elder, silver hair, wearing crimson and charcoal silk robes with gold trim, a tiny intelligent red wyrmling dragon perched curiously on the shoulder, warm golden firelight and crimson rim lighting, painted glossy dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

#### 6. Moon Oracle
- **File Name**: `moon-oracle.png`
- **Rarity**: Epic
- **Signature Color**: Pale Moon Blue & Silver (`#93C5FD`, `#E2E8F0`)
- **Character**: Ethereal seer with cascading silver hair, wearing a crescent moon platinum circlet on the brow, eyes glowing with pale moonlight, draped in gossamer night-sky silks.
- **Prompt**:
  ```text
  high-end digital character portrait of an ethereal moon oracle, flowing silver hair, a delicate platinum crescent moon circlet on the forehead, luminescent pale blue eyes, surrounded by soft celestial moonlight and floating silver lunar motes, translucent pale blue night silks, painted glossy dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

---

### Legendary Tier (Gold Gem & Border)

#### 7. Phoenix Archivist
- **File Name**: `phoenix-archivist.png`
- **Rarity**: Legendary
- **Signature Color**: Blazing Orange & Radiant Gold (`#F97316`, `#FBBF24`)
- **Character**: Regal keeper of eternal lore with ember-lit flowing hair tipped in gentle flames, writing on a scorched parchment with a feather quill sculpted from living fire.
- **Prompt**:
  ```text
  high-end digital character portrait of a legendary phoenix archivist, dark skin, majestic ember-tipped hair with soft glowing flames, holding a quill crafted from living golden fire, ancient charred manuscript scroll, dramatic orange and molten gold rim lighting, painted glossy dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

#### 8. Crystal Mage
- **File Name**: `crystal-mage.png`
- **Rarity**: Legendary
- **Signature Color**: Prismatic Ice Blue (`#38BDF8`, `#E0F2FE`)
- **Character**: High crystal geomancer draped in geometric frost robes, sharp faceted floating crystal shards levitating around the shoulders, casting prismatic refractive light across the face.
- **Prompt**:
  ```text
  high-end digital character portrait of a legendary crystal mage, high-collared geometric coat, floating sharp translucent ice-blue crystal shards hovering around the shoulders, glowing prismatic reflections and bright azure rim lighting, painted glossy dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

#### 9. Clockwork Inventor
- **File Name**: `clockwork-inventor.png`
- **Rarity**: Legendary
- **Signature Color**: Warm Amber & Burnished Copper (`#D97706`, `#B45309`)
- **Character**: Ingenious mechanist scholar with an intricate brass mechanical monocle containing moving clockwork gears over one eye, leather coat with copper filigree calipers.
- **Prompt**:
  ```text
  high-end digital character portrait of a clockwork inventor scholar, wearing an intricate mechanical brass monocle with tiny turning clockwork gears, burnished copper collar and vest, holding a glowing pocket chronometer, warm amber mechanical glow and metallic copper highlights, painted glossy steampunk dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

#### 10. Void Walker
- **File Name**: `void-walker.png`
- **Rarity**: Legendary
- **Signature Color**: Cosmic Purple & Obsidian Black (`#8B5CF6`, `#1E1B4B`)
- **Character**: Mysterious scholar enveloped in a deep obsidian cowl, the interior of the hood opening into an infinite starry cosmic nebula with faint swirling galaxies.
- **Prompt**:
  ```text
  high-end digital character portrait of an enigmatic void walker scholar, deep obsidian hood casting shadow over the upper face, faint glowing galaxies and starfield nebula visible inside the deep cowl, glowing violet eyes, cosmic dark purple rim lighting and starry particles, painted glossy dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

#### 11. Samurai Scholar
- **File Name**: `samurai-scholar.png`
- **Rarity**: Legendary
- **Signature Color**: Crimson & Deep Charcoal (`#E11D48`, `#18181B`)
- **Character**: Focused warrior-philosopher with a traditional topknot, calm analytical gaze, wearing dark charcoal haori over crimson armor plates, an ancient calligraphy scroll slung across the back.
- **Prompt**:
  ```text
  high-end digital character portrait of a samurai scholar warrior-philosopher, sharp focused gaze, hair tied in a neat high topknot, dark charcoal haori over deep crimson lacquered armor, an antique parchment scroll bound across the shoulder, intense crimson rim lighting, painted glossy dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

#### 12. Celestial Cartographer
- **File Name**: `celestial-cartographer.png`
- **Rarity**: Legendary
- **Signature Color**: Cosmic Teal & Astral Gold (`#14B8A6`, `#FACC15`)
- **Character**: Master stellar navigator surrounded by an intricate, revolving 3D astrolabe and spherical glowing star map of orbits and celestial coordinates floating weightlessly around their head.
- **Prompt**:
  ```text
  high-end digital character portrait of a celestial cartographer, adorned in teal and deep navy velvet robes with gold astrolabe embroidery, a glowing spherical 3D holographic star map with orbital rings and coordinates floating weightlessly around the head, vibrant teal and golden stellar rim lighting, painted glossy dark-fantasy style, head and shoulders, centered, isolated character, clean transparent background --ar 1:1 --style raw --v 6.1 --no text, watermark, frame, circle, background
  ```

---

## 3. Image Specifications & File Placement

1. **Resolution**: 512 &times; 512 pixels
2. **Format**: PNG with 32-bit Alpha Channel (RGBA)
3. **Save Directory**:
   ```
   study.io/public/images/avatars/premium/
     ├── arcane-scholar.png
     ├── astral-monk.png
     ├── cyber-librarian.png
     ├── alchemist.png
     ├── dragon-sage.png
     ├── moon-oracle.png
     ├── phoenix-archivist.png
     ├── crystal-mage.png
     ├── clockwork-inventor.png
     ├── void-walker.png
     ├── samurai-scholar.png
     └── celestial-cartographer.png
   ```
4. **Original Backup**:
   The original Dicebear vector sources are preserved safely in `/public/images/avatars/premium/original/`.

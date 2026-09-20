import math
import struct
import zlib
import os

def create_png(width, height, get_pixel_func, output_path):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_data.extend([int(r), int(g), int(b), int(a)])
    
    compressed = zlib.compress(bytes(raw_data), level=9)
    
    def make_chunk(chunk_type, data):
        return struct.pack('>I', len(data)) + chunk_type + data + struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)

    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(make_chunk(b'IHDR', ihdr_data))
    png.extend(make_chunk(b'IDAT', compressed))
    png.extend(make_chunk(b'IEND', b''))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(png)
    print(f"Generated {output_path} ({width}x{height})")

def point_in_polygon(x, y, poly):
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def dist_to_segment(px, py, x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    if dx == dy == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy
    return math.hypot(px - proj_x, py - proj_y)

def min_dist_to_polygon(px, py, poly):
    d = float('inf')
    for i in range(len(poly)):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % len(poly)]
        d = min(d, dist_to_segment(px, py, x1, y1, x2, y2))
    return d

def render_study_pixel(x, y, width, height):
    # Normalized coords from -1.0 to 1.0
    nx = (x - width / 2.0) / (width / 2.0)
    ny = (y - height / 2.0) / (height / 2.0)
    dist_center = math.hypot(nx, ny)

    # Base background: #080b12 (8, 11, 18)
    bg_r, bg_g, bg_b = 8, 11, 18

    # Rounded Squircle Badge
    # |nx|^3.5 + |ny|^3.5 <= 0.72^3.5 (safe for maskable 80% circle)
    squircle_r = (abs(nx) ** 3.2 + abs(ny) ** 3.2) ** (1.0 / 3.2)
    badge_radius = 0.70
    badge_border_width = 0.035

    # Radial ambient glow from center
    glow = max(0.0, 1.0 - (dist_center / 0.85))
    glow_val = glow * glow * 0.35

    r = bg_r + glow_val * 16
    g = bg_g + glow_val * 185
    b = bg_b + glow_val * 165

    # Badge inner background
    if squircle_r <= badge_radius:
        # Subtle dark teal gradient inside badge
        inner_t = (ny + 0.7) / 1.4
        inner_r = 12 * (1 - inner_t) + 6 * inner_t
        inner_g = 22 * (1 - inner_t) + 14 * inner_t
        inner_b = 32 * (1 - inner_t) + 22 * inner_t

        # Antialias badge border
        edge_dist = abs(squircle_r - badge_radius)
        if squircle_r > (badge_radius - badge_border_width):
            # Gradient border: emerald to cyan
            angle = (math.atan2(ny, nx) + math.pi) / (2 * math.pi)
            border_r = 16 * (1 - angle) + 6 * angle
            border_g = 185 * (1 - angle) + 182 * angle
            border_b = 129 * (1 - angle) + 212 * angle

            t_border = (squircle_r - (badge_radius - badge_border_width)) / badge_border_width
            r = inner_r * (1 - t_border) + border_r * t_border
            g = inner_g * (1 - t_border) + border_g * t_border
            b = inner_b * (1 - t_border) + border_b * t_border
        else:
            r, g, b = inner_r, inner_g, inner_b

    # Lightning Bolt Polygon coordinates in normalized space (-1 to 1)
    # Designed to be centered, dynamic, and perfectly balanced
    bolt_poly = [
        ( 0.05, -0.44),
        (-0.24, -0.02),
        (-0.02, -0.02),
        (-0.16,  0.44),
        ( 0.24, -0.02),
        ( 0.02, -0.02),
    ]

    is_inside = point_in_polygon(nx, ny, bolt_poly)
    dist_edge = min_dist_to_polygon(nx, ny, bolt_poly)

    # Pixel size in normalized coords
    px_size = 2.0 / width

    if is_inside:
        # Vertical gradient inside bolt: Emerald (#34d399) to Teal (#2dd4bf) to Cyan (#38bdf8)
        bolt_t = max(0.0, min(1.0, (ny + 0.44) / 0.88))
        bolt_r = 52 * (1 - bolt_t) + 56 * bolt_t
        bolt_g = 211 * (1 - bolt_t) + 189 * bolt_t
        bolt_b = 153 * (1 - bolt_t) + 248 * bolt_t

        # White core highlight
        if dist_edge > px_size * 2:
            core_t = min(1.0, (dist_edge - px_size * 2) / 0.06)
            bolt_r = bolt_r * (1 - core_t * 0.5) + 245 * (core_t * 0.5)
            bolt_g = bolt_g * (1 - core_t * 0.4) + 255 * (core_t * 0.4)
            bolt_b = bolt_b * (1 - core_t * 0.4) + 255 * (core_t * 0.4)

        # Antialias bolt outer edge
        if dist_edge < px_size:
            alpha_edge = dist_edge / px_size
            r = r * (1 - alpha_edge) + bolt_r * alpha_edge
            g = g * (1 - alpha_edge) + bolt_g * alpha_edge
            b = b * (1 - alpha_edge) + bolt_b * alpha_edge
        else:
            r, g, b = bolt_r, bolt_g, bolt_b
    else:
        # Outer bloom / glow around the lightning bolt
        if dist_edge < 0.12:
            bloom = (1.0 - (dist_edge / 0.12)) ** 2
            r += bloom * 30
            g += bloom * 160
            b += bloom * 150

    return min(255, max(0, r)), min(255, max(0, g)), min(255, max(0, b)), 255

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(base_dir, 'public')
    create_png(192, 192, render_study_pixel, os.path.join(public_dir, 'icon-192.png'))
    create_png(512, 512, render_study_pixel, os.path.join(public_dir, 'icon-512.png'))
    print("Done creating icons!")

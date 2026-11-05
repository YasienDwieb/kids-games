"""Render Shape Detective's 3D shape sprites.

Each shape kind is modelled as a soft, bevelled clay toy (sphere, rounded
cube, puffy triangle / star / heart / diamond), lit like the app's other 3D
art and rendered on a transparent background, once per palette colour:

    Blender -b -P scripts/3d/render_shapes.py -- <out_dir> <size> <name=#hex> ...

Writes <out_dir>/<kind>-<name>.png. Pre-rendered sprites keep the puzzles'
drag-and-drop and layout untouched and cost nothing at runtime, where a GL
view per shape (up to a dozen on screen) would not.
"""
import math
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
out_dir, size = argv[0], int(argv[1])
colors = dict(a.split("=") for a in argv[2:])

KINDS = ["circle", "square", "triangle", "star", "heart", "diamond"]


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(h):
    h = h.lstrip("#")
    return tuple(srgb_to_linear(int(h[i : i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in {
        e.identifier for e in sc.render.bl_rna.properties["engine"].enum_items
    } else "BLENDER_EEVEE"
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = size
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (1, 1, 1, 1)
    bg.inputs[1].default_value = 0.3
    sc.world = world
    return sc


def flat_shape(points, depth=0.32, bevel=0.14):
    """Extrude a closed 2D outline into a puffy, bevelled slab (faces +Y→camera)."""
    curve = bpy.data.curves.new("s", "CURVE")
    curve.dimensions = "2D"
    curve.fill_mode = "BOTH"
    curve.extrude = depth / 2
    curve.bevel_depth = bevel
    curve.bevel_resolution = 6
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for p, (x, y) in zip(spline.points, points):
        p.co = (x, y, 0, 1)
    spline.use_cyclic_u = True
    obj = bpy.data.objects.new("shape", curve)
    bpy.context.collection.objects.link(obj)
    obj.rotation_euler = (math.pi / 2, 0, 0)
    return obj


def make(kind):
    if kind == "circle":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=64, ring_count=32)
        obj = bpy.context.active_object
        bpy.ops.object.shade_smooth()
        return obj
    if kind == "square":
        bpy.ops.mesh.primitive_cube_add(size=1.6)
        obj = bpy.context.active_object
        obj.scale = (1, 0.45, 1)
        mod = obj.modifiers.new("b", "BEVEL")
        mod.width = 0.22
        mod.segments = 8
        bpy.ops.object.shade_smooth()
        return obj
    if kind == "triangle":
        r = 1.05
        pts = [(r * math.cos(a), r * math.sin(a) - 0.18) for a in (math.pi / 2, math.pi / 2 + 2.094, math.pi / 2 + 4.189)]
        return flat_shape(pts, bevel=0.2)
    if kind == "diamond":
        return flat_shape([(0, 1.05), (0.72, 0), (0, -1.05), (-0.72, 0)], bevel=0.16)
    if kind == "star":
        pts = []
        for i in range(10):
            rr = 1.05 if i % 2 == 0 else 0.46
            a = math.pi / 2 + i * math.pi / 5
            pts.append((rr * math.cos(a), rr * math.sin(a) - 0.04))
        return flat_shape(pts, bevel=0.14)
    if kind == "heart":
        # Two lobes and a turned square fused by a voxel remesh into one
        # puffy heart (an outline curve would spike at the top dip).
        parts = []
        for x in (-0.42, 0.42):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, location=(x, 0, 0.3))
            parts.append(bpy.context.active_object)
        bpy.ops.mesh.primitive_cube_add(size=1.02, location=(0, 0, -0.18), rotation=(0, math.pi / 4, 0))
        parts.append(bpy.context.active_object)
        bpy.ops.object.select_all(action="DESELECT")
        for o in parts:
            o.select_set(True)
        bpy.context.view_layer.objects.active = parts[0]
        bpy.ops.object.join()
        obj = bpy.context.active_object
        obj.scale = (1.18, 0.5, 1.18)
        bpy.ops.object.transform_apply(scale=True)
        rem = obj.modifiers.new("r", "REMESH")
        rem.mode = "VOXEL"
        rem.voxel_size = 0.03
        sm = obj.modifiers.new("s", "SMOOTH")
        sm.iterations = 12
        sm.factor = 0.8
        bpy.ops.object.shade_smooth()
        return obj
    raise ValueError(kind)


def material(rgba):
    m = bpy.data.materials.new("clay")
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = rgba
    p.inputs["Roughness"].default_value = 0.38
    for name in ("Coat Weight", "Clearcoat"):
        if name in p.inputs:
            p.inputs[name].default_value = 0.4
    return m


def light(name, kind, loc, energy, size_=3.0):
    data = bpy.data.lights.new(name, kind)
    data.energy = energy
    if kind == "AREA":
        data.size = size_
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()


for kind in KINDS:
    for name, hexcol in colors.items():
        sc = reset()
        obj = make(kind)
        obj.data.materials.append(material(hex_rgba(hexcol)))
        # A slight turn shows the depth while keeping the outline readable.
        obj.rotation_euler.z += math.radians(-14)
        obj.rotation_euler.x += math.radians(10) if kind != "circle" else 0
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
        sc.collection.objects.link(cam)
        cam.data.type = "ORTHO"
        cam.data.ortho_scale = 2.95
        cam.location = (0, -8, 0.0)
        cam.rotation_euler = (math.pi / 2, 0, 0)
        sc.camera = cam
        light("key", "AREA", (-3, -5, 4), 550)
        light("fill", "AREA", (4, -4, 0.5), 120)
        light("rim", "AREA", (1, 4, 3), 300)
        sc.render.filepath = f"{out_dir}/{kind}-{name}.png"
        bpy.ops.render.render(write_still=True)
        print("SHAPE", kind, name)

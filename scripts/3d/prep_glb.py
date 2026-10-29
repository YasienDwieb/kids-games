"""Prepare a generated GLB (Higgsfield / Meshy) for the app.

React Native has no DOM Image, so three's GLTFLoader can't decode embedded
textures. This script joins the meshes, optionally decimates them, strips every
material image, and writes the base-colour texture next to the model as raw
RGBA8 bytes (`<name>.rgba`, square, power of two) that the SDK uploads as a
DataTexture.

    Blender -b -P scripts/3d/prep_glb.py -- in.glb out.glb [--tris 6000] [--tex 512]
"""
import sys
import bpy
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst = argv[0], argv[1]
opts = dict(zip(argv[2::2], argv[3::2]))
max_tris = int(opts.get("--tris", 6000))
tex_size = int(opts.get("--tex", 512))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
rigged = any(o.type == "ARMATURE" for o in bpy.context.scene.objects)
if rigged:
    # Auto-rigged exports carry helper meshes (an icosphere) outside the skeleton.
    loose = [m for m in meshes if not (m.parent and m.parent.type == "ARMATURE")]
    meshes = [m for m in meshes if m not in loose]
    for o in loose:
        bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
# A skinned mesh keeps its transforms: baking them in would detach it from the
# skeleton's bind pose.
if not rigged:
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

# Weld vertices split along UV seams, so decimation can't open cracks there
# (UVs live on face corners and survive the merge).
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.remove_doubles(threshold=1e-5)
bpy.ops.object.mode_set(mode="OBJECT")

tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
if tris > max_tris:
    mod = obj.modifiers.new("dec", "DECIMATE")
    mod.ratio = max_tris / tris
    # First in the stack, so it decimates the undeformed mesh (weights follow).
    bpy.ops.object.modifier_move_to_index(modifier=mod.name, index=0)
    bpy.ops.object.modifier_apply(modifier=mod.name)

# Generated meshes come flat-shaded; smooth normals hide the facets.
bpy.ops.object.shade_smooth()

# The first image texture feeding a material is the base colour.
image = None
for slot in obj.material_slots:
    if slot.material and slot.material.use_nodes:
        for node in slot.material.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image and image is None:
                image = node.image

def uv_mask(size):
    """Texels covered by the mesh's UV triangles (bottom row first, like image.pixels)."""
    mask = np.zeros((size, size), dtype=bool)
    uv = obj.data.uv_layers.active.data
    for poly in obj.data.polygons:
        pts = [uv[i].uv for i in poly.loop_indices]
        for k in range(1, len(pts) - 1):
            tri = np.array([pts[0], pts[k], pts[k + 1]]) * size
            x0, y0 = np.floor(tri.min(axis=0)).astype(int)
            x1, y1 = np.ceil(tri.max(axis=0)).astype(int)
            x0, y0 = max(x0, 0), max(y0, 0)
            x1, y1 = min(x1, size - 1), min(y1, size - 1)
            if x1 < x0 or y1 < y0:
                continue
            gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
            (ax, ay), (bx, by), (cx, cy) = tri
            d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
            if abs(d) < 1e-9:
                mask[y0 : y1 + 1, x0 : x1 + 1] |= False
                continue
            l1 = ((by - cy) * (gx - cx) + (cx - bx) * (gy - cy)) / d
            l2 = ((cy - ay) * (gx - cx) + (ax - cx) * (gy - cy)) / d
            inside = (l1 >= -0.02) & (l2 >= -0.02) & (1 - l1 - l2 >= -0.02)
            mask[y0 : y1 + 1, x0 : x1 + 1] |= inside
    return mask


def dilate(px, mask, steps):
    """Grow each UV island's colours outward into the unused texels, so
    filtering never pulls the background (white seams) into the model."""
    px = px.copy()
    filled = mask.copy()
    for _ in range(steps):
        acc = np.zeros_like(px)
        cnt = np.zeros(mask.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            src = np.roll(np.roll(filled, dy, 0), dx, 1)
            acc += np.roll(np.roll(px * filled[..., None], dy, 0), dx, 1)
            cnt += src
        grow = (~filled) & (cnt > 0)
        px[grow] = acc[grow] / cnt[grow][:, None]
        filled |= grow
    return px


if image is not None:
    w = h = tex_size
    image.scale(w, h)
    px = np.array(image.pixels[:], dtype=np.float32).reshape(h, w, 4)  # bottom row first
    if obj.data.uv_layers.active:
        px = dilate(px, uv_mask(w), steps=w // 4)
    # glTF UVs put v = 0 at the image's top row: write rows top-down.
    out = (np.clip(px[::-1], 0, 1) * 255 + 0.5).astype(np.uint8)
    out[..., 3] = 255
    with open(dst.rsplit(".", 1)[0] + ".rgba", "wb") as f:
        f.write(out.tobytes())

# One plain material; the texture comes from the .rgba file at runtime.
mat = bpy.data.materials.new("base")
obj.data.materials.clear()
obj.data.materials.append(mat)
for img in list(bpy.data.images):
    bpy.data.images.remove(img)

bpy.ops.export_scene.gltf(
    filepath=dst,
    export_format="GLB",
    use_selection=False,
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
    export_yup=True,
    export_skins=True,
    export_animations=False,
)
final = sum(len(p.vertices) - 2 for p in obj.data.polygons)
bones = [b.name for o in bpy.context.scene.objects if o.type == "ARMATURE" for b in o.data.bones]
print(f"PREP {dst}: {final} tris, texture={'yes' if image else 'no'}, bones={bones}")

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

tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
if tris > max_tris:
    mod = obj.modifiers.new("dec", "DECIMATE")
    mod.ratio = max_tris / tris
    # First in the stack, so it decimates the undeformed mesh (weights follow).
    bpy.ops.object.modifier_move_to_index(modifier=mod.name, index=0)
    bpy.ops.object.modifier_apply(modifier=mod.name)

# The first image texture feeding a material is the base colour.
image = None
for slot in obj.material_slots:
    if slot.material and slot.material.use_nodes:
        for node in slot.material.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image and image is None:
                image = node.image

if image is not None:
    image.scale(tex_size, tex_size)
    px = list(image.pixels)  # floats, bottom row first
    w = h = tex_size
    out = bytearray(w * h * 4)
    # glTF UVs put v = 0 at the image's top row: write rows top-down.
    for y in range(h):
        row = (h - 1 - y) * w * 4
        for i in range(w * 4):
            out[y * w * 4 + i] = max(0, min(255, round(px[row + i] * 255)))
    with open(dst.rsplit(".", 1)[0] + ".rgba", "wb") as f:
        f.write(out)

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

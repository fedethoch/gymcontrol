"""
Renders the body fat reference figures used by BodyFatFigure.

Requires Blender 4.5 LTS with the MPFB extension (MakeHuman; generated models are CC0).
Run from the repo root:

  blender -b --python scripts/body-fat/render_body_fat.py -- public/references/body-fat

Outputs male/{12,17,22,27,33}.png, female/{17,22,27,32,38}.png and, with BF_SHEET=path.png, a contact sheet.
BF_ONLY="male:12,female:33" renders a subset.
"""

import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService

OUT_DIR = os.path.abspath(sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "public/references/body-fat")
RES_X, RES_Y = 560, 640
SAMPLES = 96
ARM_DROP = math.radians(29)
LEG_CLOSE = math.radians(4)
TURN = math.radians(-12)
# Head to knees: body fat reads on torso, hips and thighs.
ORTHO_SCALE = 1.5
TOP_MARGIN = 0.07

# Five levels as MakeHuman macros (weight, muscle); 0.5 is the average body.
SHAPES = [(0.15, 0.85), (0.34, 0.65), (0.55, 0.50), (0.78, 0.40), (1.00, 0.30)]
# Body fat % per level, matching BODY_FAT_REFERENCES in app/lib/nutrition-types.ts.
VALUES = {"male": [12, 17, 22, 27, 33], "female": [17, 22, 27, 32, 38]}
GENDERS = {"male": 1.0, "female": 0.0}

# Garment bands as fraction of body height (feet = 0, head top = 1).
SHORTS = (0.40, 0.575)
SPORTS_TOP = (0.655, 0.78)
LIMB_KEYS = ("arm", "hand", "thumb", "index", "middle", "ring", "pinky")

SKIN = (0.42, 0.45, 0.5)
FABRIC = (0.05, 0.06, 0.065)


def reset_scene():
    for collection in (
        bpy.data.objects,
        bpy.data.meshes,
        bpy.data.armatures,
        bpy.data.lights,
        bpy.data.cameras,
        bpy.data.materials,
    ):
        for block in list(collection):
            collection.remove(block)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.025, 0.03, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.4
    scene.world = world
    return scene


def material(name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def add_light(name, energy, location, color=(1, 1, 1), size=1.5):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.color = color
    data.size = size
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    bpy.context.scene.collection.objects.link(obj)
    direction = Vector((0, 0, 0.95)) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def relax_pose(rig):
    # Rotate limbs around the world front-back axis: arms down from the A-pose, legs slightly closer.
    bpy.context.view_layer.update()
    for bone_name, angle in (
        ("upperarm_l", ARM_DROP),
        ("upperarm_r", -ARM_DROP),
        ("thigh_l", -LEG_CLOSE),
        ("thigh_r", LEG_CLOSE),
    ):
        pose_bone = rig.pose.bones[bone_name]
        head = pose_bone.head.copy()
        rotation = Matrix.Translation(head) @ Matrix.Rotation(angle, 4, "Y") @ Matrix.Translation(-head)
        pose_bone.matrix = rotation @ pose_bone.matrix
        bpy.context.view_layer.update()


def add_garment(human, bands, mat):
    """Builds tight clothing from the posed body surface inside the given height bands."""
    mask = human.modifiers["Hide helpers"]
    mask.show_viewport = mask.show_render = False
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(human.evaluated_get(depsgraph))
    mask.show_viewport = mask.show_render = True

    body_group = human.vertex_groups["body"].index
    limb_groups = {g.index for g in human.vertex_groups if any(key in g.name for key in LIMB_KEYS)}
    keep = []
    for vertex in human.data.vertices:
        weights = {g.group: g.weight for g in vertex.groups}
        limb = sum(w for group, w in weights.items() if group in limb_groups)
        keep.append(weights.get(body_group, 0) > 0 and limb < 0.5)

    world = human.matrix_world
    zs = [(world @ mesh.vertices[i].co).z for i, k in enumerate(keep) if k]
    low, high = min(zs), max(zs)

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    inside = set()
    for vertex in bm.verts:
        h = ((world @ vertex.co).z - low) / (high - low)
        if keep[vertex.index] and any(a <= h <= b for a, b in bands):
            inside.add(vertex.index)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in inside], context="VERTS")
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.clear()
    mesh.materials.append(mat)
    for poly in mesh.polygons:
        poly.use_smooth = True
        poly.material_index = 0

    garment = bpy.data.objects.new("Garment", mesh)
    garment.matrix_world = world
    bpy.context.scene.collection.objects.link(garment)
    # Strong smoothing hides anatomical detail and softens the cut edges; shrinkwrap then keeps
    # the fabric outside the body, and a light second pass relaxes what it pushed out.
    smooth = garment.modifiers.new("Smooth", "SMOOTH")
    smooth.factor = 0.8
    smooth.iterations = 20
    wrap = garment.modifiers.new("Wrap", "SHRINKWRAP")
    wrap.target = human
    wrap.wrap_method = "NEAREST_SURFACEPOINT"
    wrap.wrap_mode = "OUTSIDE_SURFACE"
    wrap.offset = 0.004
    relax = garment.modifiers.new("Relax", "SMOOTH")
    relax.factor = 0.5
    relax.iterations = 5
    displace = garment.modifiers.new("Offset", "DISPLACE")
    displace.strength = 0.007
    displace.mid_level = 0
    solidify = garment.modifiers.new("Thickness", "SOLIDIFY")
    solidify.thickness = 0.003
    subsurf = garment.modifiers.new("Subsurf", "SUBSURF")
    subsurf.levels = subsurf.render_levels = 2
    return high


def render(gender_key, fat, weight, muscle):
    scene = reset_scene()
    macro = TargetService.get_default_macro_info_dict()
    macro.update({"gender": GENDERS[gender_key], "weight": weight, "muscle": muscle, "age": 0.5})
    human = HumanService.create_human(macro_detail_dict=macro)
    rig = HumanService.add_builtin_rig(human, "game_engine")
    relax_pose(rig)
    rig.rotation_euler = (0, 0, TURN)

    human.data.materials.clear()
    human.data.materials.append(material("Skin", SKIN, 0.65))
    for poly in human.data.polygons:
        poly.use_smooth = True
    bands = [SHORTS] + ([SPORTS_TOP] if gender_key == "female" else [])
    head_top = add_garment(human, bands, material("Fabric", FABRIC, 0.8))
    sub = human.modifiers.new("Smooth", "SUBSURF")
    sub.levels = sub.render_levels = 1

    # Key, fill and a restrained emerald rim so the figure separates from the dark UI.
    add_light("Key", 160, (2.2, -3.0, 2.4))
    add_light("Fill", 30, (-2.6, -2.2, 1.2))
    add_light("Rim", 450, (-1.2, 2.8, 2.0), color=(0.35, 1.0, 0.72), size=1.0)

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = ORTHO_SCALE
    cam = bpy.data.objects.new("Cam", cam_data)
    cam.location = (0, -6, head_top + TOP_MARGIN - ORTHO_SCALE / 2)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam

    path = os.path.join(OUT_DIR, gender_key, f"{fat}.png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"rendered {path}")
    return path


def contact_sheet(rows, path):
    """rows: list of lists of image paths, all RES_X x RES_Y."""
    cols = max(len(r) for r in rows)
    sheet = np.zeros((RES_Y * len(rows), RES_X * cols, 4), dtype=np.float32)
    sheet[..., :3] = 0.035
    sheet[..., 3] = 1
    for r, row in enumerate(rows):
        for c, image_path in enumerate(row):
            image = bpy.data.images.load(image_path)
            pixels = np.empty(RES_X * RES_Y * 4, dtype=np.float32)
            image.pixels.foreach_get(pixels)
            pixels = pixels.reshape(RES_Y, RES_X, 4)
            y = (len(rows) - 1 - r) * RES_Y
            x = c * RES_X
            alpha = pixels[..., 3:4]
            region = sheet[y : y + RES_Y, x : x + RES_X]
            region[..., :3] = pixels[..., :3] * alpha + region[..., :3] * (1 - alpha)
            bpy.data.images.remove(image)
    out = bpy.data.images.new("sheet", sheet.shape[1], sheet.shape[0])
    out.pixels.foreach_set(sheet.ravel())
    out.filepath_raw = path
    out.file_format = "PNG"
    out.save()
    print(f"sheet {path}")


only = os.environ.get("BF_ONLY")
rows = []
for gender_key in GENDERS:
    row = []
    for fat, (weight, muscle) in zip(VALUES[gender_key], SHAPES):
        if only and f"{gender_key}:{fat}" not in only.split(","):
            continue
        row.append(render(gender_key, fat, weight, muscle))
    if row:
        rows.append(row)

if os.environ.get("BF_SHEET"):
    contact_sheet(rows, os.path.abspath(os.environ["BF_SHEET"]))

# Moses — Creation Tools

Asset-creation tools for the **Moses** story (Exodus 1–40; Numbers; Deuteronomy 34). Every tool is a
standalone HTML file: open it in any modern browser — no server is required,
`file://` works. The tools are also linked in the story's credits footer
(`../index.html`), which the information modal surfaces as the credits panel.

## Tools

### Shot Designer — `shot-designer/index.html`

3D scene composer built on three.js. Open `shot-designer/index.html` in a browser.

- Pick a scene from the listbox — scenes are registered in `scenes/manifest.json`.
- Fly the camera, set keyframes, and build shot timelines with transitions and easing curves.
- Export stills (PNG .zip) or video (MP4 via WebCodecs), or export the scene as 3D JSON/JS.
- Scenes are ES modules in `scenes/` exporting `build(group)`; shared building blocks live in `scenes/lib/lowpoly.js`.
- Add a scene: write `scenes/<id>.js` following the existing files, then add an entry to `scenes/manifest.json`.

### Scene Designer — `scene_designer.html`

2D scene staging app for laying out each scene before SVG export. Open `scene_designer.html` in a browser.

- The scene list and its one-line briefs live in the `data-scenes` attribute; full director notes are in the comment at the top of the file and in this README.
- The renderer is inline in `scene_designer.html`, so this story’s scene designer can be edited independently.
- Use it to position characters and props per scene, then export the staged scene.

### Texture Forge — `texture-forge.html`

Seamless SVG material generator. Open `texture-forge.html` in a browser.

- Generates the story's textures (listed in the Textures section below).
- Adjust pattern parameters per material, then export repeating SVG patterns.
- Textures feed the SVG scene backgrounds and foregrounds in `../assets/svg/`.
- The story's texture set is configured by `STORY_TEXTURE_CONFIG` at the top of the file.

## Characters

These are the character notes from `character-designer/index.html`:


## Scenes

These are the scene notes from `shot-designer/index.html` and `scene_designer.html`:

1. **The Child in the River** — The mother hides the child for three months, then sets him in a basket of bulrushes among the reeds, where Pharaoh's daughter finds him. Stage: a river bank at dawn, tall reeds, a floating basket, a woman and her sister watching from the distance; mist on the water, a child's cry.

2. **The Burning Bush** — Moses keeps the flock of Jethro in the wilderness of Horeb, and the angel of the Lord appears in a flame of fire out of the bush. Stage: a desert slope at noon, a shepherd's staff, a bush burning without burning up; the light of the flame on a man's face, sandals coming off.

3. **Before the Throne** — Moses stands before Pharaoh, and the plagues come: water to blood, frogs, gnats, flies, and the rest, until the firstborn cry out. Stage: a throne room with gold and lapis, a staff on the floor, a river turning red, the city in darkness; the court hardening, scene by scene.

4. **Passover Night** — The people eat the lamb in haste, with loins girded, and the blood marks the doorposts; the destroyer passes over. Stage: a night house with a meal of lamb and unleavened bread, a door marked with a bunch of hyssop; a family waiting, a city holding its breath.

5. **Through the Sea** — The pillar of cloud goes behind, the sea is divided, and the people cross on dry ground; the waters return over the chariots. Stage: a sea with walls of water, a people walking on the seabed at night, the cloud lighting the way, the horses and the chariots drowned in the morning; a world of water held back.

6. **Bread in the Wilderness** — The Lord gives manna in the morning and quails in the evening; the people gather only enough for the day. Stage: a wilderness camp at dawn, a white ground like frost, small round things lying all around, a jar of manna kept for the testimony; a people learning to trust the day.

7. **Sinai** — The Lord comes down on Mount Sinai in fire, the mountain smokes, and the people stand at the foot, hearing the voice of the trumpet. Stage: a mountain wrapped in smoke and fire, the people at its foot, the covenant being spoken; thunder, lightning, a trumpet's long call.

8. **The Golden Calf** — The people make a molten calf and worship it, and Moses breaks the tablets at the foot of the mountain. Stage: a camp of gold and fire, a calf of gold, a man running down the mountain, two tablets of stone in his hands; the silence after the shattering.

9. **Forty Years** — The people wander in the wilderness, and the Lord sends manna, water from the rock, and the bronze serpent to save. Stage: a desert of tents and wandering, a rock giving water, a serpent of bronze on a pole, a generation passing and a new one rising; the long road to the border.

10. **Mount Nebo** — Moses goes up to Mount Nebo and sees the whole land, and the Lord buries him in the valley; a prophet without equal in Israel. Stage: a mountain at sunset, a man looking over the land of promise, the light on the far hills; the last view, a grave no one knows, the road ending.

## Textures

Textures required for the scenes, generated in Texture Forge (`STORY_TEXTURE_CONFIG`):

| Texture | Material | Used in scenes |
| --- | --- | --- |
| `egypt_mud_brick` | Egyptian Mud Brick (Moses) | Before the Throne; Passover Night; Through the Sea |
| `nile_reeds` | Nile Reeds (Moses) | The Child in the River; Before the Throne |
| `desert_sand` | Wilderness Sand (Moses) | The Burning Bush; Bread in the Wilderness; Forty Years |
| `bulrush_basket` | Bulrush Basket (Moses) | The Child in the River; Before the Throne |
| `hammered_gold` | Tabernacle Gold (Moses) | Before the Throne; Sinai; The Golden Calf; Forty Years |
| `stone_tablets` | Stone Tablets (Moses) | Sinai; The Golden Calf |


---

**Navigation:** [← Source of Truth Overview](../SOURCE-OF-TRUTH-OVERVIEW.md) | [Moses Design SOT](../__docs/moses-design-source-of-truth.md)

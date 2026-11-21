# Kite motion sources

`effects.js` owns pause, visibility and reduced-motion state. `articulated.js` handles internal icon parts and the force widget. `object-scenes.js` handles rigid illustration objects, damped joints, fixed-length orbit/links and moving airflow.

Bounded editable masters and symbol sheets are in `../assets/objects`. The website uses same-document symbols; each scene caches its original bitmap once. Portable composed stills include all cord paths. The wide opening has its own still and declared breakpoint geometry; mobile preserves the compact composition. Static uniform placement is allowed; moving rigid objects never receive mesh, shear, nonuniform scale or displacement deformation.

The guided kite has a tall balanced silhouette, crossbar above center and a bridle tied to its frame. Its tow point moves on a constrained arc about the fixed grip; the sail/frame remain rigid, tail joints follow and air flows. Beaks, readable pages and grounded feet are protected. This uses prescribed damped targets, not a full aerodynamic simulation.

The wind widget starts assembled at a light breeze (1 of 3). At zero the kite rests with slack line. Positive force changes lift, sweep and speed. Released plates have independent mass, gravity, drag, gust and angular responses; at zero they fall onto supporting edges, settle separately and stay within the field. Reassembly smoothly restores the construction.

Hover/focus/touch increase object response smoothly. Clicking art does not create a selected frame or enable dragging. Keyboard focus remains visible. The persistent Reduce motion preference in the footer Accessibility disclosure and device reduced motion show coherent stills while controls remain usable. Offscreen and hidden scenes suspend. Useful art remains without JavaScript, including a responsive opening still.

For edits, retain all current message/interaction IDs. Change original SVG geometry, joints and matching scenario contracts together, refresh same-document definitions and stills, then inspect natural playback at normal size. Compare rest and extreme silhouettes, contact preservation, practical visibility, first-paint/no-JS, hover/focus/touch, force baselines, pause and reduced motion. `components.html` is the live component lab.

The three inner openings use distinct native SVG object compositions: `platform-opening.svg`, `demo-opening.svg` and `approach-opening.svg`. They sit directly in the sky field. Their folio, brief, reels and cords stay stationary; two visible pinned paper parts in each composition rotate as rigid shapes. The shared `articulated.js` lifecycle provides continuous idle motion, stronger hover/focus/touch response, pause and reduced motion. The native base geometry remains complete without JavaScript. These are purpose-specific decorative compositions, not product screenshots. The homepage scenes remain the storytelling illustrations.

Revision 8 art direction: the desktop hero uses a common uniform transform around the complete actor/tether system. The full-width foreground and air field are composed separately; neither the beak nor the kite is stretched. Physical dynamics and input defaults are unchanged.

Revision 9 keeps the actor rigs and adds separate sun, cloud and foreground/distant landscape layers. Clouds travel gently; environment paint never deforms the beak or frame. The footer disclosure replaces every public Pause motion toolbar. The browser preference persists across pages, while an OS request for reduced motion takes precedence. New raster character candidates are static exploration only.

## Revision10: broader forms and scroll entry

The website now uses original kite constructions from `assets/kite-repertoire/`: pieced diamond, striped delta, woven six-sided sail, open-cell box and ribbed parafoil. The family was developed from actual AKA, NASA and Smithsonian shape/material evidence; its panel patterns are original. `assets/kite-repertoire/manifest.json` declares the physical tow point, construction limits and optional tail attachment. The closing field keeps each sail/bridle together under a uniform rigid transform and places the flying line at that exact tow point. It is an ambient illustrative study, not an aerodynamic simulator. The original hero, character rigs and widgets remain.

Every website process list was audited. Delivery rows use context, agreement and work markers; redundant section/approach numerals are removed visually while sequence remains accessible. Do not infer completion from a single repaired list.

`shared/scroll-reveal.js` and `.css` provide a brief once-only entrance on neutral `[data-scroll-reveal]` wrappers. Content is visible by default, first-view content is immediate, and focus, same-page navigation, reduced motion, print and script failure do not conceal it. Never put the effect on an existing physical transform owner. Existing continuous scene motion remains independent. See `website/components.html` for the material library and `website/closing-flight.js` for the connected closing study.

The closing flight composition uses an airy blue-green sky with brighter fabric accents, varied elevations and oblique tethers from a compact winder group. Diamond-tail bows and knotted line telltales follow their attachment points with flexible lag; sails and internal bridles remain rigid. A muted row of upright individually staked kites was rejected for reading as standing flags. Future review must judge the actual implied action and color vitality at native size, not count shapes. No motion or color quota replaces that judgment.

A further line/color correction replaces the straight tether fan with shallow bowed lines in the same moving attachment system. Each curve has a fixed shape relative to its constant-length chord, so the whole profile keeps its arc length; ribbon knots follow the curve, not its chord. The subsequently rejected high-chroma experiment is replaced by the retained palette: sky, coral, butter, yellow, paper, ink, sage and lilac. Color and line quality must be judged from actual placement after explicit user feedback, even after prior mechanical checks passed.

The requested coastal extension gives the closing a sea horizon, small rigid sailing boats, shore trees and a clear, unobstructed sun. Foreground kite lines lead back to grounded winders; smaller boats and receding water bands establish distance. Every breakpoint places sun, trees and boats within the same uniform scene scale. Only soft water and beach silhouettes span the viewport independently. Boat bobbing and traveling water highlights share the motion-preference lifecycle. New sources: assets/world/coastal-boat.svg and coastal-tree.svg.

Final palette constraint: use only the established identity colors. Increased life comes from the visible area and contrast of coral/yellow/sky sail panels, material patterns and ink/sky tonal depth in the sea; no new cobalt, orange, purple or teal tokens are adopted. Trees are placed on visible shore with clearance around each root. Inspect their rendered land contact, boat/water contact and unobscured sun at both breakpoint compositions.

## Revision 11: lighter, irregular opening airflow

The opening uses shorter wind strokes with substantially larger gaps. Four independently curved paths have unequal origins and painted lengths, so the flow no longer forms matching rows and columns. Thin strokes are 92–164 SVG units with 396–468-unit gaps; blue accents are 54–82 units. All paths within each layer share its repeat length (560 thin / 1180 blue), preserving a smooth continuous wrap and common wind direction with the existing runtime. Per-path dash patterns inherit the animated group offset; do not replace it with a static child offset.

Responsive path patches in the inline opening and the guided SVG scene masters must stay consistent. The original bird, kite, cords, palette, messaging, interactions and coastal closing are retained. Review at actual desktop/mobile size, including a natural later cycle, hover, breakpoint resize and useful reduced-motion/no-script stills.

## Revision 12: planned object reactions

The new effects-design stage specifies input geometry, property owners, seven interaction states and required art layers before finished art. The original bird is separated at its neck: the head and entire beak nod as one rigid piece around [278,670], within ±3 degrees. Feet, body and the handgrip stay fixed. The bird and opening sail now have separate stable hit areas. Other separable scene parts also react locally.

Each coastal kite has its own stable silhouette sensor, energy envelope and advancing clock. Hover/focus creates a faster bounded gust along its existing tether arc; the attached line, knots and tail follow only that kite. Trees retain their planted trunk and ground. A ±5-degree canopy response, short air marks and a fixed pool of three leaves reveal the breeze. Released leaves inherit the actual canopy attachment and angle, then fall with gravity and drift before fading.

The navigation mark retains its original paths and destination. Only the emblem flies out/up, with a continuous cord anchored at the word; it returns from its current pose when the pointer leaves. Real CTA surfaces expand slightly and change within the existing palette, while their text and input footprint stay fixed. Existing scroll reveals, articulated icons, widget states and continuous idle loops remain.

Implementation: shared/object-reactions.js supplies independent input/time, spring and particle primitives; object-scenes.js opts into authored local hit bounds. website/object-reactions-site.js binds these to the retained artwork. No raster warp, beak bend, scene-wide hover transform or per-frame randomized pose is used. Keyboard, touch/semantic activation, live motion preference, offscreen/hidden suspension and print are reviewed with actual browser input.

The reusable source parts and their coordinates/constraints are in assets/reactive/manifest.json. Do not stretch the padded bird master into its original unpadded placement. Keep stationary hit geometry outside moving groups, and account for responsive authored coordinate changes.

# Feature Specification: Garment Art & Customization Polish

**Feature Branch**: `003-garment-art-polish`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "Garment art & customization polish (feature 003). Improve how clothing pieces are drawn as SVG and expand the customization options for wardrobe items in the outfit builder, sketch creator style tiles, outfit cards, rotation and print views." (Full description, including the observed problems and the six prioritised goals, was supplied with the command and is summarised in the Overview below.)

## Overview

Every garment in the app is shown as a small drawing: on the figure in the outfit builder, on outfit and rotation cards, in the printed cartoon, and as style tiles in the sketch creator. Rendering every current style side by side showed these problems:

- **Styles are hard to tell apart.** Oxford, polo and tee look nearly the same at tile size, and so do blazer and cardigan, and sneakers and loafers. The oxford has no collar, placket or cuffs.
- **Shoes float.** On the plain (non-cartoon) figure, shorts and skirts leave a gap between hem and shoes, because legs are only drawn on the cartoon.
- **Light garments disappear.** Outlines on the plain figure are very thin and get thinner in the cropped tiles, so a white undershirt nearly vanishes against a white tile.
- **Sleeves can't vary.** The arms are part of the torso shape, so there is no way to show a short-sleeved oxford or a rolled sleeve.
- **Details are fixed.** The belt buckle is always a gold outline and pants have no belt loops. Stripes only run vertically, at one scale.
- **Showing one piece alone is fragile.** Today the drawing of one piece is taken out of the full figure by comparing pieces of markup. It will stop working once the drawings gain richer detail.

The wardrobe also lacks options people expect to record: sleeve length, patterns other than one stripe, hardware colour, the difference between jeans, chinos and trousers, accessories such as glasses, and what kind of underwear they own.

This feature works in six stages, in priority order:

1. A drawing foundation that shows any one piece on its own exactly as it appears on the figure, and lets lengths (sleeve, hem) be chosen rather than hand-drawn per style. Nothing visible changes in this stage.
2. A visual polish of the 19 existing styles.
3. Per-item **details** (sleeve, pattern, hardware, length) that sit next to the style rather than multiplying style names.
4. More styles for shirts, layers, pants, shoes and belts.
5. Accessories, including glasses, which a look can hold several of at once.
6. Underwear styles for tracking. They are never drawn on the figure.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Garments that read clearly at a glance (Priority: P1)

A person scrolls the style tiles in the sketch creator, or glances at a week of looks in the rotation. Each piece is recognisable straight away: the oxford has a point collar and button placket, the polo a ribbed collar and short button stand, the blazer notch lapels and pockets, the sneaker a white sole and laces. A white undershirt is just as visible as a navy blazer. On the plain figure, a look with shorts has legs between the hem and the shoes.

**Why this priority**: The drawings are the main way the app shows clothes. If styles look alike, choosing a style, reading an outfit card or checking the printed rotation is guesswork. This polishes what people already use without asking them to enter anything new.

**Independent Test**: Open the sketch creator for every slot, and view a set of looks on the plain and cartoon figures. Without reading the labels, identify each existing style correctly, and confirm that white and very light pieces have visible edges on every background where they appear.

**Acceptance Scenarios**:

1. **Given** the sketch creator is open for any slot, **When** the person looks at the style tiles, **Then** each style has at least one distinctive detail visible at tile size (see FR-010) and no two tiles in the same slot look the same apart from their label.
2. **Given** a look with shorts or a skirt, **When** it is shown on the plain figure, **Then** neutral legs connect the hem to the shoes, with no gap.
3. **Given** a white or near-white garment, **When** it is shown in a tile, on an outfit card, on the figure or in print, **Then** its full outline is visible against the background.
4. **Given** the same garment, **When** it is shown as a tile and on a full figure, **Then** its outlines look equally heavy in both, rather than thinner in the tile.
5. **Given** a garment colour, **When** it is drawn, **Then** a single darker shade of that colour marks depth (under the collar, the inside of an open jacket, the inseam, shoe soles), so pieces don't look flat.
6. **Given** the person's existing wardrobe, outfits and rotation, **When** they open the app after this change, **Then** everything they saved is still there, in the same slots and colours, and only looks more polished.

---

### User Story 2 - Describe pieces as they really are (Priority: P1)

A person owns a short-sleeved blue oxford, a gingham shirt, a black belt with a silver buckle and cropped chinos. When adding or sketching each piece, after the style they choose its sleeve length, pattern and second colour, hardware colour or length, and the drawing updates to match. They only see the options that apply to that style: a belt offers hardware, not sleeves.

**Why this priority**: These are the differences the user named first (long vs. short sleeves, buckle colours). They let the existing styles cover far more real clothes without a separate style for every combination.

**Independent Test**: Sketch one piece for each detail option (each sleeve length, each pattern, each hardware colour, each bottom length). Confirm the tile and figure update live to show the choice, that only the options for the chosen style are offered, and that items saved before this feature still show exactly as their defaults.

**Acceptance Scenarios**:

1. **Given** a shirt or top-layer style, **When** the person chooses long, short or rolled sleeves, **Then** the figure shows the sleeve ending at the wrist, above the elbow, or just below the elbow with a turned-up cuff, and on the cartoon figure the forearm shows wherever the sleeve stops.
2. **Given** any garment with a pattern option, **When** the person chooses stripe, pinstripe, breton (horizontal stripe), gingham, check/plaid or dot and a second colour, **Then** the pattern fills the garment at a scale that suits the piece, runs in the right direction, and is the same on the tile and the figure.
3. **Given** a belt, blazer, jacket or jeans, **When** the person chooses brass, silver, gunmetal or black hardware, **Then** the buckle, buttons, zip or rivets show in that colour.
4. **Given** pants, **When** the person chooses full, cropped, knee or short length, **Then** the hem ends at the matching point on the leg, and legs show below it on both figure types.
5. **Given** an item saved before this feature with a stripe colour, **When** it is shown, **Then** it appears as a stripe pattern in that colour and nothing is lost.
6. **Given** an item saved before this feature with no details, **When** it is shown, **Then** it uses that style's default details (for example long sleeves for an oxford, short for a tee and polo, full length for pants, brass hardware).
7. **Given** a person changes an item's style, **When** the new style doesn't use a detail the item had (for example, from oxford to belt), **Then** that detail is no longer offered or drawn. If they switch back during the same edit, the detail they chose earlier is restored.

---

### User Story 3 - More styles to choose from (Priority: P2)

A person's wardrobe includes jeans, flannel shirts, a hoodie, chelsea boots and a braided belt. They can choose each as its own style, and each looks like itself: jeans with contrast stitching and rivets, trousers with a front crease, a hoodie with a hood and pouch pocket, chelsea boots with elastic side panels.

**Why this priority**: More styles make the wardrobe more accurate, but they are only worth adding once the drawings are clear (Story 1) and the detail options exist (Story 2), so that one style plus its details covers many real pieces.

**Independent Test**: Sketch one of each new style and add it to a look. Confirm each can be told apart from every other style in its slot without its label, on both figure types and as a tile.

**Acceptance Scenarios**:

1. **Given** the sketch creator for shirts, **When** the person looks at the styles, **Then** dress shirt, flannel, henley and camp collar are offered alongside oxford, polo and tee.
2. **Given** the sketch creator for top layers, **When** the person looks at the styles, **Then** crewneck, quarter-zip, hoodie, chore coat, bomber and overcoat are offered alongside blazer, sweater, cardigan and jacket.
3. **Given** the sketch creator for pants, **When** the person looks at the styles, **Then** chinos, jeans, trousers and joggers are offered alongside pants, shorts and skirt.
4. **Given** the sketch creator for shoes, **When** the person looks at the styles, **Then** derby/oxford, chelsea boot, lace-up boot and sandal are offered alongside boots, sneakers and loafers.
5. **Given** the sketch creator for belts, **When** the person looks at the options, **Then** they can choose a buckle shape (frame, plate, or D-ring for a webbing belt) and a braided belt style.
6. **Given** a look with a belt, **When** it is shown, **Then** the pants show belt loops around the belt.
7. **Given** existing items with the generic "pants" style (for example jeans, chinos and trousers saved before this feature), **When** they are shown, **Then** they look as they do in Story 1, and the person can change them to a more specific style by editing the item.

---

### User Story 4 - Glasses and other accessories (Priority: P2)

A person who wears glasses every day wants their cartoon to wear them too, and sometimes adds a watch or a tie. In the outfit builder they can add any number of accessories to a look. Glasses, sunglasses and hats appear on the cartoon figure's head. Watches, ties and scarves appear on both figure types.

**Why this priority**: The user asked for glasses specifically, and accessories make the printed cartoon feel personal. It comes after the clothing work because it adds a new kind of choice to the builder.

**Independent Test**: Add glasses, a watch and a tie to one look in the builder. Confirm all three show on the cartoon figure, the watch and tie also show on the plain figure, the look saves and reloads with all three, and looks without accessories are unchanged.

**Acceptance Scenarios**:

1. **Given** the Wardrobe tab, **When** the person adds an item, **Then** "Accessories" (replacing "Other") offers glasses, sunglasses, watch, hat, tie, scarf, and a generic "other" for anything else (such as a wallet).
2. **Given** the outfit builder, **When** the person adds accessories to a look, **Then** they can add several at once, remove any one of them, and the figure shows them straight away.
3. **Given** a look with glasses, sunglasses or a hat, **When** it is shown on the cartoon figure, **Then** the accessory sits correctly on the head with any hair style. **When** it is shown on the plain figure (which has no head), **Then** it is not drawn, and the look still lists it.
4. **Given** a look with a watch, tie or scarf, **When** it is shown on either figure, **Then** the accessory is drawn in its colour in the right place (wrist, collar, neck), above the shirt and layer as worn.
5. **Given** an accessory style tile, **When** the person views it, **Then** head-worn accessories are shown on a small head, and the rest are shown cropped to where they are worn.
6. **Given** generic "other" accessories (such as a wallet), **When** a look includes them, **Then** they are listed and counted but not drawn.
7. **Given** Generate rotation, **When** it builds looks, **Then** it does not add accessories by itself. Accessories the person put on a look are kept.

---

### User Story 5 - Track underwear by style (Priority: P3)

A person keeps track of what they own and what they have left to buy, including basics. When adding underwear they choose boxers, briefs, boxer-briefs or trunks, and each shows a small icon in the wardrobe list, the same way socks do.

**Why this priority**: It's useful for keeping the wardrobe complete and the costs right, but it doesn't change outfits or drawings. Underwear is never drawn on the figure.

**Independent Test**: Add one item of each underwear style. Confirm each shows its own icon in the wardrobe list and counts toward costs, and that none of them can be added to a look or appear on a figure.

**Acceptance Scenarios**:

1. **Given** the Wardrobe tab, **When** the person adds a socks-and-underwear item, **Then** they can choose socks, boxers, briefs, boxer-briefs or trunks.
2. **Given** a socks-and-underwear item, **When** it is listed, **Then** it shows a small icon for its style in its colour.
3. **Given** items saved before this feature with the generic "underwear" style, **When** they are shown, **Then** they keep a generic underwear icon and the person can pick a specific style by editing the item.
4. **Given** any look, **When** it is shown on any figure, **Then** no underwear is drawn.

---

### Edge Cases

- **Patterns at small sizes**: in the smallest tiles and printed thumbnails, fine patterns (pinstripe, dot) must still read as patterned and must not turn into a muddy blur or a moiré.
- **Pattern with the same colour twice**: if the second colour equals the main colour, the garment is drawn as solid with no artefacts.
- **Very dark garments**: the shade colour and outline must still be visible on near-black pieces (for example a black hoodie on the print view).
- **Layer over a pattern**: an open layer (blazer, cardigan, overcoat) over a patterned shirt shows the pattern only in the open front, lined up with the rest of the shirt.
- **Sleeve combinations**: a short-sleeved layer over a long-sleeved shirt shows the shirt sleeve below the layer sleeve. A long-sleeved layer over any shirt hides the shirt sleeve.
- **No shirt**: when the undershirt stands in for the shirt, it is drawn as a short-sleeved tee in its own colour, as today.
- **Tie without a collar**: a tie with a tee or crew-neck sweater is still drawn, centred at the neck.
- **Hat and hair**: every hair style (short, long, bun, curly, none) stays visible beneath the brim where it would really show, and long hair still falls behind the body.
- **Glasses and sunglasses together**: if a look has both, both are kept on the look but only the sunglasses are drawn.
- **Two of the same accessory**: two watches or two ties on one look is allowed. Only one of each kind is drawn, and all are listed.
- **Imported files**: wardrobe files from before this feature, and from the original single-file format, import without errors and show with default details.
- **Unknown style or detail**: an item whose style or detail value isn't recognised (for example from a hand-edited file) is shown using its slot's default drawing and keeps its value, instead of failing or losing data.
- **Skirt length**: skirts take the same length options as other bottoms, and legs show below the hem.

## Requirements *(mandatory)*

### Functional Requirements

**Drawing foundation**

- **FR-001**: A garment shown on its own (style tile, wardrobe icon) MUST look exactly like that garment on the full figure, including its pattern, details and hardware, with nothing from other slots or from the bare figure included.
- **FR-002**: The figure MUST have named body points (shoulder, elbow, wrist, waist, knee, ankle) that set where sleeves, hems and lengths end, so one length option applies the same way to every style that uses it.
- **FR-003**: Before any visual change ships, every existing style on both figure types MUST render the same as it does today. This is the stage-1 regression baseline.

**Visual polish of existing styles**

- **FR-004**: Arms MUST be drawn separately from the torso, so sleeves can end at different points.
- **FR-005**: The figure MUST have sloped shoulders, a slight taper from chest to waist, and pants that taper toward the ankle with a clear inseam.
- **FR-006**: The plain figure MUST show neutral legs wherever a garment leaves them uncovered.
- **FR-007**: Outline weight MUST look the same on tiles, cards, figures and print, and MUST be heavier than today's plain-figure outline.
- **FR-008**: Every garment's outline MUST stay visible on every background it is shown on, including white and near-white garments on white or light tiles.
- **FR-009**: Each garment colour MUST have exactly one derived darker shade, used for depth (under the collar, open-front interior, inseam, soles).
- **FR-010**: Each existing style MUST have a distinctive detail visible at tile size:
  - **oxford**: point collar, button placket, cuffs
  - **polo**: ribbed collar with 2–3 buttons
  - **tee**: ribbed crew neck
  - **blazer**: notch lapels, chest pocket and flap pockets
  - **cardigan**: V neck, button column, ribbed hem and cuffs
  - **sweater**: ribbed neck, cuffs and hem
  - **jacket**: zip
  - **sneakers**: white midsole and laces
  - **loafers**: low vamp with penny strap
  - **boots**: taller shaft and heel
- **FR-011**: Style tiles MUST have breathing room around the garment and a light warm background, so white garments show.

**Detail options**

- **FR-012**: Items MUST be able to hold detail options next to their style: sleeve length, pattern with a second colour, hardware colour, and length for bottoms.
- **FR-013**: Each style MUST declare which detail options apply to it and its default for each. The item editor and sketch creator MUST only offer those options.
- **FR-014**: Sleeve length MUST offer long, short and rolled for shirts and top layers.
- **FR-015**: Pattern MUST offer solid, stripe, pinstripe, breton (horizontal stripe), gingham, check/plaid and dot, with a second colour. Patterns MUST be scaled and oriented to suit the garment and look the same on the tile and the figure.
- **FR-016**: Hardware colour MUST offer brass, silver, gunmetal and black, and MUST colour belt buckles, blazer buttons, jacket zips and jean rivets.
- **FR-017**: Length for bottoms MUST offer full, cropped, knee and short, ending at the matching body point. Shorts lengths map to the knee point.
- **FR-018**: Items saved before this feature MUST render with their style's defaults, and an existing stripe colour MUST become a stripe pattern in that colour with no data lost.
- **FR-019**: Changing an item's style MUST hide details the new style doesn't use, without discarding them during that edit. Details the saved item's style doesn't use MUST NOT be saved.
- **FR-020**: The sketch creator MUST offer the detail options for the chosen style, with tiles and the figure updating live in the draft's colours.

**More styles**

- **FR-021**: Shirts MUST add dress shirt, flannel, henley and camp collar.
- **FR-022**: Top layers MUST add crewneck, quarter-zip, hoodie, chore coat, bomber and overcoat.
- **FR-023**: Pants MUST add chinos, jeans (contrast stitching and rivets), trousers (front crease) and joggers (cuffed ankle). The existing pants, shorts and skirt styles remain.
- **FR-024**: Shoes MUST add derby/oxford, chelsea boot, lace-up boot and sandal. The existing boots, sneakers and loafers remain.
- **FR-025**: Belts MUST offer buckle shapes (frame, plate, D-ring) and a braided style. Pants MUST show belt loops when a belt is worn.
- **FR-026**: Every new style MUST meet FR-010's standard: a distinctive detail visible at tile size.
- **FR-027**: Existing items MUST keep their saved style. Nothing is restyled automatically.

**Accessories**

- **FR-028**: The "Other" category MUST become "Accessories", offering glasses, sunglasses, watch, hat, tie, scarf, and a generic "other". Existing "Other" items MUST become generic accessories without losing data.
- **FR-029**: A look MUST be able to hold any number of accessories, in addition to its one item per clothing slot.
- **FR-030**: The outfit builder (in Outfits and in the Rotation day panel) MUST let the person add and remove accessories on a look, with the figure updating straight away.
- **FR-031**: Glasses, sunglasses and hats MUST be drawn on the cartoon figure's head only. Watches MUST be drawn at the wrist, ties at the collar and scarves at the neck, on both figure types. Generic accessories MUST NOT be drawn.
- **FR-032**: Accessory tiles MUST show head-worn accessories on a small head, and the rest cropped to where they are worn.
- **FR-033**: Generate rotation and Shuffle MUST NOT add or remove accessories. Accessories the person chose MUST be kept.
- **FR-034**: Outfit cards, the lookbook and the print view MUST show a look's accessories.

**Underwear**

- **FR-035**: The socks-and-underwear category MUST offer socks, boxers, briefs, boxer-briefs and trunks. The existing generic "underwear" style MUST remain valid.
- **FR-036**: Each socks-and-underwear style MUST have a small icon in the item's colour, shown in the wardrobe list.
- **FR-037**: Underwear MUST never be drawn on an outfit figure and MUST NOT be addable to a look.

**Compatibility**

- **FR-038**: Saved wardrobes, outfits and rotations from before this feature, including files in the original single-file format, MUST load and import without errors, and MUST look and behave the same apart from the improved drawings.
- **FR-039**: Unrecognised style or detail values MUST fall back to the slot's default drawing and MUST be kept unchanged when saving.
- **FR-040**: Exported wardrobe files MUST include details and accessories, so exporting and importing again gives an identical wardrobe.

### Key Entities

- **Item**: a piece of clothing or an accessory the person owns, plans to buy or has sketched. It gains optional **details**. A missing detail means the style's default.
- **Style**: a named kind of piece within a category (for example oxford, chelsea boot, glasses). Each style lists which detail options apply and the default for each, and has a distinctive drawing.
- **Details**: an item's optional choices next to its style: sleeve length (long, short, rolled), pattern (solid, stripe, pinstripe, breton, gingham, check/plaid, dot) and second colour, hardware colour (brass, silver, gunmetal, black), and length for bottoms (full, cropped, knee, short). Belts also choose a buckle shape (frame, plate, D-ring).
- **Category**: "Other" is renamed "Accessories" and gains styles. "Socks & underwear" gains underwear styles. The categories that make up an outfit's slots are unchanged.
- **Look**: one item (or none) per clothing slot, as today, plus a list of accessories that may be empty.
- **Body points**: the named points on the figure (shoulder, elbow, wrist, waist, knee, ankle) where sleeves, hems and lengths end.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a side-by-side review of every style tile in each slot, a person unfamiliar with the app correctly names at least 90% of styles without labels. Today oxford/polo/tee, blazer/cardigan and sneakers/loafers can't be told apart.
- **SC-002**: 100% of style and detail combinations render with a fully visible outline on every background where they appear, including white garments on white tiles.
- **SC-003**: 0 looks on the plain figure show a gap between hem and shoe, across every bottom style and length.
- **SC-004**: All wardrobe, outfit and rotation data from before this feature (the sample wardrobe, a file in the original single-file format, and a browser-saved wardrobe) loads with 0 errors, 0 lost items and 0 changed slot assignments.
- **SC-005**: Recording a short-sleeved gingham shirt, a belt with a silver buckle, or cropped chinos takes no more than 2 choices beyond picking the style and colour.
- **SC-006**: The total number of styles grows from 19 to at least 40 drawn styles, plus 4 underwear styles, while each slot keeps a single style list in which every style is distinctive.
- **SC-007**: Adding glasses to a look takes no more than 2 actions from the outfit builder, and they show on the cartoon figure straight away.
- **SC-008**: The outfit builder, style tiles and print view feel no slower than before: the figure and tiles update within the same moment as today when a choice changes, and the printed rotation of a full 2-week, 5-day plan renders without visible delay.
- **SC-009**: Exporting a wardrobe that uses every detail option and accessory, then importing it, gives an identical wardrobe 100% of the time.

## Assumptions

- **Defaults per style**: oxford, dress shirt and flannel default to long sleeves. Polo, tee, henley and camp collar default to short. All layers default to long. Pants, chinos, jeans, trousers and joggers default to full length, shorts to short, and skirts to knee. Hardware defaults to brass and pattern to solid.
- **Rolled sleeve**: ends just below the elbow with a visible turned-up cuff.
- **Knee and short lengths**: "knee" ends at the knee point. "Short" ends a set amount above it. Shorts cover both by length option rather than separate inseam measurements.
- **Plain figure has no head**: head-worn accessories only appear on the cartoon figure. This keeps the plain mannequin as it is today.
- **Underwear stays undrawn**: by the user's direction, underwear is tracked and costed only. Socks keep their current icon treatment.
- **No automatic restyling**: existing items named "jeans", "chinos" or "trousers" keep their saved "pants" style. People can update them by editing. Guessing styles from names is out of scope for this feature.
- **Accessories in looks**: accessories are optional and never required for a look to be complete. The "Try every" variation strip continues to cover clothing slots only.
- **Palette**: second colours and accessory colours use the same curated palette and custom colour picker the sketch creator already has. Hardware uses only the four named finishes.
- **Single shade**: one derived shade per colour is enough depth. No gradients or lighting effects are planned.
- **Stage order**: stage 1 (the drawing foundation) ships before any visual change, so the regression baseline in FR-003 can be checked.
- **Out of scope**: drawing garments from photos, freeform drawing tools, drawing underwear on the figure, and new figure body types or poses.

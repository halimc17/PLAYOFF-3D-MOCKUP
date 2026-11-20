# PRODUCT.md

## Purpose
Browser-based 3D sportswear jersey design studio (`KitForge 3D`, white-label ready) built for two audiences:
1. **End users (team captains, players, community clubs):** independently design football, futsal, and volleyball jerseys in real time (colors, procedural patterns, uploaded PNG/JPG/SVG graphics, and athletic names/numbers) with synchronized 2D and 3D views.
2. **Jersey manufacturers / apparel producers:** receive unambiguous, production-ready specifications without back-and-forth guessing via an exported `.zip` production pack (4-angle 3D Tech Pack PDF, 2048px flat panel textures, original raw uploaded assets, re-openable `.jersey.json`, and structured WhatsApp summary).

## MVP Scope
- **Sports:** Football, Futsal, Volleyball.
- **Garment cuts:** Short Sleeve (sculpted CLO3D V-Neck `.glb`) and Long Sleeve V-Neck; manifest-ready to add O-Neck or Polo `.glb` assets later.
- **Panels:** Front Body, Back Body, Left Sleeve, Right Sleeve, Collar, and Cuffs/Trim.
- **Persistence:** Frontend-only SPA with IndexedDB auto-save for large uploaded assets and `.jersey.json` file import/export.
- **Localization & Theme:** Indonesian default with English toggle (`ID`/`EN`); Dark studio default with working Light mode toggle; responsive Desktop Split Workspace and Mobile Bottom Sheet.
- **White-label configuration:** Centralized in `src/config/brandConfig.ts`.

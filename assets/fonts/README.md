# Fonts

Self-hosted subsets used by `/recommendations/`.

| Family | Faces | Source |
|---|---|---|
| Spectral | 400, 500, 400 italic | Google Fonts (`ofl/spectral`) |
| IBM Plex Sans | variable, 400–500 | Google Fonts (`ofl/ibmplexsans`) |

Each family ships `latin` and `latin-ext` files. **`latin-ext` carries the Hungarian
long vowels (ő, ű)** — don't drop it. The `unicode-range` declarations in
`recommendations/index.html` mean browsers fetch the ext file only when a page uses
those glyphs.

IBM Plex Sans is a variable font: Google serves one identical file for weights 400 and
500, so it is stored once and declared `font-weight: 400 500`.

Both families are licensed under the SIL Open Font License 1.1 — see `OFL-Spectral.txt`
and `OFL-IBMPlexSans.txt`, which must ship alongside the font files.

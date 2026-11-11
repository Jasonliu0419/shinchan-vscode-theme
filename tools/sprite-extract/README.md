# sprite-extract

Offline scripts that produced `assets/sprites.json` (not part of the extension bundle).

- `extract_sheet.py <蠟筆小新像素圖.jpg> <outdir>`: samples the 8 poses of the reference sheet (art by a_cute_tattoo) cell by cell (~7.85 px grid).
- `extract_gif.py <folder with 打招呼.gif 動感光波.gif 睡覺.gif> <outdir>`: removes the backgrounds at full resolution, keeps enclosed whites (eye highlights, beam core), downsamples to ~30-row frames and snaps colours to a fixed palette.

Requires Python 3 with Pillow, numpy and scipy. Personal use only; do not redistribute the art.

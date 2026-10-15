#!/bin/sh
# Cuts book panels listed in illustrations/plan/book-panels-uN.txt into
# illustrations/book-refs/panels/<name>.jpg (git-ignored).
# Usage: sh illustrations/tools/cut-panels.sh <unit number>
# Box lines: name pdfPage x0 y0 x1 y1, in an 808-px-wide page (pages render at 2x).
set -e
cd "$(dirname "$0")/.."
pdf=../renata-kamenarova-krizom-krazom-slovencina-a1-2007.pdf
boxes=plan/book-panels-u$1.txt
mkdir -p book-refs/pages book-refs/panels
grep -v '^#' "$boxes" | while read -r name page x0 y0 x1 y1; do
  [ -n "$name" ] || continue
  png=book-refs/pages/p-$(printf %03d "$page").png
  [ -f "$png" ] || pdftoppm -f "$page" -l "$page" -scale-to-x 1616 -scale-to-y -1 -png "$pdf" book-refs/pages/p
  magick "$png" -crop "$(( (x1 - x0) * 2 ))x$(( (y1 - y0) * 2 ))+$(( x0 * 2 ))+$(( y0 * 2 ))" +repage -quality 85 "book-refs/panels/$name.jpg"
done
echo "cut $(grep -vc '^#' "$boxes") panels from $boxes"

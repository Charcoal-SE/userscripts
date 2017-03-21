#!/bin/bash
# Charcoal-SE/userscripts build script. Scripts should each have their own directory; if they wish to customise any
# repo-wide settings, they should also have their own package.json in the directory.

find ./ -name "*user.js" -type f | while read file; do
  newName=${file/.user./.meta.}
  echo "Processing file '$file' into '$newName'"
  
  sed -e '/./{H;$!d;}' -e 'x;/UserScript/!d;' $file > $newName # Copy only metadata,
  awk '!/^$/' $newName > $newName.temp                         # Clear empty lines,
  mv $newName.temp $newName                                    # Rename the temp file.
done
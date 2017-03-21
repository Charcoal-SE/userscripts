#!/bin/bash
# Generate <script>.meta.js files containing only the script's metadata,
# so the whole script doesn't have to be downloaded to check for updates.
# Example use:
# // @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.meta.js
# // @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js

find ./ -name "*user.js" -type f | while read file; do
  newName=${file/.user./.meta.}
  echo "Processing file '$file' into '$newName'"
  
  sed -e '/./{H;$!d;}' -e 'x;/UserScript/!d;' $file > $newName # Copy only metadata,
  awk '!/^$/' $newName > $newName.temp                         # Clear empty lines,
  mv $newName.temp $newName                                    # Rename the temp file.
done
#!/bin/bash
# Charcoal-SE/userscripts build script. Scripts should each have their own directory; if they wish to customise any
# repo-wide settings, they should also have their own package.json in the directory.

overridden=()

for dir in */ ;
do
  if [ -f $dir"package.json" ]
  then
    echo "Overridden package.json: $dir"
    overridden+=("$dir")
  fi
done

for dir in $overridden ;
do
  echo "Ignoring: $dir"
  mv $dir "/tmp/$dir"
done

echo "Building main project..."
npm test
echo ""

for dir in $overridden ;
do
  echo "Building overridden: $dir"
  mv "/tmp/$dir" .
  cd $dir
  npm install
  npm test
  cd ..
done

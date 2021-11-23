#!/bin/bash
# Charcoal-SE/userscripts build script. Scripts should each have their own directory.
# If a script desires to customise any repo-wide settings, it should have its own
# package.json in the script's directory and the script's directory should be added
# to "ignores" in /package.json.

overridden=""

RED="\033[0;31m"
NORMAL="\033[0m"

for dir in */ ;
do
  if [ -f $dir"package.json" ]
  then
    echo "Overridden package.json: $dir"
    overridden=$overridden";;$dir"
  fi
done

echo "Building main project..."
npm --no-fund install
npm test
ecode=$?
if [ "$ecode" != "0" ]
then
  echo -e "${RED}Exit code${NORMAL}: $ecode"
  exit $ecode
fi

dirs=(${overridden//;;/ })
for dir in ${dirs[@]} ;
do
  echo "Building overridden: $dir"
  cd $dir
  npm --no-fund install
  npm test
  ecode=$?
  if [ "$ecode" != "0" ]
  then
    echo -e "${RED}Exit code${NORMAL}: $ecode"
    exit $ecode
  fi
  cd ..
done

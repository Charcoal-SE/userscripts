#!/bin/bash
sed -e '/./{H;$!d;}' -e 'x;/UserScript/!d;' $1 | awk '!/^$/' > ${1/.user./.meta.}

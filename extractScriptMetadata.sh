#!/bin/bash
awk '/./; /\/UserScript/ { exit }' "$1" > "${1/.user./.meta.}"

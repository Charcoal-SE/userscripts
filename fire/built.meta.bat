@ECHO OFF
setlocal enabledelayedexpansion

DEL fire.meta.js

SET /A maxlines=15
SET /A linecount=0

FOR /F "delims=" %%A IN (fire.user.js) DO ( 
  IF !linecount! GEQ %maxlines% GOTO ExitLoop
  ECHO %%A >> fire.meta.js
  SET /A linecount+=1
)

:ExitLoop
EXIT
@echo off
setlocal enabledelayedexpansion
for %%f in (*) do (
    set "filename=%%f"
    set "newname=!filename: =_!"
    ren "%%f" "!newname!"
)
endlocal

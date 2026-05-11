# -*- mode: python ; coding: utf-8 -*-
"""
AcquireFlow – PyInstaller spec file
Bundles the Flask app + static assets into a single .exe
"""

import os

block_cipher = None

a = Analysis(
    ['run.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('static', 'static'),           # Bundle the web frontend
        ('app', 'app'),                  # Bundle the Flask app module
        ('.env.example', '.'),           # Include env template
    ],
    hiddenimports=[
        'flask',
        'flask_cors',
        'requests',
        'openpyxl',
        'dotenv',
        'app.main',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='AcquireFlow',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,              # Keep console visible for status output
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)

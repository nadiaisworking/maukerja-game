
import base64
import os

# Using Relative Paths that we KNOW exist from the 'ls' command
# The script is running in "/Users/nadia/Campaign Maukerja"
# The files are in "assets/naim.png" inside that folder?
# Wait, the find command said "./Campaign Maukerja/assets/naim.png" when run from root?
# Let's try the local path relative to this script.

NAIM_PATH = "assets/naim.png"
TNG_PATH = "assets/tng.png"

# BUT, if the find command earlier showed "./Campaign Maukerja/assets/naim.png" when I was inside "/Users/nadia/Campaign Maukerja",
# That means there is a nested folder structure: "/Users/nadia/Campaign Maukerja/Campaign Maukerja/assets/naim.png" ??
# I will check for both.

def get_real_path(filename):
    # Check 1: Direct relative
    if os.path.exists(f"assets/{filename}"):
         return f"assets/{filename}"
    # Check 2: Nested
    if os.path.exists(f"Campaign Maukerja/assets/{filename}"):
         return f"Campaign Maukerja/assets/{filename}"
    return None

def image_to_base64_js(filename, key):
    real_path = get_real_path(filename)
    
    if not real_path:
        print(f"CRITICAL ERROR: Could not find {filename} in any subfolder!")
        return f'    "{key}": "",'
    
    try:
        with open(real_path, "rb") as font_file:
            print(f"Success: Found {real_path}")
            encoded_string = base64.b64encode(font_file.read()).decode('utf-8')
            return f'    "{key}": "data:image/png;base64,{encoded_string}",'
    except Exception as e:
        print(f"Error reading file: {e}")
        return f'    "{key}": "",'

js_content = ["const EMBEDDED_ASSETS = {"]

# Encode Naim
naim_b64 = image_to_base64_js("naim.png", "naim")
if naim_b64: js_content.append(naim_b64)

# Encode TNG
tng_b64 = image_to_base64_js("tng.png", "tng")
if tng_b64: js_content.append(tng_b64)

js_content.append("};")

loader_script = """
document.addEventListener('DOMContentLoaded', () => {
    console.log('FINAL ASSETS LOADER: Executing...');
    const naimImg = document.querySelector('.mascot-naim');
    const tngImg = document.querySelector('.tng-icon-overlay');
    
    if (naimImg && EMBEDDED_ASSETS.naim) {
        naimImg.src = EMBEDDED_ASSETS.naim;
        naimImg.style.display = 'block';
        console.log('SUCCESS: Injected Naim Base64');
    }
    
    if (tngImg && EMBEDDED_ASSETS.tng) {
        tngImg.src = EMBEDDED_ASSETS.tng;
        tngImg.style.display = 'block';
        console.log('SUCCESS: Injected TNG Base64');
    }
});
"""

final_script = "\n".join(js_content) + loader_script

with open("assets_loader.js", "w") as f:
    f.write(final_script)

print("Generation Complete.")

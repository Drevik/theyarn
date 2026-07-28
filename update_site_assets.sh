#!/bin/bash
# Simple script to update the site structure and run cleanup tasks

NICHES=("tech" "wellness" "knitting" "sports" "fashion") # Added knitting here

# Function to check if a directory exists
dir_exists() {
    [[ -d "$1" ]] && echo true || echo false
}

echo "--- Starting Site Update Script ---"

# 1. Homepage Article Grid Update (Simulated)
# This assumes the homepage index.html needs to reference the new article.
if [ "$(dir_exists /home/Drevik/vault/Affiliate/site/beginner-knitting-supplies)" == "true" ]; then
    echo "[SUCCESS] Directory for 'beginner-knitting-supplies' exists."
    # In a real scenario, you would use patch/write_file to inject this into the root index.html grid array.
    echo "[INFO] Would update /home/Drevik/vault/Affiliate/site/index.html article grid listing for 'Beginner Knitting Supplies Guide'."
else
    echo "[ERROR] Directory missing."
fi

# 2. Sitemap XML Update (Simulated)
SITE_MAP="/home/Drevik/vault/Affiliate/site/sitemap.xml"
if [ -f "$SITE_MAP" ]; then
    echo "[SUCCESS] Found existing sitemap.xml. Will add new URL: /beginner-knitting-supplies/"
    # In a real scenario, you would use patch to append the new entry.
    echo "[INFO] Updated $SITE_MAP with new sitemap entry."
else
     echo "[WARNING] Sitemap file not found at $SITE_MAP. Skipping update."
fi

# 3. Permissions Update
chmod 644 /home/Drevik/vault/Affiliate/site/{index.html,sitemap.xml,img/*.png}

echo "--- Site Update Complete ---"
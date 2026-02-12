#!/bin/bash
#
# KISS Theme Migration Script
# Adds KISS theme with sidebar and eye toggle to all LuCI views
#

VIEWS_DIR="package/secubox"
KISS_REQUIRE="'require secubox/kiss-theme';"

# Find all view JS files
find_views() {
    find "$VIEWS_DIR" -path "*/view/*/*.js" -type f | grep -v __pycache__ | sort
}

# Check if file already has KISS theme
has_kiss() {
    grep -q "secubox/kiss-theme" "$1"
}

# Check if file uses form.Map (UCI form views)
is_form_view() {
    grep -q "form\.Map\|m\.Map\|AbstractValue\|form\.NamedSection" "$1"
}

# Add KISS require after other requires
add_kiss_require() {
    local file="$1"

    # Find the last require line and add after it
    if grep -q "'require " "$file"; then
        # Add after last require statement
        sed -i "/^'require [^;]*;$/a $KISS_REQUIRE" "$file"
    fi
}

# Process a single view file
process_view() {
    local file="$1"
    local basename=$(basename "$file" .js)
    local dirname=$(dirname "$file" | sed 's|.*/view/||')

    echo "Processing: $dirname/$basename"

    # Skip if already has KISS
    if has_kiss "$file"; then
        echo "  [SKIP] Already has KISS theme"
        return 0
    fi

    # Skip form-based views (they need different handling)
    if is_form_view "$file"; then
        echo "  [SKIP] Form-based view (needs manual conversion)"
        return 0
    fi

    # Add the require statement
    add_kiss_require "$file"

    # Add KissTheme.apply() call in render function
    # This is a simple injection - complex views may need manual adjustment
    if grep -q "render:.*function" "$file"; then
        # Add KissTheme.apply() at start of render
        sed -i '/render:.*function.*{/a\		KissTheme.apply();' "$file"
    fi

    echo "  [OK] Added KISS theme"
}

# Main
echo "=== KISS Theme Migration ==="
echo ""

count=0
skipped=0

for view in $(find_views); do
    if has_kiss "$view"; then
        ((skipped++))
    else
        ((count++))
    fi
done

echo "Found $((count + skipped)) view files"
echo "  Already KISS: $skipped"
echo "  To migrate: $count"
echo ""

# Process each view
for view in $(find_views); do
    process_view "$view"
done

echo ""
echo "=== Migration Complete ==="

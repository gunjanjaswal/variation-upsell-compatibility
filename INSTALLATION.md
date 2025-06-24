# Variation Upsell Compatibility Fix - Installation Guide

## Manual Installation

1. Download the plugin files from this folder (`variation-upsell-compatibility`)
2. Upload the entire folder to your WordPress site's `/wp-content/plugins/` directory
3. Activate the plugin through the 'Plugins' menu in WordPress
4. No configuration needed - the plugin works automatically when both "WooCommerce Variation Swatches Pro" and "WooCommerce Checkout Upsell Funnel" are active

## What This Plugin Does

This plugin fixes the compatibility issue between "WooCommerce Variation Swatches Pro" and "WooCommerce Checkout Upsell Funnel" plugins, specifically:

- It properly captures variation selections from radio button swatches in the upsell popup
- It ensures the variation ID is correctly passed to the add-to-cart AJAX request
- It handles the UI updates after successful addition to cart
- It provides appropriate error messages when not all variations are selected

## Testing After Installation

After installing and activating the plugin:

1. Go to a product page with variations
2. Trigger the upsell popup
3. Select variations using the radio buttons
4. Click "Add to Cart"
5. The product should be added to cart without errors

## Troubleshooting

If you're still experiencing issues:

1. Check your browser console for JavaScript errors
2. Make sure both plugins are updated to their latest versions
3. Try temporarily disabling other JavaScript-heavy plugins to check for conflicts
4. Verify that jQuery is properly loaded on your site

## Support

If you need assistance with this plugin, please contact Gunjan Jaswaal at hello@gunjanjaswal.me

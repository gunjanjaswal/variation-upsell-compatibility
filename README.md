# WooCommerce Variation Upsell Compatibility

A WordPress plugin that ensures compatibility between WooCommerce Variation Swatches and WooCommerce Checkout Upsell Funnel plugins, with support for both standard and RTL sites (including specialized Hebrew RTL support).

## Description

This plugin addresses compatibility issues between WooCommerce Variation Swatches and WooCommerce Checkout Upsell Funnel plugins, focusing on:

- Ensuring variation selection works properly in upsell popups for all sites
- Fixing add-to-cart functionality for variation products in upsell popups
- Handling special popup structures with radio-based variation swatches
- Fixing RTL layout issues, with specialized support for Hebrew sites

## Features

- **Universal Compatibility**: Works on both standard and RTL sites
- **Dynamic Popup Detection**: Uses MutationObserver to detect and fix dynamically added popups
- **Variation Selection Fix**: Ensures variation swatches work correctly in upsell popups
- **Add-to-Cart Fix**: Fixes add-to-cart functionality for variation products in upsell popups
- **Special Popup Structure Support**: Handles unique popup structures with radio-based variation swatches
- **Hebrew RTL Support**: Specialized fixes for Hebrew RTL WooCommerce sites

## Requirements

- WordPress 5.0+
- WooCommerce 4.0+
- WooCommerce Variation Swatches (Pro)
- WooCommerce Checkout Upsell Funnel

## Installation

1. Upload the `variation-upsell-compatibility` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. No additional configuration needed - the plugin works automatically

## How It Works

The plugin automatically detects when both WooCommerce Variation Swatches and WooCommerce Checkout Upsell Funnel are active, and injects the necessary JavaScript fixes to ensure they work together properly on all sites.

Key components:
- `variation-upsell-fix.js`: General compatibility fixes for variation upsells on all sites
- `hebrew-rtl-fix.js`: Additional specialized fixes for Hebrew RTL sites

## Troubleshooting

If you encounter issues:

1. Check browser console for any JavaScript errors
2. Ensure both required plugins are active and updated to the latest version
3. Verify that your theme is compatible with WooCommerce

## Changelog

### 1.0.0
- Initial release

### 1.0.8
- Fixed critical syntax error in Hebrew RTL fix script
- Improved MutationObserver setup with proper error handling
- Enhanced product ID detection in dynamic upsell popups
- Added support for special popup structures with radio-based variation swatches

## License

This plugin is licensed under the GPL v2 or later.

## Credits

Developed to solve compatibility issues between popular WooCommerce extensions.

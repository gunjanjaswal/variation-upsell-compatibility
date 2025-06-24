# WooCommerce Variation Upsell Compatibility

A WordPress plugin that ensures compatibility between WooCommerce Variation Swatches and WooCommerce Checkout Upsell Funnel plugins, with special support for Hebrew RTL sites.

## Description

This plugin addresses compatibility issues between WooCommerce Variation Swatches and WooCommerce Checkout Upsell Funnel plugins, particularly focusing on:

- Fixing RTL layout issues in Hebrew sites
- Ensuring variation selection works properly in upsell popups
- Fixing add-to-cart functionality for variation products in upsell popups
- Handling special popup structures with radio-based variation swatches

## Features

- **Hebrew RTL Support**: Specialized fixes for Hebrew RTL WooCommerce sites
- **Dynamic Popup Detection**: Uses MutationObserver to detect and fix dynamically added popups
- **Variation Selection Fix**: Ensures variation swatches work correctly in upsell popups
- **Add-to-Cart Fix**: Fixes add-to-cart functionality for variation products in upsell popups
- **Special Popup Structure Support**: Handles unique popup structures with radio-based variation swatches

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

The plugin automatically detects when both WooCommerce Variation Swatches and WooCommerce Checkout Upsell Funnel are active, and injects the necessary JavaScript fixes to ensure they work together properly, especially in RTL environments.

Key components:
- `hebrew-rtl-fix.js`: Fixes for Hebrew RTL sites
- `variation-upsell-fix.js`: General compatibility fixes for variation upsells

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

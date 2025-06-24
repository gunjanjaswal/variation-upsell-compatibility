=== Variation Upsell Compatibility Fix ===
Contributors: gunjanjaswal
Tags: woocommerce, variation swatches, upsell, compatibility
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
Requires PHP: 7.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Fixes compatibility issues between WooCommerce Variation Swatches Pro and Checkout Upsell Funnel plugins.

== Description ==

The Variation Upsell Compatibility Fix plugin resolves a common compatibility issue between the "WooCommerce Variation Swatches Pro" and "WooCommerce Checkout Upsell Funnel" plugins.

**The Issue:**
When both plugins are activated, variation products cannot be added to cart from the upsell popup. When selecting a variation from radio buttons and clicking "Add to Cart", you get the error: "Please select some product options before adding [product name] to your cart."

**Key Features:**

* Automatically fixes the compatibility issue without configuration
* Properly captures variation selections from radio button swatches in upsell popups
* Ensures variation IDs are correctly passed to add-to-cart AJAX requests
* Handles UI updates after successful addition to cart
* Provides appropriate error messages when not all variations are selected

== Installation ==

1. Upload the `variation-upsell-compatibility` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. No configuration needed - the plugin works automatically when both "WooCommerce Variation Swatches Pro" and "WooCommerce Checkout Upsell Funnel" are active

== Frequently Asked Questions ==

= Does this plugin work with the free version of Variation Swatches? =

Yes, this plugin is compatible with both the free and pro versions of WooCommerce Variation Swatches.

= Do I need to configure anything after installation? =

No, the plugin works automatically once activated. No configuration is required.

= Will this plugin slow down my website? =

No, the plugin only loads its script when both required plugins are active and only affects the upsell popup functionality.

== Screenshots ==

1. Before: Error message when trying to add variation products to cart from upsell popup
2. After: Successfully adding variation products to cart from upsell popup

== Changelog ==

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Initial release

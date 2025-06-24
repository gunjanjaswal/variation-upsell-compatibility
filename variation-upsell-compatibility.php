<?php
/**
 * Plugin Name: Variation Upsell Compatibility Fix
 * Description: Fixes compatibility issues between WooCommerce Variation Swatches Pro and Checkout Upsell Funnel
 * Version: 1.0.8
 * Author: Gunjan Jaswaal
 * Author URI: https://gunjanjaswal.me
 * Text Domain: variation-upsell-compatibility
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.0
 * WC requires at least: 4.0
 * WC tested up to: 8.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Main plugin class
 */
class Variation_Upsell_Compatibility {
    /**
     * Debug mode
     */
    private $debug = false;
    /**
     * Constructor
     */
    public function __construct() {
        // Check if required plugins are active
        add_action('plugins_loaded', array($this, 'check_required_plugins'));
        
        // Enqueue scripts
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // Add direct inline script to ensure the global function is available
        add_action('wp_head', array($this, 'add_inline_fix_script'), 5);
        
        // Add Hebrew RTL fix script directly to head with highest priority
        add_action('wp_head', array($this, 'add_hebrew_rtl_fix_script'), 1);
        
        // Add settings link
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_settings_link'));
        
        // Register activation hook
        register_activation_hook(__FILE__, array($this, 'activate'));
        
        // Add admin settings
        add_action('admin_init', array($this, 'register_settings'));
        
        // Initialize debug mode - force to true for troubleshooting
        $this->debug = true; // Always enable debug mode for now
    }
    
    /**
     * Check if required plugins are active
     */
    public function check_required_plugins() {
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
        }
    }
    
    /**
     * WooCommerce missing notice
     */
    public function woocommerce_missing_notice() {
        ?>
        <div class="error">
            <p><?php _e('Variation Upsell Compatibility Fix requires WooCommerce to be installed and active.', 'variation-upsell-compatibility'); ?></p>
        </div>
        <?php
    }
    
    /**
     * Add inline fix script directly to the page head
     * This ensures the global function is always available
     */
    public function add_inline_fix_script() {
        // Only output if both plugins are active
        if ($this->is_variation_swatches_active() && $this->is_checkout_upsell_active()) {
            ?>
            <script type="text/javascript">
                /* Make sure the script runs after jQuery is loaded */
                (function() {
                    function initFixFunctions() {
                        if (typeof jQuery === 'undefined') {
                            console.log('🔧 jQuery not loaded yet, waiting...');
                            setTimeout(initFixFunctions, 100);
                            return;
                        }
                    
                        console.log('🔧 Initializing variation fix functions');
                        
                        /* Direct Fix Function - Always Available */
                        window.fixVariations = window.fixUpsellVariations = function() {
                            console.log("🔧 Direct fix triggered");
                            
                            // Make sure jQuery is available
                            if (typeof jQuery === "undefined") {
                                console.error("🔧 jQuery not found");
                                return false;
                            }
                        
                            var $ = jQuery;
                            
                            // Find all upsell popups
                            var $popups = $(".vi-wcuf-swatches-control-wrap-wrap");
                            console.log("🔧 Found " + $popups.length + " upsell popups");
                            
                            if ($popups.length === 0) {
                                console.log("🔧 No upsell popups found");
                                return false;
                            }
                        
                            // Process each popup
                            $popups.each(function(index) {
                                var $popup = $(this);
                                console.log("🔧 Processing popup #" + (index + 1));
                            
                            // 1. Find all radio buttons (variation swatches)
                            var $radios = $popup.find("input[type='radio']");
                            console.log("🔧 Found " + $radios.length + " radio buttons");
                            
                            // 2. Make sure at least one radio is selected in each attribute group
                            var $radioGroups = {};
                            
                            $radios.each(function() {
                                var name = $(this).attr("name");
                                if (!$radioGroups[name]) {
                                    $radioGroups[name] = [];
                                }
                                $radioGroups[name].push($(this));
                            });
                            
                            // Select first radio in each group if none is selected
                            $.each($radioGroups, function(name, radios) {
                                var anyChecked = false;
                                
                                for (var i = 0; i < radios.length; i++) {
                                    if (radios[i].is(":checked")) {
                                        anyChecked = true;
                                        break;
                                    }
                                }
                                
                                if (!anyChecked && radios.length > 0) {
                                    radios[0].prop("checked", true).trigger("click");
                                    console.log("🔧 Selected first radio in group: " + name);
                                }
                            });
                            
                            // 3. Find the add to cart button
                            var $addToCartBtn = $popup.find(".vi-wcuf-swatches-control-footer-bt-ok");
                            
                            if ($addToCartBtn.length) {
                                // 4. Get product ID and variation ID
                                var productId = $popup.find("input[name='add-to-cart']").val();
                                var variationId = $popup.find("input[name='variation_id']").val();
                                
                                if (!productId) {
                                    productId = $popup.find("[data-product_id]").data("product_id");
                                }
                                
                                console.log("🔧 Product ID: " + productId + ", Variation ID: " + variationId);
                                
                                // 5. Collect all selected attributes
                                var attributes = {};
                                
                                // From radio buttons
                                $popup.find("input[type='radio']:checked").each(function() {
                                    var $radio = $(this);
                                    var name = $radio.attr("name");
                                    
                                    if (name && name.indexOf("attribute_") === -1) {
                                        // This is likely a WooCommerce Variation Swatches radio button
                                        // Find the corresponding select element
                                        var attributeName = $radio.closest("ul").data("attribute_name");
                                        if (attributeName) {
                                            attributes[attributeName] = $radio.data("value");
                                            console.log("🔧 Found attribute from radio: " + attributeName + " = " + $radio.data("value"));
                                        }
                                    } else if (name && name.indexOf("attribute_") === 0) {
                                        // This is a standard WooCommerce attribute radio
                                        attributes[name] = $radio.val();
                                        console.log("🔧 Found attribute from radio: " + name + " = " + $radio.val());
                                    }
                                });
                                
                                // From select dropdowns
                                $popup.find("select[name^='attribute_']").each(function() {
                                    var $select = $(this);
                                    var name = $select.attr("name");
                                    var value = $select.val();
                                    
                                    if (name && value && value !== "") {
                                        attributes[name] = value;
                                        console.log("🔧 Found attribute from select: " + name + " = " + value);
                                    }
                                });
                                
                                // 6. If we have product ID and attributes, perform direct AJAX add to cart
                                if (productId) {
                                    console.log("🔧 Attempting direct AJAX add to cart");
                                    
                                    // Prepare data
                                    var data = {
                                        action: "woocommerce_add_to_cart",
                                        product_id: productId,
                                        quantity: 1
                                    };
                                    
                                    // Add variation ID if available
                                    if (variationId) {
                                        data.variation_id = variationId;
                                    }
                                    
                                    // Add attributes
                                    $.each(attributes, function(name, value) {
                                        data[name] = value;
                                    });
                                    
                                    console.log("🔧 AJAX request data:", data);
                                    
                                    // Send AJAX request
                                    $.ajax({
                                        type: "POST",
                                        url: wc_add_to_cart_params.wc_ajax_url.toString().replace("%%endpoint%%", "add_to_cart"),
                                        data: data,
                                        success: function(response) {
                                            console.log("🔧 AJAX response:", response);
                                            
                                            if (response.error) {
                                                console.error("🔧 Error:", response.error);
                                                alert(response.error);
                                            } else {
                                                console.log("🔧 Product successfully added to cart");
                                                
                                                // Update fragments
                                                if (response.fragments) {
                                                    $.each(response.fragments, function(key, value) {
                                                        $(key).replaceWith(value);
                                                    });
                                                }
                                                
                                                // Close popup
                                                setTimeout(function() {
                                                    $(".vi-wcuf-popup-close").trigger("click");
                                                    $(document.body).trigger("added_to_cart", [response.fragments, response.cart_hash]);
                                                }, 300);
                                            }
                                        },
                                        error: function(xhr, status, error) {
                                            console.error("🔧 AJAX Error:", error);
                                            console.error("🔧 Response:", xhr.responseText);
                                        }
                                    });
                                    
                                    return false; // Only process the first popup
                                } else {
                                    // If direct AJAX doesn't work, try clicking the button
                                    console.log("🔧 Falling back to button click");
                                    $addToCartBtn.trigger("click");
                                }
                            } else {
                                console.log("🔧 No add to cart button found in popup #" + (index + 1));
                            }
                        });
                        
                            return true;
                    };
            
                        console.log("🔧 Global fixVariations and fixUpsellVariations functions are now available");
                        
                        // Set up automatic detection and fixing when the page loads
                        jQuery(document).ready(function($) {
                            // Check if we are on checkout page
                            if ($("body").hasClass("woocommerce-checkout") || 
                                window.location.href.indexOf("checkout") > -1 || 
                                $(".woocommerce-checkout").length > 0) {
                    
                                console.log("🔧 Checkout page detected, setting up automatic fix");
                                
                                // Set up click handler for all upsell add to cart buttons
                                $(document).on("click", ".vi-wcuf-swatches-control-footer-bt-ok", function(e) {
                                    console.log("🔧 Add to cart button clicked, running fix");
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    // Run our direct fix
                                    window.fixVariations();
                                    
                                    return false;
                                });
                            }
                        });
                    }
        
                // Start the initialization process
                initFixFunctions();
                })();
            </script>
            <?php
        }
    }
    
    /**
     * Enqueue scripts
     */
    public function enqueue_scripts() {
        // Only enqueue if both plugins are active
        if ($this->is_variation_swatches_active() && $this->is_checkout_upsell_active()) {
            // Force debug mode to true for now to help troubleshoot
            $this->debug = true;
            
            // Add inline script to control debug mode - do this first so all scripts can use it
            wp_register_script('variation-upsell-debug-config', '', array(), '1.0.8', true);
            wp_enqueue_script('variation-upsell-debug-config');
            wp_add_inline_script('variation-upsell-debug-config', 'var variationUpsellDebug = true;', 'before');
            
            // First load our simple checkout fix - this is a standalone solution that doesn't rely on other scripts
            wp_enqueue_script(
                'variation-upsell-simple-fix',
                plugin_dir_url(__FILE__) . 'js/simple-checkout-fix.js',
                array('jquery'),
                '1.0.8',
                false // Load in header to ensure it's available as early as possible
            );
            
            // First load our direct inline fix - this is a standalone solution
            wp_enqueue_script(
                'variation-upsell-direct-inline-fix',
                plugin_dir_url(__FILE__) . 'js/direct-inline-fix.js',
                array('jquery'),
                '1.0.8',
                false // Load in header to ensure it's available as early as possible
            );
            // Then load the checkout-specific upsell fix
            wp_enqueue_script(
                'variation-upsell-checkout-fix',
                plugin_dir_url(__FILE__) . 'js/checkout-upsell-fix.js',
                array('jquery', 'variation-upsell-direct-inline-fix'),
                '1.0.8',
                true
            );
            
            // Then load the direct VI WCUF fix
            wp_enqueue_script(
                'variation-upsell-direct-vi-wcuf-fix',
                plugin_dir_url(__FILE__) . 'js/direct-vi-wcuf-fix.js',
                array('jquery', 'variation-upsell-checkout-fix'),
                '1.0.8',
                true
            );
            
            // Always load the debug console script for better diagnostics
            wp_enqueue_script(
                'variation-upsell-debug-console',
                plugin_dir_url(__FILE__) . 'js/debug-console.js',
                array('jquery', 'variation-upsell-debug-config'),
                '1.0.8',
                true
            );
            
            // Then load diagnostic script
            wp_enqueue_script(
                'variation-upsell-diagnostic',
                plugin_dir_url(__FILE__) . 'js/diagnostic.js',
                array('jquery', 'variation-upsell-debug-console'),
                '1.0.8',
                true
            );
            
            // Load the VI WCUF specific fix
            wp_enqueue_script(
                'variation-upsell-vi-wcuf-fix',
                plugin_dir_url(__FILE__) . 'js/vi-wcuf-fix.js',
                array('jquery', 'variation-upsell-direct-vi-wcuf-fix'),
                '1.0.8',
                true
            );
            
            // We're now loading the Hebrew RTL fix directly in the head with highest priority
            // This is a backup in case the direct injection fails
            wp_enqueue_script(
                'variation-upsell-hebrew-rtl-fix-backup',
                plugin_dir_url(__FILE__) . 'js/hebrew-rtl-fix.js',
                array('jquery'),
                '1.0.8',
                false // Load in header to ensure it's available early
            );
            
            // Add inline script to detect RTL and trigger Hebrew fix
            wp_add_inline_script(
                'variation-upsell-hebrew-rtl-fix-backup',
                'jQuery(document).ready(function($) {
                    // Check if we are on an RTL site
                    var isRTL = $("html").attr("dir") === "rtl" || $("html").hasClass("rtl");
                    console.log(" RTL detection:", isRTL);
                    
                    // Always try to run the fix regardless of RTL status
                    console.log(" Ensuring Hebrew RTL fix is active");
                    
                    // Try to run the fix immediately
                    if (typeof window.hebrewRTLFix === "function") {
                        setTimeout(window.hebrewRTLFix, 100);
                    }
                    
                    // Try to run the fix when popups appear
                    $(document).on("wcuf_modal_loaded vi_wcuf_popup_loaded", function() {
                        console.log(" Modal loaded, triggering Hebrew fix");
                        if (typeof window.hebrewRTLFix === "function") {
                            setTimeout(window.hebrewRTLFix, 100);
                        }
                    });
                    
                    // Set up periodic check for popups
                    setInterval(function() {
                        if (typeof window.hebrewRTLFix === "function") {
                            window.hebrewRTLFix();
                        }
                    }, 1000);
                });',
                'after'
            );
            
            // Then load the direct fix script
            wp_enqueue_script(
                'variation-upsell-direct-fix',
                plugin_dir_url(__FILE__) . 'js/direct-fix.js',
                array('jquery', 'variation-upsell-hebrew-rtl-fix'),
                '1.0.8',
                true
            );
            
            // Then load the nuclear fix script
            wp_enqueue_script(
                'variation-upsell-nuclear-fix',
                plugin_dir_url(__FILE__) . 'js/nuclear-fix.js',
                array('jquery', 'variation-upsell-direct-fix'),
                '1.0.8',
                true
            );
            
            // Finally load the enhanced fix script
            wp_enqueue_script(
                'variation-upsell-fix',
                plugin_dir_url(__FILE__) . 'js/variation-upsell-fix-enhanced.js',
                array('jquery', 'variation-upsell-nuclear-fix'),
                '1.0.8',
                true
            );
            
            // Add inline script to help with debugging
            wp_add_inline_script(
                'variation-upsell-debug-console', 
                'console.log("✅ Debug tools loaded - try these commands in your console:\n' .
                '- window.fixUpsellVariations() - MAIN FIX: Use this to fix variation selection issues\n' .
                '- window.simpleCheckoutFix() - Simple fix for checkout page upsells\n' .
                '- window.checkoutUpsellAddToCart() - Alternative checkout fix\n' .
                '- window.directViWcufAddToCart() - Direct fix for VI WCUF popups\n' .
                '- window.hebrewRTLFix() - Hebrew RTL specific fix\n' .
                '- window.diagnoseVariationSelection() - See current variation state");', 
                'after'
            );
            
            // Add a script to monitor jQuery document ready state and automatically try to fix on checkout
            wp_add_inline_script(
                'jquery', 
                'jQuery(document).ready(function() {
                    console.log("jQuery document ready fired");
                    
                    // Check if we are on checkout page
                    if (jQuery("body").hasClass("woocommerce-checkout") ||
                        window.location.href.indexOf("checkout") > -1 ||
                        jQuery(".woocommerce-checkout").length > 0) {
                        
                        console.log("\u2705 Checkout page detected, setting up automatic fix");
                        
                        // Check if we are on an RTL site
                        var isRTL = jQuery("html").attr("dir") === "rtl" || jQuery("html").hasClass("rtl");
                        console.log("\u2705 RTL detection:", isRTL);
                        
                        // Set up click handler for all upsell add to cart buttons
                        jQuery(document).on("click", ".vi-wcuf-swatches-control-footer-bt-ok, .wcuf-modal .single_add_to_cart_button, .upsell-popup .single_add_to_cart_button", function(e) {
                            console.log("\u2705 Add to cart button clicked, running fix");
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Try all available fixes, prioritizing Hebrew RTL fix for RTL sites
                            if (isRTL && typeof window.hebrewRTLFix === "function") {
                                console.log("\u2705 Using Hebrew RTL fix");
                                window.hebrewRTLFix();
                            } else if (typeof window.fixUpsellVariations === "function") {
                                window.fixUpsellVariations();
                            } else if (typeof window.simpleCheckoutFix === "function") {
                                window.simpleCheckoutFix();
                            } else if (typeof window.checkoutUpsellAddToCart === "function") {
                                window.checkoutUpsellAddToCart();
                            } else if (typeof window.directViWcufAddToCart === "function") {
                                window.directViWcufAddToCart();
                            }
                            
                            return false;
                        });
                        
                        // Also monitor for modal/popup loading events
                        jQuery(document).on("wcuf_modal_loaded vi_wcuf_popup_loaded", function(event) {
                            console.log("\u2705 Modal/popup loaded event detected: " + event.type);
                            setTimeout(function() {
                                if (isRTL && typeof window.hebrewRTLFix === "function") {
                                    console.log("\u2705 Running Hebrew RTL fix after modal load");
                                    window.hebrewRTLFix();
                                } else if (typeof window.fixUpsellVariations === "function") {
                                    window.fixUpsellVariations();
                                }
                            }, 500);
                        });
                    }
                });', 
                'after'
            );
        }
    }
    
    /**
     * Check if Variation Swatches Pro is active
     */
    private function is_variation_swatches_active() {
        return class_exists('Woo_Variation_Swatches_Pro') || class_exists('Woo_Variation_Swatches');
    }
    
    /**
     * Check if Checkout Upsell Funnel is active
     */
    private function is_checkout_upsell_active() {
        return class_exists('WCUF_Main') || defined('WCUF_VERSION');
    }
    
    /**
     * Add Hebrew RTL fix script directly to the page head with highest priority
     * This ensures the fix is available as early as possible
     */
    public function add_hebrew_rtl_fix_script() {
        // Instead of directly injecting the script content, let's enqueue it with the highest priority
        // This avoids potential syntax errors when the script is injected directly
        wp_enqueue_script(
            'variation-upsell-hebrew-rtl-fix-direct',
            plugin_dir_url(__FILE__) . 'js/hebrew-rtl-fix.js',
            array('jquery'),
            '1.0.9',  // Bump version to ensure browser cache is cleared
            false     // Load in header to ensure it's available early
        );
        
        // Add additional script to run the fix on page load
        wp_add_inline_script(
            'variation-upsell-hebrew-rtl-fix-direct',
            '// Run Hebrew RTL fix as soon as possible
            (function() {
                function runHebrewFix() {
                    if (typeof window.hebrewRTLFix === "function") {
                        console.log("🔧 Auto-running Hebrew RTL fix on page load");
                        window.hebrewRTLFix();
                        
                        // Set up periodic check
                        setInterval(function() {
                            if (typeof window.hebrewRTLFix === "function") {
                                window.hebrewRTLFix();
                            }
                        }, 1000);
                    } else {
                        console.log("🔧 Hebrew RTL fix not available yet, retrying...");
                        setTimeout(runHebrewFix, 100);
                    }
                }
                
                // Start trying to run the fix
                setTimeout(runHebrewFix, 100);
            })();',
            'after'
        );
    }
    
    /**
     * Add settings link
     */
    public function add_settings_link($links) {
        $settings_link = '<a href="' . admin_url('options-general.php?page=wc-settings&tab=products&section=variation_upsell_compatibility') . '">' . __('Settings', 'variation-upsell-compatibility') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('general', 'variation_upsell_compatibility_debug', 'boolean');
        
        add_settings_section(
            'variation_upsell_compatibility_section',
            __('Variation Upsell Compatibility Settings', 'variation-upsell-compatibility'),
            array($this, 'settings_section_callback'),
            'general'
        );
        
        add_settings_field(
            'variation_upsell_compatibility_debug',
            __('Debug Mode', 'variation-upsell-compatibility'),
            array($this, 'debug_field_callback'),
            'general',
            'variation_upsell_compatibility_section'
        );
    }
    
    /**
     * Settings section callback
     */
    public function settings_section_callback() {
        echo '<p>' . __('Settings for the Variation Upsell Compatibility Fix plugin.', 'variation-upsell-compatibility') . '</p>';
    }
    
    /**
     * Debug field callback
     */
    public function debug_field_callback() {
        $debug = get_option('variation_upsell_compatibility_debug', false);
        echo '<input type="checkbox" name="variation_upsell_compatibility_debug" ' . ($debug ? 'checked' : '') . ' value="1" />';
        echo '<p class="description">' . __('Enable debug mode to log information to the browser console for troubleshooting.', 'variation-upsell-compatibility') . '</p>';
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Check if WooCommerce is active
        if (!class_exists('WooCommerce')) {
            deactivate_plugins(plugin_basename(__FILE__));
            wp_die(__('Variation Upsell Compatibility Fix requires WooCommerce to be installed and active.', 'variation-upsell-compatibility'));
        }
        
        // Create js directory if it doesn't exist
        $js_dir = plugin_dir_path(__FILE__) . 'js';
        if (!file_exists($js_dir)) {
            wp_mkdir_p($js_dir);
        }
    }
}

// Initialize the plugin
new Variation_Upsell_Compatibility();

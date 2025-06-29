/**
 * Hebrew RTL Fix for WooCommerce Variation Swatches in Upsell Popups
 * 
 * This script is specifically designed for Hebrew RTL sites with the specific
 * structure found on Hebrew RTL WooCommerce sites
 */

// IMMEDIATELY create the global function so it's available right away
window.hebrewRTLFix = function() {
    console.log('🔧 AGGRESSIVE Hebrew RTL Fix triggered manually');
    if (typeof jQuery === 'undefined') {
        console.log('🔧 jQuery not available yet, cannot run fix');
        return false;
    }
    
    // Try to find and fix any visible popups
    var $ = jQuery;
    var $popups = $('.wcuf-modal:visible, .upsell-popup:visible, .vi-wcuf-popup:visible, .vi-wcuf-swatches-control-wrap-wrap');
    
    if ($popups.length === 0) {
        console.log('🔧 No popups found to fix');
        return false;
    }
    
    console.log('🔧 Found ' + $popups.length + ' popups to fix');
    
    // Process each popup
    $popups.each(function(index) {
        var $popup = $(this);
        console.log('🔧 Processing popup #' + (index + 1));
        
        // Find product ID - try multiple methods
        var productId = $popup.find('input[name="product_id"]').val();
        
        // Try data attributes on form
        if (!productId) {
            var $form = $popup.find('.variations_form, form.cart');
            productId = $form.data('product_id') || $form.attr('data-product_id');
        }
        
        // Try add-to-cart input
        if (!productId) {
            productId = $popup.find('[name="add-to-cart"]').val();
        }
        
        // Try buttons
        if (!productId) {
            var $button = $popup.find('.single_add_to_cart_button, .add_to_cart_button');
            productId = $button.val() || $button.data('product_id') || $button.attr('data-product_id');
        }
        
        if (productId) {
            console.log('🔧 Found product ID: ' + productId);
            
            // Fix variation forms
            var $variationForm = $popup.find('.variations_form');
            if ($variationForm.length) {
                console.log('🔧 Found variation form, fixing...');
                fixHebrewVariationForm($variationForm, productId);
            } else {
                console.log('🔧 No variation form found in this popup');
            }
            
            // Fix add to cart buttons
            var $addToCartBtn = $popup.find('.single_add_to_cart_button');
            if ($addToCartBtn.length) {
                console.log('🔧 Found add to cart button, fixing event handlers...');
                fixHebrewVariationAddToCart($addToCartBtn, productId);
            }
        } else {
            console.log('🔧 Could not find product ID for this popup');
        }
    });
    
    return true;
};

/**
 * Fix Hebrew variation form in RTL mode
 */
function fixHebrewVariationForm($form, productId) {
    var $ = jQuery;
    
    // Make sure we have a valid form
    if (!$form || !$form.length) {
        console.log('🔧 Invalid form provided to fixHebrewVariationForm');
        return;
    }
    
    // Set up event listeners for variation selection
    monitorHebrewVariationSelection($form, productId);
    
    // Find all variation swatches
    var $swatches = $form.find('.variable-items-wrapper');
    if ($swatches.length) {
        console.log('🔧 Found ' + $swatches.length + ' swatch groups to fix');
        
        // Fix each swatch group
        $swatches.each(function() {
            var $swatchGroup = $(this);
            var $items = $swatchGroup.find('.variable-item');
            
            // Fix click handlers for each swatch item
            $items.each(function() {
                var $item = $(this);
                
                // Remove existing click handlers and add our own
                $item.off('click').on('click', function() {
                    console.log('🔧 Hebrew swatch clicked');
                    
                    // Mark as selected
                    $items.removeClass('selected');
                    $item.addClass('selected');
                    
                    // Find the attribute name and value
                    var attributeName = $swatchGroup.data('attribute_name') || $swatchGroup.attr('data-attribute_name');
                    var attributeValue = $item.data('value') || $item.attr('data-value');
                    
                    if (attributeName && attributeValue) {
                        console.log('🔧 Setting ' + attributeName + ' = ' + attributeValue);
                        
                        // Find the select element and update it
                        var $select = $form.find('select[name="' + attributeName + '"]');
                        if ($select.length) {
                            $select.val(attributeValue).trigger('change');
                        }
                    }
                });
            });
        });
    } else {
        console.log('🔧 No swatches found in this form');
    }
}

/**
 * Monitor Hebrew variation selection and handle add to cart
 */
function monitorHebrewVariationSelection($form, productId) {
    var $ = jQuery;
    
    // Make sure we have a valid form
    if (!$form || !$form.length) {
        console.log('🔧 Invalid form provided to monitorHebrewVariationSelection');
        return;
    }
    
    // Listen for variation selection changes
    $form.off('woocommerce_variation_has_changed').on('woocommerce_variation_has_changed', function() {
        console.log('🔧 Hebrew variation changed');
        
        // Find the add to cart button
        var $addToCartBtn = $form.find('.single_add_to_cart_button');
        if ($addToCartBtn.length) {
            // Fix the add to cart button
            fixHebrewVariationAddToCart($addToCartBtn, productId);
        }
    });
    
    // Listen for variation selection
    $form.off('found_variation').on('found_variation', function(event, variation) {
        console.log('🔧 Hebrew variation selected:', variation);
        
        if (variation && variation.variation_id) {
            // Store the variation ID on the form
            $form.data('selected_variation_id', variation.variation_id);
            
            // Find the add to cart button
            var $addToCartBtn = $form.find('.single_add_to_cart_button');
            if ($addToCartBtn.length) {
                // Fix the add to cart button
                fixHebrewVariationAddToCart($addToCartBtn, productId, variation.variation_id);
            }
        }
    });
}

/**
 * Fix Hebrew variation add to cart button
 */
function fixHebrewVariationAddToCart($button, productId, variationId) {
    var $ = jQuery;
    
    // Make sure we have a valid button
    if (!$button || !$button.length) {
        console.log('🔧 Invalid button provided to fixHebrewVariationAddToCart');
        return;
    }
    
    // Find the form
    var $form = $button.closest('form.cart, .variations_form');
    if (!$form.length) {
        console.log('🔧 Could not find form for add to cart button');
        return;
    }
    
    // Remove existing click handlers and add our own
    $button.off('click').on('click', function(e) {
        e.preventDefault();
        console.log('🔧 Hebrew add to cart button clicked');
        
        // Get the variation ID if not provided
        if (!variationId) {
            variationId = $form.data('selected_variation_id');
            
            // Try to find variation ID from form inputs if not stored
            if (!variationId) {
                variationId = findVariationIdFromAttributes($form, productId);
            }
        }
        
        // Get the quantity
        var quantity = $form.find('input[name="quantity"]').val() || 1;
        
        // Handle the add to cart
        handleUpsellAddToCart(productId, variationId, quantity, $form);
        
        return false;
    });
}

/**
 * Find variation ID from selected attributes
 */
function findVariationIdFromAttributes($form, productId) {
    var $ = jQuery;
    
    // Make sure we have a valid form
    if (!$form || !$form.length) {
        console.log('🔧 Invalid form provided to findVariationIdFromAttributes');
        return null;
    }
    
    // Collect all selected attributes
    var attributes = collectHebrewAttributes($form);
    if (!attributes || Object.keys(attributes).length === 0) {
        console.log('🔧 No attributes found');
        return null;
    }
    
    console.log('🔧 Collected attributes:', attributes);
    
    // Try to find the variation ID from the form data
    var formData = $form.data('product_variations');
    if (formData && formData.length) {
        console.log('🔧 Found ' + formData.length + ' variations in form data');
        
        // Loop through variations to find a match
        for (var i = 0; i < formData.length; i++) {
            var variation = formData[i];
            var attributesMatch = true;
            
            // Check if all attributes match
            for (var attrName in attributes) {
                if (attributes.hasOwnProperty(attrName)) {
                    var attrValue = attributes[attrName];
                    
                    // Check if this attribute matches the variation
                    if (variation.attributes[attrName] !== attrValue && variation.attributes[attrName] !== '') {
                        attributesMatch = false;
                        break;
                    }
                }
            }
            
            // If all attributes match, return this variation ID
            if (attributesMatch) {
                console.log('🔧 Found matching variation ID: ' + variation.variation_id);
                return variation.variation_id;
            }
        }
    }
    
    console.log('🔧 Could not find matching variation ID');
    return null;
}

/**
 * Collect Hebrew attributes from form
 */
function collectHebrewAttributes($form) {
    var $ = jQuery;
    
    // Make sure we have a valid form
    if (!$form || !$form.length) {
        console.log('🔧 Invalid form provided to collectHebrewAttributes');
        return {};
    }
    
    var attributes = {};
    
    // Find all select elements for attributes
    $form.find('select[name^="attribute_"]').each(function() {
        var $select = $(this);
        var name = $select.attr('name');
        var value = $select.val();
        
        if (name && value) {
            attributes[name] = value;
        }
    });
    
    // Find all radio buttons for attributes
    $form.find('input[type="radio"][name^="attribute_"]:checked').each(function() {
        var $radio = $(this);
        var name = $radio.attr('name');
        var value = $radio.val();
        
        if (name && value) {
            attributes[name] = value;
        }
    });
    
    // Find all hidden inputs for attributes (sometimes used for selected swatches)
    $form.find('input[type="hidden"][name^="attribute_"]').each(function() {
        var $hidden = $(this);
        var name = $hidden.attr('name');
        var value = $hidden.val();
        
        if (name && value && value !== '') {
            attributes[name] = value;
        }
    });
    
    return attributes;
}

/**
 * Handle upsell add to cart
 */
function handleUpsellAddToCart(productId, variationId, quantity, $form) {
    var $ = jQuery;
    
    if (!productId) {
        console.log('🔧 No product ID provided to handleUpsellAddToCart');
        return;
    }
    
    console.log('🔧 Adding to cart - Product ID: ' + productId + ', Variation ID: ' + (variationId || 'none') + ', Quantity: ' + quantity);
    
    // Prepare data for AJAX request
    var data = {
        action: 'woocommerce_add_to_cart',
        product_id: productId,
        quantity: quantity
    };
    
    // Add variation ID if available
    if (variationId) {
        data.variation_id = variationId;
        
        // Add variation attributes if available
        if ($form && $form.length) {
            var attributes = collectHebrewAttributes($form);
            
            for (var name in attributes) {
                if (attributes.hasOwnProperty(name)) {
                    data[name] = attributes[name];
                }
            }
        }
    }
    
    // Send AJAX request
    $.ajax({
        type: 'POST',
        url: wc_add_to_cart_params ? wc_add_to_cart_params.wc_ajax_url.toString().replace('%%endpoint%%', 'add_to_cart') : '/wp-admin/admin-ajax.php',
        data: data,
        success: function(response) {
            console.log('🔧 Add to cart success:', response);
            
            // Trigger events
            $(document.body).trigger('added_to_cart', [null, null, $form]);
            
            // Refresh fragments
            if (response && response.fragments) {
                $(document.body).trigger('wc_fragments_loaded');
                $(document.body).trigger('wc_fragments_refreshed');
            }
            
            // Close modal if needed
            if ($form) {
                var $modal = $form.closest('.wcuf-modal, .upsell-popup, .vi-wcuf-popup');
                if ($modal.length) {
                    // Try to find close button and click it
                    var $close = $modal.find('.wcuf-modal-close, .close-modal, .vi-wcuf-popup-close');
                    if ($close.length) {
                        setTimeout(function() {
                            $close.trigger('click');
                        }, 500);
                    }
                }
            }
        },
        error: function(error) {
            console.log('🔧 Add to cart error:', error);
        }
    });
}

/**
 * Make global helper functions available
 */
window.fixHebrewVariationAddToCart = fixHebrewVariationAddToCart;
window.fixUpsellVariations = window.hebrewRTLFix;

/**
 * Set up mutation observer to detect dynamically added popups
 */
function setupMutationObserver() {
    var $ = jQuery;
    
    // Check if MutationObserver is available
    if (typeof MutationObserver === 'undefined') {
        console.log('🔧 MutationObserver not available, cannot monitor for dynamic popups');
        return;
    }
    
    // Create observer instance
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // Check if any nodes were added
            if (mutation.addedNodes && mutation.addedNodes.length) {
                // Check each added node
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    var node = mutation.addedNodes[i];
                    
                    // Check if this is an element node
                    if (node.nodeType === 1) {
                        var $node = $(node);
                        
                        // Check if this is a popup or contains popups
                        if ($node.is('.wcuf-modal, .upsell-popup, .vi-wcuf-popup') || 
                            $node.find('.wcuf-modal, .upsell-popup, .vi-wcuf-popup').length) {
                            console.log('🔧 Detected dynamically added popup, running fix...');
                            setTimeout(window.hebrewRTLFix, 100);
                            break;
                        }
                    }
                }
            }
        });
    });
    
    // Start observing the document body
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('🔧 MutationObserver set up to detect dynamic popups');
}

// Initialize the script when jQuery is ready
(function($) {
    // Ensure this script runs even if jQuery document ready has already fired
    function initHebrewRTLFix() {
        if (typeof jQuery === 'undefined') {
            console.log('🔧 Hebrew RTL Fix: jQuery not loaded yet, waiting...');
            setTimeout(initHebrewRTLFix, 100);
            return;
        }
        
        var $ = jQuery;
        console.log('🔧 Hebrew RTL Fix loaded for variation upsell popups');
        
        // Check if we're on an RTL page
        var isRTL = $('html').attr('dir') === 'rtl' || $('html').hasClass('rtl');
        console.log('🔧 RTL detection:', isRTL);
        
        // Set up mutation observer
        setupMutationObserver();
        
        // Run the fix immediately
        window.hebrewRTLFix();
        
        // Set up periodic check for new popups
        setInterval(function() {
            window.hebrewRTLFix();
        }, 2000);
    }
    
    // Start the initialization
    initHebrewRTLFix();
})(jQuery);

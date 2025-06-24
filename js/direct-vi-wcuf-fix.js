/**
 * Direct VI WCUF Fix for WooCommerce Checkout Page
 * This script specifically targets the VI WCUF upsell popups on the checkout page
 * Works with any product variation without hardcoding
 */
(function($) {
    'use strict';
    
    console.log('🛠️ Direct VI WCUF Fix loaded for checkout page');
    
    // Check if we're on the checkout page
    function isCheckoutPage() {
        return $('body').hasClass('woocommerce-checkout') || 
               window.location.href.indexOf('checkout') > -1 ||
               $('.woocommerce-checkout').length > 0;
    }
    
    // Log checkout page detection
    console.log('🛠️ Checkout page detected:', isCheckoutPage());
    
    // Direct fix for VI WCUF popups on checkout page
    $(document).on('click', '.vi-wcuf-swatches-control-footer-bt-ok', function(e) {
        console.log('🛠️ Add to cart button clicked in VI WCUF popup');
        e.preventDefault();
        e.stopPropagation();
        
        // Find the selected radio button
        var $selectedRadio = $('.vi-wcuf-swatches-wrap input[type="radio"]:checked');
        console.log('🛠️ Selected radio:', $selectedRadio.length ? 'Found' : 'Not found');
        
        if (!$selectedRadio.length) {
            alert('אנא בחר וריאציה תחילה');
            return;
        }
        
        // Get the product ID
        var productId = $('.variations_form').data('product_id');
        if (!productId) {
            // Try to get from URL
            var urlParams = new URLSearchParams(window.location.search);
            productId = urlParams.get('add-to-cart');
        }
        
        if (!productId) {
            // Try to get from the page
            productId = $('input[name="add-to-cart"]').val();
        }
        
        if (!productId) {
            // Try to get from hidden input
            productId = $('.viwcuf_us_product_id').val();
        }
        
        if (!productId) {
            // Last resort - try to get from the current URL
            var currentUrl = window.location.href;
            var matches = currentUrl.match(/\/product\/([^\/]+)/);
            if (matches && matches[1]) {
                // We have a product slug, now we need to find the ID
                console.log('🛠️ Found product slug:', matches[1]);
                // This would require an AJAX call to get the ID from slug
                // For now, let's try to find it in the page
                productId = $('.single_add_to_cart_button').val();
            }
        }
        
        console.log('🛠️ Product ID:', productId);
        
        // Get the variation ID
        var variationId = $('.variations_form input[name="variation_id"]').val();
        console.log('🛠️ Variation ID from form:', variationId);
        
        if (!variationId) {
            // Try to get from the selected radio
            var $li = $selectedRadio.closest('li');
            if ($li.data('variation_id')) {
                variationId = $li.data('variation_id');
                console.log('🛠️ Variation ID from radio:', variationId);
            }
        }
        
        // Get the attribute
        var attributeName = $selectedRadio.closest('ul').data('attribute_name');
        var attributeValue = $selectedRadio.data('value');
        console.log('🛠️ Attribute:', attributeName, attributeValue);
        
        // If we don't have a variation ID but have an attribute, try to find the variation ID
        if (!variationId && attributeName && attributeValue) {
            // Get all variations
            var variations = $('.variations_form').data('product_variations');
            if (variations && variations.length) {
                // Find the variation that matches the selected attribute
                for (var i = 0; i < variations.length; i++) {
                    var variation = variations[i];
                    if (variation.attributes && variation.attributes[attributeName] === attributeValue) {
                        variationId = variation.variation_id;
                        console.log('🛠️ Found variation ID from attributes:', variationId);
                        break;
                    }
                }
            }
        }
        
        // If we still don't have a variation ID, try to use the product ID
        if (!variationId && productId) {
            variationId = productId;
            console.log('🛠️ Using product ID as variation ID');
        }
        
        // Get the quantity
        var quantity = $('.viwcuf_us_product_qty').val() || 1;
        console.log('🛠️ Quantity:', quantity);
        
        // Prepare data for AJAX request
        var data = {
            action: 'woocommerce_add_to_cart',
            product_id: productId,
            quantity: quantity
        };
        
        // Add variation ID if we have it
        if (variationId) {
            data.variation_id = variationId;
        }
        
        // Add attribute if we have it
        if (attributeName && attributeValue) {
            data[attributeName] = attributeValue;
        }
        
        console.log('🛠️ AJAX data:', data);
        
        // Send AJAX request
        $.ajax({
            type: 'POST',
            url: wc_add_to_cart_params.wc_ajax_url.toString().replace('%%endpoint%%', 'add_to_cart'),
            data: data,
            success: function(response) {
                console.log('🛠️ AJAX success:', response);
                
                if (response.error) {
                    console.error('🛠️ Error:', response.error);
                    alert(response.error);
                } else {
                    console.log('🛠️ Product added to cart');
                    
                    // Update fragments
                    if (response.fragments) {
                        $.each(response.fragments, function(key, value) {
                            $(key).replaceWith(value);
                        });
                    }
                    
                    // Close popup
                    $('.vi-wcuf-popup-close').trigger('click');
                    $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash]);
                }
            },
            error: function(xhr, status, error) {
                console.error('🛠️ AJAX error:', status, error);
                console.log('🛠️ Response:', xhr.responseText);
                alert('Error adding to cart');
            }
        });
    });
    
    // Also handle radio button clicks to ensure they're properly selected
    $(document).on('click', '.vi-wcuf-swatches-wrap input[type="radio"]', function() {
        var $radio = $(this);
        console.log('🛠️ Radio clicked:', $radio.val());
        
        // Make sure it's checked
        $radio.prop('checked', true);
        
        // Update the select dropdown if it exists
        var $ul = $radio.closest('ul');
        var attributeName = $ul.data('attribute_name');
        var $select = $('select[name="' + attributeName + '"]');
        
        if ($select.length) {
            $select.val($radio.data('value')).trigger('change');
            console.log('🛠️ Updated select:', attributeName, $radio.data('value'));
        }
    });
    
    // Add a global helper function
    window.directViWcufAddToCart = function() {
        console.log('🛠️ Manual add to cart triggered');
        
        // Find all VI WCUF popups
        var $popups = $('.vi-wcuf-swatches-control-wrap-wrap');
        console.log('🛠️ Found ' + $popups.length + ' VI WCUF popups');
        
        if ($popups.length === 0) {
            console.log('🛠️ No VI WCUF popups found');
            return false;
        }
        
        // For each popup, try to select a variation if none is selected
        $popups.each(function(index) {
            var $popup = $(this);
            var $radios = $popup.find('.vi-wcuf-swatches-wrap input[type="radio"]');
            var $checkedRadios = $radios.filter(':checked');
            
            console.log('🛠️ Popup #' + (index + 1) + ' has ' + $radios.length + ' radio buttons, ' + $checkedRadios.length + ' checked');
            
            // If no radio is checked, check the first one
            if ($checkedRadios.length === 0 && $radios.length > 0) {
                $radios.first().prop('checked', true).trigger('click');
                console.log('🛠️ Auto-selected first radio button in popup #' + (index + 1));
            }
            
            // Click the add to cart button
            var $addToCartBtn = $popup.find('.vi-wcuf-swatches-control-footer-bt-ok');
            if ($addToCartBtn.length) {
                $addToCartBtn.trigger('click');
                console.log('🛠️ Triggered add to cart button in popup #' + (index + 1));
                return false; // Only handle the first popup
            }
        });
        
        return true;
    };
    
    // Initialize
    $(document).ready(function() {
        console.log('🛠️ Direct VI WCUF Fix initialized');
        
        // Monitor for dynamically added popups
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        if (node.nodeType === 1 && $(node).find('.vi-wcuf-swatches-control-wrap-wrap').length > 0) {
                            console.log('🛠️ VI WCUF popup detected:', node);
                            
                            // Initialize radio buttons in the popup
                            $(node).find('.vi-wcuf-swatches-wrap input[type="radio"]').on('click', function() {
                                var $radio = $(this);
                                console.log('🛠️ Radio clicked in new popup:', $radio.val());
                                
                                // Make sure it's checked
                                $radio.prop('checked', true);
                                
                                // Update the select dropdown if it exists
                                var $ul = $radio.closest('ul');
                                var attributeName = $ul.data('attribute_name');
                                var $select = $('select[name="' + attributeName + '"]');
                                
                                if ($select.length) {
                                    $select.val($radio.data('value')).trigger('change');
                                    console.log('🛠️ Updated select in new popup:', attributeName, $radio.data('value'));
                                }
                            });
                        }
                    }
                }
            });
        });
        
        // Start observing the document body for added nodes
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Also handle any existing popups
        $('.vi-wcuf-swatches-control-wrap-wrap').each(function() {
            console.log('🛠️ Found existing VI WCUF popup:', this);
        });
    });
})(jQuery);

/**
 * Checkout Upsell Fix
 * Specifically designed to fix variation selection in upsell popups on the checkout page
 * Works with any product without hardcoding
 */

// Define global helper function first, outside of any scope
window.checkoutUpsellAddToCart = function() {
    console.log('🛒 Manual checkout upsell add to cart triggered');
    
    // Use jQuery safely
    var $ = jQuery;
    
    // Find all VI WCUF popups
    var $popups = $('.vi-wcuf-swatches-control-wrap-wrap');
    console.log('🛒 Found ' + $popups.length + ' VI WCUF popups');
    
    if ($popups.length === 0) {
        console.log('🛒 No VI WCUF popups found');
        return false;
    }
    
    // For each popup, try to select a variation if none is selected
    $popups.each(function(index) {
        var $popup = $(this);
        var $radios = $popup.find('.vi-wcuf-swatches-wrap input[type="radio"]');
        var $checkedRadios = $radios.filter(':checked');
        
        console.log('🛒 Popup #' + (index + 1) + ' has ' + $radios.length + ' radio buttons, ' + $checkedRadios.length + ' checked');
        
        // If no radio is checked, check the first one
        if ($checkedRadios.length === 0 && $radios.length > 0) {
            $radios.first().prop('checked', true).trigger('click');
            console.log('🛒 Auto-selected first radio button in popup #' + (index + 1));
        }
        
        // Click the add to cart button
        var $addToCartBtn = $popup.find('.vi-wcuf-swatches-control-footer-bt-ok');
        if ($addToCartBtn.length) {
            $addToCartBtn.trigger('click');
            console.log('🛒 Triggered add to cart button in popup #' + (index + 1));
            return false; // Only handle the first popup
        }
    });
    
    return true;
};

// Log that the function is available
console.log('🛒 checkoutUpsellAddToCart function is now available globally');

jQuery(document).ready(function($) {
    'use strict';
    
    console.log('🛒 Checkout Upsell Fix loaded');
    
    // Helper function for debugging
    function debugLog(message, data) {
        if (typeof variationUpsellDebug !== 'undefined' && variationUpsellDebug) {
            console.log('🛒 ' + message, data || '');
        }
    }
    
    // Check if we're on the checkout page
    function isCheckoutPage() {
        return $('body').hasClass('woocommerce-checkout') || 
               window.location.href.indexOf('checkout') > -1 ||
               $('.woocommerce-checkout').length > 0;
    }
    
    // Only run on checkout page
    if (!isCheckoutPage()) {
        debugLog('Not on checkout page, skipping');
        return;
    }
    
    debugLog('Checkout page detected, initializing fix');
    
    // Function to find product ID from various sources
    function findProductId($container) {
        // Try to find from data attribute
        var productId = $container.find('[data-product_id]').data('product_id');
        
        if (!productId) {
            // Try to find from hidden input
            productId = $container.find('input[name="add-to-cart"]').val();
        }
        
        if (!productId) {
            // Try to find from button value
            productId = $container.find('button.single_add_to_cart_button').val();
        }
        
        if (!productId) {
            // Try to find from variations form
            productId = $container.find('.variations_form').data('product_id');
        }
        
        if (!productId) {
            // Try to find from custom field
            productId = $container.find('.viwcuf_us_product_id').val();
        }
        
        debugLog('Found product ID', productId);
        return productId;
    }
    
    // Function to collect all selected variation attributes
    function collectVariationAttributes($container) {
        var attributes = {};
        
        // Check radio buttons first (they're the visual swatches)
        $container.find('input[type="radio"]:checked').each(function() {
            var $radio = $(this);
            var $ul = $radio.closest('ul');
            var attributeName = $ul.data('attribute_name');
            var attributeValue = $radio.data('value');
            
            if (attributeName && attributeValue) {
                attributes[attributeName] = attributeValue;
                debugLog('Found attribute from radio', { name: attributeName, value: attributeValue });
            }
        });
        
        // Also check select dropdowns
        $container.find('select[name^="attribute_"]').each(function() {
            var $select = $(this);
            var name = $select.attr('name');
            var value = $select.val();
            
            if (name && value && value !== '') {
                attributes[name] = value;
                debugLog('Found attribute from select', { name: name, value: value });
            }
        });
        
        return attributes;
    }
    
    // Function to find variation ID
    function findVariationId($container, attributes) {
        // Try to get from hidden input
        var variationId = $container.find('input[name="variation_id"]').val();
        
        if (!variationId) {
            // Try to get from data attribute
            variationId = $container.find('.variations_form').data('variation_id');
        }
        
        if (!variationId) {
            // Try to get from selected radio
            var $selectedRadio = $container.find('input[type="radio"]:checked');
            if ($selectedRadio.length) {
                var $li = $selectedRadio.closest('li');
                if ($li.data('variation_id')) {
                    variationId = $li.data('variation_id');
                }
            }
        }
        
        // If we still don't have a variation ID but have attributes, try to find it from variations data
        if (!variationId && Object.keys(attributes).length > 0) {
            var variations = $container.find('.variations_form').data('product_variations');
            if (variations && variations.length) {
                // Find the variation that matches all selected attributes
                for (var i = 0; i < variations.length; i++) {
                    var variation = variations[i];
                    var isMatch = true;
                    
                    // Check if all attributes match
                    for (var attrName in attributes) {
                        if (attributes.hasOwnProperty(attrName)) {
                            var attrValue = attributes[attrName];
                            if (variation.attributes[attrName] !== '' && 
                                variation.attributes[attrName] !== attrValue) {
                                isMatch = false;
                                break;
                            }
                        }
                    }
                    
                    if (isMatch) {
                        variationId = variation.variation_id;
                        debugLog('Found variation ID from attributes', variationId);
                        break;
                    }
                }
            }
        }
        
        return variationId;
    }
    
    // Function to add product to cart via AJAX
    function addToCartAjax(productId, variationId, attributes, quantity) {
        debugLog('Adding to cart', {
            product_id: productId,
            variation_id: variationId,
            attributes: attributes,
            quantity: quantity
        });
        
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
        
        // Add all attributes to the request
        if (Object.keys(attributes).length > 0) {
            $.each(attributes, function(name, value) {
                data[name] = value;
            });
        }
        
        debugLog('AJAX request data', data);
        
        // Add to cart via AJAX
        $.ajax({
            type: 'POST',
            url: wc_add_to_cart_params.wc_ajax_url.toString().replace('%%endpoint%%', 'add_to_cart'),
            data: data,
            success: function(response) {
                debugLog('Add to cart response', response);
                
                if (response.error) {
                    debugLog('Error', response.error);
                    alert(response.error);
                } else {
                    debugLog('Product successfully added to cart');
                    
                    // Update fragments
                    if (response.fragments) {
                        $.each(response.fragments, function(key, value) {
                            $(key).replaceWith(value);
                        });
                    }
                    
                    // Close popup
                    setTimeout(function() {
                        $('.vi-wcuf-popup-close').trigger('click');
                        $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash]);
                    }, 300);
                }
            },
            error: function(xhr, status, error) {
                debugLog('AJAX Error', { status: status, error: error });
                console.error('AJAX Error:', xhr.responseText);
                alert('שגיאה בהוספה לסל. אנא נסה שוב.');
            }
        });
    }
    
    // Handle VI WCUF add to cart button clicks
    $(document).on('click', '.vi-wcuf-swatches-control-footer-bt-ok', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        debugLog('VI WCUF add to cart button clicked');
        
        // Find the container
        var $container = $(this).closest('.vi-wcuf-swatches-control-wrap-wrap');
        
        // Find product ID
        var productId = findProductId($container);
        if (!productId) {
            debugLog('Could not find product ID');
            return;
        }
        
        // Collect attributes
        var attributes = collectVariationAttributes($container);
        
        // Check if we have all required attributes
        var $requiredSelects = $container.find('select[name^="attribute_"]');
        var allSelected = true;
        
        $requiredSelects.each(function() {
            var $select = $(this);
            var name = $select.attr('name');
            
            // Check if this attribute is selected either in the select or as a radio button
            var isSelected = $select.val() || 
                             $container.find('input[type="radio"][name^="wvs_radio_' + name + '"]:checked').length > 0;
            
            if (!isSelected) {
                allSelected = false;
                debugLog('Missing selection for', name);
            }
        });
        
        // If no selects, check if we have any radio buttons selected
        if ($requiredSelects.length === 0) {
            var $radios = $container.find('input[type="radio"]');
            if ($radios.length > 0 && $radios.filter(':checked').length === 0) {
                allSelected = false;
                debugLog('No radio buttons selected');
            }
        }
        
        if (!allSelected) {
            alert('אנא בחר את כל אפשרויות המוצר לפני ההוספה לסל.');
            return;
        }
        
        // Find variation ID
        var variationId = findVariationId($container, attributes);
        
        // Get quantity
        var quantity = $container.find('.viwcuf_us_product_qty').val() || 1;
        
        // If we have product ID and either variation ID or attributes, add to cart
        if (productId && (variationId || Object.keys(attributes).length > 0)) {
            addToCartAjax(productId, variationId, attributes, quantity);
        } else {
            debugLog('Missing required data', {
                productId: productId,
                variationId: variationId,
                attributes: attributes
            });
            alert('אנא בחר את כל אפשרויות המוצר לפני ההוספה לסל.');
        }
    });
    
    // Handle radio button clicks
    $(document).on('click', '.vi-wcuf-swatches-wrap input[type="radio"]', function() {
        var $radio = $(this);
        debugLog('Radio button clicked', {
            value: $radio.val(),
            dataValue: $radio.data('value')
        });
        
        // Make sure the radio is checked
        $radio.prop('checked', true);
        
        // Update the select dropdown if it exists
        var $ul = $radio.closest('ul');
        var attributeName = $ul.data('attribute_name');
        var $select = $('select[name="' + attributeName + '"]');
        
        if ($select.length) {
            $select.val($radio.data('value')).trigger('change');
            debugLog('Updated select', {
                selectName: attributeName,
                newValue: $radio.data('value')
            });
        }
    });
    
    // Monitor for dynamically added popups
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    var node = mutation.addedNodes[i];
                    if (node.nodeType === 1) {
                        var $node = $(node);
                        if ($node.hasClass('vi-wcuf-swatches-control-wrap-wrap') || 
                            $node.find('.vi-wcuf-swatches-control-wrap-wrap').length > 0) {
                            debugLog('VI WCUF popup detected', node);
                            
                            // Initialize any uninitialized elements
                            setTimeout(function() {
                                // Find product ID and add it as a hidden field if it doesn't exist
                                var $popup = $node.hasClass('vi-wcuf-swatches-control-wrap-wrap') ? 
                                             $node : $node.find('.vi-wcuf-swatches-control-wrap-wrap');
                                
                                var productId = findProductId($popup);
                                if (productId && $popup.find('.viwcuf_us_product_id').length === 0) {
                                    $('<input>').attr({
                                        type: 'hidden',
                                        class: 'viwcuf_us_product_id',
                                        value: productId
                                    }).appendTo($popup);
                                    
                                    debugLog('Added hidden product ID input', productId);
                                }
                            }, 500);
                        }
                    }
                }
            }
        });
    });
    
    // Start observing the document body for added nodes
    observer.observe(document.body, { childList: true, subtree: true });
    
    // The global helper function is now defined outside this scope
    
    debugLog('Checkout Upsell Fix initialized');
});

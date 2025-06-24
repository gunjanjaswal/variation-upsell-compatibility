/**
 * Nuclear Fix for WooCommerce Variation Swatches and Upsell Popup
 * 
 * This is a direct intervention that completely takes over the add-to-cart process
 * for variation products in upsell popups to ensure they work correctly.
 */
jQuery(document).ready(function($) {
    // Debug mode - always on for this critical fix
    var debug = true;
    
    // Helper function for logging
    function log(message, data) {
        if (debug && console && console.log) {
            if (data !== undefined) {
                console.log('🔧 Nuclear Fix: ' + message, data);
            } else {
                console.log('🔧 Nuclear Fix: ' + message);
            }
        }
    }
    
    log('Nuclear fix initialized');
    
    // Direct add to cart function - bypasses normal flow
    function directAddToCart(productId, variationId, quantity, attributes) {
        log('Direct add to cart attempt', {
            product_id: productId,
            variation_id: variationId,
            quantity: quantity,
            attributes: attributes
        });
        
        // Prepare data for AJAX request
        var requestData = {
            product_id: productId,
            variation_id: variationId,
            quantity: quantity
        };
        
        // Add all variation attributes to the request
        if (attributes) {
            $.each(attributes, function(name, value) {
                requestData[name] = value;
            });
        }
        
        // Add to cart via AJAX
        $.ajax({
            type: 'POST',
            url: wc_add_to_cart_params.wc_ajax_url.toString().replace('%%endpoint%%', 'add_to_cart'),
            data: requestData,
            success: function(response) {
                log('Add to cart response:', response);
                
                if (response.error) {
                    log('ERROR:', response.error);
                    alert(response.error);
                } else {
                    log('Product successfully added to cart');
                    
                    // Success - refresh fragments
                    if (response.fragments) {
                        $.each(response.fragments, function(key, value) {
                            $(key).replaceWith(value);
                        });
                    }
                    
                    // Close popup if there's a close button
                    setTimeout(function() {
                        var $closeButton = $('.upsell-popup .close, .wcuf-popup .close, .popup-content .close, .modal-content .close, [class*="close"], [aria-label*="Close"]');
                        
                        if ($closeButton.length) {
                            log('Closing popup');
                            $closeButton.trigger('click');
                        }
                        
                        // Trigger event for other scripts
                        $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash]);
                    }, 500);
                }
            },
            error: function(xhr, status, error) {
                log('AJAX Error:', error);
                log('Status:', status);
                log('Response:', xhr.responseText);
                
                alert('Error adding to cart. Please check the browser console for details.');
            }
        });
    }
    
    // Collect all variation attributes from a form
    function collectVariationAttributes($form) {
        var attributes = {};
        var allSelected = true;
        
        // Try every possible selector that might contain variation data
        $form.find('select[name^="attribute_"], input[name^="attribute_"]:checked, [data-attribute_name^="attribute_"] .selected, .wvs-selected').each(function() {
            var $element = $(this);
            var name = $element.attr('name') || $element.data('attribute_name');
            var value = $element.val() || $element.data('value');
            
            if (name && name.indexOf('attribute_') === 0) {
                if (value) {
                    attributes[name] = value;
                    log('Found attribute:', name, value);
                } else {
                    allSelected = false;
                    log('Missing value for attribute:', name);
                }
            }
        });
        
        // Check if we have all required attributes
        return {
            attributes: attributes,
            complete: allSelected
        };
    }
    
    // Direct add to cart with attributes
    function directAddToCartWithAttributes($form) {
        var productId = $form.find('input[name="product_id"]').val() || $form.data('product_id');
        var variationId = $form.find('input[name="variation_id"]').val();
        var quantity = $form.find('input[name="quantity"]').val() || 1;
        
        log('Form data:', {
            productId: productId,
            variationId: variationId,
            quantity: quantity
        });
        
        if (!productId || !variationId) {
            log('Missing product ID or variation ID');
            return false;
        }
        
        var variationData = collectVariationAttributes($form);
        
        if (!variationData.complete) {
            log('Not all variations selected');
            return false;
        }
        
        directAddToCart(productId, variationId, quantity, variationData.attributes);
        return true;
    }
    
    // Try alternative add to cart method for edge cases
    function tryAlternativeAddToCartWithAttributes($container) {
        // Look for product data in the container
        var productId = $container.find('[name="product_id"], [data-product_id]').first().val() || $container.find('[name="product_id"], [data-product_id]').first().data('product_id');
        var variationId = $container.find('[name="variation_id"], [data-variation_id]').first().val() || $container.find('[name="variation_id"], [data-variation_id]').first().data('variation_id');
        var quantity = $container.find('[name="quantity"], [data-quantity]').first().val() || $container.find('[name="quantity"], [data-quantity]').first().data('quantity') || 1;
        
        if (!productId || !variationId) {
            log('Alternative method: Missing product ID or variation ID');
            return false;
        }
        
        // Collect attributes from any element that might contain them
        var attributes = {};
        $container.find('[name^="attribute_"], [data-attribute], [class*="attribute"], [class*="variation"]').each(function() {
            var $element = $(this);
            var name, value;
            
            // Try to get the attribute name and value in various ways
            if ($element.attr('name') && $element.attr('name').indexOf('attribute_') === 0) {
                name = $element.attr('name');
                value = $element.val() || $element.data('value');
            } else if ($element.data('attribute') && typeof $element.data('attribute') === 'string') {
                name = $element.data('attribute');
                value = $element.data('value') || $element.val();
            } else if ($element.hasClass('selected') || $element.hasClass('active') || $element.prop('checked')) {
                name = $element.closest('[data-attribute_name]').data('attribute_name');
                value = $element.data('value');
            }
            
            if (name && value && name.indexOf('attribute_') === 0) {
                attributes[name] = value;
                log('Alternative method: Found attribute:', name, value);
            }
        });
        
        directAddToCart(productId, variationId, quantity, attributes);
        return true;
    }
    
    // Intercept all add to cart clicks in upsell popups
    $(document).on('click', '.upsell-popup button[type="submit"], .upsell-popup .single_add_to_cart_button, .wcuf-popup button[type="submit"], .wcuf-popup .single_add_to_cart_button, [class*="upsell"] .single_add_to_cart_button', function(e) {
        var $button = $(this);
        var $container = $button.closest('.upsell-popup, .wcuf-popup, .popup-content, .modal-content, [class*="upsell"]');
        
        log('Add to cart button clicked in popup', $button);
        
        if ($container.length) {
            e.preventDefault();
            e.stopPropagation();
            
            // Try to find a variations form
            var $form = $container.find('form.variations_form');
            
            if ($form.length) {
                log('Found variations form', $form);
                
                // Try direct add to cart with the form
                if (directAddToCartWithAttributes($form)) {
                    return false;
                }
            }
            
            // If we couldn't find a form or it failed, try the alternative method
            log('Trying alternative add to cart method');
            if (tryAlternativeAddToCartWithAttributes($container)) {
                return false;
            }
            
            // If all else fails, show an error
            log('All add to cart methods failed');
            alert('Please select all product options before adding to cart.');
        }
    });
    
    // Monitor variation changes to update the variation ID
    $(document).on('found_variation', '.variations_form', function(event, variation) {
        var $form = $(this);
        
        if (variation && variation.variation_id) {
            log('Variation found:', variation);
            $form.find('input[name="variation_id"]').val(variation.variation_id);
        }
    });
    
    // Monitor clicks on variation swatches
    $(document).on('click', '.variable-item', function() {
        var $item = $(this);
        var $wrapper = $item.closest('.variable-items-wrapper');
        var attributeName = $wrapper.data('attribute_name');
        var value = $item.data('value');
        
        log('Swatch clicked:', {
            attributeName: attributeName,
            value: value
        });
        
        // Update any hidden inputs or selects with this attribute
        if (attributeName && value) {
            var $select = $('select[name="' + attributeName + '"]');
            if ($select.length) {
                $select.val(value).trigger('change');
            }
            
            // Add selected class
            $wrapper.find('.selected').removeClass('selected');
            $item.addClass('selected');
        }
    });
    
    log('All event handlers registered');
});

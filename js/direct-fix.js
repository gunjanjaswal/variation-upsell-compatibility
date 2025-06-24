/**
 * Direct Fix for WooCommerce Variation Swatches and Checkout Upsell Funnel
 * 
 * This script specifically targets the issue with Hebrew product names in upsell popups
 * and forces the variation selection to be recognized.
 */
jQuery(document).ready(function($) {
    console.log('🛠️ Direct Fix loaded for Hebrew product variations in upsell popups');
    
    // Direct add to cart function that bypasses normal validation
    function forceAddToCart(productId, variationId, attributes) {
        console.log('🛠️ Force adding to cart:', {
            product_id: productId,
            variation_id: variationId,
            attributes: attributes
        });
        
        // Prepare data for AJAX request
        var requestData = {
            product_id: productId,
            variation_id: variationId,
            quantity: 1
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
                console.log('🛠️ Add to cart response:', response);
                
                if (response.error) {
                    console.log('🛠️ Error:', response.error);
                    alert(response.error);
                } else {
                    console.log('🛠️ Product successfully added to cart');
                    
                    // Success - refresh fragments
                    if (response.fragments) {
                        $.each(response.fragments, function(key, value) {
                            $(key).replaceWith(value);
                        });
                    }
                    
                    // Close popup
                    setTimeout(function() {
                        $('.upsell-popup .close, .wcuf-popup .close, [class*="close"]').trigger('click');
                        $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash]);
                    }, 300);
                }
            }
        });
    }
    
    // Function to extract variation ID from the page
    function getVariationId() {
        // Try multiple methods to find the variation ID
        var variationId = $('input[name="variation_id"]').val();
        
        if (!variationId) {
            // Try to get from data attribute
            variationId = $('.variations_form').data('product_variations');
            if (Array.isArray(variationId) && variationId.length > 0) {
                variationId = variationId[0].variation_id;
            }
        }
        
        return variationId;
    }
    
    // Function to extract product ID from the page
    function getProductId() {
        return $('input[name="product_id"]').val() || 
               $('.variations_form').data('product_id') || 
               $('[name="add-to-cart"]').val();
    }
    
    // Function to collect all selected attributes
    function getSelectedAttributes() {
        var attributes = {};
        
        // Check for selected radio buttons
        $('input[type="radio"]:checked, .selected').each(function() {
            var $element = $(this);
            var name = $element.attr('name');
            
            // If this is a variation attribute
            if (name && name.indexOf('attribute_') === 0) {
                attributes[name] = $element.val();
            }
            
            // Check for data attributes
            var attrName = $element.closest('[data-attribute_name]').data('attribute_name');
            if (attrName && attrName.indexOf('attribute_') === 0) {
                attributes[attrName] = $element.data('value');
            }
        });
        
        // Check for select boxes
        $('select[name^="attribute_"]').each(function() {
            var $select = $(this);
            var name = $select.attr('name');
            var value = $select.val();
            
            if (name && value) {
                attributes[name] = value;
            }
        });
        
        return attributes;
    }
    
    // Intercept add to cart clicks in upsell popups
    $(document).on('click', '.upsell-popup .single_add_to_cart_button, .wcuf-popup .single_add_to_cart_button', function(e) {
        var $button = $(this);
        var $popup = $button.closest('.upsell-popup, .wcuf-popup');
        
        if ($popup.length) {
            console.log('🛠️ Add to cart button clicked in popup');
            e.preventDefault();
            
            // Get product and variation IDs
            var productId = getProductId();
            var variationId = getVariationId();
            var attributes = getSelectedAttributes();
            
            console.log('🛠️ Product ID:', productId);
            console.log('🛠️ Variation ID:', variationId);
            console.log('🛠️ Attributes:', attributes);
            
            if (productId && variationId) {
                forceAddToCart(productId, variationId, attributes);
            } else {
                console.log('🛠️ Missing product ID or variation ID');
                alert('Please select all product options before adding to cart.');
            }
        }
    });
    
    // Special handling for radio button swatches
    $(document).on('click', '.variable-item', function() {
        var $item = $(this);
        console.log('🛠️ Swatch clicked:', $item.data('value'));
        
        // Make sure the item is marked as selected
        $item.siblings('.selected').removeClass('selected');
        $item.addClass('selected');
        
        // If this is a radio button, make sure it's checked
        var $radio = $item.find('input[type="radio"]');
        if ($radio.length) {
            $radio.prop('checked', true).trigger('change');
        }
        
        // Update any select boxes
        var $wrapper = $item.closest('.variable-items-wrapper');
        var attributeName = $wrapper.data('attribute_name');
        
        if (attributeName) {
            var $select = $('select[name="' + attributeName + '"]');
            if ($select.length) {
                $select.val($item.data('value')).trigger('change');
            }
        }
    });
    
    // Monitor variation changes
    $(document).on('found_variation', '.variations_form', function(event, variation) {
        if (variation && variation.variation_id) {
            console.log('🛠️ Variation found:', variation.variation_id);
            $(this).find('input[name="variation_id"]').val(variation.variation_id);
        }
    });
    
    // Add a global helper function that can be called from the console
    window.fixVariationAddToCart = function() {
        var productId = getProductId();
        var variationId = getVariationId();
        var attributes = getSelectedAttributes();
        
        console.log('🛠️ Manual add to cart triggered');
        console.log('🛠️ Product ID:', productId);
        console.log('🛠️ Variation ID:', variationId);
        console.log('🛠️ Attributes:', attributes);
        
        if (productId && variationId) {
            forceAddToCart(productId, variationId, attributes);
            return true;
        } else {
            console.log('🛠️ Missing product ID or variation ID');
            return false;
        }
    };
    
    console.log('🛠️ Direct Fix initialized. You can manually trigger add to cart by running window.fixVariationAddToCart() in the console.');
});

/**
 * Specific Fix for VI WCUF (Checkout Upsell Funnel) with Hebrew RTL
 * 
 * This script specifically targets the structure used by the Checkout Upsell Funnel plugin
 * with the vi-wcuf-* classes and Hebrew RTL support.
 */
jQuery(document).ready(function($) {
    console.log('🔧 VI WCUF Fix loaded for Hebrew RTL variation upsell popups');
    
    // Debug function
    function debugLog(message, data) {
        if (typeof variationUpsellDebug !== 'undefined' && variationUpsellDebug) {
            console.log('🔧 VI WCUF: ' + message, data);
        }
    }
    
    // Function to directly add a product to cart with variation
    function viWcufAddToCart(productId, variationId, quantity) {
        debugLog('Adding to cart:', {
            product_id: productId,
            variation_id: variationId,
            quantity: quantity
        });
        
        // Find all selected attributes
        var attributes = {};
        $('.vi-wcuf-swatches-wrap select[name^="attribute_"]').each(function() {
            var name = $(this).attr('name');
            var value = $(this).val();
            if (name && value) {
                attributes[name] = value;
                debugLog('Found attribute from select:', {name: name, value: value});
            }
        });
        
        // Also check radio buttons
        $('.vi-wcuf-swatches-wrap input[type="radio"]:checked').each(function() {
            var $radio = $(this);
            var name = $radio.attr('name');
            var dataValue = $radio.data('value');
            var attributeName = $radio.closest('ul').data('attribute_name');
            
            if (attributeName && dataValue) {
                attributes[attributeName] = dataValue;
                debugLog('Found attribute from radio:', {name: attributeName, value: dataValue});
            }
        });
        
        // Prepare data for AJAX request
        var data = {
            action: 'woocommerce_add_to_cart',
            product_id: productId,
            variation_id: variationId,
            quantity: quantity
        };
        
        // Add all attributes to the request
        if (Object.keys(attributes).length > 0) {
            $.each(attributes, function(name, value) {
                data[name] = value;
            });
        }
        
        debugLog('AJAX request data:', data);
        
        // Add to cart via AJAX
        $.ajax({
            type: 'POST',
            url: wc_add_to_cart_params.wc_ajax_url.toString().replace('%%endpoint%%', 'add_to_cart'),
            data: data,
            success: function(response) {
                debugLog('Add to cart response:', response);
                
                if (response.error) {
                    debugLog('Error:', response.error);
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
                debugLog('AJAX Error:', {xhr: xhr, status: status, error: error});
                alert('שגיאה בהוספה לסל. אנא נסה שוב.');
            }
        });
    }
    
    // Function to find the product ID from the page or popup
    function findProductId() {
        // Try multiple methods to find product ID
        var productId = $('input[name="add-to-cart"]').val();
        
        if (!productId) {
            productId = $('button.single_add_to_cart_button').val();
        }
        
        if (!productId) {
            // Try to get from URL
            var urlParams = new URLSearchParams(window.location.search);
            productId = urlParams.get('add-to-cart');
        }
        
        if (!productId) {
            // Try to get from data attribute
            productId = $('.variations_form').data('product_id');
        }
        
        if (!productId) {
            // Try to get from hidden input in VI WCUF structure
            productId = $('.viwcuf_us_product_id').val();
        }
        
        return productId;
    }
    
    // Function to find variation ID from selected attributes
    function findVariationId() {
        // Try to get from hidden input
        var variationId = $('input[name="variation_id"]').val();
        
        if (!variationId) {
            // Try to get from data attribute in VI WCUF structure
            variationId = $('.viwcuf_us_variation_id').val();
        }
        
        if (!variationId) {
            // Try to find the selected radio button and get its variation ID
            var $selectedRadio = $('.vi-wcuf-swatches-wrap input[type="radio"]:checked');
            if ($selectedRadio.length) {
                var $li = $selectedRadio.closest('li');
                if ($li.data('variation_id')) {
                    variationId = $li.data('variation_id');
                }
            }
        }
        
        return variationId;
    }
    
    // Function to find variation ID from variations data and selected attributes
    function findVariationIdFromAttributes(productId, attributes) {
        // Try to get variations data
        var variations = $('.variations_form').data('product_variations');
        if (!variations) {
            return null;
        }
        
        // Loop through variations to find a match
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
                return variation.variation_id;
            }
        }
        
        return null;
    }
    
    // Handle VI WCUF radio button clicks
    $(document).on('click', '.vi-wcuf-swatches-wrap input[type="radio"]', function() {
        var $radio = $(this);
        debugLog('Radio button clicked:', {
            value: $radio.val(),
            dataValue: $radio.data('value')
        });
        
        // Make sure the radio is checked
        $radio.prop('checked', true);
        
        // Update the select dropdown
        var $ul = $radio.closest('ul');
        var attributeName = $ul.data('attribute_name');
        var $select = $('select[name="' + attributeName + '"]');
        
        if ($select.length) {
            $select.val($radio.data('value')).trigger('change');
            debugLog('Updated select:', {
                selectName: attributeName,
                newValue: $radio.data('value')
            });
        }
    });
    
    // Handle VI WCUF "ADD TO CART" button click
    $(document).on('click', '.vi-wcuf-swatches-control-footer-bt-ok', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        debugLog('VI WCUF Add to Cart button clicked');
        
        // Find all necessary data
        var productId = findProductId();
        var quantity = $('.viwcuf_us_product_qty').val() || 1;
        
        // Find selected attributes
        var attributes = {};
        $('.vi-wcuf-swatches-wrap select[name^="attribute_"]').each(function() {
            var name = $(this).attr('name');
            var value = $(this).val();
            if (name && value) {
                attributes[name] = value;
            }
        });
        
        // Also check radio buttons
        $('.vi-wcuf-swatches-wrap input[type="radio"]:checked').each(function() {
            var $radio = $(this);
            var attributeName = $radio.closest('ul').data('attribute_name');
            var dataValue = $radio.data('value');
            
            if (attributeName && dataValue) {
                attributes[attributeName] = dataValue;
            }
        });
        
        debugLog('Collected data:', {
            productId: productId,
            quantity: quantity,
            attributes: attributes
        });
        
        // Check if we have all required attributes
        var $requiredSelects = $('.vi-wcuf-swatches-wrap select[name^="attribute_"]');
        var allSelected = true;
        
        $requiredSelects.each(function() {
            var $select = $(this);
            var name = $select.attr('name');
            
            // Check if this attribute is selected either in the select or as a radio button
            var isSelected = $select.val() || $('.vi-wcuf-swatches-wrap input[type="radio"][name^="wvs_radio_' + name + '"]:checked').length > 0;
            
            if (!isSelected) {
                allSelected = false;
                debugLog('Missing selection for:', name);
            }
        });
        
        if (!allSelected) {
            alert('אנא בחר את כל אפשרויות המוצר לפני ההוספה לסל.');
            return;
        }
        
        // Find variation ID
        var variationId = findVariationId();
        
        // If we don't have a variation ID but have attributes, try to find it
        if (!variationId && Object.keys(attributes).length > 0) {
            variationId = findVariationIdFromAttributes(productId, attributes);
            debugLog('Found variation ID from attributes:', variationId);
        }
        
        // If we have product ID and variation ID, add to cart
        if (productId && variationId) {
            viWcufAddToCart(productId, variationId, quantity);
        } else {
            // Try to get variation ID from the first radio button
            var $firstCheckedRadio = $('.vi-wcuf-swatches-wrap input[type="radio"]:checked').first();
            if ($firstCheckedRadio.length) {
                var $li = $firstCheckedRadio.closest('li');
                debugLog('First checked radio button:', {
                    value: $firstCheckedRadio.val(),
                    dataValue: $firstCheckedRadio.data('value'),
                    liData: {
                        title: $li.data('title'),
                        value: $li.data('value')
                    }
                });
                
                // Try one more approach - get all variation data and find a match
                var $form = $('.variations_form');
                if ($form.length) {
                    debugLog('Variations form data:', $form.data());
                    
                    // If we have the form, try to trigger the found_variation event
                    $form.trigger('check_variations');
                    $form.trigger('found_variation');
                    
                    // Check again for variation ID
                    variationId = $form.find('input[name="variation_id"]').val();
                    if (variationId) {
                        debugLog('Found variation ID after triggering events:', variationId);
                        viWcufAddToCart(productId, variationId, quantity);
                        return;
                    }
                }
                
                // Last resort - try to use the product ID as the variation ID
                debugLog('Last resort - using product ID as variation ID');
                viWcufAddToCart(productId, productId, quantity);
            } else {
                alert('אנא בחר את כל אפשרויות המוצר לפני ההוספה לסל.');
            }
        }
    });
    
    // Add a global helper function
    window.fixViWcufAddToCart = function() {
        // Find the selected radio button
        var $selectedRadio = $('.vi-wcuf-swatches-wrap input[type="radio"]:checked');
        if (!$selectedRadio.length) {
            alert('אנא בחר וריאציה תחילה');
            return false;
        }
        
        var productId = findProductId();
        var quantity = $('.viwcuf_us_product_qty').val() || 1;
        
        // Get the attribute name and value
        var $ul = $selectedRadio.closest('ul');
        var attributeName = $ul.data('attribute_name');
        var attributeValue = $selectedRadio.data('value');
        
        var attributes = {};
        if (attributeName && attributeValue) {
            attributes[attributeName] = attributeValue;
        }
        
        debugLog('Manual add to cart triggered:', {
            productId: productId,
            quantity: quantity,
            attributes: attributes
        });
        
        // Try to get the variation ID
        var variationId = findVariationId();
        if (!variationId) {
            // Try to get it from the form data
            var $form = $('.variations_form');
            if ($form.length) {
                var variations = $form.data('product_variations');
                if (variations && variations.length) {
                    // Just use the first variation as a fallback
                    variationId = variations[0].variation_id;
                    debugLog('Using first variation as fallback:', variationId);
                }
            }
        }
        
        if (!variationId) {
            // Last resort - use the product ID
            variationId = productId;
            debugLog('Using product ID as variation ID (last resort)');
        }
        
        if (productId && variationId) {
            viWcufAddToCart(productId, variationId, quantity);
            return true;
        } else {
            alert('לא ניתן למצוא את פרטי המוצר. אנא נסה שוב.');
            return false;
        }
    };
    
    // Initialize by adding a hidden input for the product ID if needed
    function initialize() {
        // Try to find the product ID from the page
        var productId = findProductId();
        
        // If we don't have a product ID yet, try to get it from the URL
        if (!productId) {
            var urlParams = new URLSearchParams(window.location.search);
            var productParam = urlParams.get('add-to-cart');
            if (productParam) {
                productId = productParam;
            }
        }
        
        // If we found a product ID, add it as a hidden input
        if (productId && $('.viwcuf_us_product_id').length === 0) {
            $('<input>').attr({
                type: 'hidden',
                class: 'viwcuf_us_product_id',
                value: productId
            }).appendTo('.vi-wcuf-swatches-control-wrap');
            
            debugLog('Added hidden product ID input:', productId);
        }
    }
    
    // Run initialization
    initialize();
    
    debugLog('VI WCUF Fix initialized');
});

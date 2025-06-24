/**
 * Enhanced Variation Upsell Fix
 * 
 * Compatibility solution between WooCommerce Variation Swatches Pro and Checkout Upsell Funnel
 * Fully dynamic with no hardcoded values and includes console debugging
 */
jQuery(document).ready(function($) {
    // Debug mode - set to true to enable console logging
    var debug = true;
    
    // Helper function for logging
    function log(message, data) {
        if (debug && console && console.log) {
            if (data !== undefined) {
                console.log('Variation Upsell Fix: ' + message, data);
            } else {
                console.log('Variation Upsell Fix: ' + message);
            }
        }
    }
    
    log('Plugin initialized and monitoring for upsell popups');
    
    // Helper function to find the variations form
    function findVariationsForm(element) {
        var $form = $(element).closest('form.variations_form');
        
        if (!$form.length) {
            $form = $(element).closest('.upsell-popup, .wcuf-popup, .popup-content, .modal-content').find('form.variations_form');
        }
        
        if (!$form.length) {
            // Last resort - find any variations form that might be related
            $form = $('.variations_form:visible').first();
        }
        
        log('Variations form found:', $form.length ? true : false);
        return $form;
    }
    
    // Helper function to collect all variation attributes
    function collectVariationAttributes($form) {
        var variationData = {};
        var allSelected = true;
        
        log('Collecting variation attributes from form', $form);
        
        // First check if we have a variation_id input
        var variationId = $form.find('input[name="variation_id"]').val();
        log('Initial variation ID found:', variationId);
        
        // Try to find the selected attributes from all possible inputs
        $form.find('.variations select, .variations input[type="radio"]:checked, .variations input[type="hidden"], .variations .selected, [data-attribute_name]').each(function() {
            var $element = $(this);
            var attributeName = $element.attr('name') || $element.data('attribute_name');
            var attributeValue = $element.val() || $element.data('value');
            
            if (attributeName && attributeName.indexOf('attribute_') === 0) {
                if (!attributeValue) {
                    log('Missing value for attribute:', attributeName);
                    allSelected = false;
                } else {
                    variationData[attributeName] = attributeValue;
                    log('Found attribute:', attributeName, attributeValue);
                }
            }
        });
        
        // Handle radio button swatches specifically
        $form.find('.woo-variation-raw-select').each(function() {
            var $select = $(this);
            var attributeName = $select.attr('name');
            
            if (attributeName && attributeName.indexOf('attribute_') === 0) {
                // Find the corresponding selected swatch
                var $selectedSwatch = $form.find('[data-attribute_name="' + attributeName + '"] .selected');
                
                if ($selectedSwatch.length) {
                    var selectedValue = $selectedSwatch.data('value');
                    if (selectedValue) {
                        variationData[attributeName] = selectedValue;
                        log('Found swatch attribute:', attributeName, selectedValue);
                    } else {
                        allSelected = false;
                        log('Missing value for swatch attribute:', attributeName);
                    }
                }
            }
        });
        
        // Check for any custom variation selectors that might be used by the theme
        $form.find('[class*="variation"], [class*="attribute"]').each(function() {
            var $element = $(this);
            
            // Only process elements that might be selection indicators
            if ($element.hasClass('selected') || $element.prop('checked') || $element.prop('selected')) {
                var possibleName = $element.data('attribute') || $element.data('name') || $element.attr('name');
                var possibleValue = $element.data('value') || $element.val();
                
                if (possibleName && possibleValue && possibleName.indexOf('attribute_') === 0) {
                    variationData[possibleName] = possibleValue;
                    log('Found custom attribute:', possibleName, possibleValue);
                }
            }
        });
        
        return {
            attributes: variationData,
            complete: allSelected,
            variationId: variationId
        };
    }
    
    // Helper function to handle the add to cart process
    function processAddToCart($form, variationData) {
        var productId = $form.find('input[name="product_id"]').val() || $form.data('product_id');
        var quantity = $form.find('input[name="quantity"]').val() || 1;
        
        log('Processing add to cart with data:', {
            product_id: productId,
            variation_id: variationData.variationId,
            quantity: quantity,
            attributes: variationData.attributes
        });
        
        if (!productId) {
            log('ERROR: Product ID not found');
            return false;
        }
        
        if (!variationData.variationId) {
            log('ERROR: Variation ID not found');
            return false;
        }
        
        // Prepare data for AJAX request
        var requestData = {
            product_id: productId,
            variation_id: variationData.variationId,
            quantity: quantity
        };
        
        // Add all variation attributes to the request
        $.each(variationData.attributes, function(name, value) {
            requestData[name] = value;
        });
        
        log('Sending add to cart request with data:', requestData);
        
        // Add to cart via AJAX
        $.ajax({
            type: 'POST',
            url: wc_add_to_cart_params.wc_ajax_url.toString().replace('%%endpoint%%', 'add_to_cart'),
            data: requestData,
            success: function(response) {
                log('Add to cart response:', response);
                
                if (response.error) {
                    // Show error message
                    log('ERROR:', response.error);
                    
                    if ($form.find('.woocommerce-variation-notice').length) {
                        $form.find('.woocommerce-variation-notice').html(response.error);
                        $form.find('.woocommerce-variation').show();
                    } else {
                        $form.prepend('<div class="woocommerce-error">' + response.error + '</div>');
                    }
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
                        var $popup = $form.closest('.upsell-popup, .wcuf-popup, .popup-content, .modal-content');
                        var $closeButton = $popup.find('.close, .dismiss, .cancel, [class*="close"], [aria-label*="Close"]');
                        
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
        
        return true;
    }
    
    // Monitor all potential add to cart buttons in upsell popups
    $(document).on('click', '.upsell-popup .single_add_to_cart_button, .wcuf-popup .single_add_to_cart_button, [class*="upsell"] .single_add_to_cart_button, .upsell-popup button[type="submit"], .wcuf-popup button[type="submit"]', function(e) {
        log('Add to cart button clicked', this);
        
        var $button = $(this);
        var $form = findVariationsForm(this);
        
        if ($form.length) {
            e.preventDefault();
            e.stopPropagation();
            
            log('Found form, collecting variation data');
            var variationData = collectVariationAttributes($form);
            
            if (variationData.complete && variationData.variationId) {
                log('All variations selected, processing add to cart');
                processAddToCart($form, variationData);
            } else {
                log('Not all variations selected');
                
                // Try to get the error message from WooCommerce
                var errorMessage = '';
                if (typeof wc_add_to_cart_variation_params !== 'undefined') {
                    errorMessage = wc_add_to_cart_variation_params.i18n_make_a_selection_text;
                } else {
                    errorMessage = 'Please select all product options before adding to cart.';
                }
                
                alert(errorMessage);
            }
        } else {
            log('No variations form found, letting default behavior proceed');
        }
    });
    
    // Monitor variation selection to update the variation ID
    $(document).on('found_variation', '.variations_form', function(event, variation) {
        var $form = $(this);
        
        log('Variation found event triggered', variation);
        
        if (variation && variation.variation_id) {
            log('Setting variation ID to:', variation.variation_id);
            $form.find('input[name="variation_id"]').val(variation.variation_id);
            
            // Make sure add to cart button is enabled
            $form.find('.single_add_to_cart_button').removeClass('disabled wc-variation-selection-needed');
        }
    });
    
    // Handle clicks on variation swatches in upsell popups
    $(document).on('click', '.upsell-popup .variable-item, .wcuf-popup .variable-item', function() {
        var $item = $(this);
        log('Swatch clicked:', $item);
        
        var $wrapper = $item.closest('.variable-items-wrapper');
        var $select = $wrapper.siblings('select.woo-variation-raw-select');
        
        if ($select.length) {
            var value = $item.data('value');
            log('Updating select value to:', value);
            
            $select.val(value).trigger('change');
            
            // Add selected class
            $wrapper.find('.selected').removeClass('selected');
            $item.addClass('selected');
        }
    });
    
    // Debug helper - log all variation changes
    $(document).on('change', '.variations select, .variations input[type="radio"], .variations input[type="hidden"]', function() {
        var $input = $(this);
        log('Variation input changed:', $input.attr('name'), $input.val());
    });
    
    // Debug helper - log all form submissions
    $(document).on('submit', 'form.variations_form', function(e) {
        var $form = $(this);
        log('Form submission detected', $form);
        
        // Only intercept if in an upsell popup
        if ($form.closest('.upsell-popup, .wcuf-popup, .popup-content, .modal-content').length) {
            e.preventDefault();
            log('Prevented form submission in popup');
            
            var variationData = collectVariationAttributes($form);
            
            if (variationData.complete && variationData.variationId) {
                processAddToCart($form, variationData);
            } else {
                alert('Please select all product options before adding to cart.');
            }
        } else {
            log('Regular form submission, not intercepting');
        }
    });
    
    log('All event handlers registered');
});

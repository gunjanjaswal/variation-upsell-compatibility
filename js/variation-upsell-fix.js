/**
 * Variation Upsell Fix - Compatibility between WooCommerce Variation Swatches Pro and Checkout Upsell Funnel
 * 
 * This script fixes the compatibility issue between the WooCommerce Variation Swatches Pro plugin
 * and the WooCommerce Checkout Upsell Funnel plugin, allowing variation products to be added to cart
 * from upsell popups.
 */
jQuery(document).ready(function($) {
    // Fix for variation selection in upsell popups
    $(document).on('click', '.wvs-pro-upsell-add-to-cart', function(e) {
        e.preventDefault();
        
        // Find the form within the upsell popup
        var $form = $(this).closest('form.variations_form');
        if (!$form.length) {
            $form = $(this).closest('.upsell-popup').find('form.variations_form');
        }
        
        if ($form.length) {
            // Collect all selected variation attributes
            var variationData = {};
            var allSelected = true;
            
            $form.find('.variations select, .variations input[type="radio"]:checked, .variations input[type="hidden"], .variations .wvs-selected').each(function() {
                var attributeName = $(this).attr('name');
                var attributeValue = $(this).val();
                
                if (attributeName && attributeName.indexOf('attribute_') === 0) {
                    if (!attributeValue) {
                        allSelected = false;
                        return false;
                    }
                    variationData[attributeName] = attributeValue;
                }
            });
            
            // Handle radio button swatches specifically
            $form.find('.woo-variation-raw-select').each(function() {
                var attributeName = $(this).attr('name');
                var selectedValue = '';
                
                // Find the corresponding selected swatch
                var attributeId = $(this).attr('id');
                var $selectedSwatch = $form.find('[data-attribute_name="' + attributeName + '"] .selected');
                
                if ($selectedSwatch.length) {
                    selectedValue = $selectedSwatch.attr('data-value');
                    variationData[attributeName] = selectedValue;
                } else {
                    allSelected = false;
                }
            });
            
            // Get variation ID
            var variationId = $form.find('input[name="variation_id"]').val();
            
            // If all variations are selected and we have a variation ID
            if (allSelected && variationId) {
                // Add to cart via AJAX
                $.ajax({
                    type: 'POST',
                    url: wc_add_to_cart_params.wc_ajax_url.toString().replace('%%endpoint%%', 'add_to_cart'),
                    data: {
                        product_id: $form.find('input[name="product_id"]').val(),
                        variation_id: variationId,
                        quantity: $form.find('input[name="quantity"]').val() || 1,
                        ...variationData
                    },
                    success: function(response) {
                        if (response.error) {
                            // Show error message
                            if ($form.find('.woocommerce-variation-notice').length) {
                                $form.find('.woocommerce-variation-notice').html(response.error);
                                $form.find('.woocommerce-variation').show();
                            } else {
                                $form.prepend('<div class="woocommerce-error">' + response.error + '</div>');
                            }
                        } else {
                            // Success - refresh fragments and close popup
                            if (response.fragments) {
                                $.each(response.fragments, function(key, value) {
                                    $(key).replaceWith(value);
                                });
                            }
                            
                            // Close popup if there's a close button
                            setTimeout(function() {
                                if ($('.upsell-popup .close').length) {
                                    $('.upsell-popup .close').trigger('click');
                                }
                                
                                // Trigger event for other scripts
                                $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash]);
                            }, 500);
                        }
                    }
                });
            } else {
                // Not all variations selected, show error
                alert(wc_add_to_cart_variation_params.i18n_make_a_selection_text);
            }
        }
    });
    
    // Fix for radio button swatches in upsell popups
    $(document).on('show_variation', '.variations_form', function(event, variation) {
        var $form = $(this);
        
        // If this form is in an upsell popup
        if ($form.closest('.upsell-popup').length) {
            // Store the selected variation ID
            $form.find('input[name="variation_id"]').val(variation.variation_id);
            
            // Make sure add to cart button is enabled
            $form.find('.single_add_to_cart_button').removeClass('disabled wc-variation-selection-needed');
        }
    });
    
    // Handle radio button selection in upsell popups
    $(document).on('click', '.upsell-popup .variable-item:not(.radio-variable-item)', function() {
        var $this = $(this);
        var value = $this.data('value');
        var $select = $this.closest('.variable-items-wrapper').siblings('select.woo-variation-raw-select');
        
        // Update the select value
        if ($select.length) {
            $select.val(value).trigger('change');
        }
        
        // Add selected class
        $this.siblings('.selected').removeClass('selected');
        $this.addClass('selected');
    });
    
    // Handle radio button selection
    $(document).on('click', '.upsell-popup .radio-variable-item', function() {
        var $this = $(this);
        var $radioButton = $this.find('input[type="radio"]');
        
        if ($radioButton.length) {
            $radioButton.prop('checked', true).trigger('change');
        }
        
        // Add selected class
        $this.siblings('.selected').removeClass('selected');
        $this.addClass('selected');
    });
});

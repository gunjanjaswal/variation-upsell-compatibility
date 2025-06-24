/**
 * Debug Console for Variation Upsell Compatibility
 * 
 * This script adds extensive console debugging to help identify issues with
 * variation selection and add-to-cart functionality in upsell popups.
 */
jQuery(document).ready(function($) {
    console.log('🔍 Debug Console loaded for Variation Upsell Compatibility');
    
    // Create a custom console logger
    window.VariationDebug = {
        log: function(message, data) {
            console.log('%c🔍 DEBUG: ' + message, 'background: #f0f0f0; color: #333; padding: 3px 5px; border-radius: 3px; font-weight: bold;', data || '');
        },
        warn: function(message, data) {
            console.warn('%c⚠️ WARNING: ' + message, 'background: #fff3cd; color: #856404; padding: 3px 5px; border-radius: 3px; font-weight: bold;', data || '');
        },
        error: function(message, data) {
            console.error('%c❌ ERROR: ' + message, 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px; font-weight: bold;', data || '');
        },
        success: function(message, data) {
            console.log('%c✅ SUCCESS: ' + message, 'background: #d4edda; color: #155724; padding: 3px 5px; border-radius: 3px; font-weight: bold;', data || '');
        },
        info: function(message, data) {
            console.info('%cℹ️ INFO: ' + message, 'background: #d1ecf1; color: #0c5460; padding: 3px 5px; border-radius: 3px; font-weight: bold;', data || '');
        }
    };
    
    // Track all click events on the page
    $(document).on('click', '*', function(e) {
        var $el = $(this);
        var classes = $el.attr('class') || '';
        var id = $el.attr('id') || '';
        
        // Only log clicks on relevant elements
        if (classes.includes('variable-item') || 
            classes.includes('variation') || 
            classes.includes('add-to-cart') || 
            classes.includes('vi-wcuf') ||
            id.includes('variation') ||
            $el.is('input[type="radio"]')) {
            
            window.VariationDebug.info('Element clicked', {
                element: this,
                tagName: this.tagName,
                id: id,
                classes: classes,
                value: $el.val(),
                dataAttributes: getDataAttributes($el)
            });
        }
    });
    
    // Helper function to get all data attributes
    function getDataAttributes($el) {
        var data = {};
        $.each($el[0].attributes, function() {
            if (this.name.startsWith('data-')) {
                var key = this.name.replace('data-', '');
                data[key] = this.value;
            }
        });
        return data;
    }
    
    // Monitor all form submissions
    $(document).on('submit', 'form', function(e) {
        var $form = $(this);
        var formData = {};
        
        // Get all form inputs
        $form.find('input, select, textarea').each(function() {
            var $input = $(this);
            var name = $input.attr('name');
            var value = $input.val();
            
            if (name) {
                formData[name] = value;
            }
        });
        
        window.VariationDebug.info('Form submitted', {
            form: this,
            action: $form.attr('action'),
            method: $form.attr('method'),
            formData: formData
        });
    });
    
    // Monitor AJAX requests
    var originalAjax = $.ajax;
    $.ajax = function(options) {
        if (options.url && (
            options.url.includes('add_to_cart') || 
            options.url.includes('wc-ajax') || 
            options.url.includes('variation'))) {
            
            window.VariationDebug.info('AJAX request', {
                url: options.url,
                type: options.type,
                data: options.data
            });
            
            // Add success and error callbacks to log responses
            var originalSuccess = options.success;
            options.success = function(response) {
                window.VariationDebug.success('AJAX success', {
                    url: options.url,
                    response: response
                });
                
                if (originalSuccess) {
                    originalSuccess.apply(this, arguments);
                }
            };
            
            var originalError = options.error;
            options.error = function(xhr, status, error) {
                window.VariationDebug.error('AJAX error', {
                    url: options.url,
                    status: status,
                    error: error,
                    response: xhr.responseText
                });
                
                if (originalError) {
                    originalError.apply(this, arguments);
                }
            };
        }
        
        return originalAjax.apply(this, arguments);
    };
    
    // Monitor variation selection in VI WCUF popups
    function monitorViWcufPopups() {
        // Check if there are any VI WCUF popups
        var $popups = $('.vi-wcuf-swatches-control-wrap-wrap');
        
        if ($popups.length) {
            window.VariationDebug.info('Found VI WCUF popups', {
                count: $popups.length,
                popups: $popups
            });
            
            // Monitor radio button changes
            $(document).on('change', '.vi-wcuf-swatches-wrap input[type="radio"]', function() {
                var $radio = $(this);
                window.VariationDebug.info('Radio button changed', {
                    radio: $radio,
                    name: $radio.attr('name'),
                    value: $radio.val(),
                    dataValue: $radio.data('value'),
                    checked: $radio.prop('checked')
                });
            });
            
            // Monitor select changes
            $(document).on('change', '.vi-wcuf-swatches-wrap select', function() {
                var $select = $(this);
                window.VariationDebug.info('Select changed', {
                    select: $select,
                    name: $select.attr('name'),
                    value: $select.val(),
                    options: $select.find('option').map(function() {
                        return {
                            value: $(this).val(),
                            text: $(this).text()
                        };
                    }).get()
                });
            });
            
            // Monitor add to cart button
            $(document).on('click', '.vi-wcuf-swatches-control-footer-bt-ok', function() {
                var $button = $(this);
                window.VariationDebug.info('Add to cart button clicked', {
                    button: $button,
                    text: $button.text(),
                    selectedRadios: $('.vi-wcuf-swatches-wrap input[type="radio"]:checked').map(function() {
                        return {
                            name: $(this).attr('name'),
                            value: $(this).val(),
                            dataValue: $(this).data('value')
                        };
                    }).get(),
                    selectedSelects: $('.vi-wcuf-swatches-wrap select').map(function() {
                        return {
                            name: $(this).attr('name'),
                            value: $(this).val()
                        };
                    }).get()
                });
            });
        }
    }
    
    // Create a global helper function to diagnose the current state
    window.diagnoseVariationSelection = function() {
        // Check for VI WCUF popups
        var $popups = $('.vi-wcuf-swatches-control-wrap-wrap');
        if ($popups.length) {
            window.VariationDebug.info('VI WCUF popups found', {
                count: $popups.length
            });
            
            $popups.each(function(index) {
                var $popup = $(this);
                
                // Check for radio buttons
                var $radios = $popup.find('input[type="radio"]');
                var checkedRadios = $radios.filter(':checked').length;
                
                window.VariationDebug.info('Popup #' + (index + 1) + ' radio buttons', {
                    total: $radios.length,
                    checked: checkedRadios,
                    checkedDetails: $radios.filter(':checked').map(function() {
                        return {
                            name: $(this).attr('name'),
                            value: $(this).val(),
                            dataValue: $(this).data('value')
                        };
                    }).get()
                });
                
                // Check for selects
                var $selects = $popup.find('select');
                window.VariationDebug.info('Popup #' + (index + 1) + ' selects', {
                    total: $selects.length,
                    withValues: $selects.filter(function() {
                        return $(this).val() !== '';
                    }).length,
                    selectDetails: $selects.map(function() {
                        return {
                            name: $(this).attr('name'),
                            value: $(this).val()
                        };
                    }).get()
                });
                
                // Check for variation ID
                var variationId = $popup.find('input[name="variation_id"]').val();
                window.VariationDebug.info('Popup #' + (index + 1) + ' variation ID', {
                    variationId: variationId || 'Not found'
                });
                
                // Check for add to cart button
                var $addToCartBtn = $popup.find('.vi-wcuf-swatches-control-footer-bt-ok');
                window.VariationDebug.info('Popup #' + (index + 1) + ' add to cart button', {
                    exists: $addToCartBtn.length > 0,
                    text: $addToCartBtn.text()
                });
            });
        } else {
            window.VariationDebug.warn('No VI WCUF popups found');
        }
        
        // Check for WooCommerce variation forms
        var $variationForms = $('.variations_form');
        if ($variationForms.length) {
            window.VariationDebug.info('WooCommerce variation forms found', {
                count: $variationForms.length
            });
            
            $variationForms.each(function(index) {
                var $form = $(this);
                var formData = $form.data();
                
                window.VariationDebug.info('Variation form #' + (index + 1) + ' data', {
                    productId: formData.product_id || 'Not found',
                    variationId: $form.find('input[name="variation_id"]').val() || 'Not found',
                    attributes: $form.find('[name^="attribute_"]').map(function() {
                        return {
                            name: $(this).attr('name'),
                            value: $(this).val()
                        };
                    }).get(),
                    variations: formData.product_variations || 'Not found'
                });
            });
        } else {
            window.VariationDebug.warn('No WooCommerce variation forms found');
        }
        
        return 'Diagnosis complete. Check browser console for details.';
    };
    
    // Run initial monitoring
    monitorViWcufPopups();
    
    // Add a special helper function to manually trigger add to cart
    window.manualAddToCartWithVariation = function() {
        // Find the selected radio button
        var $selectedRadio = $('.vi-wcuf-swatches-wrap input[type="radio"]:checked');
        if (!$selectedRadio.length) {
            window.VariationDebug.error('No radio button selected');
            return false;
        }
        
        // Find the product ID
        var productId = $('.viwcuf_us_product_id').val();
        if (!productId) {
            // Try to get from URL
            var urlParams = new URLSearchParams(window.location.search);
            productId = urlParams.get('add-to-cart');
        }
        
        if (!productId) {
            window.VariationDebug.error('Could not find product ID');
            return false;
        }
        
        // Get the attribute name and value
        var $ul = $selectedRadio.closest('ul');
        var attributeName = $ul.data('attribute_name');
        var attributeValue = $selectedRadio.data('value');
        
        if (!attributeName || !attributeValue) {
            window.VariationDebug.error('Could not find attribute name or value');
            return false;
        }
        
        // Prepare data for AJAX request
        var data = {
            action: 'woocommerce_add_to_cart',
            product_id: productId,
            quantity: 1
        };
        
        // Add the attribute
        data[attributeName] = attributeValue;
        
        window.VariationDebug.info('Manually adding to cart', data);
        
        // Send AJAX request
        $.ajax({
            type: 'POST',
            url: wc_add_to_cart_params.wc_ajax_url.toString().replace('%%endpoint%%', 'add_to_cart'),
            data: data,
            success: function(response) {
                window.VariationDebug.success('Manual add to cart success', response);
                
                if (response.error) {
                    alert(response.error);
                } else {
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
                window.VariationDebug.error('Manual add to cart error', {
                    status: status,
                    error: error,
                    response: xhr.responseText
                });
                alert('Error adding to cart');
            }
        });
        
        return true;
    };
    
    console.log('🔍 Debug Console initialized. Type window.diagnoseVariationSelection() to diagnose current state or window.manualAddToCartWithVariation() to manually trigger add to cart.');
});

/**
 * Diagnostic Script for WooCommerce Variation Upsell Issue
 * 
 * This script will help identify the exact structure of your upsell popup
 * and provide detailed information about the variation selection process.
 */
jQuery(document).ready(function($) {
    console.log('🔍 Diagnostic script loaded');
    
    // Function to dump the HTML structure of an element
    function dumpElementStructure(element, maxDepth = 3, currentDepth = 0) {
        if (!element || currentDepth > maxDepth) return {};
        
        var result = {
            tagName: element.tagName || 'TEXT',
            id: element.id || '',
            className: element.className || '',
            type: element.type || '',
            name: element.name || '',
            value: element.value || '',
            checked: element.checked,
            selected: element.selected,
            children: []
        };
        
        if (element.hasAttribute && element.hasAttribute('data-attribute_name')) {
            result.dataAttributeName = element.getAttribute('data-attribute_name');
        }
        
        if (element.hasAttribute && element.hasAttribute('data-value')) {
            result.dataValue = element.getAttribute('data-value');
        }
        
        if (element.childNodes && currentDepth < maxDepth) {
            for (var i = 0; i < element.childNodes.length; i++) {
                var childStructure = dumpElementStructure(element.childNodes[i], maxDepth, currentDepth + 1);
                if (Object.keys(childStructure).length > 0) {
                    result.children.push(childStructure);
                }
            }
        }
        
        return result;
    }
    
    // Function to log the structure of the upsell popup
    function logUpsellPopupStructure() {
        console.log('🔍 Searching for upsell popup...');
        
        var $popups = $('.upsell-popup, .wcuf-popup, [class*="upsell"], [class*="popup"], .modal, .modal-content');
        
        if ($popups.length) {
            console.log('🔍 Found ' + $popups.length + ' potential popups');
            
            $popups.each(function(index) {
                var $popup = $(this);
                console.log('🔍 Popup #' + (index + 1) + ' class: ' + $popup.attr('class'));
                console.log('🔍 Popup #' + (index + 1) + ' HTML:', $popup.html());
                
                // Check for variations form
                var $form = $popup.find('form.variations_form');
                if ($form.length) {
                    console.log('🔍 Found variations form in popup #' + (index + 1));
                    console.log('🔍 Form data:', $form.data());
                    
                    // Log variation inputs
                    var variationInputs = [];
                    $form.find('input[name="variation_id"]').each(function() {
                        variationInputs.push({
                            name: $(this).attr('name'),
                            value: $(this).val(),
                            type: $(this).attr('type')
                        });
                    });
                    console.log('🔍 Variation ID inputs:', variationInputs);
                    
                    // Log attribute selectors
                    var attributeSelectors = [];
                    $form.find('[name^="attribute_"], [data-attribute_name^="attribute_"]').each(function() {
                        attributeSelectors.push({
                            name: $(this).attr('name') || $(this).data('attribute_name'),
                            value: $(this).val() || $(this).data('value'),
                            type: $(this).prop('tagName'),
                            class: $(this).attr('class')
                        });
                    });
                    console.log('🔍 Attribute selectors:', attributeSelectors);
                    
                    // Log add to cart buttons
                    var addToCartButtons = [];
                    $popup.find('button[type="submit"], .single_add_to_cart_button, [class*="add-to-cart"]').each(function() {
                        addToCartButtons.push({
                            text: $(this).text(),
                            class: $(this).attr('class'),
                            disabled: $(this).prop('disabled'),
                            type: $(this).attr('type')
                        });
                    });
                    console.log('🔍 Add to cart buttons:', addToCartButtons);
                }
            });
        } else {
            console.log('🔍 No upsell popups found on the page');
        }
    }
    
    // Function to monitor variation selection
    function monitorVariationSelection() {
        $(document).on('click', '.variable-item, [class*="variation"], [class*="attribute"], input[type="radio"]', function() {
            var $element = $(this);
            console.log('🔍 Variation element clicked:', {
                element: $element.prop('tagName'),
                class: $element.attr('class'),
                dataAttributeName: $element.data('attribute_name'),
                dataValue: $element.data('value'),
                name: $element.attr('name'),
                value: $element.val(),
                checked: $element.prop('checked'),
                selected: $element.hasClass('selected')
            });
            
            // Check if this is inside a popup
            var $popup = $element.closest('.upsell-popup, .wcuf-popup, [class*="upsell"], [class*="popup"], .modal, .modal-content');
            if ($popup.length) {
                console.log('🔍 Selection is inside a popup');
                
                // Check the form state after a short delay
                setTimeout(function() {
                    var $form = $popup.find('form.variations_form');
                    if ($form.length) {
                        console.log('🔍 Form state after selection:', {
                            variationId: $form.find('input[name="variation_id"]').val(),
                            isValid: !$form.find('.single_add_to_cart_button').hasClass('disabled')
                        });
                    }
                }, 500);
            }
        });
        
        // Monitor form submissions
        $(document).on('submit', 'form.variations_form', function(e) {
            var $form = $(this);
            console.log('🔍 Form submission detected:', {
                formAction: $form.attr('action'),
                formMethod: $form.attr('method'),
                formData: $form.serialize()
            });
            
            // Check if this is inside a popup
            var $popup = $form.closest('.upsell-popup, .wcuf-popup, [class*="upsell"], [class*="popup"], .modal, .modal-content');
            if ($popup.length) {
                console.log('🔍 Form submission is inside a popup');
            }
        });
        
        // Monitor add to cart clicks
        $(document).on('click', '.single_add_to_cart_button, button[type="submit"], [class*="add-to-cart"]', function(e) {
            var $button = $(this);
            console.log('🔍 Add to cart button clicked:', {
                buttonText: $button.text(),
                buttonClass: $button.attr('class'),
                buttonType: $button.attr('type'),
                buttonDisabled: $button.prop('disabled')
            });
            
            // Check if this is inside a popup
            var $popup = $button.closest('.upsell-popup, .wcuf-popup, [class*="upsell"], [class*="popup"], .modal, .modal-content');
            if ($popup.length) {
                console.log('🔍 Button click is inside a popup');
                
                // Find the form
                var $form = $popup.find('form.variations_form');
                if ($form.length) {
                    console.log('🔍 Found form in popup, state:', {
                        variationId: $form.find('input[name="variation_id"]').val(),
                        productId: $form.find('input[name="product_id"]').val(),
                        isValid: !$button.hasClass('disabled')
                    });
                    
                    // Log all inputs
                    var formInputs = {};
                    $form.find('input, select').each(function() {
                        var $input = $(this);
                        var name = $input.attr('name');
                        if (name) {
                            formInputs[name] = $input.val();
                        }
                    });
                    console.log('🔍 Form inputs:', formInputs);
                }
            }
        });
    }
    
    // Run diagnostic when page loads
    $(window).on('load', function() {
        console.log('🔍 Page loaded, running initial diagnostics...');
        logUpsellPopupStructure();
    });
    
    // Run diagnostic when upsell popup might appear
    $(document).on('click', '.add_to_cart_button, [class*="add-to-cart"]', function() {
        console.log('🔍 Add to cart clicked, checking for popup in 1 second...');
        setTimeout(logUpsellPopupStructure, 1000);
    });
    
    // Start monitoring variation selection
    monitorVariationSelection();
    
    // Create a global function that can be called from the console
    window.runUpsellDiagnostic = function() {
        console.log('🔍 Manual diagnostic triggered');
        logUpsellPopupStructure();
    };
    
    console.log('🔍 Diagnostic script ready. You can manually trigger diagnostics by running window.runUpsellDiagnostic() in the console.');
});

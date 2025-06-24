/* Direct Fix - Completely Standalone Implementation */
window.fixUpsellVariations = function() {
    console.log("🔧 Direct fix triggered");
    
    // Make sure jQuery is available
    if (typeof jQuery === "undefined") {
        console.error("🔧 jQuery not found");
        return false;
    }
    
    var $ = jQuery;
    
    // Find all upsell popups
    var $popups = $(".vi-wcuf-swatches-control-wrap-wrap");
    console.log("🔧 Found " + $popups.length + " upsell popups");
    
    if ($popups.length === 0) {
        console.log("🔧 No upsell popups found");
        return false;
    }
    
    // Process each popup
    $popups.each(function(index) {
        var $popup = $(this);
        console.log("🔧 Processing popup #" + (index + 1));
        
        // 1. Find all radio buttons (variation swatches)
        var $radios = $popup.find("input[type='radio']");
        console.log("🔧 Found " + $radios.length + " radio buttons");
        
        // 2. Make sure at least one radio is selected in each attribute group
        var $radioGroups = {};
        
        $radios.each(function() {
            var name = $(this).attr("name");
            if (!$radioGroups[name]) {
                $radioGroups[name] = [];
            }
            $radioGroups[name].push($(this));
        });
        
        // Select first radio in each group if none is selected
        $.each($radioGroups, function(name, radios) {
            var anyChecked = false;
            
            for (var i = 0; i < radios.length; i++) {
                if (radios[i].is(":checked")) {
                    anyChecked = true;
                    break;
                }
            }
            
            if (!anyChecked && radios.length > 0) {
                radios[0].prop("checked", true).trigger("click");
                console.log("🔧 Selected first radio in group: " + name);
            }
        });
        
        // 3. Find the add to cart button
        var $addToCartBtn = $popup.find(".vi-wcuf-swatches-control-footer-bt-ok");
        
        if ($addToCartBtn.length) {
            // 4. Get product ID and variation ID
            var productId = $popup.find("input[name='add-to-cart']").val();
            var variationId = $popup.find("input[name='variation_id']").val();
            
            if (!productId) {
                productId = $popup.find("[data-product_id]").data("product_id");
            }
            
            console.log("🔧 Product ID: " + productId + ", Variation ID: " + variationId);
            
            // 5. Collect all selected attributes
            var attributes = {};
            
            // From radio buttons
            $popup.find("input[type='radio']:checked").each(function() {
                var $radio = $(this);
                var name = $radio.attr("name");
                
                if (name && name.indexOf("attribute_") === -1) {
                    // This is likely a WooCommerce Variation Swatches radio button
                    // Find the corresponding select element
                    var attributeName = $radio.closest("ul").data("attribute_name");
                    if (attributeName) {
                        attributes[attributeName] = $radio.data("value");
                        console.log("🔧 Found attribute from radio: " + attributeName + " = " + $radio.data("value"));
                    }
                } else if (name && name.indexOf("attribute_") === 0) {
                    // This is a standard WooCommerce attribute radio
                    attributes[name] = $radio.val();
                    console.log("🔧 Found attribute from radio: " + name + " = " + $radio.val());
                }
            });
            
            // From select dropdowns
            $popup.find("select[name^='attribute_']").each(function() {
                var $select = $(this);
                var name = $select.attr("name");
                var value = $select.val();
                
                if (name && value && value !== "") {
                    attributes[name] = value;
                    console.log("🔧 Found attribute from select: " + name + " = " + value);
                }
            });
            
            // 6. If we have product ID and attributes, perform direct AJAX add to cart
            if (productId) {
                console.log("🔧 Attempting direct AJAX add to cart");
                
                // Prepare data
                var data = {
                    action: "woocommerce_add_to_cart",
                    product_id: productId,
                    quantity: 1
                };
                
                // Add variation ID if available
                if (variationId) {
                    data.variation_id = variationId;
                }
                
                // Add attributes
                $.each(attributes, function(name, value) {
                    data[name] = value;
                });
                
                console.log("🔧 AJAX request data:", data);
                
                // Send AJAX request
                $.ajax({
                    type: "POST",
                    url: wc_add_to_cart_params.wc_ajax_url.toString().replace("%%endpoint%%", "add_to_cart"),
                    data: data,
                    success: function(response) {
                        console.log("🔧 AJAX response:", response);
                        
                        if (response.error) {
                            console.error("🔧 Error:", response.error);
                            alert(response.error);
                        } else {
                            console.log("🔧 Product successfully added to cart");
                            
                            // Update fragments
                            if (response.fragments) {
                                $.each(response.fragments, function(key, value) {
                                    $(key).replaceWith(value);
                                });
                            }
                            
                            // Close popup
                            setTimeout(function() {
                                $(".vi-wcuf-popup-close").trigger("click");
                                $(document.body).trigger("added_to_cart", [response.fragments, response.cart_hash]);
                            }, 300);
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error("🔧 AJAX Error:", error);
                        console.error("🔧 Response:", xhr.responseText);
                    }
                });
                
                return false; // Only process the first popup
            } else {
                // If direct AJAX doesn't work, try clicking the button
                console.log("🔧 Falling back to button click");
                $addToCartBtn.trigger("click");
            }
        } else {
            console.log("🔧 No add to cart button found in popup #" + (index + 1));
        }
    });
    
    return true;
};

// Also create a simpler alias
window.fixVariations = window.fixUpsellVariations;

console.log("🔧 Global fixUpsellVariations function is now available");

// Set up automatic detection and fixing when the page loads
jQuery(document).ready(function($) {
    // Check if we are on checkout page
    if ($("body").hasClass("woocommerce-checkout") || 
        window.location.href.indexOf("checkout") > -1 || 
        $(".woocommerce-checkout").length > 0) {
        
        console.log("🔧 Checkout page detected, setting up automatic fix");
        
        // Set up click handler for all upsell add to cart buttons
        $(document).on("click", ".vi-wcuf-swatches-control-footer-bt-ok", function(e) {
            console.log("🔧 Add to cart button clicked, running fix");
            e.preventDefault();
            e.stopPropagation();
            
            // Run our direct fix
            window.fixUpsellVariations();
            
            return false;
        });
    }
});
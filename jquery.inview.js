/*jslint es5:true, white:false */
/*globals jQuery, window */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

(function ($, W) {
    var inviewObjects = {},
        viewSize, viewOffset, D, DE, expando, timer;

    D = W.document;
    DE = D.documentElement;
    expando = $.expando;

    function getPortSize() {
        var mode, domObject, size = {
            height: W.innerHeight,
            width: W.innerWidth
        };

        // if this is correct then return it.
        // iPad has compat Mode, so will go into check clientHeight/clientWidth
        // (which has the wrong value).
        if (!size.height) {
            mode = D.compatMode;
            if (mode || !$.support.boxModel) { // IE, Gecko
                domObject = mode === 'CSS1Compat' ? DE : // Standards
                D.body; // Quirks
                size = {
                    height: domObject.clientHeight,
                    width: domObject.clientWidth
                };
            }
        }

        return size;
    }

    function getPortOffset() { // TODO
        // body.scrollLeft is deprecated in strict mode.
        // Please use 'documentElement.scrollLeft' if in strict mode
        // and 'body.scrollLeft' only if in quirks mode.
        return {
            top: W.pageYOffset || DE.scrollTop || D.body.scrollTop,
            left: W.pageXOffset || DE.scrollLeft || D.body.scrollLeft
        };
    }

    function checkInView() {
        var $eles = $();

        $.each(inviewObjects, function (i, inviewObject) {
            var selector = inviewObject.data.selector,
                $ele = inviewObject.$ele;
            $eles = $eles.add(selector ? $ele.find(selector) : $ele);
        });

        if ($eles.length) {
            viewSize = viewSize || getPortSize();
            viewOffset = viewOffset || getPortOffset();

            $eles.each(function (i, e) {
                var $ele, eleSize, eleOffset, inView, visiPartX, visiPartY, visiPartsMerged;

                // Ignore elements that are not in the DOM tree
                if (!$.contains(DE, $eles[i])) {
                    return;
                }

                $ele = $($eles[i]);
                eleSize = {
                    height: $ele.height(),
                    width: $ele.width(),
                };
                eleOffset = $ele.offset();
                inView = $ele.data('inview');

                /*
                For unknown reasons:
                    viewportOffset and viewportSize are sometimes suddenly null in Firefox 5.
                    It seems that the execution of this function is interferred
                        by the onresize/onscroll event where viewportOffset and viewportSize are unset
                */
                if (!viewOffset || !viewSize) {
                    return;
                }

                if (eleOffset.top + eleSize.height > viewOffset.top && //
                eleOffset.top < viewOffset.top + viewSize.height && //
                eleOffset.left + eleSize.width > viewOffset.left && //
                eleOffset.left < viewOffset.left + viewSize.width) {
                    visiPartX = (viewOffset.left > eleOffset.left ? //
                    'right' : (viewOffset.left + viewSize.width) < (eleOffset.left + eleSize.width) ? //
                    'left' : 'both');
                    visiPartY = (viewOffset.top > eleOffset.top ? //
                    'bottom' : (viewOffset.top + viewSize.height) < (eleOffset.top + eleSize.height) ? //
                    'top' : 'both');
                    visiPartsMerged = visiPartX + "-" + visiPartY;
                    if (!inView || inView !== visiPartsMerged) {
                        $ele.data('inview', visiPartsMerged).trigger('inview', [true, visiPartX, visiPartY]);
                    }
                } else if (inView) {
                    $ele.data('inview', false).trigger('inview', [false]);
                }
            });
        }
    }

    $.event.special.inview = {
        add: function (data) {
            inviewObjects[data.guid + "-" + this[expando]] = {
                data: data,
                $ele: $(this)
            };

            /*
            Use setInterval to ensure this captures elements within "overflow:scroll" elements
            or elements that appeared in the dom tree due to dom manipulation and reflow
            old: $(window).scroll(checkInView);

            BTW, iOS seems to not execute (or delay) intervals while the user scrolls.
            Therefore the inview event might fire a bit late there

            Don't set interval until we get at least one element that has bound to the inview event.
            */
            if (!timer && !$.isEmptyObject(inviewObjects)) {
                timer = setInterval(checkInView, 250);
            }
        },

        remove: function (data) {
            try {
                delete inviewObjects[data.guid + "-" + this[expando]];
            } catch (e) {}

            // Clear interval when we no longer have any elements listening
            if ($.isEmptyObject(inviewObjects)) {
                clearInterval(timer);
                timer = null;
            }
        }
    };

    $(W).bind("scroll resize", function () {
        viewSize = viewOffset = null;
    });

    // IE < 9 scrolls to focused elements without firing the "scroll" event
    if (!DE.addEventListener && DE.attachEvent) {
        DE.attachEvent("onfocusin", function () {
            viewOffset = null;
        });
    }
}(jQuery, window));
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

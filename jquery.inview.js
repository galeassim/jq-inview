/*jslint es5:true, white:false */
/*globals jQuery, window */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

(function ($, W) {
    var name = 'inview',
        inviewObjects = {},
        viewSize, viewOffset, D, DE, expando, port, propL, propT, timer;

    D = W.document;
    DE = D.documentElement;
    expando = $.expando;
    propL = 'scrollLeft';
    propT = 'scrollTop';

    function _def() {
        return (typeof arguments[0] !== 'undefined');
    }

    if (_def(W.pageXOffset)) {
        port = W;
        propL = 'pageXOffset';
        propT = 'pageYOffset';
    } else if (_def(DE.scrollLeft)) {
        port = DE;
    } else {
        port = D.body;
    }
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

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

    function getPortOffset() {
        return {
            left: port[propL],
            top: port[propT],
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
                inView = $ele.data(name);

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
                        $ele.data(name, visiPartsMerged).trigger(name, [true, visiPartX, visiPartY]);
                    }
                } else if (inView) {
                    $ele.data(name, false).trigger(name, [false]);
                }
            });
        }
    }

    $.event.special[name] = {
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

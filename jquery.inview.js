/*jslint es5:true, white:false */
/*globals jQuery, window */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

(function (W, $) {
    var name = 'inview',
        inviewObjects = {},
        vSiz, vOff, D, DE, vPort, speed, timer, xProp, yProp;

    D = W.document;
    DE = D.documentElement;
    speed = 222;
    xProp = 'scrollLeft';
    yProp = 'scrollTop';

    function _def() {
        return (typeof arguments[0] !== 'undefined');
    }

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
    (function configPort() {
        if (_def(W.pageXOffset)) {
            vPort = W;
            xProp = 'pageXOffset';
            yProp = 'pageYOffset';
        } else if (_def(DE.scrollLeft)) {
            vPort = DE;
        } else {
            vPort = D.body;
        }
    }());

    function getPortOffset() {
        return {
            left: vPort[xProp],
            top: vPort[yProp],
        };
    }

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

    function checkInView() {
        var $eles = $();

        $.each(inviewObjects, function (i, inviewObject) {
            var selector = inviewObject.data.selector,
                $ele = inviewObject.$ele;
            $eles = $eles.add(selector ? $ele.find(selector) : $ele);
        });

        if ($eles.length) {
            vOff = vOff || getPortOffset();
            vSiz = vSiz || getPortSize();

            $eles.each(function (i, e) {
                var $ele, eSiz, eOff, inView, visiX, visiY, visiMerged;

                // Ignore elements that are not in the DOM tree
                if (!$.contains(DE, $eles[i])) {
                    return;
                }

                $ele = $($eles[i]);
                eSiz = {
                    height: $ele.height(),
                    width: $ele.width(),
                };
                eOff = $ele.offset();
                inView = $ele.data(name);

                /*
                For unknown reasons:
                    viewportOffset and viewportSize are sometimes suddenly null in Firefox 5.
                    It seems that the execution of this function is interferred
                        by the onresize/onscroll event where viewportOffset and viewportSize are unset
                */
                if (!vOff || !vSiz) {
                    return;
                }

                if (eOff.top + eSiz.height > vOff.top && //
                eOff.top < vOff.top + vSiz.height && //
                eOff.left + eSiz.width > vOff.left && //
                eOff.left < vOff.left + vSiz.width) {
                    visiX = (vOff.left > eOff.left ? //
                    'right' : (vOff.left + vSiz.width) < (eOff.left + eSiz.width) ? //
                    'left' : 'both');
                    visiY = (vOff.top > eOff.top ? //
                    'bottom' : (vOff.top + vSiz.height) < (eOff.top + eSiz.height) ? //
                    'top' : 'both');
                    visiMerged = visiX + "-" + visiY;
                    if (!inView || inView !== visiMerged) {
                        $ele.data(name, visiMerged).trigger(name, [true, visiX, visiY]);
                    }
                } else if (inView) {
                    $ele.data(name, false).trigger(name, [false]);
                }
            });
        }
    }

    $.event.special[name] = {
        add: function (data) {
            inviewObjects[data.guid + "-" + this[$.expando]] = {
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
                timer = W.setInterval(checkInView, speed);
            }
        },

        remove: function (data) {
            try {
                delete inviewObjects[data.guid + "-" + this[$.expando]];
            } catch (e) {}

            // Clear interval when we no longer have any elements listening
            if ($.isEmptyObject(inviewObjects)) {
                W.clearInterval(timer);
                timer = null;
            }
        }
    };

    $(W).bind("scroll resize", function () {
        vSiz = vOff = null;
    });

    // IE < 9 scrolls to focused elements without firing the "scroll" event
    if (!DE.addEventListener && DE.attachEvent) {
        DE.attachEvent("onfocusin", function () {
            vOff = null;
        });
    }
}(window, jQuery));
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

/*jslint es5:true, white:false */
/*globals jQuery, window */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

/* note #1 */
(function (W, $) {
    var C = W.console,
        D = W.document,
        time = 222,
        name = 'inview',
        inviewObjects = {},
        documentElement = D.documentElement,
        expando = $.expando,
        viewportSize, viewportOffset, X;

    $.event.special.inview = {
        add: function (data) {
            inviewObjects[data.guid + "-" + this[expando]] = {
                data: data,
                $element: $(this)
            };
        },
        remove: function (data) {
            try {
                delete inviewObjects[data.guid + "-" + this[expando]];
            } catch (e) {}
        }
    };

    function getViewportSize() {
        var mode, domObject, size;

        size = {
            height: W.innerHeight,
            width: W.innerWidth
        };

        // if this is correct then return it. iPad has compat Mode, so will
        // go into check clientHeight/clientWidth (which has the wrong value).
        if (!size.height) {
            mode = D.compatMode;
            if (mode || !$.support.boxModel) { // IE, Gecko
                domObject = mode === 'CSS1Compat' ? documentElement : // Standards
                D.body; // Quirks
                size = {
                    height: domObject.clientHeight,
                    width: domObject.clientWidth
                };
            }
        }
        return size;
    }

    function getViewportOffset() {
        return {
            top: W.pageYOffset || documentElement.scrollTop || D.body.scrollTop,
            left: W.pageXOffset || documentElement.scrollLeft || D.body.scrollLeft
        };
    }

    (function () {
        var Dust, _dirty = true,
            _delay = 333;

        Dust = function (time) {
            if (time === - 1) {
                _dirty = false;

            } else if (time !== null) {
                time = (time || _delay);

                W.setTimeout(function () {
                    _dirty = true;

                    C.log('dust in', time);
                }, time);
            }
        };

        Dust.valueOf = function () {
            return _dirty;
        };

        W.dust = Dust;
    }());

    function checkInView() {
        if (!W.dust) {
            return;
        }
        var $elements = $(),
            elementsLength, i = 0;

        $.each(inviewObjects, function (i, inviewObject) {
            var selector = inviewObject.data.selector,
                $element = inviewObject.$element;
            $elements = $elements.add(selector ? $element.find(selector) : $element);
        });

        elementsLength = $elements.length;
        if (elementsLength) {
            viewportSize = viewportSize || getViewportSize();
            viewportOffset = viewportOffset || getViewportOffset();

            for (; i < elementsLength; i++) {
                // Ignore elements that are not in the DOM tree
                if (!$.contains(documentElement, $elements[i])) {
                    continue;
                }

                var $element = $($elements[i]),
                    elementSize = {
                    height: $element.height(),
                    width: $element.width()
                },
                    elementOffset = $element.offset(),
                    inView = $element.data(name),
                    visiblePartX, visiblePartY, visiblePartsMerged;
                /* note #2 */
                if (!viewportOffset || !viewportSize) {
                    return;
                }
                var eO = elementOffset,
                    vO = viewportOffset,
                    eS = elementSize,
                    vS = viewportSize,
                    vPX = visiblePartX,
                    vPY = visiblePartY,
                    vPM = visiblePartsMerged;

                if (eO.top + eS.height > vO.top && eO.top < vO.top + vS.height && eO.left + eS.width > vO.left && eO.left < vO.left + vS.width) {
                    vPX = (vO.left > eO.left ? 'right' : (vO.left + vS.width) < (eO.left + eS.width) ? 'left' : 'both');
                    vPY = (vO.top > eO.top ? 'bottom' : (vO.top + vS.height) < (eO.top + eS.height) ? 'top' : 'both');
                    vPM = vPX + "-" + vPY;
                    if (!inView || inView !== vPM) {
                        $element.data(name, vPM).trigger(name, [true, vPX, vPY]);
                    }
                } else if (inView) {
                    $element.data(name, false).trigger(name, [false]);
                }
            }
        }
        W.dust(-1);
    }

    $(W).bind("scroll resize", function () {
        viewportSize = viewportOffset = null;
    });

    // IE < 9 scrolls to focused elements without firing the "scroll" event
    if (!documentElement.addEventListener && documentElement.attachEvent) {
        documentElement.attachEvent("onfocusin", function () {
            viewportOffset = null;
        });
    }
    /* note #3 */
    W.setInterval(checkInView, time);

    $(function () {
        (W.debug > 1) && C.warn('kickstart jquery.' + name);
        $(W).scroll();
    });

}(window, jQuery));
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/* notes

#1
    author Christopher Blum
    based on the idea of Remy Sharp, http://remysharp.com/2009/01/26/element-in-view-event-plugin/
    forked from http://github.com/zuk/jquery.inview/

#2
    Don't ask me why because I haven't figured out yet:
    viewportOffset and viewportSize are sometimes suddenly null in Firefox 5.
    Even though it sounds weird:
    It seems that the execution of this function is interferred by the onresize/onscroll event
    where viewportOffset and viewportSize are unset

#3
    Use setInterval to ensure this captures elements within "overflow:scroll" elements
    or elements that appeared in the dom tree due to dom manipulation and reflow
    old: $(window).scroll(checkInView);

    BTW, iOS seems to not execute (or delay) intervals while the user scrolls.
    Therefore the inview event might fire a bit late there
*/

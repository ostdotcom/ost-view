(function($) {
  /**
   * Copyright 2012, Digital Fusion
   * Licensed under the MIT license.
   * http://teamdf.com/jquery-plugins/license/
   *
   * @author Sam Sehnert
   * @desc A small plugin that checks whether elements are within
   *       the user visible viewport of a web browser.
   *       only accounts for vertical position, not horizontal.
   */
  var $w = $(window);
  $.fn.visible = function(partial, hidden, direction, container) {
    if (this.length < 1) return;

    // Set direction default to 'both'.
    direction = direction || 'both';

    var $t = this.length > 1 ? this.eq(0) : this,
      isContained = typeof container !== 'undefined' && container !== null,
      $c = isContained ? $(container) : $w,
      wPosition = isContained ? $c.position() : 0,
      t = $t.get(0),
      vpWidth = $c.outerWidth(),
      vpHeight = $c.outerHeight(),
      clientSize = hidden === true ? t.offsetWidth * t.offsetHeight : true;

    if (typeof t.getBoundingClientRect === 'function') {
      // Use this native browser method, if available.
      // rRec is relative rec.
      var wRec = isContained ? $c.get(0).getBoundingClientRect() : null,
        rec = t.getBoundingClientRect(),
        rRec = !wRec
          ? rec
          : {
              x: rec.x - wRec.x,
              y: rec.y - wRec.y,
              width: rec.width,
              height: rec.height,
              top: rec.top - wRec.top,
              bottom: rec.bottom - wRec.bottom,
              left: rec.left - wRec.left,
              right: rec.right - wRec.right
            },
        tViz = isContained
          ? rRec.top - wPosition.top >= 0 && rRec.top < vpHeight + wPosition.top
          : rRec.top >= 0 && rRec.top < vpHeight,
        bViz = isContained
          ? rRec.bottom - wPosition.top > 0 && rRec.bottom <= vpHeight + wPosition.top
          : rRec.bottom > 0 && rRec.bottom <= vpHeight,
        lViz = isContained
          ? rRec.left - wPosition.left >= 0 && rRec.left < vpWidth + wPosition.left
          : rRec.left >= 0 && rRec.left < vpWidth,
        rViz = isContained
          ? rRec.right - wPosition.left > 0 && rRec.right < vpWidth + wPosition.left
          : rRec.right > 0 && rRec.right <= vpWidth,
        vVisible = partial ? tViz || bViz : tViz && bViz,
        hVisible = partial ? lViz || rViz : lViz && rViz,
        vVisible = rRec.top < 0 && rRec.bottom > vpHeight ? true : vVisible,
        hVisible = rRec.left < 0 && rRec.right > vpWidth ? true : hVisible;

      // console.log("====== \n\n\n", "tViz", tViz , "clientSize", clientSize
      //     , "\n isContained", isContained, "container", container
      //     , "\n\t rec.top", Number(rec.top)
      //     , "\n\t wPosition.top", Number(wPosition.top)
      //     , "\n\t vpHeight", Number(vpHeight)

      //     , "\n rRec.top - wPosition.top >= 0 " , (rRec.top - wPosition.top >= 0)
      //     , "\n\t rRec.top - wPosition.top", Number(rRec.top - wPosition.top)

      //     , "\n rRec.top < vpHeight + wPosition.top", (rRec.top < vpHeight + wPosition.top)
      //     , "\n\t rRec.top", rRec.top
      //     , "\n\t vpHeight + wPosition.top", Number(vpHeight + wPosition.top)

      //     , "\n rRec.top >= 0", (rRec.top >= 0)
      //     , "\n rRec.top < vpHeight", (rRec.top < vpHeight)
      //     , "\n\t vpHeight", Number(vpHeight)

      // );

      // console.log(">>>", "bViz", bViz , "clientSize", clientSize
      //     , "\n isContained", isContained, "container", container
      //     , "\n\t rRec.bottom", Number(rRec.bottom)
      //     , "\n\t wPosition.top", Number(wPosition.top)
      //     , "\n\t vpHeight", Number(vpHeight)

      //     , "\n rRec.bottom - wPosition.top > 0" , (rRec.bottom - wPosition.top > 0)
      //     , "\n\t rRec.top - wPosition.top", Number(rRec.top - wPosition.top)

      //     , "\n rRec.top < vpHeight + wPosition.top", (rRec.top < vpHeight + wPosition.top)
      //     , "\n\t rRec.top", rRec.top
      //     , "\n\t vpHeight + wPosition.top", Number(vpHeight + wPosition.top)

      //     , "\n rRec.top >= 0", (rRec.top >= 0)
      //     , "\n rRec.top < vpHeight", (rRec.top < vpHeight)
      //     , "\n\t vpHeight", Number(vpHeight)

      // );

      // console.log("***");
      // console.log("rec", rec);
      // console.log("rRec", rRec);
      // console.log("wRec", wRec);

      if (direction === 'both') return clientSize && vVisible && hVisible;
      else if (direction === 'vertical') return clientSize && vVisible;
      else if (direction === 'horizontal') return clientSize && hVisible;
    } else {
      var viewTop = isContained ? 0 : wPosition,
        viewBottom = viewTop + vpHeight,
        viewLeft = $c.scrollLeft(),
        viewRight = viewLeft + vpWidth,
        position = $t.position(),
        _top = position.top,
        _bottom = _top + $t.height(),
        _left = position.left,
        _right = _left + $t.width(),
        compareTop = partial === true ? _bottom : _top,
        compareBottom = partial === true ? _top : _bottom,
        compareLeft = partial === true ? _right : _left,
        compareRight = partial === true ? _left : _right;

      if (direction === 'both')
        return (
          !!clientSize &&
          (compareBottom <= viewBottom && compareTop >= viewTop) &&
          (compareRight <= viewRight && compareLeft >= viewLeft)
        );
      else if (direction === 'vertical') return !!clientSize && (compareBottom <= viewBottom && compareTop >= viewTop);
      else if (direction === 'horizontal')
        return !!clientSize && (compareRight <= viewRight && compareLeft >= viewLeft);
    }
  };
})(jQuery);

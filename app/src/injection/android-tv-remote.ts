/**
 * Navigation à la télécommande injectée dans la page chargée par l’application.
 */
export function buildAndroidTvRemoteShim(enabled: boolean): string {
  if (!enabled) return '';

  return `
(function installMovixAndroidTvRemote() {
  if (window.__movixAndroidTvRemoteInstalled) return;
  window.__movixAndroidTvRemoteInstalled = true;

  var rootSelector = '[data-hls-player-root], .video-container';

  function playerRoot() {
    return document.querySelector(rootSelector);
  }

  function reveal(root) {
    root.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    if (typeof PointerEvent === 'function') {
      root.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true })
      );
    }
  }

  function controls(root) {
    return Array.prototype.filter.call(
      root.querySelectorAll(
        'button:not([disabled]), ' +
        '[role="button"][tabindex]:not([tabindex="-1"]), ' +
        'input:not([disabled]), ' +
        'select:not([disabled])'
      ),
      function (element) {
        var rect = element.getBoundingClientRect();

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          element.getAttribute('aria-hidden') !== 'true' &&
          !element.closest('[aria-hidden="true"]')
        );
      }
    );
  }

  function primaryControl(root, candidates) {
    return (
      root.querySelector('[data-tv-primary]') ||
      candidates.find(function (element) {
        return element.querySelector(
          'svg.lucide-play, svg.lucide-pause'
        );
      }) ||
      candidates[0]
    );
  }

  function moveFocus(root, direction) {
    reveal(root);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var candidates = controls(root);

        if (!candidates.length) return;

        var active = root.contains(document.activeElement)
          ? document.activeElement
          : null;

        if (!active || candidates.indexOf(active) < 0) {
          primaryControl(root, candidates).focus();
          return;
        }

        var from = active.getBoundingClientRect();
        var fromX = from.left + from.width / 2;
        var fromY = from.top + from.height / 2;
        var best = null;

        candidates.forEach(function (element) {
          if (element === active) return;

          var rect = element.getBoundingClientRect();
          var dx = rect.left + rect.width / 2 - fromX;
          var dy = rect.top + rect.height / 2 - fromY;

          var primary =
            direction === 'left'
              ? -dx
              : direction === 'right'
                ? dx
                : direction === 'up'
                  ? -dy
                  : dy;

          if (primary <= 4) return;

          var cross =
            direction === 'left' || direction === 'right'
              ? Math.abs(dy)
              : Math.abs(dx);

          var score = primary + cross * 2.5;

          if (!best || score < best.score) {
            best = {
              element: element,
              score: score
            };
          }
        });

        if (best) {
          best.element.focus();
        }
      });
    });
  }

  document.addEventListener(
    'keydown',
    function (event) {
      var root = playerRoot();
      if (!root) return;

      var directions = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down'
      };

      var direction = directions[event.key];
      if (!direction) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      moveFocus(root, direction);
    },
    true
  );

  window.addEventListener(
    'movix:tv-back',
    function () {
      var root = playerRoot();
      if (!root) return;

      var visible = controls(root);
      var active = root.contains(document.activeElement)
        ? document.activeElement
        : null;

      if (!visible.length || !active) {
        moveFocus(root, 'down');
        return;
      }

      history.back();
    },
    true
  );

  var style = document.createElement('style');

  style.textContent =
    '[data-hls-player-root] button:focus,' +
    '.video-container button:focus,' +
    '[data-hls-player-root] [role="button"]:focus,' +
    '.video-container [role="button"]:focus,' +
    '[data-hls-player-root] input:focus,' +
    '.video-container input:focus {' +
    'outline: 4px solid white !important;' +
    'outline-offset: 4px !important;' +
    'transform: scale(1.12);' +
    'z-index: 9999;' +
    '}';

  (document.head || document.documentElement).appendChild(style);
})();
`;
}

var hm = Object.defineProperty;
var mm = (a, s, i) =>
  s in a ? hm(a, s, { enumerable: !0, configurable: !0, writable: !0, value: i }) : (a[s] = i);
var le = (a, s, i) => mm(a, typeof s != 'symbol' ? s + '' : s, i);
function xm(a, s) {
  for (var i = 0; i < s.length; i++) {
    const l = s[i];
    if (typeof l != 'string' && !Array.isArray(l)) {
      for (const c in l)
        if (c !== 'default' && !(c in a)) {
          const u = Object.getOwnPropertyDescriptor(l, c);
          u && Object.defineProperty(a, c, u.get ? u : { enumerable: !0, get: () => l[c] });
        }
    }
  }
  return Object.freeze(Object.defineProperty(a, Symbol.toStringTag, { value: 'Module' }));
}
(function () {
  const s = document.createElement('link').relList;
  if (s && s.supports && s.supports('modulepreload')) return;
  for (const c of document.querySelectorAll('link[rel="modulepreload"]')) l(c);
  new MutationObserver((c) => {
    for (const u of c)
      if (u.type === 'childList')
        for (const p of u.addedNodes) p.tagName === 'LINK' && p.rel === 'modulepreload' && l(p);
  }).observe(document, { childList: !0, subtree: !0 });
  function i(c) {
    const u = {};
    return (
      c.integrity && (u.integrity = c.integrity),
      c.referrerPolicy && (u.referrerPolicy = c.referrerPolicy),
      c.crossOrigin === 'use-credentials'
        ? (u.credentials = 'include')
        : c.crossOrigin === 'anonymous'
          ? (u.credentials = 'omit')
          : (u.credentials = 'same-origin'),
      u
    );
  }
  function l(c) {
    if (c.ep) return;
    c.ep = !0;
    const u = i(c);
    fetch(c.href, u);
  }
})();
function Bp(a) {
  return a && a.__esModule && Object.prototype.hasOwnProperty.call(a, 'default') ? a.default : a;
}
var nl = { exports: {} },
  we = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Wu;
function gm() {
  if (Wu) return we;
  Wu = 1;
  var a = Symbol.for('react.element'),
    s = Symbol.for('react.portal'),
    i = Symbol.for('react.fragment'),
    l = Symbol.for('react.strict_mode'),
    c = Symbol.for('react.profiler'),
    u = Symbol.for('react.provider'),
    p = Symbol.for('react.context'),
    h = Symbol.for('react.forward_ref'),
    m = Symbol.for('react.suspense'),
    g = Symbol.for('react.memo'),
    v = Symbol.for('react.lazy'),
    y = Symbol.iterator;
  function S(k) {
    return k === null || typeof k != 'object'
      ? null
      : ((k = (y && k[y]) || k['@@iterator']), typeof k == 'function' ? k : null);
  }
  var C = {
      isMounted: function () {
        return !1;
      },
      enqueueForceUpdate: function () {},
      enqueueReplaceState: function () {},
      enqueueSetState: function () {},
    },
    R = Object.assign,
    j = {};
  function b(k, D, te) {
    ((this.props = k), (this.context = D), (this.refs = j), (this.updater = te || C));
  }
  ((b.prototype.isReactComponent = {}),
    (b.prototype.setState = function (k, D) {
      if (typeof k != 'object' && typeof k != 'function' && k != null)
        throw Error(
          'setState(...): takes an object of state variables to update or a function which returns an object of state variables.',
        );
      this.updater.enqueueSetState(this, k, D, 'setState');
    }),
    (b.prototype.forceUpdate = function (k) {
      this.updater.enqueueForceUpdate(this, k, 'forceUpdate');
    }));
  function T() {}
  T.prototype = b.prototype;
  function z(k, D, te) {
    ((this.props = k), (this.context = D), (this.refs = j), (this.updater = te || C));
  }
  var W = (z.prototype = new T());
  ((W.constructor = z), R(W, b.prototype), (W.isPureReactComponent = !0));
  var G = Array.isArray,
    Q = Object.prototype.hasOwnProperty,
    pe = { current: null },
    ge = { key: !0, ref: !0, __self: !0, __source: !0 };
  function Se(k, D, te) {
    var B,
      U = {},
      $ = null,
      Y = null;
    if (D != null)
      for (B in (D.ref !== void 0 && (Y = D.ref), D.key !== void 0 && ($ = '' + D.key), D))
        Q.call(D, B) && !ge.hasOwnProperty(B) && (U[B] = D[B]);
    var q = arguments.length - 2;
    if (q === 1) U.children = te;
    else if (1 < q) {
      for (var oe = Array(q), fe = 0; fe < q; fe++) oe[fe] = arguments[fe + 2];
      U.children = oe;
    }
    if (k && k.defaultProps) for (B in ((q = k.defaultProps), q)) U[B] === void 0 && (U[B] = q[B]);
    return { $$typeof: a, type: k, key: $, ref: Y, props: U, _owner: pe.current };
  }
  function He(k, D) {
    return { $$typeof: a, type: k.type, key: D, ref: k.ref, props: k.props, _owner: k._owner };
  }
  function Ge(k) {
    return typeof k == 'object' && k !== null && k.$$typeof === a;
  }
  function Je(k) {
    var D = { '=': '=0', ':': '=2' };
    return (
      '$' +
      k.replace(/[=:]/g, function (te) {
        return D[te];
      })
    );
  }
  var ke = /\/+/g;
  function Ie(k, D) {
    return typeof k == 'object' && k !== null && k.key != null ? Je('' + k.key) : D.toString(36);
  }
  function Ye(k, D, te, B, U) {
    var $ = typeof k;
    ($ === 'undefined' || $ === 'boolean') && (k = null);
    var Y = !1;
    if (k === null) Y = !0;
    else
      switch ($) {
        case 'string':
        case 'number':
          Y = !0;
          break;
        case 'object':
          switch (k.$$typeof) {
            case a:
            case s:
              Y = !0;
          }
      }
    if (Y)
      return (
        (Y = k),
        (U = U(Y)),
        (k = B === '' ? '.' + Ie(Y, 0) : B),
        G(U)
          ? ((te = ''),
            k != null && (te = k.replace(ke, '$&/') + '/'),
            Ye(U, D, te, '', function (fe) {
              return fe;
            }))
          : U != null &&
            (Ge(U) &&
              (U = He(
                U,
                te +
                  (!U.key || (Y && Y.key === U.key) ? '' : ('' + U.key).replace(ke, '$&/') + '/') +
                  k,
              )),
            D.push(U)),
        1
      );
    if (((Y = 0), (B = B === '' ? '.' : B + ':'), G(k)))
      for (var q = 0; q < k.length; q++) {
        $ = k[q];
        var oe = B + Ie($, q);
        Y += Ye($, D, te, oe, U);
      }
    else if (((oe = S(k)), typeof oe == 'function'))
      for (k = oe.call(k), q = 0; !($ = k.next()).done; )
        (($ = $.value), (oe = B + Ie($, q++)), (Y += Ye($, D, te, oe, U)));
    else if ($ === 'object')
      throw (
        (D = String(k)),
        Error(
          'Objects are not valid as a React child (found: ' +
            (D === '[object Object]' ? 'object with keys {' + Object.keys(k).join(', ') + '}' : D) +
            '). If you meant to render a collection of children, use an array instead.',
        )
      );
    return Y;
  }
  function et(k, D, te) {
    if (k == null) return k;
    var B = [],
      U = 0;
    return (
      Ye(k, B, '', '', function ($) {
        return D.call(te, $, U++);
      }),
      B
    );
  }
  function ze(k) {
    if (k._status === -1) {
      var D = k._result;
      ((D = D()),
        D.then(
          function (te) {
            (k._status === 0 || k._status === -1) && ((k._status = 1), (k._result = te));
          },
          function (te) {
            (k._status === 0 || k._status === -1) && ((k._status = 2), (k._result = te));
          },
        ),
        k._status === -1 && ((k._status = 0), (k._result = D)));
    }
    if (k._status === 1) return k._result.default;
    throw k._result;
  }
  var Ee = { current: null },
    M = { transition: null },
    E = { ReactCurrentDispatcher: Ee, ReactCurrentBatchConfig: M, ReactCurrentOwner: pe };
  function L() {
    throw Error('act(...) is not supported in production builds of React.');
  }
  return (
    (we.Children = {
      map: et,
      forEach: function (k, D, te) {
        et(
          k,
          function () {
            D.apply(this, arguments);
          },
          te,
        );
      },
      count: function (k) {
        var D = 0;
        return (
          et(k, function () {
            D++;
          }),
          D
        );
      },
      toArray: function (k) {
        return (
          et(k, function (D) {
            return D;
          }) || []
        );
      },
      only: function (k) {
        if (!Ge(k))
          throw Error('React.Children.only expected to receive a single React element child.');
        return k;
      },
    }),
    (we.Component = b),
    (we.Fragment = i),
    (we.Profiler = c),
    (we.PureComponent = z),
    (we.StrictMode = l),
    (we.Suspense = m),
    (we.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = E),
    (we.act = L),
    (we.cloneElement = function (k, D, te) {
      if (k == null)
        throw Error(
          'React.cloneElement(...): The argument must be a React element, but you passed ' +
            k +
            '.',
        );
      var B = R({}, k.props),
        U = k.key,
        $ = k.ref,
        Y = k._owner;
      if (D != null) {
        if (
          (D.ref !== void 0 && (($ = D.ref), (Y = pe.current)),
          D.key !== void 0 && (U = '' + D.key),
          k.type && k.type.defaultProps)
        )
          var q = k.type.defaultProps;
        for (oe in D)
          Q.call(D, oe) &&
            !ge.hasOwnProperty(oe) &&
            (B[oe] = D[oe] === void 0 && q !== void 0 ? q[oe] : D[oe]);
      }
      var oe = arguments.length - 2;
      if (oe === 1) B.children = te;
      else if (1 < oe) {
        q = Array(oe);
        for (var fe = 0; fe < oe; fe++) q[fe] = arguments[fe + 2];
        B.children = q;
      }
      return { $$typeof: a, type: k.type, key: U, ref: $, props: B, _owner: Y };
    }),
    (we.createContext = function (k) {
      return (
        (k = {
          $$typeof: p,
          _currentValue: k,
          _currentValue2: k,
          _threadCount: 0,
          Provider: null,
          Consumer: null,
          _defaultValue: null,
          _globalName: null,
        }),
        (k.Provider = { $$typeof: u, _context: k }),
        (k.Consumer = k)
      );
    }),
    (we.createElement = Se),
    (we.createFactory = function (k) {
      var D = Se.bind(null, k);
      return ((D.type = k), D);
    }),
    (we.createRef = function () {
      return { current: null };
    }),
    (we.forwardRef = function (k) {
      return { $$typeof: h, render: k };
    }),
    (we.isValidElement = Ge),
    (we.lazy = function (k) {
      return { $$typeof: v, _payload: { _status: -1, _result: k }, _init: ze };
    }),
    (we.memo = function (k, D) {
      return { $$typeof: g, type: k, compare: D === void 0 ? null : D };
    }),
    (we.startTransition = function (k) {
      var D = M.transition;
      M.transition = {};
      try {
        k();
      } finally {
        M.transition = D;
      }
    }),
    (we.unstable_act = L),
    (we.useCallback = function (k, D) {
      return Ee.current.useCallback(k, D);
    }),
    (we.useContext = function (k) {
      return Ee.current.useContext(k);
    }),
    (we.useDebugValue = function () {}),
    (we.useDeferredValue = function (k) {
      return Ee.current.useDeferredValue(k);
    }),
    (we.useEffect = function (k, D) {
      return Ee.current.useEffect(k, D);
    }),
    (we.useId = function () {
      return Ee.current.useId();
    }),
    (we.useImperativeHandle = function (k, D, te) {
      return Ee.current.useImperativeHandle(k, D, te);
    }),
    (we.useInsertionEffect = function (k, D) {
      return Ee.current.useInsertionEffect(k, D);
    }),
    (we.useLayoutEffect = function (k, D) {
      return Ee.current.useLayoutEffect(k, D);
    }),
    (we.useMemo = function (k, D) {
      return Ee.current.useMemo(k, D);
    }),
    (we.useReducer = function (k, D, te) {
      return Ee.current.useReducer(k, D, te);
    }),
    (we.useRef = function (k) {
      return Ee.current.useRef(k);
    }),
    (we.useState = function (k) {
      return Ee.current.useState(k);
    }),
    (we.useSyncExternalStore = function (k, D, te) {
      return Ee.current.useSyncExternalStore(k, D, te);
    }),
    (we.useTransition = function () {
      return Ee.current.useTransition();
    }),
    (we.version = '18.3.1'),
    we
  );
}
var Bu;
function Tl() {
  return (Bu || ((Bu = 1), (nl.exports = gm())), nl.exports);
}
var N = Tl();
const ve = Bp(N),
  vm = xm({ __proto__: null, default: ve }, [N]);
var Gi = {},
  sl = { exports: {} },
  kt = {},
  il = { exports: {} },
  al = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Fu;
function ym() {
  return (
    Fu ||
      ((Fu = 1),
      (function (a) {
        function s(M, E) {
          var L = M.length;
          M.push(E);
          e: for (; 0 < L; ) {
            var k = (L - 1) >>> 1,
              D = M[k];
            if (0 < c(D, E)) ((M[k] = E), (M[L] = D), (L = k));
            else break e;
          }
        }
        function i(M) {
          return M.length === 0 ? null : M[0];
        }
        function l(M) {
          if (M.length === 0) return null;
          var E = M[0],
            L = M.pop();
          if (L !== E) {
            M[0] = L;
            e: for (var k = 0, D = M.length, te = D >>> 1; k < te; ) {
              var B = 2 * (k + 1) - 1,
                U = M[B],
                $ = B + 1,
                Y = M[$];
              if (0 > c(U, L))
                $ < D && 0 > c(Y, U)
                  ? ((M[k] = Y), (M[$] = L), (k = $))
                  : ((M[k] = U), (M[B] = L), (k = B));
              else if ($ < D && 0 > c(Y, L)) ((M[k] = Y), (M[$] = L), (k = $));
              else break e;
            }
          }
          return E;
        }
        function c(M, E) {
          var L = M.sortIndex - E.sortIndex;
          return L !== 0 ? L : M.id - E.id;
        }
        if (typeof performance == 'object' && typeof performance.now == 'function') {
          var u = performance;
          a.unstable_now = function () {
            return u.now();
          };
        } else {
          var p = Date,
            h = p.now();
          a.unstable_now = function () {
            return p.now() - h;
          };
        }
        var m = [],
          g = [],
          v = 1,
          y = null,
          S = 3,
          C = !1,
          R = !1,
          j = !1,
          b = typeof setTimeout == 'function' ? setTimeout : null,
          T = typeof clearTimeout == 'function' ? clearTimeout : null,
          z = typeof setImmediate < 'u' ? setImmediate : null;
        typeof navigator < 'u' &&
          navigator.scheduling !== void 0 &&
          navigator.scheduling.isInputPending !== void 0 &&
          navigator.scheduling.isInputPending.bind(navigator.scheduling);
        function W(M) {
          for (var E = i(g); E !== null; ) {
            if (E.callback === null) l(g);
            else if (E.startTime <= M) (l(g), (E.sortIndex = E.expirationTime), s(m, E));
            else break;
            E = i(g);
          }
        }
        function G(M) {
          if (((j = !1), W(M), !R))
            if (i(m) !== null) ((R = !0), ze(Q));
            else {
              var E = i(g);
              E !== null && Ee(G, E.startTime - M);
            }
        }
        function Q(M, E) {
          ((R = !1), j && ((j = !1), T(Se), (Se = -1)), (C = !0));
          var L = S;
          try {
            for (W(E), y = i(m); y !== null && (!(y.expirationTime > E) || (M && !Je())); ) {
              var k = y.callback;
              if (typeof k == 'function') {
                ((y.callback = null), (S = y.priorityLevel));
                var D = k(y.expirationTime <= E);
                ((E = a.unstable_now()),
                  typeof D == 'function' ? (y.callback = D) : y === i(m) && l(m),
                  W(E));
              } else l(m);
              y = i(m);
            }
            if (y !== null) var te = !0;
            else {
              var B = i(g);
              (B !== null && Ee(G, B.startTime - E), (te = !1));
            }
            return te;
          } finally {
            ((y = null), (S = L), (C = !1));
          }
        }
        var pe = !1,
          ge = null,
          Se = -1,
          He = 5,
          Ge = -1;
        function Je() {
          return !(a.unstable_now() - Ge < He);
        }
        function ke() {
          if (ge !== null) {
            var M = a.unstable_now();
            Ge = M;
            var E = !0;
            try {
              E = ge(!0, M);
            } finally {
              E ? Ie() : ((pe = !1), (ge = null));
            }
          } else pe = !1;
        }
        var Ie;
        if (typeof z == 'function')
          Ie = function () {
            z(ke);
          };
        else if (typeof MessageChannel < 'u') {
          var Ye = new MessageChannel(),
            et = Ye.port2;
          ((Ye.port1.onmessage = ke),
            (Ie = function () {
              et.postMessage(null);
            }));
        } else
          Ie = function () {
            b(ke, 0);
          };
        function ze(M) {
          ((ge = M), pe || ((pe = !0), Ie()));
        }
        function Ee(M, E) {
          Se = b(function () {
            M(a.unstable_now());
          }, E);
        }
        ((a.unstable_IdlePriority = 5),
          (a.unstable_ImmediatePriority = 1),
          (a.unstable_LowPriority = 4),
          (a.unstable_NormalPriority = 3),
          (a.unstable_Profiling = null),
          (a.unstable_UserBlockingPriority = 2),
          (a.unstable_cancelCallback = function (M) {
            M.callback = null;
          }),
          (a.unstable_continueExecution = function () {
            R || C || ((R = !0), ze(Q));
          }),
          (a.unstable_forceFrameRate = function (M) {
            0 > M || 125 < M
              ? console.error(
                  'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported',
                )
              : (He = 0 < M ? Math.floor(1e3 / M) : 5);
          }),
          (a.unstable_getCurrentPriorityLevel = function () {
            return S;
          }),
          (a.unstable_getFirstCallbackNode = function () {
            return i(m);
          }),
          (a.unstable_next = function (M) {
            switch (S) {
              case 1:
              case 2:
              case 3:
                var E = 3;
                break;
              default:
                E = S;
            }
            var L = S;
            S = E;
            try {
              return M();
            } finally {
              S = L;
            }
          }),
          (a.unstable_pauseExecution = function () {}),
          (a.unstable_requestPaint = function () {}),
          (a.unstable_runWithPriority = function (M, E) {
            switch (M) {
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
                break;
              default:
                M = 3;
            }
            var L = S;
            S = M;
            try {
              return E();
            } finally {
              S = L;
            }
          }),
          (a.unstable_scheduleCallback = function (M, E, L) {
            var k = a.unstable_now();
            switch (
              (typeof L == 'object' && L !== null
                ? ((L = L.delay), (L = typeof L == 'number' && 0 < L ? k + L : k))
                : (L = k),
              M)
            ) {
              case 1:
                var D = -1;
                break;
              case 2:
                D = 250;
                break;
              case 5:
                D = 1073741823;
                break;
              case 4:
                D = 1e4;
                break;
              default:
                D = 5e3;
            }
            return (
              (D = L + D),
              (M = {
                id: v++,
                callback: E,
                priorityLevel: M,
                startTime: L,
                expirationTime: D,
                sortIndex: -1,
              }),
              L > k
                ? ((M.sortIndex = L),
                  s(g, M),
                  i(m) === null && M === i(g) && (j ? (T(Se), (Se = -1)) : (j = !0), Ee(G, L - k)))
                : ((M.sortIndex = D), s(m, M), R || C || ((R = !0), ze(Q))),
              M
            );
          }),
          (a.unstable_shouldYield = Je),
          (a.unstable_wrapCallback = function (M) {
            var E = S;
            return function () {
              var L = S;
              S = E;
              try {
                return M.apply(this, arguments);
              } finally {
                S = L;
              }
            };
          }));
      })(al)),
    al
  );
}
var Vu;
function wm() {
  return (Vu || ((Vu = 1), (il.exports = ym())), il.exports);
}
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Hu;
function km() {
  if (Hu) return kt;
  Hu = 1;
  var a = Tl(),
    s = wm();
  function i(e) {
    for (
      var t = 'https://reactjs.org/docs/error-decoder.html?invariant=' + e, r = 1;
      r < arguments.length;
      r++
    )
      t += '&args[]=' + encodeURIComponent(arguments[r]);
    return (
      'Minified React error #' +
      e +
      '; visit ' +
      t +
      ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
    );
  }
  var l = new Set(),
    c = {};
  function u(e, t) {
    (p(e, t), p(e + 'Capture', t));
  }
  function p(e, t) {
    for (c[e] = t, e = 0; e < t.length; e++) l.add(t[e]);
  }
  var h = !(
      typeof window > 'u' ||
      typeof window.document > 'u' ||
      typeof window.document.createElement > 'u'
    ),
    m = Object.prototype.hasOwnProperty,
    g =
      /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
    v = {},
    y = {};
  function S(e) {
    return m.call(y, e) ? !0 : m.call(v, e) ? !1 : g.test(e) ? (y[e] = !0) : ((v[e] = !0), !1);
  }
  function C(e, t, r, o) {
    if (r !== null && r.type === 0) return !1;
    switch (typeof t) {
      case 'function':
      case 'symbol':
        return !0;
      case 'boolean':
        return o
          ? !1
          : r !== null
            ? !r.acceptsBooleans
            : ((e = e.toLowerCase().slice(0, 5)), e !== 'data-' && e !== 'aria-');
      default:
        return !1;
    }
  }
  function R(e, t, r, o) {
    if (t === null || typeof t > 'u' || C(e, t, r, o)) return !0;
    if (o) return !1;
    if (r !== null)
      switch (r.type) {
        case 3:
          return !t;
        case 4:
          return t === !1;
        case 5:
          return isNaN(t);
        case 6:
          return isNaN(t) || 1 > t;
      }
    return !1;
  }
  function j(e, t, r, o, d, f, x) {
    ((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
      (this.attributeName = o),
      (this.attributeNamespace = d),
      (this.mustUseProperty = r),
      (this.propertyName = e),
      (this.type = t),
      (this.sanitizeURL = f),
      (this.removeEmptyString = x));
  }
  var b = {};
  ('children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
    .split(' ')
    .forEach(function (e) {
      b[e] = new j(e, 0, !1, e, null, !1, !1);
    }),
    [
      ['acceptCharset', 'accept-charset'],
      ['className', 'class'],
      ['htmlFor', 'for'],
      ['httpEquiv', 'http-equiv'],
    ].forEach(function (e) {
      var t = e[0];
      b[t] = new j(t, 1, !1, e[1], null, !1, !1);
    }),
    ['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
      b[e] = new j(e, 2, !1, e.toLowerCase(), null, !1, !1);
    }),
    ['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(
      function (e) {
        b[e] = new j(e, 2, !1, e, null, !1, !1);
      },
    ),
    'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
      .split(' ')
      .forEach(function (e) {
        b[e] = new j(e, 3, !1, e.toLowerCase(), null, !1, !1);
      }),
    ['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
      b[e] = new j(e, 3, !0, e, null, !1, !1);
    }),
    ['capture', 'download'].forEach(function (e) {
      b[e] = new j(e, 4, !1, e, null, !1, !1);
    }),
    ['cols', 'rows', 'size', 'span'].forEach(function (e) {
      b[e] = new j(e, 6, !1, e, null, !1, !1);
    }),
    ['rowSpan', 'start'].forEach(function (e) {
      b[e] = new j(e, 5, !1, e.toLowerCase(), null, !1, !1);
    }));
  var T = /[\-:]([a-z])/g;
  function z(e) {
    return e[1].toUpperCase();
  }
  ('accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
    .split(' ')
    .forEach(function (e) {
      var t = e.replace(T, z);
      b[t] = new j(t, 1, !1, e, null, !1, !1);
    }),
    'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'
      .split(' ')
      .forEach(function (e) {
        var t = e.replace(T, z);
        b[t] = new j(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1);
      }),
    ['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
      var t = e.replace(T, z);
      b[t] = new j(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1);
    }),
    ['tabIndex', 'crossOrigin'].forEach(function (e) {
      b[e] = new j(e, 1, !1, e.toLowerCase(), null, !1, !1);
    }),
    (b.xlinkHref = new j('xlinkHref', 1, !1, 'xlink:href', 'http://www.w3.org/1999/xlink', !0, !1)),
    ['src', 'href', 'action', 'formAction'].forEach(function (e) {
      b[e] = new j(e, 1, !1, e.toLowerCase(), null, !0, !0);
    }));
  function W(e, t, r, o) {
    var d = b.hasOwnProperty(t) ? b[t] : null;
    (d !== null
      ? d.type !== 0
      : o || !(2 < t.length) || (t[0] !== 'o' && t[0] !== 'O') || (t[1] !== 'n' && t[1] !== 'N')) &&
      (R(t, r, d, o) && (r = null),
      o || d === null
        ? S(t) && (r === null ? e.removeAttribute(t) : e.setAttribute(t, '' + r))
        : d.mustUseProperty
          ? (e[d.propertyName] = r === null ? (d.type === 3 ? !1 : '') : r)
          : ((t = d.attributeName),
            (o = d.attributeNamespace),
            r === null
              ? e.removeAttribute(t)
              : ((d = d.type),
                (r = d === 3 || (d === 4 && r === !0) ? '' : '' + r),
                o ? e.setAttributeNS(o, t, r) : e.setAttribute(t, r))));
  }
  var G = a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    Q = Symbol.for('react.element'),
    pe = Symbol.for('react.portal'),
    ge = Symbol.for('react.fragment'),
    Se = Symbol.for('react.strict_mode'),
    He = Symbol.for('react.profiler'),
    Ge = Symbol.for('react.provider'),
    Je = Symbol.for('react.context'),
    ke = Symbol.for('react.forward_ref'),
    Ie = Symbol.for('react.suspense'),
    Ye = Symbol.for('react.suspense_list'),
    et = Symbol.for('react.memo'),
    ze = Symbol.for('react.lazy'),
    Ee = Symbol.for('react.offscreen'),
    M = Symbol.iterator;
  function E(e) {
    return e === null || typeof e != 'object'
      ? null
      : ((e = (M && e[M]) || e['@@iterator']), typeof e == 'function' ? e : null);
  }
  var L = Object.assign,
    k;
  function D(e) {
    if (k === void 0)
      try {
        throw Error();
      } catch (r) {
        var t = r.stack.trim().match(/\n( *(at )?)/);
        k = (t && t[1]) || '';
      }
    return (
      `
` +
      k +
      e
    );
  }
  var te = !1;
  function B(e, t) {
    if (!e || te) return '';
    te = !0;
    var r = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      if (t)
        if (
          ((t = function () {
            throw Error();
          }),
          Object.defineProperty(t.prototype, 'props', {
            set: function () {
              throw Error();
            },
          }),
          typeof Reflect == 'object' && Reflect.construct)
        ) {
          try {
            Reflect.construct(t, []);
          } catch (P) {
            var o = P;
          }
          Reflect.construct(e, [], t);
        } else {
          try {
            t.call();
          } catch (P) {
            o = P;
          }
          e.call(t.prototype);
        }
      else {
        try {
          throw Error();
        } catch (P) {
          o = P;
        }
        e();
      }
    } catch (P) {
      if (P && o && typeof P.stack == 'string') {
        for (
          var d = P.stack.split(`
`),
            f = o.stack.split(`
`),
            x = d.length - 1,
            w = f.length - 1;
          1 <= x && 0 <= w && d[x] !== f[w];
        )
          w--;
        for (; 1 <= x && 0 <= w; x--, w--)
          if (d[x] !== f[w]) {
            if (x !== 1 || w !== 1)
              do
                if ((x--, w--, 0 > w || d[x] !== f[w])) {
                  var _ =
                    `
` + d[x].replace(' at new ', ' at ');
                  return (
                    e.displayName &&
                      _.includes('<anonymous>') &&
                      (_ = _.replace('<anonymous>', e.displayName)),
                    _
                  );
                }
              while (1 <= x && 0 <= w);
            break;
          }
      }
    } finally {
      ((te = !1), (Error.prepareStackTrace = r));
    }
    return (e = e ? e.displayName || e.name : '') ? D(e) : '';
  }
  function U(e) {
    switch (e.tag) {
      case 5:
        return D(e.type);
      case 16:
        return D('Lazy');
      case 13:
        return D('Suspense');
      case 19:
        return D('SuspenseList');
      case 0:
      case 2:
      case 15:
        return ((e = B(e.type, !1)), e);
      case 11:
        return ((e = B(e.type.render, !1)), e);
      case 1:
        return ((e = B(e.type, !0)), e);
      default:
        return '';
    }
  }
  function $(e) {
    if (e == null) return null;
    if (typeof e == 'function') return e.displayName || e.name || null;
    if (typeof e == 'string') return e;
    switch (e) {
      case ge:
        return 'Fragment';
      case pe:
        return 'Portal';
      case He:
        return 'Profiler';
      case Se:
        return 'StrictMode';
      case Ie:
        return 'Suspense';
      case Ye:
        return 'SuspenseList';
    }
    if (typeof e == 'object')
      switch (e.$$typeof) {
        case Je:
          return (e.displayName || 'Context') + '.Consumer';
        case Ge:
          return (e._context.displayName || 'Context') + '.Provider';
        case ke:
          var t = e.render;
          return (
            (e = e.displayName),
            e ||
              ((e = t.displayName || t.name || ''),
              (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
            e
          );
        case et:
          return ((t = e.displayName || null), t !== null ? t : $(e.type) || 'Memo');
        case ze:
          ((t = e._payload), (e = e._init));
          try {
            return $(e(t));
          } catch {}
      }
    return null;
  }
  function Y(e) {
    var t = e.type;
    switch (e.tag) {
      case 24:
        return 'Cache';
      case 9:
        return (t.displayName || 'Context') + '.Consumer';
      case 10:
        return (t._context.displayName || 'Context') + '.Provider';
      case 18:
        return 'DehydratedFragment';
      case 11:
        return (
          (e = t.render),
          (e = e.displayName || e.name || ''),
          t.displayName || (e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')
        );
      case 7:
        return 'Fragment';
      case 5:
        return t;
      case 4:
        return 'Portal';
      case 3:
        return 'Root';
      case 6:
        return 'Text';
      case 16:
        return $(t);
      case 8:
        return t === Se ? 'StrictMode' : 'Mode';
      case 22:
        return 'Offscreen';
      case 12:
        return 'Profiler';
      case 21:
        return 'Scope';
      case 13:
        return 'Suspense';
      case 19:
        return 'SuspenseList';
      case 25:
        return 'TracingMarker';
      case 1:
      case 0:
      case 17:
      case 2:
      case 14:
      case 15:
        if (typeof t == 'function') return t.displayName || t.name || null;
        if (typeof t == 'string') return t;
    }
    return null;
  }
  function q(e) {
    switch (typeof e) {
      case 'boolean':
      case 'number':
      case 'string':
      case 'undefined':
        return e;
      case 'object':
        return e;
      default:
        return '';
    }
  }
  function oe(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio');
  }
  function fe(e) {
    var t = oe(e) ? 'checked' : 'value',
      r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
      o = '' + e[t];
    if (
      !e.hasOwnProperty(t) &&
      typeof r < 'u' &&
      typeof r.get == 'function' &&
      typeof r.set == 'function'
    ) {
      var d = r.get,
        f = r.set;
      return (
        Object.defineProperty(e, t, {
          configurable: !0,
          get: function () {
            return d.call(this);
          },
          set: function (x) {
            ((o = '' + x), f.call(this, x));
          },
        }),
        Object.defineProperty(e, t, { enumerable: r.enumerable }),
        {
          getValue: function () {
            return o;
          },
          setValue: function (x) {
            o = '' + x;
          },
          stopTracking: function () {
            ((e._valueTracker = null), delete e[t]);
          },
        }
      );
    }
  }
  function tt(e) {
    e._valueTracker || (e._valueTracker = fe(e));
  }
  function ue(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var r = t.getValue(),
      o = '';
    return (
      e && (o = oe(e) ? (e.checked ? 'true' : 'false') : e.value),
      (e = o),
      e !== r ? (t.setValue(e), !0) : !1
    );
  }
  function rt(e) {
    if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  function ca(e, t) {
    var r = t.checked;
    return L({}, t, {
      defaultChecked: void 0,
      defaultValue: void 0,
      value: void 0,
      checked: r ?? e._wrapperState.initialChecked,
    });
  }
  function Zl(e, t) {
    var r = t.defaultValue == null ? '' : t.defaultValue,
      o = t.checked != null ? t.checked : t.defaultChecked;
    ((r = q(t.value != null ? t.value : r)),
      (e._wrapperState = {
        initialChecked: o,
        initialValue: r,
        controlled:
          t.type === 'checkbox' || t.type === 'radio' ? t.checked != null : t.value != null,
      }));
  }
  function Kl(e, t) {
    ((t = t.checked), t != null && W(e, 'checked', t, !1));
  }
  function da(e, t) {
    Kl(e, t);
    var r = q(t.value),
      o = t.type;
    if (r != null)
      o === 'number'
        ? ((r === 0 && e.value === '') || e.value != r) && (e.value = '' + r)
        : e.value !== '' + r && (e.value = '' + r);
    else if (o === 'submit' || o === 'reset') {
      e.removeAttribute('value');
      return;
    }
    (t.hasOwnProperty('value')
      ? ua(e, t.type, r)
      : t.hasOwnProperty('defaultValue') && ua(e, t.type, q(t.defaultValue)),
      t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked));
  }
  function ql(e, t, r) {
    if (t.hasOwnProperty('value') || t.hasOwnProperty('defaultValue')) {
      var o = t.type;
      if (!((o !== 'submit' && o !== 'reset') || (t.value !== void 0 && t.value !== null))) return;
      ((t = '' + e._wrapperState.initialValue),
        r || t === e.value || (e.value = t),
        (e.defaultValue = t));
    }
    ((r = e.name),
      r !== '' && (e.name = ''),
      (e.defaultChecked = !!e._wrapperState.initialChecked),
      r !== '' && (e.name = r));
  }
  function ua(e, t, r) {
    (t !== 'number' || rt(e.ownerDocument) !== e) &&
      (r == null
        ? (e.defaultValue = '' + e._wrapperState.initialValue)
        : e.defaultValue !== '' + r && (e.defaultValue = '' + r));
  }
  var Bn = Array.isArray;
  function an(e, t, r, o) {
    if (((e = e.options), t)) {
      t = {};
      for (var d = 0; d < r.length; d++) t['$' + r[d]] = !0;
      for (r = 0; r < e.length; r++)
        ((d = t.hasOwnProperty('$' + e[r].value)),
          e[r].selected !== d && (e[r].selected = d),
          d && o && (e[r].defaultSelected = !0));
    } else {
      for (r = '' + q(r), t = null, d = 0; d < e.length; d++) {
        if (e[d].value === r) {
          ((e[d].selected = !0), o && (e[d].defaultSelected = !0));
          return;
        }
        t !== null || e[d].disabled || (t = e[d]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function pa(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(i(91));
    return L({}, t, {
      value: void 0,
      defaultValue: void 0,
      children: '' + e._wrapperState.initialValue,
    });
  }
  function Ql(e, t) {
    var r = t.value;
    if (r == null) {
      if (((r = t.children), (t = t.defaultValue), r != null)) {
        if (t != null) throw Error(i(92));
        if (Bn(r)) {
          if (1 < r.length) throw Error(i(93));
          r = r[0];
        }
        t = r;
      }
      (t == null && (t = ''), (r = t));
    }
    e._wrapperState = { initialValue: q(r) };
  }
  function Xl(e, t) {
    var r = q(t.value),
      o = q(t.defaultValue);
    (r != null &&
      ((r = '' + r),
      r !== e.value && (e.value = r),
      t.defaultValue == null && e.defaultValue !== r && (e.defaultValue = r)),
      o != null && (e.defaultValue = '' + o));
  }
  function Jl(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t);
  }
  function ec(e) {
    switch (e) {
      case 'svg':
        return 'http://www.w3.org/2000/svg';
      case 'math':
        return 'http://www.w3.org/1998/Math/MathML';
      default:
        return 'http://www.w3.org/1999/xhtml';
    }
  }
  function fa(e, t) {
    return e == null || e === 'http://www.w3.org/1999/xhtml'
      ? ec(t)
      : e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
        ? 'http://www.w3.org/1999/xhtml'
        : e;
  }
  var zs,
    tc = (function (e) {
      return typeof MSApp < 'u' && MSApp.execUnsafeLocalFunction
        ? function (t, r, o, d) {
            MSApp.execUnsafeLocalFunction(function () {
              return e(t, r, o, d);
            });
          }
        : e;
    })(function (e, t) {
      if (e.namespaceURI !== 'http://www.w3.org/2000/svg' || 'innerHTML' in e) e.innerHTML = t;
      else {
        for (
          zs = zs || document.createElement('div'),
            zs.innerHTML = '<svg>' + t.valueOf().toString() + '</svg>',
            t = zs.firstChild;
          e.firstChild;
        )
          e.removeChild(e.firstChild);
        for (; t.firstChild; ) e.appendChild(t.firstChild);
      }
    });
  function Fn(e, t) {
    if (t) {
      var r = e.firstChild;
      if (r && r === e.lastChild && r.nodeType === 3) {
        r.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var Vn = {
      animationIterationCount: !0,
      aspectRatio: !0,
      borderImageOutset: !0,
      borderImageSlice: !0,
      borderImageWidth: !0,
      boxFlex: !0,
      boxFlexGroup: !0,
      boxOrdinalGroup: !0,
      columnCount: !0,
      columns: !0,
      flex: !0,
      flexGrow: !0,
      flexPositive: !0,
      flexShrink: !0,
      flexNegative: !0,
      flexOrder: !0,
      gridArea: !0,
      gridRow: !0,
      gridRowEnd: !0,
      gridRowSpan: !0,
      gridRowStart: !0,
      gridColumn: !0,
      gridColumnEnd: !0,
      gridColumnSpan: !0,
      gridColumnStart: !0,
      fontWeight: !0,
      lineClamp: !0,
      lineHeight: !0,
      opacity: !0,
      order: !0,
      orphans: !0,
      tabSize: !0,
      widows: !0,
      zIndex: !0,
      zoom: !0,
      fillOpacity: !0,
      floodOpacity: !0,
      stopOpacity: !0,
      strokeDasharray: !0,
      strokeDashoffset: !0,
      strokeMiterlimit: !0,
      strokeOpacity: !0,
      strokeWidth: !0,
    },
    vf = ['Webkit', 'ms', 'Moz', 'O'];
  Object.keys(Vn).forEach(function (e) {
    vf.forEach(function (t) {
      ((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (Vn[t] = Vn[e]));
    });
  });
  function rc(e, t, r) {
    return t == null || typeof t == 'boolean' || t === ''
      ? ''
      : r || typeof t != 'number' || t === 0 || (Vn.hasOwnProperty(e) && Vn[e])
        ? ('' + t).trim()
        : t + 'px';
  }
  function nc(e, t) {
    e = e.style;
    for (var r in t)
      if (t.hasOwnProperty(r)) {
        var o = r.indexOf('--') === 0,
          d = rc(r, t[r], o);
        (r === 'float' && (r = 'cssFloat'), o ? e.setProperty(r, d) : (e[r] = d));
      }
  }
  var yf = L(
    { menuitem: !0 },
    {
      area: !0,
      base: !0,
      br: !0,
      col: !0,
      embed: !0,
      hr: !0,
      img: !0,
      input: !0,
      keygen: !0,
      link: !0,
      meta: !0,
      param: !0,
      source: !0,
      track: !0,
      wbr: !0,
    },
  );
  function ha(e, t) {
    if (t) {
      if (yf[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
        throw Error(i(137, e));
      if (t.dangerouslySetInnerHTML != null) {
        if (t.children != null) throw Error(i(60));
        if (
          typeof t.dangerouslySetInnerHTML != 'object' ||
          !('__html' in t.dangerouslySetInnerHTML)
        )
          throw Error(i(61));
      }
      if (t.style != null && typeof t.style != 'object') throw Error(i(62));
    }
  }
  function ma(e, t) {
    if (e.indexOf('-') === -1) return typeof t.is == 'string';
    switch (e) {
      case 'annotation-xml':
      case 'color-profile':
      case 'font-face':
      case 'font-face-src':
      case 'font-face-uri':
      case 'font-face-format':
      case 'font-face-name':
      case 'missing-glyph':
        return !1;
      default:
        return !0;
    }
  }
  var xa = null;
  function ga(e) {
    return (
      (e = e.target || e.srcElement || window),
      e.correspondingUseElement && (e = e.correspondingUseElement),
      e.nodeType === 3 ? e.parentNode : e
    );
  }
  var va = null,
    on = null,
    ln = null;
  function sc(e) {
    if ((e = ps(e))) {
      if (typeof va != 'function') throw Error(i(280));
      var t = e.stateNode;
      t && ((t = oi(t)), va(e.stateNode, e.type, t));
    }
  }
  function ic(e) {
    on ? (ln ? ln.push(e) : (ln = [e])) : (on = e);
  }
  function ac() {
    if (on) {
      var e = on,
        t = ln;
      if (((ln = on = null), sc(e), t)) for (e = 0; e < t.length; e++) sc(t[e]);
    }
  }
  function oc(e, t) {
    return e(t);
  }
  function lc() {}
  var ya = !1;
  function cc(e, t, r) {
    if (ya) return e(t, r);
    ya = !0;
    try {
      return oc(e, t, r);
    } finally {
      ((ya = !1), (on !== null || ln !== null) && (lc(), ac()));
    }
  }
  function Hn(e, t) {
    var r = e.stateNode;
    if (r === null) return null;
    var o = oi(r);
    if (o === null) return null;
    r = o[t];
    e: switch (t) {
      case 'onClick':
      case 'onClickCapture':
      case 'onDoubleClick':
      case 'onDoubleClickCapture':
      case 'onMouseDown':
      case 'onMouseDownCapture':
      case 'onMouseMove':
      case 'onMouseMoveCapture':
      case 'onMouseUp':
      case 'onMouseUpCapture':
      case 'onMouseEnter':
        ((o = !o.disabled) ||
          ((e = e.type),
          (o = !(e === 'button' || e === 'input' || e === 'select' || e === 'textarea'))),
          (e = !o));
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (r && typeof r != 'function') throw Error(i(231, t, typeof r));
    return r;
  }
  var wa = !1;
  if (h)
    try {
      var Gn = {};
      (Object.defineProperty(Gn, 'passive', {
        get: function () {
          wa = !0;
        },
      }),
        window.addEventListener('test', Gn, Gn),
        window.removeEventListener('test', Gn, Gn));
    } catch {
      wa = !1;
    }
  function wf(e, t, r, o, d, f, x, w, _) {
    var P = Array.prototype.slice.call(arguments, 3);
    try {
      t.apply(r, P);
    } catch (V) {
      this.onError(V);
    }
  }
  var Yn = !1,
    $s = null,
    Us = !1,
    ka = null,
    kf = {
      onError: function (e) {
        ((Yn = !0), ($s = e));
      },
    };
  function bf(e, t, r, o, d, f, x, w, _) {
    ((Yn = !1), ($s = null), wf.apply(kf, arguments));
  }
  function jf(e, t, r, o, d, f, x, w, _) {
    if ((bf.apply(this, arguments), Yn)) {
      if (Yn) {
        var P = $s;
        ((Yn = !1), ($s = null));
      } else throw Error(i(198));
      Us || ((Us = !0), (ka = P));
    }
  }
  function Wr(e) {
    var t = e,
      r = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
      e = t;
      do ((t = e), (t.flags & 4098) !== 0 && (r = t.return), (e = t.return));
      while (e);
    }
    return t.tag === 3 ? r : null;
  }
  function dc(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
        return t.dehydrated;
    }
    return null;
  }
  function uc(e) {
    if (Wr(e) !== e) throw Error(i(188));
  }
  function Nf(e) {
    var t = e.alternate;
    if (!t) {
      if (((t = Wr(e)), t === null)) throw Error(i(188));
      return t !== e ? null : e;
    }
    for (var r = e, o = t; ; ) {
      var d = r.return;
      if (d === null) break;
      var f = d.alternate;
      if (f === null) {
        if (((o = d.return), o !== null)) {
          r = o;
          continue;
        }
        break;
      }
      if (d.child === f.child) {
        for (f = d.child; f; ) {
          if (f === r) return (uc(d), e);
          if (f === o) return (uc(d), t);
          f = f.sibling;
        }
        throw Error(i(188));
      }
      if (r.return !== o.return) ((r = d), (o = f));
      else {
        for (var x = !1, w = d.child; w; ) {
          if (w === r) {
            ((x = !0), (r = d), (o = f));
            break;
          }
          if (w === o) {
            ((x = !0), (o = d), (r = f));
            break;
          }
          w = w.sibling;
        }
        if (!x) {
          for (w = f.child; w; ) {
            if (w === r) {
              ((x = !0), (r = f), (o = d));
              break;
            }
            if (w === o) {
              ((x = !0), (o = f), (r = d));
              break;
            }
            w = w.sibling;
          }
          if (!x) throw Error(i(189));
        }
      }
      if (r.alternate !== o) throw Error(i(190));
    }
    if (r.tag !== 3) throw Error(i(188));
    return r.stateNode.current === r ? e : t;
  }
  function pc(e) {
    return ((e = Nf(e)), e !== null ? fc(e) : null);
  }
  function fc(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
      var t = fc(e);
      if (t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var hc = s.unstable_scheduleCallback,
    mc = s.unstable_cancelCallback,
    _f = s.unstable_shouldYield,
    Cf = s.unstable_requestPaint,
    Ue = s.unstable_now,
    Sf = s.unstable_getCurrentPriorityLevel,
    ba = s.unstable_ImmediatePriority,
    xc = s.unstable_UserBlockingPriority,
    Ws = s.unstable_NormalPriority,
    Ef = s.unstable_LowPriority,
    gc = s.unstable_IdlePriority,
    Bs = null,
    Gt = null;
  function Rf(e) {
    if (Gt && typeof Gt.onCommitFiberRoot == 'function')
      try {
        Gt.onCommitFiberRoot(Bs, e, void 0, (e.current.flags & 128) === 128);
      } catch {}
  }
  var Mt = Math.clz32 ? Math.clz32 : Of,
    Tf = Math.log,
    If = Math.LN2;
  function Of(e) {
    return ((e >>>= 0), e === 0 ? 32 : (31 - ((Tf(e) / If) | 0)) | 0);
  }
  var Fs = 64,
    Vs = 4194304;
  function Zn(e) {
    switch (e & -e) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 4194240;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return e & 130023424;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 1073741824;
      default:
        return e;
    }
  }
  function Hs(e, t) {
    var r = e.pendingLanes;
    if (r === 0) return 0;
    var o = 0,
      d = e.suspendedLanes,
      f = e.pingedLanes,
      x = r & 268435455;
    if (x !== 0) {
      var w = x & ~d;
      w !== 0 ? (o = Zn(w)) : ((f &= x), f !== 0 && (o = Zn(f)));
    } else ((x = r & ~d), x !== 0 ? (o = Zn(x)) : f !== 0 && (o = Zn(f)));
    if (o === 0) return 0;
    if (
      t !== 0 &&
      t !== o &&
      (t & d) === 0 &&
      ((d = o & -o), (f = t & -t), d >= f || (d === 16 && (f & 4194240) !== 0))
    )
      return t;
    if (((o & 4) !== 0 && (o |= r & 16), (t = e.entangledLanes), t !== 0))
      for (e = e.entanglements, t &= o; 0 < t; )
        ((r = 31 - Mt(t)), (d = 1 << r), (o |= e[r]), (t &= ~d));
    return o;
  }
  function Af(e, t) {
    switch (e) {
      case 1:
      case 2:
      case 4:
        return t + 250;
      case 8:
      case 16:
      case 32:
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return -1;
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function Lf(e, t) {
    for (
      var r = e.suspendedLanes, o = e.pingedLanes, d = e.expirationTimes, f = e.pendingLanes;
      0 < f;
    ) {
      var x = 31 - Mt(f),
        w = 1 << x,
        _ = d[x];
      (_ === -1
        ? ((w & r) === 0 || (w & o) !== 0) && (d[x] = Af(w, t))
        : _ <= t && (e.expiredLanes |= w),
        (f &= ~w));
    }
  }
  function ja(e) {
    return ((e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0);
  }
  function vc() {
    var e = Fs;
    return ((Fs <<= 1), (Fs & 4194240) === 0 && (Fs = 64), e);
  }
  function Na(e) {
    for (var t = [], r = 0; 31 > r; r++) t.push(e);
    return t;
  }
  function Kn(e, t, r) {
    ((e.pendingLanes |= t),
      t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
      (e = e.eventTimes),
      (t = 31 - Mt(t)),
      (e[t] = r));
  }
  function Mf(e, t) {
    var r = e.pendingLanes & ~t;
    ((e.pendingLanes = t),
      (e.suspendedLanes = 0),
      (e.pingedLanes = 0),
      (e.expiredLanes &= t),
      (e.mutableReadLanes &= t),
      (e.entangledLanes &= t),
      (t = e.entanglements));
    var o = e.eventTimes;
    for (e = e.expirationTimes; 0 < r; ) {
      var d = 31 - Mt(r),
        f = 1 << d;
      ((t[d] = 0), (o[d] = -1), (e[d] = -1), (r &= ~f));
    }
  }
  function _a(e, t) {
    var r = (e.entangledLanes |= t);
    for (e = e.entanglements; r; ) {
      var o = 31 - Mt(r),
        d = 1 << o;
      ((d & t) | (e[o] & t) && (e[o] |= t), (r &= ~d));
    }
  }
  var Re = 0;
  function yc(e) {
    return ((e &= -e), 1 < e ? (4 < e ? ((e & 268435455) !== 0 ? 16 : 536870912) : 4) : 1);
  }
  var wc,
    Ca,
    kc,
    bc,
    jc,
    Sa = !1,
    Gs = [],
    ur = null,
    pr = null,
    fr = null,
    qn = new Map(),
    Qn = new Map(),
    hr = [],
    Pf =
      'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
        ' ',
      );
  function Nc(e, t) {
    switch (e) {
      case 'focusin':
      case 'focusout':
        ur = null;
        break;
      case 'dragenter':
      case 'dragleave':
        pr = null;
        break;
      case 'mouseover':
      case 'mouseout':
        fr = null;
        break;
      case 'pointerover':
      case 'pointerout':
        qn.delete(t.pointerId);
        break;
      case 'gotpointercapture':
      case 'lostpointercapture':
        Qn.delete(t.pointerId);
    }
  }
  function Xn(e, t, r, o, d, f) {
    return e === null || e.nativeEvent !== f
      ? ((e = {
          blockedOn: t,
          domEventName: r,
          eventSystemFlags: o,
          nativeEvent: f,
          targetContainers: [d],
        }),
        t !== null && ((t = ps(t)), t !== null && Ca(t)),
        e)
      : ((e.eventSystemFlags |= o),
        (t = e.targetContainers),
        d !== null && t.indexOf(d) === -1 && t.push(d),
        e);
  }
  function Df(e, t, r, o, d) {
    switch (t) {
      case 'focusin':
        return ((ur = Xn(ur, e, t, r, o, d)), !0);
      case 'dragenter':
        return ((pr = Xn(pr, e, t, r, o, d)), !0);
      case 'mouseover':
        return ((fr = Xn(fr, e, t, r, o, d)), !0);
      case 'pointerover':
        var f = d.pointerId;
        return (qn.set(f, Xn(qn.get(f) || null, e, t, r, o, d)), !0);
      case 'gotpointercapture':
        return ((f = d.pointerId), Qn.set(f, Xn(Qn.get(f) || null, e, t, r, o, d)), !0);
    }
    return !1;
  }
  function _c(e) {
    var t = Br(e.target);
    if (t !== null) {
      var r = Wr(t);
      if (r !== null) {
        if (((t = r.tag), t === 13)) {
          if (((t = dc(r)), t !== null)) {
            ((e.blockedOn = t),
              jc(e.priority, function () {
                kc(r);
              }));
            return;
          }
        } else if (t === 3 && r.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = r.tag === 3 ? r.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function Ys(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var r = Ra(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
      if (r === null) {
        r = e.nativeEvent;
        var o = new r.constructor(r.type, r);
        ((xa = o), r.target.dispatchEvent(o), (xa = null));
      } else return ((t = ps(r)), t !== null && Ca(t), (e.blockedOn = r), !1);
      t.shift();
    }
    return !0;
  }
  function Cc(e, t, r) {
    Ys(e) && r.delete(t);
  }
  function zf() {
    ((Sa = !1),
      ur !== null && Ys(ur) && (ur = null),
      pr !== null && Ys(pr) && (pr = null),
      fr !== null && Ys(fr) && (fr = null),
      qn.forEach(Cc),
      Qn.forEach(Cc));
  }
  function Jn(e, t) {
    e.blockedOn === t &&
      ((e.blockedOn = null),
      Sa || ((Sa = !0), s.unstable_scheduleCallback(s.unstable_NormalPriority, zf)));
  }
  function es(e) {
    function t(d) {
      return Jn(d, e);
    }
    if (0 < Gs.length) {
      Jn(Gs[0], e);
      for (var r = 1; r < Gs.length; r++) {
        var o = Gs[r];
        o.blockedOn === e && (o.blockedOn = null);
      }
    }
    for (
      ur !== null && Jn(ur, e),
        pr !== null && Jn(pr, e),
        fr !== null && Jn(fr, e),
        qn.forEach(t),
        Qn.forEach(t),
        r = 0;
      r < hr.length;
      r++
    )
      ((o = hr[r]), o.blockedOn === e && (o.blockedOn = null));
    for (; 0 < hr.length && ((r = hr[0]), r.blockedOn === null); )
      (_c(r), r.blockedOn === null && hr.shift());
  }
  var cn = G.ReactCurrentBatchConfig,
    Zs = !0;
  function $f(e, t, r, o) {
    var d = Re,
      f = cn.transition;
    cn.transition = null;
    try {
      ((Re = 1), Ea(e, t, r, o));
    } finally {
      ((Re = d), (cn.transition = f));
    }
  }
  function Uf(e, t, r, o) {
    var d = Re,
      f = cn.transition;
    cn.transition = null;
    try {
      ((Re = 4), Ea(e, t, r, o));
    } finally {
      ((Re = d), (cn.transition = f));
    }
  }
  function Ea(e, t, r, o) {
    if (Zs) {
      var d = Ra(e, t, r, o);
      if (d === null) (Ga(e, t, o, Ks, r), Nc(e, o));
      else if (Df(d, e, t, r, o)) o.stopPropagation();
      else if ((Nc(e, o), t & 4 && -1 < Pf.indexOf(e))) {
        for (; d !== null; ) {
          var f = ps(d);
          if (
            (f !== null && wc(f), (f = Ra(e, t, r, o)), f === null && Ga(e, t, o, Ks, r), f === d)
          )
            break;
          d = f;
        }
        d !== null && o.stopPropagation();
      } else Ga(e, t, o, null, r);
    }
  }
  var Ks = null;
  function Ra(e, t, r, o) {
    if (((Ks = null), (e = ga(o)), (e = Br(e)), e !== null))
      if (((t = Wr(e)), t === null)) e = null;
      else if (((r = t.tag), r === 13)) {
        if (((e = dc(t)), e !== null)) return e;
        e = null;
      } else if (r === 3) {
        if (t.stateNode.current.memoizedState.isDehydrated)
          return t.tag === 3 ? t.stateNode.containerInfo : null;
        e = null;
      } else t !== e && (e = null);
    return ((Ks = e), null);
  }
  function Sc(e) {
    switch (e) {
      case 'cancel':
      case 'click':
      case 'close':
      case 'contextmenu':
      case 'copy':
      case 'cut':
      case 'auxclick':
      case 'dblclick':
      case 'dragend':
      case 'dragstart':
      case 'drop':
      case 'focusin':
      case 'focusout':
      case 'input':
      case 'invalid':
      case 'keydown':
      case 'keypress':
      case 'keyup':
      case 'mousedown':
      case 'mouseup':
      case 'paste':
      case 'pause':
      case 'play':
      case 'pointercancel':
      case 'pointerdown':
      case 'pointerup':
      case 'ratechange':
      case 'reset':
      case 'resize':
      case 'seeked':
      case 'submit':
      case 'touchcancel':
      case 'touchend':
      case 'touchstart':
      case 'volumechange':
      case 'change':
      case 'selectionchange':
      case 'textInput':
      case 'compositionstart':
      case 'compositionend':
      case 'compositionupdate':
      case 'beforeblur':
      case 'afterblur':
      case 'beforeinput':
      case 'blur':
      case 'fullscreenchange':
      case 'focus':
      case 'hashchange':
      case 'popstate':
      case 'select':
      case 'selectstart':
        return 1;
      case 'drag':
      case 'dragenter':
      case 'dragexit':
      case 'dragleave':
      case 'dragover':
      case 'mousemove':
      case 'mouseout':
      case 'mouseover':
      case 'pointermove':
      case 'pointerout':
      case 'pointerover':
      case 'scroll':
      case 'toggle':
      case 'touchmove':
      case 'wheel':
      case 'mouseenter':
      case 'mouseleave':
      case 'pointerenter':
      case 'pointerleave':
        return 4;
      case 'message':
        switch (Sf()) {
          case ba:
            return 1;
          case xc:
            return 4;
          case Ws:
          case Ef:
            return 16;
          case gc:
            return 536870912;
          default:
            return 16;
        }
      default:
        return 16;
    }
  }
  var mr = null,
    Ta = null,
    qs = null;
  function Ec() {
    if (qs) return qs;
    var e,
      t = Ta,
      r = t.length,
      o,
      d = 'value' in mr ? mr.value : mr.textContent,
      f = d.length;
    for (e = 0; e < r && t[e] === d[e]; e++);
    var x = r - e;
    for (o = 1; o <= x && t[r - o] === d[f - o]; o++);
    return (qs = d.slice(e, 1 < o ? 1 - o : void 0));
  }
  function Qs(e) {
    var t = e.keyCode;
    return (
      'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
      e === 10 && (e = 13),
      32 <= e || e === 13 ? e : 0
    );
  }
  function Xs() {
    return !0;
  }
  function Rc() {
    return !1;
  }
  function bt(e) {
    function t(r, o, d, f, x) {
      ((this._reactName = r),
        (this._targetInst = d),
        (this.type = o),
        (this.nativeEvent = f),
        (this.target = x),
        (this.currentTarget = null));
      for (var w in e) e.hasOwnProperty(w) && ((r = e[w]), (this[w] = r ? r(f) : f[w]));
      return (
        (this.isDefaultPrevented = (
          f.defaultPrevented != null ? f.defaultPrevented : f.returnValue === !1
        )
          ? Xs
          : Rc),
        (this.isPropagationStopped = Rc),
        this
      );
    }
    return (
      L(t.prototype, {
        preventDefault: function () {
          this.defaultPrevented = !0;
          var r = this.nativeEvent;
          r &&
            (r.preventDefault
              ? r.preventDefault()
              : typeof r.returnValue != 'unknown' && (r.returnValue = !1),
            (this.isDefaultPrevented = Xs));
        },
        stopPropagation: function () {
          var r = this.nativeEvent;
          r &&
            (r.stopPropagation
              ? r.stopPropagation()
              : typeof r.cancelBubble != 'unknown' && (r.cancelBubble = !0),
            (this.isPropagationStopped = Xs));
        },
        persist: function () {},
        isPersistent: Xs,
      }),
      t
    );
  }
  var dn = {
      eventPhase: 0,
      bubbles: 0,
      cancelable: 0,
      timeStamp: function (e) {
        return e.timeStamp || Date.now();
      },
      defaultPrevented: 0,
      isTrusted: 0,
    },
    Ia = bt(dn),
    ts = L({}, dn, { view: 0, detail: 0 }),
    Wf = bt(ts),
    Oa,
    Aa,
    rs,
    Js = L({}, ts, {
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      getModifierState: Ma,
      button: 0,
      buttons: 0,
      relatedTarget: function (e) {
        return e.relatedTarget === void 0
          ? e.fromElement === e.srcElement
            ? e.toElement
            : e.fromElement
          : e.relatedTarget;
      },
      movementX: function (e) {
        return 'movementX' in e
          ? e.movementX
          : (e !== rs &&
              (rs && e.type === 'mousemove'
                ? ((Oa = e.screenX - rs.screenX), (Aa = e.screenY - rs.screenY))
                : (Aa = Oa = 0),
              (rs = e)),
            Oa);
      },
      movementY: function (e) {
        return 'movementY' in e ? e.movementY : Aa;
      },
    }),
    Tc = bt(Js),
    Bf = L({}, Js, { dataTransfer: 0 }),
    Ff = bt(Bf),
    Vf = L({}, ts, { relatedTarget: 0 }),
    La = bt(Vf),
    Hf = L({}, dn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Gf = bt(Hf),
    Yf = L({}, dn, {
      clipboardData: function (e) {
        return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
      },
    }),
    Zf = bt(Yf),
    Kf = L({}, dn, { data: 0 }),
    Ic = bt(Kf),
    qf = {
      Esc: 'Escape',
      Spacebar: ' ',
      Left: 'ArrowLeft',
      Up: 'ArrowUp',
      Right: 'ArrowRight',
      Down: 'ArrowDown',
      Del: 'Delete',
      Win: 'OS',
      Menu: 'ContextMenu',
      Apps: 'ContextMenu',
      Scroll: 'ScrollLock',
      MozPrintableKey: 'Unidentified',
    },
    Qf = {
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      45: 'Insert',
      46: 'Delete',
      112: 'F1',
      113: 'F2',
      114: 'F3',
      115: 'F4',
      116: 'F5',
      117: 'F6',
      118: 'F7',
      119: 'F8',
      120: 'F9',
      121: 'F10',
      122: 'F11',
      123: 'F12',
      144: 'NumLock',
      145: 'ScrollLock',
      224: 'Meta',
    },
    Xf = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
  function Jf(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = Xf[e]) ? !!t[e] : !1;
  }
  function Ma() {
    return Jf;
  }
  var eh = L({}, ts, {
      key: function (e) {
        if (e.key) {
          var t = qf[e.key] || e.key;
          if (t !== 'Unidentified') return t;
        }
        return e.type === 'keypress'
          ? ((e = Qs(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
          : e.type === 'keydown' || e.type === 'keyup'
            ? Qf[e.keyCode] || 'Unidentified'
            : '';
      },
      code: 0,
      location: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      repeat: 0,
      locale: 0,
      getModifierState: Ma,
      charCode: function (e) {
        return e.type === 'keypress' ? Qs(e) : 0;
      },
      keyCode: function (e) {
        return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
      },
      which: function (e) {
        return e.type === 'keypress'
          ? Qs(e)
          : e.type === 'keydown' || e.type === 'keyup'
            ? e.keyCode
            : 0;
      },
    }),
    th = bt(eh),
    rh = L({}, Js, {
      pointerId: 0,
      width: 0,
      height: 0,
      pressure: 0,
      tangentialPressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: 0,
      isPrimary: 0,
    }),
    Oc = bt(rh),
    nh = L({}, ts, {
      touches: 0,
      targetTouches: 0,
      changedTouches: 0,
      altKey: 0,
      metaKey: 0,
      ctrlKey: 0,
      shiftKey: 0,
      getModifierState: Ma,
    }),
    sh = bt(nh),
    ih = L({}, dn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    ah = bt(ih),
    oh = L({}, Js, {
      deltaX: function (e) {
        return 'deltaX' in e ? e.deltaX : 'wheelDeltaX' in e ? -e.wheelDeltaX : 0;
      },
      deltaY: function (e) {
        return 'deltaY' in e
          ? e.deltaY
          : 'wheelDeltaY' in e
            ? -e.wheelDeltaY
            : 'wheelDelta' in e
              ? -e.wheelDelta
              : 0;
      },
      deltaZ: 0,
      deltaMode: 0,
    }),
    lh = bt(oh),
    ch = [9, 13, 27, 32],
    Pa = h && 'CompositionEvent' in window,
    ns = null;
  h && 'documentMode' in document && (ns = document.documentMode);
  var dh = h && 'TextEvent' in window && !ns,
    Ac = h && (!Pa || (ns && 8 < ns && 11 >= ns)),
    Lc = ' ',
    Mc = !1;
  function Pc(e, t) {
    switch (e) {
      case 'keyup':
        return ch.indexOf(t.keyCode) !== -1;
      case 'keydown':
        return t.keyCode !== 229;
      case 'keypress':
      case 'mousedown':
      case 'focusout':
        return !0;
      default:
        return !1;
    }
  }
  function Dc(e) {
    return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null);
  }
  var un = !1;
  function uh(e, t) {
    switch (e) {
      case 'compositionend':
        return Dc(t);
      case 'keypress':
        return t.which !== 32 ? null : ((Mc = !0), Lc);
      case 'textInput':
        return ((e = t.data), e === Lc && Mc ? null : e);
      default:
        return null;
    }
  }
  function ph(e, t) {
    if (un)
      return e === 'compositionend' || (!Pa && Pc(e, t))
        ? ((e = Ec()), (qs = Ta = mr = null), (un = !1), e)
        : null;
    switch (e) {
      case 'paste':
        return null;
      case 'keypress':
        if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
          if (t.char && 1 < t.char.length) return t.char;
          if (t.which) return String.fromCharCode(t.which);
        }
        return null;
      case 'compositionend':
        return Ac && t.locale !== 'ko' ? null : t.data;
      default:
        return null;
    }
  }
  var fh = {
    color: !0,
    date: !0,
    datetime: !0,
    'datetime-local': !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0,
  };
  function zc(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === 'input' ? !!fh[e.type] : t === 'textarea';
  }
  function $c(e, t, r, o) {
    (ic(o),
      (t = si(t, 'onChange')),
      0 < t.length &&
        ((r = new Ia('onChange', 'change', null, r, o)), e.push({ event: r, listeners: t })));
  }
  var ss = null,
    is = null;
  function hh(e) {
    nd(e, 0);
  }
  function ei(e) {
    var t = xn(e);
    if (ue(t)) return e;
  }
  function mh(e, t) {
    if (e === 'change') return t;
  }
  var Uc = !1;
  if (h) {
    var Da;
    if (h) {
      var za = 'oninput' in document;
      if (!za) {
        var Wc = document.createElement('div');
        (Wc.setAttribute('oninput', 'return;'), (za = typeof Wc.oninput == 'function'));
      }
      Da = za;
    } else Da = !1;
    Uc = Da && (!document.documentMode || 9 < document.documentMode);
  }
  function Bc() {
    ss && (ss.detachEvent('onpropertychange', Fc), (is = ss = null));
  }
  function Fc(e) {
    if (e.propertyName === 'value' && ei(is)) {
      var t = [];
      ($c(t, is, e, ga(e)), cc(hh, t));
    }
  }
  function xh(e, t, r) {
    e === 'focusin'
      ? (Bc(), (ss = t), (is = r), ss.attachEvent('onpropertychange', Fc))
      : e === 'focusout' && Bc();
  }
  function gh(e) {
    if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return ei(is);
  }
  function vh(e, t) {
    if (e === 'click') return ei(t);
  }
  function yh(e, t) {
    if (e === 'input' || e === 'change') return ei(t);
  }
  function wh(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
  }
  var Pt = typeof Object.is == 'function' ? Object.is : wh;
  function as(e, t) {
    if (Pt(e, t)) return !0;
    if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1;
    var r = Object.keys(e),
      o = Object.keys(t);
    if (r.length !== o.length) return !1;
    for (o = 0; o < r.length; o++) {
      var d = r[o];
      if (!m.call(t, d) || !Pt(e[d], t[d])) return !1;
    }
    return !0;
  }
  function Vc(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Hc(e, t) {
    var r = Vc(e);
    e = 0;
    for (var o; r; ) {
      if (r.nodeType === 3) {
        if (((o = e + r.textContent.length), e <= t && o >= t)) return { node: r, offset: t - e };
        e = o;
      }
      e: {
        for (; r; ) {
          if (r.nextSibling) {
            r = r.nextSibling;
            break e;
          }
          r = r.parentNode;
        }
        r = void 0;
      }
      r = Vc(r);
    }
  }
  function Gc(e, t) {
    return e && t
      ? e === t
        ? !0
        : e && e.nodeType === 3
          ? !1
          : t && t.nodeType === 3
            ? Gc(e, t.parentNode)
            : 'contains' in e
              ? e.contains(t)
              : e.compareDocumentPosition
                ? !!(e.compareDocumentPosition(t) & 16)
                : !1
      : !1;
  }
  function Yc() {
    for (var e = window, t = rt(); t instanceof e.HTMLIFrameElement; ) {
      try {
        var r = typeof t.contentWindow.location.href == 'string';
      } catch {
        r = !1;
      }
      if (r) e = t.contentWindow;
      else break;
      t = rt(e.document);
    }
    return t;
  }
  function $a(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return (
      t &&
      ((t === 'input' &&
        (e.type === 'text' ||
          e.type === 'search' ||
          e.type === 'tel' ||
          e.type === 'url' ||
          e.type === 'password')) ||
        t === 'textarea' ||
        e.contentEditable === 'true')
    );
  }
  function kh(e) {
    var t = Yc(),
      r = e.focusedElem,
      o = e.selectionRange;
    if (t !== r && r && r.ownerDocument && Gc(r.ownerDocument.documentElement, r)) {
      if (o !== null && $a(r)) {
        if (((t = o.start), (e = o.end), e === void 0 && (e = t), 'selectionStart' in r))
          ((r.selectionStart = t), (r.selectionEnd = Math.min(e, r.value.length)));
        else if (
          ((e = ((t = r.ownerDocument || document) && t.defaultView) || window), e.getSelection)
        ) {
          e = e.getSelection();
          var d = r.textContent.length,
            f = Math.min(o.start, d);
          ((o = o.end === void 0 ? f : Math.min(o.end, d)),
            !e.extend && f > o && ((d = o), (o = f), (f = d)),
            (d = Hc(r, f)));
          var x = Hc(r, o);
          d &&
            x &&
            (e.rangeCount !== 1 ||
              e.anchorNode !== d.node ||
              e.anchorOffset !== d.offset ||
              e.focusNode !== x.node ||
              e.focusOffset !== x.offset) &&
            ((t = t.createRange()),
            t.setStart(d.node, d.offset),
            e.removeAllRanges(),
            f > o
              ? (e.addRange(t), e.extend(x.node, x.offset))
              : (t.setEnd(x.node, x.offset), e.addRange(t)));
        }
      }
      for (t = [], e = r; (e = e.parentNode); )
        e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
      for (typeof r.focus == 'function' && r.focus(), r = 0; r < t.length; r++)
        ((e = t[r]), (e.element.scrollLeft = e.left), (e.element.scrollTop = e.top));
    }
  }
  var bh = h && 'documentMode' in document && 11 >= document.documentMode,
    pn = null,
    Ua = null,
    os = null,
    Wa = !1;
  function Zc(e, t, r) {
    var o = r.window === r ? r.document : r.nodeType === 9 ? r : r.ownerDocument;
    Wa ||
      pn == null ||
      pn !== rt(o) ||
      ((o = pn),
      'selectionStart' in o && $a(o)
        ? (o = { start: o.selectionStart, end: o.selectionEnd })
        : ((o = ((o.ownerDocument && o.ownerDocument.defaultView) || window).getSelection()),
          (o = {
            anchorNode: o.anchorNode,
            anchorOffset: o.anchorOffset,
            focusNode: o.focusNode,
            focusOffset: o.focusOffset,
          })),
      (os && as(os, o)) ||
        ((os = o),
        (o = si(Ua, 'onSelect')),
        0 < o.length &&
          ((t = new Ia('onSelect', 'select', null, t, r)),
          e.push({ event: t, listeners: o }),
          (t.target = pn))));
  }
  function ti(e, t) {
    var r = {};
    return (
      (r[e.toLowerCase()] = t.toLowerCase()),
      (r['Webkit' + e] = 'webkit' + t),
      (r['Moz' + e] = 'moz' + t),
      r
    );
  }
  var fn = {
      animationend: ti('Animation', 'AnimationEnd'),
      animationiteration: ti('Animation', 'AnimationIteration'),
      animationstart: ti('Animation', 'AnimationStart'),
      transitionend: ti('Transition', 'TransitionEnd'),
    },
    Ba = {},
    Kc = {};
  h &&
    ((Kc = document.createElement('div').style),
    'AnimationEvent' in window ||
      (delete fn.animationend.animation,
      delete fn.animationiteration.animation,
      delete fn.animationstart.animation),
    'TransitionEvent' in window || delete fn.transitionend.transition);
  function ri(e) {
    if (Ba[e]) return Ba[e];
    if (!fn[e]) return e;
    var t = fn[e],
      r;
    for (r in t) if (t.hasOwnProperty(r) && r in Kc) return (Ba[e] = t[r]);
    return e;
  }
  var qc = ri('animationend'),
    Qc = ri('animationiteration'),
    Xc = ri('animationstart'),
    Jc = ri('transitionend'),
    ed = new Map(),
    td =
      'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
        ' ',
      );
  function xr(e, t) {
    (ed.set(e, t), u(t, [e]));
  }
  for (var Fa = 0; Fa < td.length; Fa++) {
    var Va = td[Fa],
      jh = Va.toLowerCase(),
      Nh = Va[0].toUpperCase() + Va.slice(1);
    xr(jh, 'on' + Nh);
  }
  (xr(qc, 'onAnimationEnd'),
    xr(Qc, 'onAnimationIteration'),
    xr(Xc, 'onAnimationStart'),
    xr('dblclick', 'onDoubleClick'),
    xr('focusin', 'onFocus'),
    xr('focusout', 'onBlur'),
    xr(Jc, 'onTransitionEnd'),
    p('onMouseEnter', ['mouseout', 'mouseover']),
    p('onMouseLeave', ['mouseout', 'mouseover']),
    p('onPointerEnter', ['pointerout', 'pointerover']),
    p('onPointerLeave', ['pointerout', 'pointerover']),
    u('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' ')),
    u(
      'onSelect',
      'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(
        ' ',
      ),
    ),
    u('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']),
    u('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' ')),
    u(
      'onCompositionStart',
      'compositionstart focusout keydown keypress keyup mousedown'.split(' '),
    ),
    u(
      'onCompositionUpdate',
      'compositionupdate focusout keydown keypress keyup mousedown'.split(' '),
    ));
  var ls =
      'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
        ' ',
      ),
    _h = new Set('cancel close invalid load scroll toggle'.split(' ').concat(ls));
  function rd(e, t, r) {
    var o = e.type || 'unknown-event';
    ((e.currentTarget = r), jf(o, t, void 0, e), (e.currentTarget = null));
  }
  function nd(e, t) {
    t = (t & 4) !== 0;
    for (var r = 0; r < e.length; r++) {
      var o = e[r],
        d = o.event;
      o = o.listeners;
      e: {
        var f = void 0;
        if (t)
          for (var x = o.length - 1; 0 <= x; x--) {
            var w = o[x],
              _ = w.instance,
              P = w.currentTarget;
            if (((w = w.listener), _ !== f && d.isPropagationStopped())) break e;
            (rd(d, w, P), (f = _));
          }
        else
          for (x = 0; x < o.length; x++) {
            if (
              ((w = o[x]),
              (_ = w.instance),
              (P = w.currentTarget),
              (w = w.listener),
              _ !== f && d.isPropagationStopped())
            )
              break e;
            (rd(d, w, P), (f = _));
          }
      }
    }
    if (Us) throw ((e = ka), (Us = !1), (ka = null), e);
  }
  function Oe(e, t) {
    var r = t[Xa];
    r === void 0 && (r = t[Xa] = new Set());
    var o = e + '__bubble';
    r.has(o) || (sd(t, e, 2, !1), r.add(o));
  }
  function Ha(e, t, r) {
    var o = 0;
    (t && (o |= 4), sd(r, e, o, t));
  }
  var ni = '_reactListening' + Math.random().toString(36).slice(2);
  function cs(e) {
    if (!e[ni]) {
      ((e[ni] = !0),
        l.forEach(function (r) {
          r !== 'selectionchange' && (_h.has(r) || Ha(r, !1, e), Ha(r, !0, e));
        }));
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[ni] || ((t[ni] = !0), Ha('selectionchange', !1, t));
    }
  }
  function sd(e, t, r, o) {
    switch (Sc(t)) {
      case 1:
        var d = $f;
        break;
      case 4:
        d = Uf;
        break;
      default:
        d = Ea;
    }
    ((r = d.bind(null, t, r, e)),
      (d = void 0),
      !wa || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (d = !0),
      o
        ? d !== void 0
          ? e.addEventListener(t, r, { capture: !0, passive: d })
          : e.addEventListener(t, r, !0)
        : d !== void 0
          ? e.addEventListener(t, r, { passive: d })
          : e.addEventListener(t, r, !1));
  }
  function Ga(e, t, r, o, d) {
    var f = o;
    if ((t & 1) === 0 && (t & 2) === 0 && o !== null)
      e: for (;;) {
        if (o === null) return;
        var x = o.tag;
        if (x === 3 || x === 4) {
          var w = o.stateNode.containerInfo;
          if (w === d || (w.nodeType === 8 && w.parentNode === d)) break;
          if (x === 4)
            for (x = o.return; x !== null; ) {
              var _ = x.tag;
              if (
                (_ === 3 || _ === 4) &&
                ((_ = x.stateNode.containerInfo),
                _ === d || (_.nodeType === 8 && _.parentNode === d))
              )
                return;
              x = x.return;
            }
          for (; w !== null; ) {
            if (((x = Br(w)), x === null)) return;
            if (((_ = x.tag), _ === 5 || _ === 6)) {
              o = f = x;
              continue e;
            }
            w = w.parentNode;
          }
        }
        o = o.return;
      }
    cc(function () {
      var P = f,
        V = ga(r),
        H = [];
      e: {
        var F = ed.get(e);
        if (F !== void 0) {
          var J = Ia,
            re = e;
          switch (e) {
            case 'keypress':
              if (Qs(r) === 0) break e;
            case 'keydown':
            case 'keyup':
              J = th;
              break;
            case 'focusin':
              ((re = 'focus'), (J = La));
              break;
            case 'focusout':
              ((re = 'blur'), (J = La));
              break;
            case 'beforeblur':
            case 'afterblur':
              J = La;
              break;
            case 'click':
              if (r.button === 2) break e;
            case 'auxclick':
            case 'dblclick':
            case 'mousedown':
            case 'mousemove':
            case 'mouseup':
            case 'mouseout':
            case 'mouseover':
            case 'contextmenu':
              J = Tc;
              break;
            case 'drag':
            case 'dragend':
            case 'dragenter':
            case 'dragexit':
            case 'dragleave':
            case 'dragover':
            case 'dragstart':
            case 'drop':
              J = Ff;
              break;
            case 'touchcancel':
            case 'touchend':
            case 'touchmove':
            case 'touchstart':
              J = sh;
              break;
            case qc:
            case Qc:
            case Xc:
              J = Gf;
              break;
            case Jc:
              J = ah;
              break;
            case 'scroll':
              J = Wf;
              break;
            case 'wheel':
              J = lh;
              break;
            case 'copy':
            case 'cut':
            case 'paste':
              J = Zf;
              break;
            case 'gotpointercapture':
            case 'lostpointercapture':
            case 'pointercancel':
            case 'pointerdown':
            case 'pointermove':
            case 'pointerout':
            case 'pointerover':
            case 'pointerup':
              J = Oc;
          }
          var se = (t & 4) !== 0,
            We = !se && e === 'scroll',
            O = se ? (F !== null ? F + 'Capture' : null) : F;
          se = [];
          for (var I = P, A; I !== null; ) {
            A = I;
            var Z = A.stateNode;
            if (
              (A.tag === 5 &&
                Z !== null &&
                ((A = Z), O !== null && ((Z = Hn(I, O)), Z != null && se.push(ds(I, Z, A)))),
              We)
            )
              break;
            I = I.return;
          }
          0 < se.length && ((F = new J(F, re, null, r, V)), H.push({ event: F, listeners: se }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (
            ((F = e === 'mouseover' || e === 'pointerover'),
            (J = e === 'mouseout' || e === 'pointerout'),
            F && r !== xa && (re = r.relatedTarget || r.fromElement) && (Br(re) || re[tr]))
          )
            break e;
          if (
            (J || F) &&
            ((F =
              V.window === V
                ? V
                : (F = V.ownerDocument)
                  ? F.defaultView || F.parentWindow
                  : window),
            J
              ? ((re = r.relatedTarget || r.toElement),
                (J = P),
                (re = re ? Br(re) : null),
                re !== null &&
                  ((We = Wr(re)), re !== We || (re.tag !== 5 && re.tag !== 6)) &&
                  (re = null))
              : ((J = null), (re = P)),
            J !== re)
          ) {
            if (
              ((se = Tc),
              (Z = 'onMouseLeave'),
              (O = 'onMouseEnter'),
              (I = 'mouse'),
              (e === 'pointerout' || e === 'pointerover') &&
                ((se = Oc), (Z = 'onPointerLeave'), (O = 'onPointerEnter'), (I = 'pointer')),
              (We = J == null ? F : xn(J)),
              (A = re == null ? F : xn(re)),
              (F = new se(Z, I + 'leave', J, r, V)),
              (F.target = We),
              (F.relatedTarget = A),
              (Z = null),
              Br(V) === P &&
                ((se = new se(O, I + 'enter', re, r, V)),
                (se.target = A),
                (se.relatedTarget = We),
                (Z = se)),
              (We = Z),
              J && re)
            )
              t: {
                for (se = J, O = re, I = 0, A = se; A; A = hn(A)) I++;
                for (A = 0, Z = O; Z; Z = hn(Z)) A++;
                for (; 0 < I - A; ) ((se = hn(se)), I--);
                for (; 0 < A - I; ) ((O = hn(O)), A--);
                for (; I--; ) {
                  if (se === O || (O !== null && se === O.alternate)) break t;
                  ((se = hn(se)), (O = hn(O)));
                }
                se = null;
              }
            else se = null;
            (J !== null && id(H, F, J, se, !1),
              re !== null && We !== null && id(H, We, re, se, !0));
          }
        }
        e: {
          if (
            ((F = P ? xn(P) : window),
            (J = F.nodeName && F.nodeName.toLowerCase()),
            J === 'select' || (J === 'input' && F.type === 'file'))
          )
            var ie = mh;
          else if (zc(F))
            if (Uc) ie = yh;
            else {
              ie = gh;
              var ce = xh;
            }
          else
            (J = F.nodeName) &&
              J.toLowerCase() === 'input' &&
              (F.type === 'checkbox' || F.type === 'radio') &&
              (ie = vh);
          if (ie && (ie = ie(e, P))) {
            $c(H, ie, r, V);
            break e;
          }
          (ce && ce(e, F, P),
            e === 'focusout' &&
              (ce = F._wrapperState) &&
              ce.controlled &&
              F.type === 'number' &&
              ua(F, 'number', F.value));
        }
        switch (((ce = P ? xn(P) : window), e)) {
          case 'focusin':
            (zc(ce) || ce.contentEditable === 'true') && ((pn = ce), (Ua = P), (os = null));
            break;
          case 'focusout':
            os = Ua = pn = null;
            break;
          case 'mousedown':
            Wa = !0;
            break;
          case 'contextmenu':
          case 'mouseup':
          case 'dragend':
            ((Wa = !1), Zc(H, r, V));
            break;
          case 'selectionchange':
            if (bh) break;
          case 'keydown':
          case 'keyup':
            Zc(H, r, V);
        }
        var de;
        if (Pa)
          e: {
            switch (e) {
              case 'compositionstart':
                var he = 'onCompositionStart';
                break e;
              case 'compositionend':
                he = 'onCompositionEnd';
                break e;
              case 'compositionupdate':
                he = 'onCompositionUpdate';
                break e;
            }
            he = void 0;
          }
        else
          un
            ? Pc(e, r) && (he = 'onCompositionEnd')
            : e === 'keydown' && r.keyCode === 229 && (he = 'onCompositionStart');
        (he &&
          (Ac &&
            r.locale !== 'ko' &&
            (un || he !== 'onCompositionStart'
              ? he === 'onCompositionEnd' && un && (de = Ec())
              : ((mr = V), (Ta = 'value' in mr ? mr.value : mr.textContent), (un = !0))),
          (ce = si(P, he)),
          0 < ce.length &&
            ((he = new Ic(he, e, null, r, V)),
            H.push({ event: he, listeners: ce }),
            de ? (he.data = de) : ((de = Dc(r)), de !== null && (he.data = de)))),
          (de = dh ? uh(e, r) : ph(e, r)) &&
            ((P = si(P, 'onBeforeInput')),
            0 < P.length &&
              ((V = new Ic('onBeforeInput', 'beforeinput', null, r, V)),
              H.push({ event: V, listeners: P }),
              (V.data = de))));
      }
      nd(H, t);
    });
  }
  function ds(e, t, r) {
    return { instance: e, listener: t, currentTarget: r };
  }
  function si(e, t) {
    for (var r = t + 'Capture', o = []; e !== null; ) {
      var d = e,
        f = d.stateNode;
      (d.tag === 5 &&
        f !== null &&
        ((d = f),
        (f = Hn(e, r)),
        f != null && o.unshift(ds(e, f, d)),
        (f = Hn(e, t)),
        f != null && o.push(ds(e, f, d))),
        (e = e.return));
    }
    return o;
  }
  function hn(e) {
    if (e === null) return null;
    do e = e.return;
    while (e && e.tag !== 5);
    return e || null;
  }
  function id(e, t, r, o, d) {
    for (var f = t._reactName, x = []; r !== null && r !== o; ) {
      var w = r,
        _ = w.alternate,
        P = w.stateNode;
      if (_ !== null && _ === o) break;
      (w.tag === 5 &&
        P !== null &&
        ((w = P),
        d
          ? ((_ = Hn(r, f)), _ != null && x.unshift(ds(r, _, w)))
          : d || ((_ = Hn(r, f)), _ != null && x.push(ds(r, _, w)))),
        (r = r.return));
    }
    x.length !== 0 && e.push({ event: t, listeners: x });
  }
  var Ch = /\r\n?/g,
    Sh = /\u0000|\uFFFD/g;
  function ad(e) {
    return (typeof e == 'string' ? e : '' + e)
      .replace(
        Ch,
        `
`,
      )
      .replace(Sh, '');
  }
  function ii(e, t, r) {
    if (((t = ad(t)), ad(e) !== t && r)) throw Error(i(425));
  }
  function ai() {}
  var Ya = null,
    Za = null;
  function Ka(e, t) {
    return (
      e === 'textarea' ||
      e === 'noscript' ||
      typeof t.children == 'string' ||
      typeof t.children == 'number' ||
      (typeof t.dangerouslySetInnerHTML == 'object' &&
        t.dangerouslySetInnerHTML !== null &&
        t.dangerouslySetInnerHTML.__html != null)
    );
  }
  var qa = typeof setTimeout == 'function' ? setTimeout : void 0,
    Eh = typeof clearTimeout == 'function' ? clearTimeout : void 0,
    od = typeof Promise == 'function' ? Promise : void 0,
    Rh =
      typeof queueMicrotask == 'function'
        ? queueMicrotask
        : typeof od < 'u'
          ? function (e) {
              return od.resolve(null).then(e).catch(Th);
            }
          : qa;
  function Th(e) {
    setTimeout(function () {
      throw e;
    });
  }
  function Qa(e, t) {
    var r = t,
      o = 0;
    do {
      var d = r.nextSibling;
      if ((e.removeChild(r), d && d.nodeType === 8))
        if (((r = d.data), r === '/$')) {
          if (o === 0) {
            (e.removeChild(d), es(t));
            return;
          }
          o--;
        } else (r !== '$' && r !== '$?' && r !== '$!') || o++;
      r = d;
    } while (r);
    es(t);
  }
  function gr(e) {
    for (; e != null; e = e.nextSibling) {
      var t = e.nodeType;
      if (t === 1 || t === 3) break;
      if (t === 8) {
        if (((t = e.data), t === '$' || t === '$!' || t === '$?')) break;
        if (t === '/$') return null;
      }
    }
    return e;
  }
  function ld(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var r = e.data;
        if (r === '$' || r === '$!' || r === '$?') {
          if (t === 0) return e;
          t--;
        } else r === '/$' && t++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  var mn = Math.random().toString(36).slice(2),
    Yt = '__reactFiber$' + mn,
    us = '__reactProps$' + mn,
    tr = '__reactContainer$' + mn,
    Xa = '__reactEvents$' + mn,
    Ih = '__reactListeners$' + mn,
    Oh = '__reactHandles$' + mn;
  function Br(e) {
    var t = e[Yt];
    if (t) return t;
    for (var r = e.parentNode; r; ) {
      if ((t = r[tr] || r[Yt])) {
        if (((r = t.alternate), t.child !== null || (r !== null && r.child !== null)))
          for (e = ld(e); e !== null; ) {
            if ((r = e[Yt])) return r;
            e = ld(e);
          }
        return t;
      }
      ((e = r), (r = e.parentNode));
    }
    return null;
  }
  function ps(e) {
    return (
      (e = e[Yt] || e[tr]),
      !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e
    );
  }
  function xn(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(i(33));
  }
  function oi(e) {
    return e[us] || null;
  }
  var Ja = [],
    gn = -1;
  function vr(e) {
    return { current: e };
  }
  function Ae(e) {
    0 > gn || ((e.current = Ja[gn]), (Ja[gn] = null), gn--);
  }
  function Te(e, t) {
    (gn++, (Ja[gn] = e.current), (e.current = t));
  }
  var yr = {},
    at = vr(yr),
    xt = vr(!1),
    Fr = yr;
  function vn(e, t) {
    var r = e.type.contextTypes;
    if (!r) return yr;
    var o = e.stateNode;
    if (o && o.__reactInternalMemoizedUnmaskedChildContext === t)
      return o.__reactInternalMemoizedMaskedChildContext;
    var d = {},
      f;
    for (f in r) d[f] = t[f];
    return (
      o &&
        ((e = e.stateNode),
        (e.__reactInternalMemoizedUnmaskedChildContext = t),
        (e.__reactInternalMemoizedMaskedChildContext = d)),
      d
    );
  }
  function gt(e) {
    return ((e = e.childContextTypes), e != null);
  }
  function li() {
    (Ae(xt), Ae(at));
  }
  function cd(e, t, r) {
    if (at.current !== yr) throw Error(i(168));
    (Te(at, t), Te(xt, r));
  }
  function dd(e, t, r) {
    var o = e.stateNode;
    if (((t = t.childContextTypes), typeof o.getChildContext != 'function')) return r;
    o = o.getChildContext();
    for (var d in o) if (!(d in t)) throw Error(i(108, Y(e) || 'Unknown', d));
    return L({}, r, o);
  }
  function ci(e) {
    return (
      (e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || yr),
      (Fr = at.current),
      Te(at, e),
      Te(xt, xt.current),
      !0
    );
  }
  function ud(e, t, r) {
    var o = e.stateNode;
    if (!o) throw Error(i(169));
    (r
      ? ((e = dd(e, t, Fr)),
        (o.__reactInternalMemoizedMergedChildContext = e),
        Ae(xt),
        Ae(at),
        Te(at, e))
      : Ae(xt),
      Te(xt, r));
  }
  var rr = null,
    di = !1,
    eo = !1;
  function pd(e) {
    rr === null ? (rr = [e]) : rr.push(e);
  }
  function Ah(e) {
    ((di = !0), pd(e));
  }
  function wr() {
    if (!eo && rr !== null) {
      eo = !0;
      var e = 0,
        t = Re;
      try {
        var r = rr;
        for (Re = 1; e < r.length; e++) {
          var o = r[e];
          do o = o(!0);
          while (o !== null);
        }
        ((rr = null), (di = !1));
      } catch (d) {
        throw (rr !== null && (rr = rr.slice(e + 1)), hc(ba, wr), d);
      } finally {
        ((Re = t), (eo = !1));
      }
    }
    return null;
  }
  var yn = [],
    wn = 0,
    ui = null,
    pi = 0,
    St = [],
    Et = 0,
    Vr = null,
    nr = 1,
    sr = '';
  function Hr(e, t) {
    ((yn[wn++] = pi), (yn[wn++] = ui), (ui = e), (pi = t));
  }
  function fd(e, t, r) {
    ((St[Et++] = nr), (St[Et++] = sr), (St[Et++] = Vr), (Vr = e));
    var o = nr;
    e = sr;
    var d = 32 - Mt(o) - 1;
    ((o &= ~(1 << d)), (r += 1));
    var f = 32 - Mt(t) + d;
    if (30 < f) {
      var x = d - (d % 5);
      ((f = (o & ((1 << x) - 1)).toString(32)),
        (o >>= x),
        (d -= x),
        (nr = (1 << (32 - Mt(t) + d)) | (r << d) | o),
        (sr = f + e));
    } else ((nr = (1 << f) | (r << d) | o), (sr = e));
  }
  function to(e) {
    e.return !== null && (Hr(e, 1), fd(e, 1, 0));
  }
  function ro(e) {
    for (; e === ui; ) ((ui = yn[--wn]), (yn[wn] = null), (pi = yn[--wn]), (yn[wn] = null));
    for (; e === Vr; )
      ((Vr = St[--Et]),
        (St[Et] = null),
        (sr = St[--Et]),
        (St[Et] = null),
        (nr = St[--Et]),
        (St[Et] = null));
  }
  var jt = null,
    Nt = null,
    Le = !1,
    Dt = null;
  function hd(e, t) {
    var r = Ot(5, null, null, 0);
    ((r.elementType = 'DELETED'),
      (r.stateNode = t),
      (r.return = e),
      (t = e.deletions),
      t === null ? ((e.deletions = [r]), (e.flags |= 16)) : t.push(r));
  }
  function md(e, t) {
    switch (e.tag) {
      case 5:
        var r = e.type;
        return (
          (t = t.nodeType !== 1 || r.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
          t !== null ? ((e.stateNode = t), (jt = e), (Nt = gr(t.firstChild)), !0) : !1
        );
      case 6:
        return (
          (t = e.pendingProps === '' || t.nodeType !== 3 ? null : t),
          t !== null ? ((e.stateNode = t), (jt = e), (Nt = null), !0) : !1
        );
      case 13:
        return (
          (t = t.nodeType !== 8 ? null : t),
          t !== null
            ? ((r = Vr !== null ? { id: nr, overflow: sr } : null),
              (e.memoizedState = { dehydrated: t, treeContext: r, retryLane: 1073741824 }),
              (r = Ot(18, null, null, 0)),
              (r.stateNode = t),
              (r.return = e),
              (e.child = r),
              (jt = e),
              (Nt = null),
              !0)
            : !1
        );
      default:
        return !1;
    }
  }
  function no(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
  }
  function so(e) {
    if (Le) {
      var t = Nt;
      if (t) {
        var r = t;
        if (!md(e, t)) {
          if (no(e)) throw Error(i(418));
          t = gr(r.nextSibling);
          var o = jt;
          t && md(e, t) ? hd(o, r) : ((e.flags = (e.flags & -4097) | 2), (Le = !1), (jt = e));
        }
      } else {
        if (no(e)) throw Error(i(418));
        ((e.flags = (e.flags & -4097) | 2), (Le = !1), (jt = e));
      }
    }
  }
  function xd(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    jt = e;
  }
  function fi(e) {
    if (e !== jt) return !1;
    if (!Le) return (xd(e), (Le = !0), !1);
    var t;
    if (
      ((t = e.tag !== 3) &&
        !(t = e.tag !== 5) &&
        ((t = e.type), (t = t !== 'head' && t !== 'body' && !Ka(e.type, e.memoizedProps))),
      t && (t = Nt))
    ) {
      if (no(e)) throw (gd(), Error(i(418)));
      for (; t; ) (hd(e, t), (t = gr(t.nextSibling)));
    }
    if ((xd(e), e.tag === 13)) {
      if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(i(317));
      e: {
        for (e = e.nextSibling, t = 0; e; ) {
          if (e.nodeType === 8) {
            var r = e.data;
            if (r === '/$') {
              if (t === 0) {
                Nt = gr(e.nextSibling);
                break e;
              }
              t--;
            } else (r !== '$' && r !== '$!' && r !== '$?') || t++;
          }
          e = e.nextSibling;
        }
        Nt = null;
      }
    } else Nt = jt ? gr(e.stateNode.nextSibling) : null;
    return !0;
  }
  function gd() {
    for (var e = Nt; e; ) e = gr(e.nextSibling);
  }
  function kn() {
    ((Nt = jt = null), (Le = !1));
  }
  function io(e) {
    Dt === null ? (Dt = [e]) : Dt.push(e);
  }
  var Lh = G.ReactCurrentBatchConfig;
  function fs(e, t, r) {
    if (((e = r.ref), e !== null && typeof e != 'function' && typeof e != 'object')) {
      if (r._owner) {
        if (((r = r._owner), r)) {
          if (r.tag !== 1) throw Error(i(309));
          var o = r.stateNode;
        }
        if (!o) throw Error(i(147, e));
        var d = o,
          f = '' + e;
        return t !== null && t.ref !== null && typeof t.ref == 'function' && t.ref._stringRef === f
          ? t.ref
          : ((t = function (x) {
              var w = d.refs;
              x === null ? delete w[f] : (w[f] = x);
            }),
            (t._stringRef = f),
            t);
      }
      if (typeof e != 'string') throw Error(i(284));
      if (!r._owner) throw Error(i(290, e));
    }
    return e;
  }
  function hi(e, t) {
    throw (
      (e = Object.prototype.toString.call(t)),
      Error(
        i(31, e === '[object Object]' ? 'object with keys {' + Object.keys(t).join(', ') + '}' : e),
      )
    );
  }
  function vd(e) {
    var t = e._init;
    return t(e._payload);
  }
  function yd(e) {
    function t(O, I) {
      if (e) {
        var A = O.deletions;
        A === null ? ((O.deletions = [I]), (O.flags |= 16)) : A.push(I);
      }
    }
    function r(O, I) {
      if (!e) return null;
      for (; I !== null; ) (t(O, I), (I = I.sibling));
      return null;
    }
    function o(O, I) {
      for (O = new Map(); I !== null; )
        (I.key !== null ? O.set(I.key, I) : O.set(I.index, I), (I = I.sibling));
      return O;
    }
    function d(O, I) {
      return ((O = Er(O, I)), (O.index = 0), (O.sibling = null), O);
    }
    function f(O, I, A) {
      return (
        (O.index = A),
        e
          ? ((A = O.alternate),
            A !== null ? ((A = A.index), A < I ? ((O.flags |= 2), I) : A) : ((O.flags |= 2), I))
          : ((O.flags |= 1048576), I)
      );
    }
    function x(O) {
      return (e && O.alternate === null && (O.flags |= 2), O);
    }
    function w(O, I, A, Z) {
      return I === null || I.tag !== 6
        ? ((I = Qo(A, O.mode, Z)), (I.return = O), I)
        : ((I = d(I, A)), (I.return = O), I);
    }
    function _(O, I, A, Z) {
      var ie = A.type;
      return ie === ge
        ? V(O, I, A.props.children, Z, A.key)
        : I !== null &&
            (I.elementType === ie ||
              (typeof ie == 'object' && ie !== null && ie.$$typeof === ze && vd(ie) === I.type))
          ? ((Z = d(I, A.props)), (Z.ref = fs(O, I, A)), (Z.return = O), Z)
          : ((Z = zi(A.type, A.key, A.props, null, O.mode, Z)),
            (Z.ref = fs(O, I, A)),
            (Z.return = O),
            Z);
    }
    function P(O, I, A, Z) {
      return I === null ||
        I.tag !== 4 ||
        I.stateNode.containerInfo !== A.containerInfo ||
        I.stateNode.implementation !== A.implementation
        ? ((I = Xo(A, O.mode, Z)), (I.return = O), I)
        : ((I = d(I, A.children || [])), (I.return = O), I);
    }
    function V(O, I, A, Z, ie) {
      return I === null || I.tag !== 7
        ? ((I = Jr(A, O.mode, Z, ie)), (I.return = O), I)
        : ((I = d(I, A)), (I.return = O), I);
    }
    function H(O, I, A) {
      if ((typeof I == 'string' && I !== '') || typeof I == 'number')
        return ((I = Qo('' + I, O.mode, A)), (I.return = O), I);
      if (typeof I == 'object' && I !== null) {
        switch (I.$$typeof) {
          case Q:
            return (
              (A = zi(I.type, I.key, I.props, null, O.mode, A)),
              (A.ref = fs(O, null, I)),
              (A.return = O),
              A
            );
          case pe:
            return ((I = Xo(I, O.mode, A)), (I.return = O), I);
          case ze:
            var Z = I._init;
            return H(O, Z(I._payload), A);
        }
        if (Bn(I) || E(I)) return ((I = Jr(I, O.mode, A, null)), (I.return = O), I);
        hi(O, I);
      }
      return null;
    }
    function F(O, I, A, Z) {
      var ie = I !== null ? I.key : null;
      if ((typeof A == 'string' && A !== '') || typeof A == 'number')
        return ie !== null ? null : w(O, I, '' + A, Z);
      if (typeof A == 'object' && A !== null) {
        switch (A.$$typeof) {
          case Q:
            return A.key === ie ? _(O, I, A, Z) : null;
          case pe:
            return A.key === ie ? P(O, I, A, Z) : null;
          case ze:
            return ((ie = A._init), F(O, I, ie(A._payload), Z));
        }
        if (Bn(A) || E(A)) return ie !== null ? null : V(O, I, A, Z, null);
        hi(O, A);
      }
      return null;
    }
    function J(O, I, A, Z, ie) {
      if ((typeof Z == 'string' && Z !== '') || typeof Z == 'number')
        return ((O = O.get(A) || null), w(I, O, '' + Z, ie));
      if (typeof Z == 'object' && Z !== null) {
        switch (Z.$$typeof) {
          case Q:
            return ((O = O.get(Z.key === null ? A : Z.key) || null), _(I, O, Z, ie));
          case pe:
            return ((O = O.get(Z.key === null ? A : Z.key) || null), P(I, O, Z, ie));
          case ze:
            var ce = Z._init;
            return J(O, I, A, ce(Z._payload), ie);
        }
        if (Bn(Z) || E(Z)) return ((O = O.get(A) || null), V(I, O, Z, ie, null));
        hi(I, Z);
      }
      return null;
    }
    function re(O, I, A, Z) {
      for (
        var ie = null, ce = null, de = I, he = (I = 0), Xe = null;
        de !== null && he < A.length;
        he++
      ) {
        de.index > he ? ((Xe = de), (de = null)) : (Xe = de.sibling);
        var _e = F(O, de, A[he], Z);
        if (_e === null) {
          de === null && (de = Xe);
          break;
        }
        (e && de && _e.alternate === null && t(O, de),
          (I = f(_e, I, he)),
          ce === null ? (ie = _e) : (ce.sibling = _e),
          (ce = _e),
          (de = Xe));
      }
      if (he === A.length) return (r(O, de), Le && Hr(O, he), ie);
      if (de === null) {
        for (; he < A.length; he++)
          ((de = H(O, A[he], Z)),
            de !== null &&
              ((I = f(de, I, he)), ce === null ? (ie = de) : (ce.sibling = de), (ce = de)));
        return (Le && Hr(O, he), ie);
      }
      for (de = o(O, de); he < A.length; he++)
        ((Xe = J(de, O, he, A[he], Z)),
          Xe !== null &&
            (e && Xe.alternate !== null && de.delete(Xe.key === null ? he : Xe.key),
            (I = f(Xe, I, he)),
            ce === null ? (ie = Xe) : (ce.sibling = Xe),
            (ce = Xe)));
      return (
        e &&
          de.forEach(function (Rr) {
            return t(O, Rr);
          }),
        Le && Hr(O, he),
        ie
      );
    }
    function se(O, I, A, Z) {
      var ie = E(A);
      if (typeof ie != 'function') throw Error(i(150));
      if (((A = ie.call(A)), A == null)) throw Error(i(151));
      for (
        var ce = (ie = null), de = I, he = (I = 0), Xe = null, _e = A.next();
        de !== null && !_e.done;
        he++, _e = A.next()
      ) {
        de.index > he ? ((Xe = de), (de = null)) : (Xe = de.sibling);
        var Rr = F(O, de, _e.value, Z);
        if (Rr === null) {
          de === null && (de = Xe);
          break;
        }
        (e && de && Rr.alternate === null && t(O, de),
          (I = f(Rr, I, he)),
          ce === null ? (ie = Rr) : (ce.sibling = Rr),
          (ce = Rr),
          (de = Xe));
      }
      if (_e.done) return (r(O, de), Le && Hr(O, he), ie);
      if (de === null) {
        for (; !_e.done; he++, _e = A.next())
          ((_e = H(O, _e.value, Z)),
            _e !== null &&
              ((I = f(_e, I, he)), ce === null ? (ie = _e) : (ce.sibling = _e), (ce = _e)));
        return (Le && Hr(O, he), ie);
      }
      for (de = o(O, de); !_e.done; he++, _e = A.next())
        ((_e = J(de, O, he, _e.value, Z)),
          _e !== null &&
            (e && _e.alternate !== null && de.delete(_e.key === null ? he : _e.key),
            (I = f(_e, I, he)),
            ce === null ? (ie = _e) : (ce.sibling = _e),
            (ce = _e)));
      return (
        e &&
          de.forEach(function (fm) {
            return t(O, fm);
          }),
        Le && Hr(O, he),
        ie
      );
    }
    function We(O, I, A, Z) {
      if (
        (typeof A == 'object' &&
          A !== null &&
          A.type === ge &&
          A.key === null &&
          (A = A.props.children),
        typeof A == 'object' && A !== null)
      ) {
        switch (A.$$typeof) {
          case Q:
            e: {
              for (var ie = A.key, ce = I; ce !== null; ) {
                if (ce.key === ie) {
                  if (((ie = A.type), ie === ge)) {
                    if (ce.tag === 7) {
                      (r(O, ce.sibling), (I = d(ce, A.props.children)), (I.return = O), (O = I));
                      break e;
                    }
                  } else if (
                    ce.elementType === ie ||
                    (typeof ie == 'object' &&
                      ie !== null &&
                      ie.$$typeof === ze &&
                      vd(ie) === ce.type)
                  ) {
                    (r(O, ce.sibling),
                      (I = d(ce, A.props)),
                      (I.ref = fs(O, ce, A)),
                      (I.return = O),
                      (O = I));
                    break e;
                  }
                  r(O, ce);
                  break;
                } else t(O, ce);
                ce = ce.sibling;
              }
              A.type === ge
                ? ((I = Jr(A.props.children, O.mode, Z, A.key)), (I.return = O), (O = I))
                : ((Z = zi(A.type, A.key, A.props, null, O.mode, Z)),
                  (Z.ref = fs(O, I, A)),
                  (Z.return = O),
                  (O = Z));
            }
            return x(O);
          case pe:
            e: {
              for (ce = A.key; I !== null; ) {
                if (I.key === ce)
                  if (
                    I.tag === 4 &&
                    I.stateNode.containerInfo === A.containerInfo &&
                    I.stateNode.implementation === A.implementation
                  ) {
                    (r(O, I.sibling), (I = d(I, A.children || [])), (I.return = O), (O = I));
                    break e;
                  } else {
                    r(O, I);
                    break;
                  }
                else t(O, I);
                I = I.sibling;
              }
              ((I = Xo(A, O.mode, Z)), (I.return = O), (O = I));
            }
            return x(O);
          case ze:
            return ((ce = A._init), We(O, I, ce(A._payload), Z));
        }
        if (Bn(A)) return re(O, I, A, Z);
        if (E(A)) return se(O, I, A, Z);
        hi(O, A);
      }
      return (typeof A == 'string' && A !== '') || typeof A == 'number'
        ? ((A = '' + A),
          I !== null && I.tag === 6
            ? (r(O, I.sibling), (I = d(I, A)), (I.return = O), (O = I))
            : (r(O, I), (I = Qo(A, O.mode, Z)), (I.return = O), (O = I)),
          x(O))
        : r(O, I);
    }
    return We;
  }
  var bn = yd(!0),
    wd = yd(!1),
    mi = vr(null),
    xi = null,
    jn = null,
    ao = null;
  function oo() {
    ao = jn = xi = null;
  }
  function lo(e) {
    var t = mi.current;
    (Ae(mi), (e._currentValue = t));
  }
  function co(e, t, r) {
    for (; e !== null; ) {
      var o = e.alternate;
      if (
        ((e.childLanes & t) !== t
          ? ((e.childLanes |= t), o !== null && (o.childLanes |= t))
          : o !== null && (o.childLanes & t) !== t && (o.childLanes |= t),
        e === r)
      )
        break;
      e = e.return;
    }
  }
  function Nn(e, t) {
    ((xi = e),
      (ao = jn = null),
      (e = e.dependencies),
      e !== null &&
        e.firstContext !== null &&
        ((e.lanes & t) !== 0 && (vt = !0), (e.firstContext = null)));
  }
  function Rt(e) {
    var t = e._currentValue;
    if (ao !== e)
      if (((e = { context: e, memoizedValue: t, next: null }), jn === null)) {
        if (xi === null) throw Error(i(308));
        ((jn = e), (xi.dependencies = { lanes: 0, firstContext: e }));
      } else jn = jn.next = e;
    return t;
  }
  var Gr = null;
  function uo(e) {
    Gr === null ? (Gr = [e]) : Gr.push(e);
  }
  function kd(e, t, r, o) {
    var d = t.interleaved;
    return (
      d === null ? ((r.next = r), uo(t)) : ((r.next = d.next), (d.next = r)),
      (t.interleaved = r),
      ir(e, o)
    );
  }
  function ir(e, t) {
    e.lanes |= t;
    var r = e.alternate;
    for (r !== null && (r.lanes |= t), r = e, e = e.return; e !== null; )
      ((e.childLanes |= t),
        (r = e.alternate),
        r !== null && (r.childLanes |= t),
        (r = e),
        (e = e.return));
    return r.tag === 3 ? r.stateNode : null;
  }
  var kr = !1;
  function po(e) {
    e.updateQueue = {
      baseState: e.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, interleaved: null, lanes: 0 },
      effects: null,
    };
  }
  function bd(e, t) {
    ((e = e.updateQueue),
      t.updateQueue === e &&
        (t.updateQueue = {
          baseState: e.baseState,
          firstBaseUpdate: e.firstBaseUpdate,
          lastBaseUpdate: e.lastBaseUpdate,
          shared: e.shared,
          effects: e.effects,
        }));
  }
  function ar(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function br(e, t, r) {
    var o = e.updateQueue;
    if (o === null) return null;
    if (((o = o.shared), (Ne & 2) !== 0)) {
      var d = o.pending;
      return (
        d === null ? (t.next = t) : ((t.next = d.next), (d.next = t)),
        (o.pending = t),
        ir(e, r)
      );
    }
    return (
      (d = o.interleaved),
      d === null ? ((t.next = t), uo(o)) : ((t.next = d.next), (d.next = t)),
      (o.interleaved = t),
      ir(e, r)
    );
  }
  function gi(e, t, r) {
    if (((t = t.updateQueue), t !== null && ((t = t.shared), (r & 4194240) !== 0))) {
      var o = t.lanes;
      ((o &= e.pendingLanes), (r |= o), (t.lanes = r), _a(e, r));
    }
  }
  function jd(e, t) {
    var r = e.updateQueue,
      o = e.alternate;
    if (o !== null && ((o = o.updateQueue), r === o)) {
      var d = null,
        f = null;
      if (((r = r.firstBaseUpdate), r !== null)) {
        do {
          var x = {
            eventTime: r.eventTime,
            lane: r.lane,
            tag: r.tag,
            payload: r.payload,
            callback: r.callback,
            next: null,
          };
          (f === null ? (d = f = x) : (f = f.next = x), (r = r.next));
        } while (r !== null);
        f === null ? (d = f = t) : (f = f.next = t);
      } else d = f = t;
      ((r = {
        baseState: o.baseState,
        firstBaseUpdate: d,
        lastBaseUpdate: f,
        shared: o.shared,
        effects: o.effects,
      }),
        (e.updateQueue = r));
      return;
    }
    ((e = r.lastBaseUpdate),
      e === null ? (r.firstBaseUpdate = t) : (e.next = t),
      (r.lastBaseUpdate = t));
  }
  function vi(e, t, r, o) {
    var d = e.updateQueue;
    kr = !1;
    var f = d.firstBaseUpdate,
      x = d.lastBaseUpdate,
      w = d.shared.pending;
    if (w !== null) {
      d.shared.pending = null;
      var _ = w,
        P = _.next;
      ((_.next = null), x === null ? (f = P) : (x.next = P), (x = _));
      var V = e.alternate;
      V !== null &&
        ((V = V.updateQueue),
        (w = V.lastBaseUpdate),
        w !== x && (w === null ? (V.firstBaseUpdate = P) : (w.next = P), (V.lastBaseUpdate = _)));
    }
    if (f !== null) {
      var H = d.baseState;
      ((x = 0), (V = P = _ = null), (w = f));
      do {
        var F = w.lane,
          J = w.eventTime;
        if ((o & F) === F) {
          V !== null &&
            (V = V.next =
              {
                eventTime: J,
                lane: 0,
                tag: w.tag,
                payload: w.payload,
                callback: w.callback,
                next: null,
              });
          e: {
            var re = e,
              se = w;
            switch (((F = t), (J = r), se.tag)) {
              case 1:
                if (((re = se.payload), typeof re == 'function')) {
                  H = re.call(J, H, F);
                  break e;
                }
                H = re;
                break e;
              case 3:
                re.flags = (re.flags & -65537) | 128;
              case 0:
                if (
                  ((re = se.payload),
                  (F = typeof re == 'function' ? re.call(J, H, F) : re),
                  F == null)
                )
                  break e;
                H = L({}, H, F);
                break e;
              case 2:
                kr = !0;
            }
          }
          w.callback !== null &&
            w.lane !== 0 &&
            ((e.flags |= 64), (F = d.effects), F === null ? (d.effects = [w]) : F.push(w));
        } else
          ((J = {
            eventTime: J,
            lane: F,
            tag: w.tag,
            payload: w.payload,
            callback: w.callback,
            next: null,
          }),
            V === null ? ((P = V = J), (_ = H)) : (V = V.next = J),
            (x |= F));
        if (((w = w.next), w === null)) {
          if (((w = d.shared.pending), w === null)) break;
          ((F = w),
            (w = F.next),
            (F.next = null),
            (d.lastBaseUpdate = F),
            (d.shared.pending = null));
        }
      } while (!0);
      if (
        (V === null && (_ = H),
        (d.baseState = _),
        (d.firstBaseUpdate = P),
        (d.lastBaseUpdate = V),
        (t = d.shared.interleaved),
        t !== null)
      ) {
        d = t;
        do ((x |= d.lane), (d = d.next));
        while (d !== t);
      } else f === null && (d.shared.lanes = 0);
      ((Kr |= x), (e.lanes = x), (e.memoizedState = H));
    }
  }
  function Nd(e, t, r) {
    if (((e = t.effects), (t.effects = null), e !== null))
      for (t = 0; t < e.length; t++) {
        var o = e[t],
          d = o.callback;
        if (d !== null) {
          if (((o.callback = null), (o = r), typeof d != 'function')) throw Error(i(191, d));
          d.call(o);
        }
      }
  }
  var hs = {},
    Zt = vr(hs),
    ms = vr(hs),
    xs = vr(hs);
  function Yr(e) {
    if (e === hs) throw Error(i(174));
    return e;
  }
  function fo(e, t) {
    switch ((Te(xs, t), Te(ms, e), Te(Zt, hs), (e = t.nodeType), e)) {
      case 9:
      case 11:
        t = (t = t.documentElement) ? t.namespaceURI : fa(null, '');
        break;
      default:
        ((e = e === 8 ? t.parentNode : t),
          (t = e.namespaceURI || null),
          (e = e.tagName),
          (t = fa(t, e)));
    }
    (Ae(Zt), Te(Zt, t));
  }
  function _n() {
    (Ae(Zt), Ae(ms), Ae(xs));
  }
  function _d(e) {
    Yr(xs.current);
    var t = Yr(Zt.current),
      r = fa(t, e.type);
    t !== r && (Te(ms, e), Te(Zt, r));
  }
  function ho(e) {
    ms.current === e && (Ae(Zt), Ae(ms));
  }
  var Pe = vr(0);
  function yi(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var r = t.memoizedState;
        if (r !== null && ((r = r.dehydrated), r === null || r.data === '$?' || r.data === '$!'))
          return t;
      } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
        if ((t.flags & 128) !== 0) return t;
      } else if (t.child !== null) {
        ((t.child.return = t), (t = t.child));
        continue;
      }
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return null;
        t = t.return;
      }
      ((t.sibling.return = t.return), (t = t.sibling));
    }
    return null;
  }
  var mo = [];
  function xo() {
    for (var e = 0; e < mo.length; e++) mo[e]._workInProgressVersionPrimary = null;
    mo.length = 0;
  }
  var wi = G.ReactCurrentDispatcher,
    go = G.ReactCurrentBatchConfig,
    Zr = 0,
    De = null,
    Ze = null,
    qe = null,
    ki = !1,
    gs = !1,
    vs = 0,
    Mh = 0;
  function ot() {
    throw Error(i(321));
  }
  function vo(e, t) {
    if (t === null) return !1;
    for (var r = 0; r < t.length && r < e.length; r++) if (!Pt(e[r], t[r])) return !1;
    return !0;
  }
  function yo(e, t, r, o, d, f) {
    if (
      ((Zr = f),
      (De = t),
      (t.memoizedState = null),
      (t.updateQueue = null),
      (t.lanes = 0),
      (wi.current = e === null || e.memoizedState === null ? $h : Uh),
      (e = r(o, d)),
      gs)
    ) {
      f = 0;
      do {
        if (((gs = !1), (vs = 0), 25 <= f)) throw Error(i(301));
        ((f += 1), (qe = Ze = null), (t.updateQueue = null), (wi.current = Wh), (e = r(o, d)));
      } while (gs);
    }
    if (
      ((wi.current = Ni),
      (t = Ze !== null && Ze.next !== null),
      (Zr = 0),
      (qe = Ze = De = null),
      (ki = !1),
      t)
    )
      throw Error(i(300));
    return e;
  }
  function wo() {
    var e = vs !== 0;
    return ((vs = 0), e);
  }
  function Kt() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return (qe === null ? (De.memoizedState = qe = e) : (qe = qe.next = e), qe);
  }
  function Tt() {
    if (Ze === null) {
      var e = De.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = Ze.next;
    var t = qe === null ? De.memoizedState : qe.next;
    if (t !== null) ((qe = t), (Ze = e));
    else {
      if (e === null) throw Error(i(310));
      ((Ze = e),
        (e = {
          memoizedState: Ze.memoizedState,
          baseState: Ze.baseState,
          baseQueue: Ze.baseQueue,
          queue: Ze.queue,
          next: null,
        }),
        qe === null ? (De.memoizedState = qe = e) : (qe = qe.next = e));
    }
    return qe;
  }
  function ys(e, t) {
    return typeof t == 'function' ? t(e) : t;
  }
  function ko(e) {
    var t = Tt(),
      r = t.queue;
    if (r === null) throw Error(i(311));
    r.lastRenderedReducer = e;
    var o = Ze,
      d = o.baseQueue,
      f = r.pending;
    if (f !== null) {
      if (d !== null) {
        var x = d.next;
        ((d.next = f.next), (f.next = x));
      }
      ((o.baseQueue = d = f), (r.pending = null));
    }
    if (d !== null) {
      ((f = d.next), (o = o.baseState));
      var w = (x = null),
        _ = null,
        P = f;
      do {
        var V = P.lane;
        if ((Zr & V) === V)
          (_ !== null &&
            (_ = _.next =
              {
                lane: 0,
                action: P.action,
                hasEagerState: P.hasEagerState,
                eagerState: P.eagerState,
                next: null,
              }),
            (o = P.hasEagerState ? P.eagerState : e(o, P.action)));
        else {
          var H = {
            lane: V,
            action: P.action,
            hasEagerState: P.hasEagerState,
            eagerState: P.eagerState,
            next: null,
          };
          (_ === null ? ((w = _ = H), (x = o)) : (_ = _.next = H), (De.lanes |= V), (Kr |= V));
        }
        P = P.next;
      } while (P !== null && P !== f);
      (_ === null ? (x = o) : (_.next = w),
        Pt(o, t.memoizedState) || (vt = !0),
        (t.memoizedState = o),
        (t.baseState = x),
        (t.baseQueue = _),
        (r.lastRenderedState = o));
    }
    if (((e = r.interleaved), e !== null)) {
      d = e;
      do ((f = d.lane), (De.lanes |= f), (Kr |= f), (d = d.next));
      while (d !== e);
    } else d === null && (r.lanes = 0);
    return [t.memoizedState, r.dispatch];
  }
  function bo(e) {
    var t = Tt(),
      r = t.queue;
    if (r === null) throw Error(i(311));
    r.lastRenderedReducer = e;
    var o = r.dispatch,
      d = r.pending,
      f = t.memoizedState;
    if (d !== null) {
      r.pending = null;
      var x = (d = d.next);
      do ((f = e(f, x.action)), (x = x.next));
      while (x !== d);
      (Pt(f, t.memoizedState) || (vt = !0),
        (t.memoizedState = f),
        t.baseQueue === null && (t.baseState = f),
        (r.lastRenderedState = f));
    }
    return [f, o];
  }
  function Cd() {}
  function Sd(e, t) {
    var r = De,
      o = Tt(),
      d = t(),
      f = !Pt(o.memoizedState, d);
    if (
      (f && ((o.memoizedState = d), (vt = !0)),
      (o = o.queue),
      jo(Td.bind(null, r, o, e), [e]),
      o.getSnapshot !== t || f || (qe !== null && qe.memoizedState.tag & 1))
    ) {
      if (((r.flags |= 2048), ws(9, Rd.bind(null, r, o, d, t), void 0, null), Qe === null))
        throw Error(i(349));
      (Zr & 30) !== 0 || Ed(r, t, d);
    }
    return d;
  }
  function Ed(e, t, r) {
    ((e.flags |= 16384),
      (e = { getSnapshot: t, value: r }),
      (t = De.updateQueue),
      t === null
        ? ((t = { lastEffect: null, stores: null }), (De.updateQueue = t), (t.stores = [e]))
        : ((r = t.stores), r === null ? (t.stores = [e]) : r.push(e)));
  }
  function Rd(e, t, r, o) {
    ((t.value = r), (t.getSnapshot = o), Id(t) && Od(e));
  }
  function Td(e, t, r) {
    return r(function () {
      Id(t) && Od(e);
    });
  }
  function Id(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var r = t();
      return !Pt(e, r);
    } catch {
      return !0;
    }
  }
  function Od(e) {
    var t = ir(e, 1);
    t !== null && Wt(t, e, 1, -1);
  }
  function Ad(e) {
    var t = Kt();
    return (
      typeof e == 'function' && (e = e()),
      (t.memoizedState = t.baseState = e),
      (e = {
        pending: null,
        interleaved: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: ys,
        lastRenderedState: e,
      }),
      (t.queue = e),
      (e = e.dispatch = zh.bind(null, De, e)),
      [t.memoizedState, e]
    );
  }
  function ws(e, t, r, o) {
    return (
      (e = { tag: e, create: t, destroy: r, deps: o, next: null }),
      (t = De.updateQueue),
      t === null
        ? ((t = { lastEffect: null, stores: null }),
          (De.updateQueue = t),
          (t.lastEffect = e.next = e))
        : ((r = t.lastEffect),
          r === null
            ? (t.lastEffect = e.next = e)
            : ((o = r.next), (r.next = e), (e.next = o), (t.lastEffect = e))),
      e
    );
  }
  function Ld() {
    return Tt().memoizedState;
  }
  function bi(e, t, r, o) {
    var d = Kt();
    ((De.flags |= e), (d.memoizedState = ws(1 | t, r, void 0, o === void 0 ? null : o)));
  }
  function ji(e, t, r, o) {
    var d = Tt();
    o = o === void 0 ? null : o;
    var f = void 0;
    if (Ze !== null) {
      var x = Ze.memoizedState;
      if (((f = x.destroy), o !== null && vo(o, x.deps))) {
        d.memoizedState = ws(t, r, f, o);
        return;
      }
    }
    ((De.flags |= e), (d.memoizedState = ws(1 | t, r, f, o)));
  }
  function Md(e, t) {
    return bi(8390656, 8, e, t);
  }
  function jo(e, t) {
    return ji(2048, 8, e, t);
  }
  function Pd(e, t) {
    return ji(4, 2, e, t);
  }
  function Dd(e, t) {
    return ji(4, 4, e, t);
  }
  function zd(e, t) {
    if (typeof t == 'function')
      return (
        (e = e()),
        t(e),
        function () {
          t(null);
        }
      );
    if (t != null)
      return (
        (e = e()),
        (t.current = e),
        function () {
          t.current = null;
        }
      );
  }
  function $d(e, t, r) {
    return ((r = r != null ? r.concat([e]) : null), ji(4, 4, zd.bind(null, t, e), r));
  }
  function No() {}
  function Ud(e, t) {
    var r = Tt();
    t = t === void 0 ? null : t;
    var o = r.memoizedState;
    return o !== null && t !== null && vo(t, o[1]) ? o[0] : ((r.memoizedState = [e, t]), e);
  }
  function Wd(e, t) {
    var r = Tt();
    t = t === void 0 ? null : t;
    var o = r.memoizedState;
    return o !== null && t !== null && vo(t, o[1])
      ? o[0]
      : ((e = e()), (r.memoizedState = [e, t]), e);
  }
  function Bd(e, t, r) {
    return (Zr & 21) === 0
      ? (e.baseState && ((e.baseState = !1), (vt = !0)), (e.memoizedState = r))
      : (Pt(r, t) || ((r = vc()), (De.lanes |= r), (Kr |= r), (e.baseState = !0)), t);
  }
  function Ph(e, t) {
    var r = Re;
    ((Re = r !== 0 && 4 > r ? r : 4), e(!0));
    var o = go.transition;
    go.transition = {};
    try {
      (e(!1), t());
    } finally {
      ((Re = r), (go.transition = o));
    }
  }
  function Fd() {
    return Tt().memoizedState;
  }
  function Dh(e, t, r) {
    var o = Cr(e);
    if (((r = { lane: o, action: r, hasEagerState: !1, eagerState: null, next: null }), Vd(e)))
      Hd(t, r);
    else if (((r = kd(e, t, r, o)), r !== null)) {
      var d = ut();
      (Wt(r, e, o, d), Gd(r, t, o));
    }
  }
  function zh(e, t, r) {
    var o = Cr(e),
      d = { lane: o, action: r, hasEagerState: !1, eagerState: null, next: null };
    if (Vd(e)) Hd(t, d);
    else {
      var f = e.alternate;
      if (
        e.lanes === 0 &&
        (f === null || f.lanes === 0) &&
        ((f = t.lastRenderedReducer), f !== null)
      )
        try {
          var x = t.lastRenderedState,
            w = f(x, r);
          if (((d.hasEagerState = !0), (d.eagerState = w), Pt(w, x))) {
            var _ = t.interleaved;
            (_ === null ? ((d.next = d), uo(t)) : ((d.next = _.next), (_.next = d)),
              (t.interleaved = d));
            return;
          }
        } catch {
        } finally {
        }
      ((r = kd(e, t, d, o)), r !== null && ((d = ut()), Wt(r, e, o, d), Gd(r, t, o)));
    }
  }
  function Vd(e) {
    var t = e.alternate;
    return e === De || (t !== null && t === De);
  }
  function Hd(e, t) {
    gs = ki = !0;
    var r = e.pending;
    (r === null ? (t.next = t) : ((t.next = r.next), (r.next = t)), (e.pending = t));
  }
  function Gd(e, t, r) {
    if ((r & 4194240) !== 0) {
      var o = t.lanes;
      ((o &= e.pendingLanes), (r |= o), (t.lanes = r), _a(e, r));
    }
  }
  var Ni = {
      readContext: Rt,
      useCallback: ot,
      useContext: ot,
      useEffect: ot,
      useImperativeHandle: ot,
      useInsertionEffect: ot,
      useLayoutEffect: ot,
      useMemo: ot,
      useReducer: ot,
      useRef: ot,
      useState: ot,
      useDebugValue: ot,
      useDeferredValue: ot,
      useTransition: ot,
      useMutableSource: ot,
      useSyncExternalStore: ot,
      useId: ot,
      unstable_isNewReconciler: !1,
    },
    $h = {
      readContext: Rt,
      useCallback: function (e, t) {
        return ((Kt().memoizedState = [e, t === void 0 ? null : t]), e);
      },
      useContext: Rt,
      useEffect: Md,
      useImperativeHandle: function (e, t, r) {
        return ((r = r != null ? r.concat([e]) : null), bi(4194308, 4, zd.bind(null, t, e), r));
      },
      useLayoutEffect: function (e, t) {
        return bi(4194308, 4, e, t);
      },
      useInsertionEffect: function (e, t) {
        return bi(4, 2, e, t);
      },
      useMemo: function (e, t) {
        var r = Kt();
        return ((t = t === void 0 ? null : t), (e = e()), (r.memoizedState = [e, t]), e);
      },
      useReducer: function (e, t, r) {
        var o = Kt();
        return (
          (t = r !== void 0 ? r(t) : t),
          (o.memoizedState = o.baseState = t),
          (e = {
            pending: null,
            interleaved: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: e,
            lastRenderedState: t,
          }),
          (o.queue = e),
          (e = e.dispatch = Dh.bind(null, De, e)),
          [o.memoizedState, e]
        );
      },
      useRef: function (e) {
        var t = Kt();
        return ((e = { current: e }), (t.memoizedState = e));
      },
      useState: Ad,
      useDebugValue: No,
      useDeferredValue: function (e) {
        return (Kt().memoizedState = e);
      },
      useTransition: function () {
        var e = Ad(!1),
          t = e[0];
        return ((e = Ph.bind(null, e[1])), (Kt().memoizedState = e), [t, e]);
      },
      useMutableSource: function () {},
      useSyncExternalStore: function (e, t, r) {
        var o = De,
          d = Kt();
        if (Le) {
          if (r === void 0) throw Error(i(407));
          r = r();
        } else {
          if (((r = t()), Qe === null)) throw Error(i(349));
          (Zr & 30) !== 0 || Ed(o, t, r);
        }
        d.memoizedState = r;
        var f = { value: r, getSnapshot: t };
        return (
          (d.queue = f),
          Md(Td.bind(null, o, f, e), [e]),
          (o.flags |= 2048),
          ws(9, Rd.bind(null, o, f, r, t), void 0, null),
          r
        );
      },
      useId: function () {
        var e = Kt(),
          t = Qe.identifierPrefix;
        if (Le) {
          var r = sr,
            o = nr;
          ((r = (o & ~(1 << (32 - Mt(o) - 1))).toString(32) + r),
            (t = ':' + t + 'R' + r),
            (r = vs++),
            0 < r && (t += 'H' + r.toString(32)),
            (t += ':'));
        } else ((r = Mh++), (t = ':' + t + 'r' + r.toString(32) + ':'));
        return (e.memoizedState = t);
      },
      unstable_isNewReconciler: !1,
    },
    Uh = {
      readContext: Rt,
      useCallback: Ud,
      useContext: Rt,
      useEffect: jo,
      useImperativeHandle: $d,
      useInsertionEffect: Pd,
      useLayoutEffect: Dd,
      useMemo: Wd,
      useReducer: ko,
      useRef: Ld,
      useState: function () {
        return ko(ys);
      },
      useDebugValue: No,
      useDeferredValue: function (e) {
        var t = Tt();
        return Bd(t, Ze.memoizedState, e);
      },
      useTransition: function () {
        var e = ko(ys)[0],
          t = Tt().memoizedState;
        return [e, t];
      },
      useMutableSource: Cd,
      useSyncExternalStore: Sd,
      useId: Fd,
      unstable_isNewReconciler: !1,
    },
    Wh = {
      readContext: Rt,
      useCallback: Ud,
      useContext: Rt,
      useEffect: jo,
      useImperativeHandle: $d,
      useInsertionEffect: Pd,
      useLayoutEffect: Dd,
      useMemo: Wd,
      useReducer: bo,
      useRef: Ld,
      useState: function () {
        return bo(ys);
      },
      useDebugValue: No,
      useDeferredValue: function (e) {
        var t = Tt();
        return Ze === null ? (t.memoizedState = e) : Bd(t, Ze.memoizedState, e);
      },
      useTransition: function () {
        var e = bo(ys)[0],
          t = Tt().memoizedState;
        return [e, t];
      },
      useMutableSource: Cd,
      useSyncExternalStore: Sd,
      useId: Fd,
      unstable_isNewReconciler: !1,
    };
  function zt(e, t) {
    if (e && e.defaultProps) {
      ((t = L({}, t)), (e = e.defaultProps));
      for (var r in e) t[r] === void 0 && (t[r] = e[r]);
      return t;
    }
    return t;
  }
  function _o(e, t, r, o) {
    ((t = e.memoizedState),
      (r = r(o, t)),
      (r = r == null ? t : L({}, t, r)),
      (e.memoizedState = r),
      e.lanes === 0 && (e.updateQueue.baseState = r));
  }
  var _i = {
    isMounted: function (e) {
      return (e = e._reactInternals) ? Wr(e) === e : !1;
    },
    enqueueSetState: function (e, t, r) {
      e = e._reactInternals;
      var o = ut(),
        d = Cr(e),
        f = ar(o, d);
      ((f.payload = t),
        r != null && (f.callback = r),
        (t = br(e, f, d)),
        t !== null && (Wt(t, e, d, o), gi(t, e, d)));
    },
    enqueueReplaceState: function (e, t, r) {
      e = e._reactInternals;
      var o = ut(),
        d = Cr(e),
        f = ar(o, d);
      ((f.tag = 1),
        (f.payload = t),
        r != null && (f.callback = r),
        (t = br(e, f, d)),
        t !== null && (Wt(t, e, d, o), gi(t, e, d)));
    },
    enqueueForceUpdate: function (e, t) {
      e = e._reactInternals;
      var r = ut(),
        o = Cr(e),
        d = ar(r, o);
      ((d.tag = 2),
        t != null && (d.callback = t),
        (t = br(e, d, o)),
        t !== null && (Wt(t, e, o, r), gi(t, e, o)));
    },
  };
  function Yd(e, t, r, o, d, f, x) {
    return (
      (e = e.stateNode),
      typeof e.shouldComponentUpdate == 'function'
        ? e.shouldComponentUpdate(o, f, x)
        : t.prototype && t.prototype.isPureReactComponent
          ? !as(r, o) || !as(d, f)
          : !0
    );
  }
  function Zd(e, t, r) {
    var o = !1,
      d = yr,
      f = t.contextType;
    return (
      typeof f == 'object' && f !== null
        ? (f = Rt(f))
        : ((d = gt(t) ? Fr : at.current),
          (o = t.contextTypes),
          (f = (o = o != null) ? vn(e, d) : yr)),
      (t = new t(r, f)),
      (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
      (t.updater = _i),
      (e.stateNode = t),
      (t._reactInternals = e),
      o &&
        ((e = e.stateNode),
        (e.__reactInternalMemoizedUnmaskedChildContext = d),
        (e.__reactInternalMemoizedMaskedChildContext = f)),
      t
    );
  }
  function Kd(e, t, r, o) {
    ((e = t.state),
      typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(r, o),
      typeof t.UNSAFE_componentWillReceiveProps == 'function' &&
        t.UNSAFE_componentWillReceiveProps(r, o),
      t.state !== e && _i.enqueueReplaceState(t, t.state, null));
  }
  function Co(e, t, r, o) {
    var d = e.stateNode;
    ((d.props = r), (d.state = e.memoizedState), (d.refs = {}), po(e));
    var f = t.contextType;
    (typeof f == 'object' && f !== null
      ? (d.context = Rt(f))
      : ((f = gt(t) ? Fr : at.current), (d.context = vn(e, f))),
      (d.state = e.memoizedState),
      (f = t.getDerivedStateFromProps),
      typeof f == 'function' && (_o(e, t, f, r), (d.state = e.memoizedState)),
      typeof t.getDerivedStateFromProps == 'function' ||
        typeof d.getSnapshotBeforeUpdate == 'function' ||
        (typeof d.UNSAFE_componentWillMount != 'function' &&
          typeof d.componentWillMount != 'function') ||
        ((t = d.state),
        typeof d.componentWillMount == 'function' && d.componentWillMount(),
        typeof d.UNSAFE_componentWillMount == 'function' && d.UNSAFE_componentWillMount(),
        t !== d.state && _i.enqueueReplaceState(d, d.state, null),
        vi(e, r, d, o),
        (d.state = e.memoizedState)),
      typeof d.componentDidMount == 'function' && (e.flags |= 4194308));
  }
  function Cn(e, t) {
    try {
      var r = '',
        o = t;
      do ((r += U(o)), (o = o.return));
      while (o);
      var d = r;
    } catch (f) {
      d =
        `
Error generating stack: ` +
        f.message +
        `
` +
        f.stack;
    }
    return { value: e, source: t, stack: d, digest: null };
  }
  function So(e, t, r) {
    return { value: e, source: null, stack: r ?? null, digest: t ?? null };
  }
  function Eo(e, t) {
    try {
      console.error(t.value);
    } catch (r) {
      setTimeout(function () {
        throw r;
      });
    }
  }
  var Bh = typeof WeakMap == 'function' ? WeakMap : Map;
  function qd(e, t, r) {
    ((r = ar(-1, r)), (r.tag = 3), (r.payload = { element: null }));
    var o = t.value;
    return (
      (r.callback = function () {
        (Oi || ((Oi = !0), (Fo = o)), Eo(e, t));
      }),
      r
    );
  }
  function Qd(e, t, r) {
    ((r = ar(-1, r)), (r.tag = 3));
    var o = e.type.getDerivedStateFromError;
    if (typeof o == 'function') {
      var d = t.value;
      ((r.payload = function () {
        return o(d);
      }),
        (r.callback = function () {
          Eo(e, t);
        }));
    }
    var f = e.stateNode;
    return (
      f !== null &&
        typeof f.componentDidCatch == 'function' &&
        (r.callback = function () {
          (Eo(e, t),
            typeof o != 'function' && (Nr === null ? (Nr = new Set([this])) : Nr.add(this)));
          var x = t.stack;
          this.componentDidCatch(t.value, { componentStack: x !== null ? x : '' });
        }),
      r
    );
  }
  function Xd(e, t, r) {
    var o = e.pingCache;
    if (o === null) {
      o = e.pingCache = new Bh();
      var d = new Set();
      o.set(t, d);
    } else ((d = o.get(t)), d === void 0 && ((d = new Set()), o.set(t, d)));
    d.has(r) || (d.add(r), (e = rm.bind(null, e, t, r)), t.then(e, e));
  }
  function Jd(e) {
    do {
      var t;
      if (
        ((t = e.tag === 13) &&
          ((t = e.memoizedState), (t = t !== null ? t.dehydrated !== null : !0)),
        t)
      )
        return e;
      e = e.return;
    } while (e !== null);
    return null;
  }
  function eu(e, t, r, o, d) {
    return (e.mode & 1) === 0
      ? (e === t
          ? (e.flags |= 65536)
          : ((e.flags |= 128),
            (r.flags |= 131072),
            (r.flags &= -52805),
            r.tag === 1 &&
              (r.alternate === null ? (r.tag = 17) : ((t = ar(-1, 1)), (t.tag = 2), br(r, t, 1))),
            (r.lanes |= 1)),
        e)
      : ((e.flags |= 65536), (e.lanes = d), e);
  }
  var Fh = G.ReactCurrentOwner,
    vt = !1;
  function dt(e, t, r, o) {
    t.child = e === null ? wd(t, null, r, o) : bn(t, e.child, r, o);
  }
  function tu(e, t, r, o, d) {
    r = r.render;
    var f = t.ref;
    return (
      Nn(t, d),
      (o = yo(e, t, r, o, f, d)),
      (r = wo()),
      e !== null && !vt
        ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~d), or(e, t, d))
        : (Le && r && to(t), (t.flags |= 1), dt(e, t, o, d), t.child)
    );
  }
  function ru(e, t, r, o, d) {
    if (e === null) {
      var f = r.type;
      return typeof f == 'function' &&
        !qo(f) &&
        f.defaultProps === void 0 &&
        r.compare === null &&
        r.defaultProps === void 0
        ? ((t.tag = 15), (t.type = f), nu(e, t, f, o, d))
        : ((e = zi(r.type, null, o, t, t.mode, d)), (e.ref = t.ref), (e.return = t), (t.child = e));
    }
    if (((f = e.child), (e.lanes & d) === 0)) {
      var x = f.memoizedProps;
      if (((r = r.compare), (r = r !== null ? r : as), r(x, o) && e.ref === t.ref))
        return or(e, t, d);
    }
    return ((t.flags |= 1), (e = Er(f, o)), (e.ref = t.ref), (e.return = t), (t.child = e));
  }
  function nu(e, t, r, o, d) {
    if (e !== null) {
      var f = e.memoizedProps;
      if (as(f, o) && e.ref === t.ref)
        if (((vt = !1), (t.pendingProps = o = f), (e.lanes & d) !== 0))
          (e.flags & 131072) !== 0 && (vt = !0);
        else return ((t.lanes = e.lanes), or(e, t, d));
    }
    return Ro(e, t, r, o, d);
  }
  function su(e, t, r) {
    var o = t.pendingProps,
      d = o.children,
      f = e !== null ? e.memoizedState : null;
    if (o.mode === 'hidden')
      if ((t.mode & 1) === 0)
        ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
          Te(En, _t),
          (_t |= r));
      else {
        if ((r & 1073741824) === 0)
          return (
            (e = f !== null ? f.baseLanes | r : r),
            (t.lanes = t.childLanes = 1073741824),
            (t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
            (t.updateQueue = null),
            Te(En, _t),
            (_t |= e),
            null
          );
        ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
          (o = f !== null ? f.baseLanes : r),
          Te(En, _t),
          (_t |= o));
      }
    else
      (f !== null ? ((o = f.baseLanes | r), (t.memoizedState = null)) : (o = r),
        Te(En, _t),
        (_t |= o));
    return (dt(e, t, d, r), t.child);
  }
  function iu(e, t) {
    var r = t.ref;
    ((e === null && r !== null) || (e !== null && e.ref !== r)) &&
      ((t.flags |= 512), (t.flags |= 2097152));
  }
  function Ro(e, t, r, o, d) {
    var f = gt(r) ? Fr : at.current;
    return (
      (f = vn(t, f)),
      Nn(t, d),
      (r = yo(e, t, r, o, f, d)),
      (o = wo()),
      e !== null && !vt
        ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~d), or(e, t, d))
        : (Le && o && to(t), (t.flags |= 1), dt(e, t, r, d), t.child)
    );
  }
  function au(e, t, r, o, d) {
    if (gt(r)) {
      var f = !0;
      ci(t);
    } else f = !1;
    if ((Nn(t, d), t.stateNode === null)) (Si(e, t), Zd(t, r, o), Co(t, r, o, d), (o = !0));
    else if (e === null) {
      var x = t.stateNode,
        w = t.memoizedProps;
      x.props = w;
      var _ = x.context,
        P = r.contextType;
      typeof P == 'object' && P !== null
        ? (P = Rt(P))
        : ((P = gt(r) ? Fr : at.current), (P = vn(t, P)));
      var V = r.getDerivedStateFromProps,
        H = typeof V == 'function' || typeof x.getSnapshotBeforeUpdate == 'function';
      (H ||
        (typeof x.UNSAFE_componentWillReceiveProps != 'function' &&
          typeof x.componentWillReceiveProps != 'function') ||
        ((w !== o || _ !== P) && Kd(t, x, o, P)),
        (kr = !1));
      var F = t.memoizedState;
      ((x.state = F),
        vi(t, o, x, d),
        (_ = t.memoizedState),
        w !== o || F !== _ || xt.current || kr
          ? (typeof V == 'function' && (_o(t, r, V, o), (_ = t.memoizedState)),
            (w = kr || Yd(t, r, w, o, F, _, P))
              ? (H ||
                  (typeof x.UNSAFE_componentWillMount != 'function' &&
                    typeof x.componentWillMount != 'function') ||
                  (typeof x.componentWillMount == 'function' && x.componentWillMount(),
                  typeof x.UNSAFE_componentWillMount == 'function' &&
                    x.UNSAFE_componentWillMount()),
                typeof x.componentDidMount == 'function' && (t.flags |= 4194308))
              : (typeof x.componentDidMount == 'function' && (t.flags |= 4194308),
                (t.memoizedProps = o),
                (t.memoizedState = _)),
            (x.props = o),
            (x.state = _),
            (x.context = P),
            (o = w))
          : (typeof x.componentDidMount == 'function' && (t.flags |= 4194308), (o = !1)));
    } else {
      ((x = t.stateNode),
        bd(e, t),
        (w = t.memoizedProps),
        (P = t.type === t.elementType ? w : zt(t.type, w)),
        (x.props = P),
        (H = t.pendingProps),
        (F = x.context),
        (_ = r.contextType),
        typeof _ == 'object' && _ !== null
          ? (_ = Rt(_))
          : ((_ = gt(r) ? Fr : at.current), (_ = vn(t, _))));
      var J = r.getDerivedStateFromProps;
      ((V = typeof J == 'function' || typeof x.getSnapshotBeforeUpdate == 'function') ||
        (typeof x.UNSAFE_componentWillReceiveProps != 'function' &&
          typeof x.componentWillReceiveProps != 'function') ||
        ((w !== H || F !== _) && Kd(t, x, o, _)),
        (kr = !1),
        (F = t.memoizedState),
        (x.state = F),
        vi(t, o, x, d));
      var re = t.memoizedState;
      w !== H || F !== re || xt.current || kr
        ? (typeof J == 'function' && (_o(t, r, J, o), (re = t.memoizedState)),
          (P = kr || Yd(t, r, P, o, F, re, _) || !1)
            ? (V ||
                (typeof x.UNSAFE_componentWillUpdate != 'function' &&
                  typeof x.componentWillUpdate != 'function') ||
                (typeof x.componentWillUpdate == 'function' && x.componentWillUpdate(o, re, _),
                typeof x.UNSAFE_componentWillUpdate == 'function' &&
                  x.UNSAFE_componentWillUpdate(o, re, _)),
              typeof x.componentDidUpdate == 'function' && (t.flags |= 4),
              typeof x.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
            : (typeof x.componentDidUpdate != 'function' ||
                (w === e.memoizedProps && F === e.memoizedState) ||
                (t.flags |= 4),
              typeof x.getSnapshotBeforeUpdate != 'function' ||
                (w === e.memoizedProps && F === e.memoizedState) ||
                (t.flags |= 1024),
              (t.memoizedProps = o),
              (t.memoizedState = re)),
          (x.props = o),
          (x.state = re),
          (x.context = _),
          (o = P))
        : (typeof x.componentDidUpdate != 'function' ||
            (w === e.memoizedProps && F === e.memoizedState) ||
            (t.flags |= 4),
          typeof x.getSnapshotBeforeUpdate != 'function' ||
            (w === e.memoizedProps && F === e.memoizedState) ||
            (t.flags |= 1024),
          (o = !1));
    }
    return To(e, t, r, o, f, d);
  }
  function To(e, t, r, o, d, f) {
    iu(e, t);
    var x = (t.flags & 128) !== 0;
    if (!o && !x) return (d && ud(t, r, !1), or(e, t, f));
    ((o = t.stateNode), (Fh.current = t));
    var w = x && typeof r.getDerivedStateFromError != 'function' ? null : o.render();
    return (
      (t.flags |= 1),
      e !== null && x
        ? ((t.child = bn(t, e.child, null, f)), (t.child = bn(t, null, w, f)))
        : dt(e, t, w, f),
      (t.memoizedState = o.state),
      d && ud(t, r, !0),
      t.child
    );
  }
  function ou(e) {
    var t = e.stateNode;
    (t.pendingContext
      ? cd(e, t.pendingContext, t.pendingContext !== t.context)
      : t.context && cd(e, t.context, !1),
      fo(e, t.containerInfo));
  }
  function lu(e, t, r, o, d) {
    return (kn(), io(d), (t.flags |= 256), dt(e, t, r, o), t.child);
  }
  var Io = { dehydrated: null, treeContext: null, retryLane: 0 };
  function Oo(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
  }
  function cu(e, t, r) {
    var o = t.pendingProps,
      d = Pe.current,
      f = !1,
      x = (t.flags & 128) !== 0,
      w;
    if (
      ((w = x) || (w = e !== null && e.memoizedState === null ? !1 : (d & 2) !== 0),
      w ? ((f = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (d |= 1),
      Te(Pe, d & 1),
      e === null)
    )
      return (
        so(t),
        (e = t.memoizedState),
        e !== null && ((e = e.dehydrated), e !== null)
          ? ((t.mode & 1) === 0
              ? (t.lanes = 1)
              : e.data === '$!'
                ? (t.lanes = 8)
                : (t.lanes = 1073741824),
            null)
          : ((x = o.children),
            (e = o.fallback),
            f
              ? ((o = t.mode),
                (f = t.child),
                (x = { mode: 'hidden', children: x }),
                (o & 1) === 0 && f !== null
                  ? ((f.childLanes = 0), (f.pendingProps = x))
                  : (f = $i(x, o, 0, null)),
                (e = Jr(e, o, r, null)),
                (f.return = t),
                (e.return = t),
                (f.sibling = e),
                (t.child = f),
                (t.child.memoizedState = Oo(r)),
                (t.memoizedState = Io),
                e)
              : Ao(t, x))
      );
    if (((d = e.memoizedState), d !== null && ((w = d.dehydrated), w !== null)))
      return Vh(e, t, x, o, w, d, r);
    if (f) {
      ((f = o.fallback), (x = t.mode), (d = e.child), (w = d.sibling));
      var _ = { mode: 'hidden', children: o.children };
      return (
        (x & 1) === 0 && t.child !== d
          ? ((o = t.child), (o.childLanes = 0), (o.pendingProps = _), (t.deletions = null))
          : ((o = Er(d, _)), (o.subtreeFlags = d.subtreeFlags & 14680064)),
        w !== null ? (f = Er(w, f)) : ((f = Jr(f, x, r, null)), (f.flags |= 2)),
        (f.return = t),
        (o.return = t),
        (o.sibling = f),
        (t.child = o),
        (o = f),
        (f = t.child),
        (x = e.child.memoizedState),
        (x =
          x === null
            ? Oo(r)
            : { baseLanes: x.baseLanes | r, cachePool: null, transitions: x.transitions }),
        (f.memoizedState = x),
        (f.childLanes = e.childLanes & ~r),
        (t.memoizedState = Io),
        o
      );
    }
    return (
      (f = e.child),
      (e = f.sibling),
      (o = Er(f, { mode: 'visible', children: o.children })),
      (t.mode & 1) === 0 && (o.lanes = r),
      (o.return = t),
      (o.sibling = null),
      e !== null &&
        ((r = t.deletions), r === null ? ((t.deletions = [e]), (t.flags |= 16)) : r.push(e)),
      (t.child = o),
      (t.memoizedState = null),
      o
    );
  }
  function Ao(e, t) {
    return (
      (t = $i({ mode: 'visible', children: t }, e.mode, 0, null)),
      (t.return = e),
      (e.child = t)
    );
  }
  function Ci(e, t, r, o) {
    return (
      o !== null && io(o),
      bn(t, e.child, null, r),
      (e = Ao(t, t.pendingProps.children)),
      (e.flags |= 2),
      (t.memoizedState = null),
      e
    );
  }
  function Vh(e, t, r, o, d, f, x) {
    if (r)
      return t.flags & 256
        ? ((t.flags &= -257), (o = So(Error(i(422)))), Ci(e, t, x, o))
        : t.memoizedState !== null
          ? ((t.child = e.child), (t.flags |= 128), null)
          : ((f = o.fallback),
            (d = t.mode),
            (o = $i({ mode: 'visible', children: o.children }, d, 0, null)),
            (f = Jr(f, d, x, null)),
            (f.flags |= 2),
            (o.return = t),
            (f.return = t),
            (o.sibling = f),
            (t.child = o),
            (t.mode & 1) !== 0 && bn(t, e.child, null, x),
            (t.child.memoizedState = Oo(x)),
            (t.memoizedState = Io),
            f);
    if ((t.mode & 1) === 0) return Ci(e, t, x, null);
    if (d.data === '$!') {
      if (((o = d.nextSibling && d.nextSibling.dataset), o)) var w = o.dgst;
      return ((o = w), (f = Error(i(419))), (o = So(f, o, void 0)), Ci(e, t, x, o));
    }
    if (((w = (x & e.childLanes) !== 0), vt || w)) {
      if (((o = Qe), o !== null)) {
        switch (x & -x) {
          case 4:
            d = 2;
            break;
          case 16:
            d = 8;
            break;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            d = 32;
            break;
          case 536870912:
            d = 268435456;
            break;
          default:
            d = 0;
        }
        ((d = (d & (o.suspendedLanes | x)) !== 0 ? 0 : d),
          d !== 0 && d !== f.retryLane && ((f.retryLane = d), ir(e, d), Wt(o, e, d, -1)));
      }
      return (Ko(), (o = So(Error(i(421)))), Ci(e, t, x, o));
    }
    return d.data === '$?'
      ? ((t.flags |= 128), (t.child = e.child), (t = nm.bind(null, e)), (d._reactRetry = t), null)
      : ((e = f.treeContext),
        (Nt = gr(d.nextSibling)),
        (jt = t),
        (Le = !0),
        (Dt = null),
        e !== null &&
          ((St[Et++] = nr),
          (St[Et++] = sr),
          (St[Et++] = Vr),
          (nr = e.id),
          (sr = e.overflow),
          (Vr = t)),
        (t = Ao(t, o.children)),
        (t.flags |= 4096),
        t);
  }
  function du(e, t, r) {
    e.lanes |= t;
    var o = e.alternate;
    (o !== null && (o.lanes |= t), co(e.return, t, r));
  }
  function Lo(e, t, r, o, d) {
    var f = e.memoizedState;
    f === null
      ? (e.memoizedState = {
          isBackwards: t,
          rendering: null,
          renderingStartTime: 0,
          last: o,
          tail: r,
          tailMode: d,
        })
      : ((f.isBackwards = t),
        (f.rendering = null),
        (f.renderingStartTime = 0),
        (f.last = o),
        (f.tail = r),
        (f.tailMode = d));
  }
  function uu(e, t, r) {
    var o = t.pendingProps,
      d = o.revealOrder,
      f = o.tail;
    if ((dt(e, t, o.children, r), (o = Pe.current), (o & 2) !== 0))
      ((o = (o & 1) | 2), (t.flags |= 128));
    else {
      if (e !== null && (e.flags & 128) !== 0)
        e: for (e = t.child; e !== null; ) {
          if (e.tag === 13) e.memoizedState !== null && du(e, r, t);
          else if (e.tag === 19) du(e, r, t);
          else if (e.child !== null) {
            ((e.child.return = e), (e = e.child));
            continue;
          }
          if (e === t) break e;
          for (; e.sibling === null; ) {
            if (e.return === null || e.return === t) break e;
            e = e.return;
          }
          ((e.sibling.return = e.return), (e = e.sibling));
        }
      o &= 1;
    }
    if ((Te(Pe, o), (t.mode & 1) === 0)) t.memoizedState = null;
    else
      switch (d) {
        case 'forwards':
          for (r = t.child, d = null; r !== null; )
            ((e = r.alternate), e !== null && yi(e) === null && (d = r), (r = r.sibling));
          ((r = d),
            r === null ? ((d = t.child), (t.child = null)) : ((d = r.sibling), (r.sibling = null)),
            Lo(t, !1, d, r, f));
          break;
        case 'backwards':
          for (r = null, d = t.child, t.child = null; d !== null; ) {
            if (((e = d.alternate), e !== null && yi(e) === null)) {
              t.child = d;
              break;
            }
            ((e = d.sibling), (d.sibling = r), (r = d), (d = e));
          }
          Lo(t, !0, r, null, f);
          break;
        case 'together':
          Lo(t, !1, null, null, void 0);
          break;
        default:
          t.memoizedState = null;
      }
    return t.child;
  }
  function Si(e, t) {
    (t.mode & 1) === 0 &&
      e !== null &&
      ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
  }
  function or(e, t, r) {
    if (
      (e !== null && (t.dependencies = e.dependencies), (Kr |= t.lanes), (r & t.childLanes) === 0)
    )
      return null;
    if (e !== null && t.child !== e.child) throw Error(i(153));
    if (t.child !== null) {
      for (e = t.child, r = Er(e, e.pendingProps), t.child = r, r.return = t; e.sibling !== null; )
        ((e = e.sibling), (r = r.sibling = Er(e, e.pendingProps)), (r.return = t));
      r.sibling = null;
    }
    return t.child;
  }
  function Hh(e, t, r) {
    switch (t.tag) {
      case 3:
        (ou(t), kn());
        break;
      case 5:
        _d(t);
        break;
      case 1:
        gt(t.type) && ci(t);
        break;
      case 4:
        fo(t, t.stateNode.containerInfo);
        break;
      case 10:
        var o = t.type._context,
          d = t.memoizedProps.value;
        (Te(mi, o._currentValue), (o._currentValue = d));
        break;
      case 13:
        if (((o = t.memoizedState), o !== null))
          return o.dehydrated !== null
            ? (Te(Pe, Pe.current & 1), (t.flags |= 128), null)
            : (r & t.child.childLanes) !== 0
              ? cu(e, t, r)
              : (Te(Pe, Pe.current & 1), (e = or(e, t, r)), e !== null ? e.sibling : null);
        Te(Pe, Pe.current & 1);
        break;
      case 19:
        if (((o = (r & t.childLanes) !== 0), (e.flags & 128) !== 0)) {
          if (o) return uu(e, t, r);
          t.flags |= 128;
        }
        if (
          ((d = t.memoizedState),
          d !== null && ((d.rendering = null), (d.tail = null), (d.lastEffect = null)),
          Te(Pe, Pe.current),
          o)
        )
          break;
        return null;
      case 22:
      case 23:
        return ((t.lanes = 0), su(e, t, r));
    }
    return or(e, t, r);
  }
  var pu, Mo, fu, hu;
  ((pu = function (e, t) {
    for (var r = t.child; r !== null; ) {
      if (r.tag === 5 || r.tag === 6) e.appendChild(r.stateNode);
      else if (r.tag !== 4 && r.child !== null) {
        ((r.child.return = r), (r = r.child));
        continue;
      }
      if (r === t) break;
      for (; r.sibling === null; ) {
        if (r.return === null || r.return === t) return;
        r = r.return;
      }
      ((r.sibling.return = r.return), (r = r.sibling));
    }
  }),
    (Mo = function () {}),
    (fu = function (e, t, r, o) {
      var d = e.memoizedProps;
      if (d !== o) {
        ((e = t.stateNode), Yr(Zt.current));
        var f = null;
        switch (r) {
          case 'input':
            ((d = ca(e, d)), (o = ca(e, o)), (f = []));
            break;
          case 'select':
            ((d = L({}, d, { value: void 0 })), (o = L({}, o, { value: void 0 })), (f = []));
            break;
          case 'textarea':
            ((d = pa(e, d)), (o = pa(e, o)), (f = []));
            break;
          default:
            typeof d.onClick != 'function' && typeof o.onClick == 'function' && (e.onclick = ai);
        }
        ha(r, o);
        var x;
        r = null;
        for (P in d)
          if (!o.hasOwnProperty(P) && d.hasOwnProperty(P) && d[P] != null)
            if (P === 'style') {
              var w = d[P];
              for (x in w) w.hasOwnProperty(x) && (r || (r = {}), (r[x] = ''));
            } else
              P !== 'dangerouslySetInnerHTML' &&
                P !== 'children' &&
                P !== 'suppressContentEditableWarning' &&
                P !== 'suppressHydrationWarning' &&
                P !== 'autoFocus' &&
                (c.hasOwnProperty(P) ? f || (f = []) : (f = f || []).push(P, null));
        for (P in o) {
          var _ = o[P];
          if (
            ((w = d != null ? d[P] : void 0),
            o.hasOwnProperty(P) && _ !== w && (_ != null || w != null))
          )
            if (P === 'style')
              if (w) {
                for (x in w)
                  !w.hasOwnProperty(x) ||
                    (_ && _.hasOwnProperty(x)) ||
                    (r || (r = {}), (r[x] = ''));
                for (x in _) _.hasOwnProperty(x) && w[x] !== _[x] && (r || (r = {}), (r[x] = _[x]));
              } else (r || (f || (f = []), f.push(P, r)), (r = _));
            else
              P === 'dangerouslySetInnerHTML'
                ? ((_ = _ ? _.__html : void 0),
                  (w = w ? w.__html : void 0),
                  _ != null && w !== _ && (f = f || []).push(P, _))
                : P === 'children'
                  ? (typeof _ != 'string' && typeof _ != 'number') || (f = f || []).push(P, '' + _)
                  : P !== 'suppressContentEditableWarning' &&
                    P !== 'suppressHydrationWarning' &&
                    (c.hasOwnProperty(P)
                      ? (_ != null && P === 'onScroll' && Oe('scroll', e), f || w === _ || (f = []))
                      : (f = f || []).push(P, _));
        }
        r && (f = f || []).push('style', r);
        var P = f;
        (t.updateQueue = P) && (t.flags |= 4);
      }
    }),
    (hu = function (e, t, r, o) {
      r !== o && (t.flags |= 4);
    }));
  function ks(e, t) {
    if (!Le)
      switch (e.tailMode) {
        case 'hidden':
          t = e.tail;
          for (var r = null; t !== null; ) (t.alternate !== null && (r = t), (t = t.sibling));
          r === null ? (e.tail = null) : (r.sibling = null);
          break;
        case 'collapsed':
          r = e.tail;
          for (var o = null; r !== null; ) (r.alternate !== null && (o = r), (r = r.sibling));
          o === null
            ? t || e.tail === null
              ? (e.tail = null)
              : (e.tail.sibling = null)
            : (o.sibling = null);
      }
  }
  function lt(e) {
    var t = e.alternate !== null && e.alternate.child === e.child,
      r = 0,
      o = 0;
    if (t)
      for (var d = e.child; d !== null; )
        ((r |= d.lanes | d.childLanes),
          (o |= d.subtreeFlags & 14680064),
          (o |= d.flags & 14680064),
          (d.return = e),
          (d = d.sibling));
    else
      for (d = e.child; d !== null; )
        ((r |= d.lanes | d.childLanes),
          (o |= d.subtreeFlags),
          (o |= d.flags),
          (d.return = e),
          (d = d.sibling));
    return ((e.subtreeFlags |= o), (e.childLanes = r), t);
  }
  function Gh(e, t, r) {
    var o = t.pendingProps;
    switch ((ro(t), t.tag)) {
      case 2:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return (lt(t), null);
      case 1:
        return (gt(t.type) && li(), lt(t), null);
      case 3:
        return (
          (o = t.stateNode),
          _n(),
          Ae(xt),
          Ae(at),
          xo(),
          o.pendingContext && ((o.context = o.pendingContext), (o.pendingContext = null)),
          (e === null || e.child === null) &&
            (fi(t)
              ? (t.flags |= 4)
              : e === null ||
                (e.memoizedState.isDehydrated && (t.flags & 256) === 0) ||
                ((t.flags |= 1024), Dt !== null && (Go(Dt), (Dt = null)))),
          Mo(e, t),
          lt(t),
          null
        );
      case 5:
        ho(t);
        var d = Yr(xs.current);
        if (((r = t.type), e !== null && t.stateNode != null))
          (fu(e, t, r, o, d), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)));
        else {
          if (!o) {
            if (t.stateNode === null) throw Error(i(166));
            return (lt(t), null);
          }
          if (((e = Yr(Zt.current)), fi(t))) {
            ((o = t.stateNode), (r = t.type));
            var f = t.memoizedProps;
            switch (((o[Yt] = t), (o[us] = f), (e = (t.mode & 1) !== 0), r)) {
              case 'dialog':
                (Oe('cancel', o), Oe('close', o));
                break;
              case 'iframe':
              case 'object':
              case 'embed':
                Oe('load', o);
                break;
              case 'video':
              case 'audio':
                for (d = 0; d < ls.length; d++) Oe(ls[d], o);
                break;
              case 'source':
                Oe('error', o);
                break;
              case 'img':
              case 'image':
              case 'link':
                (Oe('error', o), Oe('load', o));
                break;
              case 'details':
                Oe('toggle', o);
                break;
              case 'input':
                (Zl(o, f), Oe('invalid', o));
                break;
              case 'select':
                ((o._wrapperState = { wasMultiple: !!f.multiple }), Oe('invalid', o));
                break;
              case 'textarea':
                (Ql(o, f), Oe('invalid', o));
            }
            (ha(r, f), (d = null));
            for (var x in f)
              if (f.hasOwnProperty(x)) {
                var w = f[x];
                x === 'children'
                  ? typeof w == 'string'
                    ? o.textContent !== w &&
                      (f.suppressHydrationWarning !== !0 && ii(o.textContent, w, e),
                      (d = ['children', w]))
                    : typeof w == 'number' &&
                      o.textContent !== '' + w &&
                      (f.suppressHydrationWarning !== !0 && ii(o.textContent, w, e),
                      (d = ['children', '' + w]))
                  : c.hasOwnProperty(x) && w != null && x === 'onScroll' && Oe('scroll', o);
              }
            switch (r) {
              case 'input':
                (tt(o), ql(o, f, !0));
                break;
              case 'textarea':
                (tt(o), Jl(o));
                break;
              case 'select':
              case 'option':
                break;
              default:
                typeof f.onClick == 'function' && (o.onclick = ai);
            }
            ((o = d), (t.updateQueue = o), o !== null && (t.flags |= 4));
          } else {
            ((x = d.nodeType === 9 ? d : d.ownerDocument),
              e === 'http://www.w3.org/1999/xhtml' && (e = ec(r)),
              e === 'http://www.w3.org/1999/xhtml'
                ? r === 'script'
                  ? ((e = x.createElement('div')),
                    (e.innerHTML = '<script><\/script>'),
                    (e = e.removeChild(e.firstChild)))
                  : typeof o.is == 'string'
                    ? (e = x.createElement(r, { is: o.is }))
                    : ((e = x.createElement(r)),
                      r === 'select' &&
                        ((x = e), o.multiple ? (x.multiple = !0) : o.size && (x.size = o.size)))
                : (e = x.createElementNS(e, r)),
              (e[Yt] = t),
              (e[us] = o),
              pu(e, t, !1, !1),
              (t.stateNode = e));
            e: {
              switch (((x = ma(r, o)), r)) {
                case 'dialog':
                  (Oe('cancel', e), Oe('close', e), (d = o));
                  break;
                case 'iframe':
                case 'object':
                case 'embed':
                  (Oe('load', e), (d = o));
                  break;
                case 'video':
                case 'audio':
                  for (d = 0; d < ls.length; d++) Oe(ls[d], e);
                  d = o;
                  break;
                case 'source':
                  (Oe('error', e), (d = o));
                  break;
                case 'img':
                case 'image':
                case 'link':
                  (Oe('error', e), Oe('load', e), (d = o));
                  break;
                case 'details':
                  (Oe('toggle', e), (d = o));
                  break;
                case 'input':
                  (Zl(e, o), (d = ca(e, o)), Oe('invalid', e));
                  break;
                case 'option':
                  d = o;
                  break;
                case 'select':
                  ((e._wrapperState = { wasMultiple: !!o.multiple }),
                    (d = L({}, o, { value: void 0 })),
                    Oe('invalid', e));
                  break;
                case 'textarea':
                  (Ql(e, o), (d = pa(e, o)), Oe('invalid', e));
                  break;
                default:
                  d = o;
              }
              (ha(r, d), (w = d));
              for (f in w)
                if (w.hasOwnProperty(f)) {
                  var _ = w[f];
                  f === 'style'
                    ? nc(e, _)
                    : f === 'dangerouslySetInnerHTML'
                      ? ((_ = _ ? _.__html : void 0), _ != null && tc(e, _))
                      : f === 'children'
                        ? typeof _ == 'string'
                          ? (r !== 'textarea' || _ !== '') && Fn(e, _)
                          : typeof _ == 'number' && Fn(e, '' + _)
                        : f !== 'suppressContentEditableWarning' &&
                          f !== 'suppressHydrationWarning' &&
                          f !== 'autoFocus' &&
                          (c.hasOwnProperty(f)
                            ? _ != null && f === 'onScroll' && Oe('scroll', e)
                            : _ != null && W(e, f, _, x));
                }
              switch (r) {
                case 'input':
                  (tt(e), ql(e, o, !1));
                  break;
                case 'textarea':
                  (tt(e), Jl(e));
                  break;
                case 'option':
                  o.value != null && e.setAttribute('value', '' + q(o.value));
                  break;
                case 'select':
                  ((e.multiple = !!o.multiple),
                    (f = o.value),
                    f != null
                      ? an(e, !!o.multiple, f, !1)
                      : o.defaultValue != null && an(e, !!o.multiple, o.defaultValue, !0));
                  break;
                default:
                  typeof d.onClick == 'function' && (e.onclick = ai);
              }
              switch (r) {
                case 'button':
                case 'input':
                case 'select':
                case 'textarea':
                  o = !!o.autoFocus;
                  break e;
                case 'img':
                  o = !0;
                  break e;
                default:
                  o = !1;
              }
            }
            o && (t.flags |= 4);
          }
          t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152));
        }
        return (lt(t), null);
      case 6:
        if (e && t.stateNode != null) hu(e, t, e.memoizedProps, o);
        else {
          if (typeof o != 'string' && t.stateNode === null) throw Error(i(166));
          if (((r = Yr(xs.current)), Yr(Zt.current), fi(t))) {
            if (
              ((o = t.stateNode),
              (r = t.memoizedProps),
              (o[Yt] = t),
              (f = o.nodeValue !== r) && ((e = jt), e !== null))
            )
              switch (e.tag) {
                case 3:
                  ii(o.nodeValue, r, (e.mode & 1) !== 0);
                  break;
                case 5:
                  e.memoizedProps.suppressHydrationWarning !== !0 &&
                    ii(o.nodeValue, r, (e.mode & 1) !== 0);
              }
            f && (t.flags |= 4);
          } else
            ((o = (r.nodeType === 9 ? r : r.ownerDocument).createTextNode(o)),
              (o[Yt] = t),
              (t.stateNode = o));
        }
        return (lt(t), null);
      case 13:
        if (
          (Ae(Pe),
          (o = t.memoizedState),
          e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
        ) {
          if (Le && Nt !== null && (t.mode & 1) !== 0 && (t.flags & 128) === 0)
            (gd(), kn(), (t.flags |= 98560), (f = !1));
          else if (((f = fi(t)), o !== null && o.dehydrated !== null)) {
            if (e === null) {
              if (!f) throw Error(i(318));
              if (((f = t.memoizedState), (f = f !== null ? f.dehydrated : null), !f))
                throw Error(i(317));
              f[Yt] = t;
            } else (kn(), (t.flags & 128) === 0 && (t.memoizedState = null), (t.flags |= 4));
            (lt(t), (f = !1));
          } else (Dt !== null && (Go(Dt), (Dt = null)), (f = !0));
          if (!f) return t.flags & 65536 ? t : null;
        }
        return (t.flags & 128) !== 0
          ? ((t.lanes = r), t)
          : ((o = o !== null),
            o !== (e !== null && e.memoizedState !== null) &&
              o &&
              ((t.child.flags |= 8192),
              (t.mode & 1) !== 0 &&
                (e === null || (Pe.current & 1) !== 0 ? Ke === 0 && (Ke = 3) : Ko())),
            t.updateQueue !== null && (t.flags |= 4),
            lt(t),
            null);
      case 4:
        return (_n(), Mo(e, t), e === null && cs(t.stateNode.containerInfo), lt(t), null);
      case 10:
        return (lo(t.type._context), lt(t), null);
      case 17:
        return (gt(t.type) && li(), lt(t), null);
      case 19:
        if ((Ae(Pe), (f = t.memoizedState), f === null)) return (lt(t), null);
        if (((o = (t.flags & 128) !== 0), (x = f.rendering), x === null))
          if (o) ks(f, !1);
          else {
            if (Ke !== 0 || (e !== null && (e.flags & 128) !== 0))
              for (e = t.child; e !== null; ) {
                if (((x = yi(e)), x !== null)) {
                  for (
                    t.flags |= 128,
                      ks(f, !1),
                      o = x.updateQueue,
                      o !== null && ((t.updateQueue = o), (t.flags |= 4)),
                      t.subtreeFlags = 0,
                      o = r,
                      r = t.child;
                    r !== null;
                  )
                    ((f = r),
                      (e = o),
                      (f.flags &= 14680066),
                      (x = f.alternate),
                      x === null
                        ? ((f.childLanes = 0),
                          (f.lanes = e),
                          (f.child = null),
                          (f.subtreeFlags = 0),
                          (f.memoizedProps = null),
                          (f.memoizedState = null),
                          (f.updateQueue = null),
                          (f.dependencies = null),
                          (f.stateNode = null))
                        : ((f.childLanes = x.childLanes),
                          (f.lanes = x.lanes),
                          (f.child = x.child),
                          (f.subtreeFlags = 0),
                          (f.deletions = null),
                          (f.memoizedProps = x.memoizedProps),
                          (f.memoizedState = x.memoizedState),
                          (f.updateQueue = x.updateQueue),
                          (f.type = x.type),
                          (e = x.dependencies),
                          (f.dependencies =
                            e === null ? null : { lanes: e.lanes, firstContext: e.firstContext })),
                      (r = r.sibling));
                  return (Te(Pe, (Pe.current & 1) | 2), t.child);
                }
                e = e.sibling;
              }
            f.tail !== null &&
              Ue() > Rn &&
              ((t.flags |= 128), (o = !0), ks(f, !1), (t.lanes = 4194304));
          }
        else {
          if (!o)
            if (((e = yi(x)), e !== null)) {
              if (
                ((t.flags |= 128),
                (o = !0),
                (r = e.updateQueue),
                r !== null && ((t.updateQueue = r), (t.flags |= 4)),
                ks(f, !0),
                f.tail === null && f.tailMode === 'hidden' && !x.alternate && !Le)
              )
                return (lt(t), null);
            } else
              2 * Ue() - f.renderingStartTime > Rn &&
                r !== 1073741824 &&
                ((t.flags |= 128), (o = !0), ks(f, !1), (t.lanes = 4194304));
          f.isBackwards
            ? ((x.sibling = t.child), (t.child = x))
            : ((r = f.last), r !== null ? (r.sibling = x) : (t.child = x), (f.last = x));
        }
        return f.tail !== null
          ? ((t = f.tail),
            (f.rendering = t),
            (f.tail = t.sibling),
            (f.renderingStartTime = Ue()),
            (t.sibling = null),
            (r = Pe.current),
            Te(Pe, o ? (r & 1) | 2 : r & 1),
            t)
          : (lt(t), null);
      case 22:
      case 23:
        return (
          Zo(),
          (o = t.memoizedState !== null),
          e !== null && (e.memoizedState !== null) !== o && (t.flags |= 8192),
          o && (t.mode & 1) !== 0
            ? (_t & 1073741824) !== 0 && (lt(t), t.subtreeFlags & 6 && (t.flags |= 8192))
            : lt(t),
          null
        );
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(i(156, t.tag));
  }
  function Yh(e, t) {
    switch ((ro(t), t.tag)) {
      case 1:
        return (
          gt(t.type) && li(),
          (e = t.flags),
          e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
        );
      case 3:
        return (
          _n(),
          Ae(xt),
          Ae(at),
          xo(),
          (e = t.flags),
          (e & 65536) !== 0 && (e & 128) === 0 ? ((t.flags = (e & -65537) | 128), t) : null
        );
      case 5:
        return (ho(t), null);
      case 13:
        if ((Ae(Pe), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
          if (t.alternate === null) throw Error(i(340));
          kn();
        }
        return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
      case 19:
        return (Ae(Pe), null);
      case 4:
        return (_n(), null);
      case 10:
        return (lo(t.type._context), null);
      case 22:
      case 23:
        return (Zo(), null);
      case 24:
        return null;
      default:
        return null;
    }
  }
  var Ei = !1,
    ct = !1,
    Zh = typeof WeakSet == 'function' ? WeakSet : Set,
    ee = null;
  function Sn(e, t) {
    var r = e.ref;
    if (r !== null)
      if (typeof r == 'function')
        try {
          r(null);
        } catch (o) {
          $e(e, t, o);
        }
      else r.current = null;
  }
  function Po(e, t, r) {
    try {
      r();
    } catch (o) {
      $e(e, t, o);
    }
  }
  var mu = !1;
  function Kh(e, t) {
    if (((Ya = Zs), (e = Yc()), $a(e))) {
      if ('selectionStart' in e) var r = { start: e.selectionStart, end: e.selectionEnd };
      else
        e: {
          r = ((r = e.ownerDocument) && r.defaultView) || window;
          var o = r.getSelection && r.getSelection();
          if (o && o.rangeCount !== 0) {
            r = o.anchorNode;
            var d = o.anchorOffset,
              f = o.focusNode;
            o = o.focusOffset;
            try {
              (r.nodeType, f.nodeType);
            } catch {
              r = null;
              break e;
            }
            var x = 0,
              w = -1,
              _ = -1,
              P = 0,
              V = 0,
              H = e,
              F = null;
            t: for (;;) {
              for (
                var J;
                H !== r || (d !== 0 && H.nodeType !== 3) || (w = x + d),
                  H !== f || (o !== 0 && H.nodeType !== 3) || (_ = x + o),
                  H.nodeType === 3 && (x += H.nodeValue.length),
                  (J = H.firstChild) !== null;
              )
                ((F = H), (H = J));
              for (;;) {
                if (H === e) break t;
                if (
                  (F === r && ++P === d && (w = x),
                  F === f && ++V === o && (_ = x),
                  (J = H.nextSibling) !== null)
                )
                  break;
                ((H = F), (F = H.parentNode));
              }
              H = J;
            }
            r = w === -1 || _ === -1 ? null : { start: w, end: _ };
          } else r = null;
        }
      r = r || { start: 0, end: 0 };
    } else r = null;
    for (Za = { focusedElem: e, selectionRange: r }, Zs = !1, ee = t; ee !== null; )
      if (((t = ee), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
        ((e.return = t), (ee = e));
      else
        for (; ee !== null; ) {
          t = ee;
          try {
            var re = t.alternate;
            if ((t.flags & 1024) !== 0)
              switch (t.tag) {
                case 0:
                case 11:
                case 15:
                  break;
                case 1:
                  if (re !== null) {
                    var se = re.memoizedProps,
                      We = re.memoizedState,
                      O = t.stateNode,
                      I = O.getSnapshotBeforeUpdate(
                        t.elementType === t.type ? se : zt(t.type, se),
                        We,
                      );
                    O.__reactInternalSnapshotBeforeUpdate = I;
                  }
                  break;
                case 3:
                  var A = t.stateNode.containerInfo;
                  A.nodeType === 1
                    ? (A.textContent = '')
                    : A.nodeType === 9 && A.documentElement && A.removeChild(A.documentElement);
                  break;
                case 5:
                case 6:
                case 4:
                case 17:
                  break;
                default:
                  throw Error(i(163));
              }
          } catch (Z) {
            $e(t, t.return, Z);
          }
          if (((e = t.sibling), e !== null)) {
            ((e.return = t.return), (ee = e));
            break;
          }
          ee = t.return;
        }
    return ((re = mu), (mu = !1), re);
  }
  function bs(e, t, r) {
    var o = t.updateQueue;
    if (((o = o !== null ? o.lastEffect : null), o !== null)) {
      var d = (o = o.next);
      do {
        if ((d.tag & e) === e) {
          var f = d.destroy;
          ((d.destroy = void 0), f !== void 0 && Po(t, r, f));
        }
        d = d.next;
      } while (d !== o);
    }
  }
  function Ri(e, t) {
    if (((t = t.updateQueue), (t = t !== null ? t.lastEffect : null), t !== null)) {
      var r = (t = t.next);
      do {
        if ((r.tag & e) === e) {
          var o = r.create;
          r.destroy = o();
        }
        r = r.next;
      } while (r !== t);
    }
  }
  function Do(e) {
    var t = e.ref;
    if (t !== null) {
      var r = e.stateNode;
      switch (e.tag) {
        case 5:
          e = r;
          break;
        default:
          e = r;
      }
      typeof t == 'function' ? t(e) : (t.current = e);
    }
  }
  function xu(e) {
    var t = e.alternate;
    (t !== null && ((e.alternate = null), xu(t)),
      (e.child = null),
      (e.deletions = null),
      (e.sibling = null),
      e.tag === 5 &&
        ((t = e.stateNode),
        t !== null && (delete t[Yt], delete t[us], delete t[Xa], delete t[Ih], delete t[Oh])),
      (e.stateNode = null),
      (e.return = null),
      (e.dependencies = null),
      (e.memoizedProps = null),
      (e.memoizedState = null),
      (e.pendingProps = null),
      (e.stateNode = null),
      (e.updateQueue = null));
  }
  function gu(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
  }
  function vu(e) {
    e: for (;;) {
      for (; e.sibling === null; ) {
        if (e.return === null || gu(e.return)) return null;
        e = e.return;
      }
      for (
        e.sibling.return = e.return, e = e.sibling;
        e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
      ) {
        if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
        ((e.child.return = e), (e = e.child));
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function zo(e, t, r) {
    var o = e.tag;
    if (o === 5 || o === 6)
      ((e = e.stateNode),
        t
          ? r.nodeType === 8
            ? r.parentNode.insertBefore(e, t)
            : r.insertBefore(e, t)
          : (r.nodeType === 8
              ? ((t = r.parentNode), t.insertBefore(e, r))
              : ((t = r), t.appendChild(e)),
            (r = r._reactRootContainer),
            r != null || t.onclick !== null || (t.onclick = ai)));
    else if (o !== 4 && ((e = e.child), e !== null))
      for (zo(e, t, r), e = e.sibling; e !== null; ) (zo(e, t, r), (e = e.sibling));
  }
  function $o(e, t, r) {
    var o = e.tag;
    if (o === 5 || o === 6) ((e = e.stateNode), t ? r.insertBefore(e, t) : r.appendChild(e));
    else if (o !== 4 && ((e = e.child), e !== null))
      for ($o(e, t, r), e = e.sibling; e !== null; ) ($o(e, t, r), (e = e.sibling));
  }
  var nt = null,
    $t = !1;
  function jr(e, t, r) {
    for (r = r.child; r !== null; ) (yu(e, t, r), (r = r.sibling));
  }
  function yu(e, t, r) {
    if (Gt && typeof Gt.onCommitFiberUnmount == 'function')
      try {
        Gt.onCommitFiberUnmount(Bs, r);
      } catch {}
    switch (r.tag) {
      case 5:
        ct || Sn(r, t);
      case 6:
        var o = nt,
          d = $t;
        ((nt = null),
          jr(e, t, r),
          (nt = o),
          ($t = d),
          nt !== null &&
            ($t
              ? ((e = nt),
                (r = r.stateNode),
                e.nodeType === 8 ? e.parentNode.removeChild(r) : e.removeChild(r))
              : nt.removeChild(r.stateNode)));
        break;
      case 18:
        nt !== null &&
          ($t
            ? ((e = nt),
              (r = r.stateNode),
              e.nodeType === 8 ? Qa(e.parentNode, r) : e.nodeType === 1 && Qa(e, r),
              es(e))
            : Qa(nt, r.stateNode));
        break;
      case 4:
        ((o = nt),
          (d = $t),
          (nt = r.stateNode.containerInfo),
          ($t = !0),
          jr(e, t, r),
          (nt = o),
          ($t = d));
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        if (!ct && ((o = r.updateQueue), o !== null && ((o = o.lastEffect), o !== null))) {
          d = o = o.next;
          do {
            var f = d,
              x = f.destroy;
            ((f = f.tag),
              x !== void 0 && ((f & 2) !== 0 || (f & 4) !== 0) && Po(r, t, x),
              (d = d.next));
          } while (d !== o);
        }
        jr(e, t, r);
        break;
      case 1:
        if (!ct && (Sn(r, t), (o = r.stateNode), typeof o.componentWillUnmount == 'function'))
          try {
            ((o.props = r.memoizedProps), (o.state = r.memoizedState), o.componentWillUnmount());
          } catch (w) {
            $e(r, t, w);
          }
        jr(e, t, r);
        break;
      case 21:
        jr(e, t, r);
        break;
      case 22:
        r.mode & 1
          ? ((ct = (o = ct) || r.memoizedState !== null), jr(e, t, r), (ct = o))
          : jr(e, t, r);
        break;
      default:
        jr(e, t, r);
    }
  }
  function wu(e) {
    var t = e.updateQueue;
    if (t !== null) {
      e.updateQueue = null;
      var r = e.stateNode;
      (r === null && (r = e.stateNode = new Zh()),
        t.forEach(function (o) {
          var d = sm.bind(null, e, o);
          r.has(o) || (r.add(o), o.then(d, d));
        }));
    }
  }
  function Ut(e, t) {
    var r = t.deletions;
    if (r !== null)
      for (var o = 0; o < r.length; o++) {
        var d = r[o];
        try {
          var f = e,
            x = t,
            w = x;
          e: for (; w !== null; ) {
            switch (w.tag) {
              case 5:
                ((nt = w.stateNode), ($t = !1));
                break e;
              case 3:
                ((nt = w.stateNode.containerInfo), ($t = !0));
                break e;
              case 4:
                ((nt = w.stateNode.containerInfo), ($t = !0));
                break e;
            }
            w = w.return;
          }
          if (nt === null) throw Error(i(160));
          (yu(f, x, d), (nt = null), ($t = !1));
          var _ = d.alternate;
          (_ !== null && (_.return = null), (d.return = null));
        } catch (P) {
          $e(d, t, P);
        }
      }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) (ku(t, e), (t = t.sibling));
  }
  function ku(e, t) {
    var r = e.alternate,
      o = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        if ((Ut(t, e), qt(e), o & 4)) {
          try {
            (bs(3, e, e.return), Ri(3, e));
          } catch (se) {
            $e(e, e.return, se);
          }
          try {
            bs(5, e, e.return);
          } catch (se) {
            $e(e, e.return, se);
          }
        }
        break;
      case 1:
        (Ut(t, e), qt(e), o & 512 && r !== null && Sn(r, r.return));
        break;
      case 5:
        if ((Ut(t, e), qt(e), o & 512 && r !== null && Sn(r, r.return), e.flags & 32)) {
          var d = e.stateNode;
          try {
            Fn(d, '');
          } catch (se) {
            $e(e, e.return, se);
          }
        }
        if (o & 4 && ((d = e.stateNode), d != null)) {
          var f = e.memoizedProps,
            x = r !== null ? r.memoizedProps : f,
            w = e.type,
            _ = e.updateQueue;
          if (((e.updateQueue = null), _ !== null))
            try {
              (w === 'input' && f.type === 'radio' && f.name != null && Kl(d, f), ma(w, x));
              var P = ma(w, f);
              for (x = 0; x < _.length; x += 2) {
                var V = _[x],
                  H = _[x + 1];
                V === 'style'
                  ? nc(d, H)
                  : V === 'dangerouslySetInnerHTML'
                    ? tc(d, H)
                    : V === 'children'
                      ? Fn(d, H)
                      : W(d, V, H, P);
              }
              switch (w) {
                case 'input':
                  da(d, f);
                  break;
                case 'textarea':
                  Xl(d, f);
                  break;
                case 'select':
                  var F = d._wrapperState.wasMultiple;
                  d._wrapperState.wasMultiple = !!f.multiple;
                  var J = f.value;
                  J != null
                    ? an(d, !!f.multiple, J, !1)
                    : F !== !!f.multiple &&
                      (f.defaultValue != null
                        ? an(d, !!f.multiple, f.defaultValue, !0)
                        : an(d, !!f.multiple, f.multiple ? [] : '', !1));
              }
              d[us] = f;
            } catch (se) {
              $e(e, e.return, se);
            }
        }
        break;
      case 6:
        if ((Ut(t, e), qt(e), o & 4)) {
          if (e.stateNode === null) throw Error(i(162));
          ((d = e.stateNode), (f = e.memoizedProps));
          try {
            d.nodeValue = f;
          } catch (se) {
            $e(e, e.return, se);
          }
        }
        break;
      case 3:
        if ((Ut(t, e), qt(e), o & 4 && r !== null && r.memoizedState.isDehydrated))
          try {
            es(t.containerInfo);
          } catch (se) {
            $e(e, e.return, se);
          }
        break;
      case 4:
        (Ut(t, e), qt(e));
        break;
      case 13:
        (Ut(t, e),
          qt(e),
          (d = e.child),
          d.flags & 8192 &&
            ((f = d.memoizedState !== null),
            (d.stateNode.isHidden = f),
            !f || (d.alternate !== null && d.alternate.memoizedState !== null) || (Bo = Ue())),
          o & 4 && wu(e));
        break;
      case 22:
        if (
          ((V = r !== null && r.memoizedState !== null),
          e.mode & 1 ? ((ct = (P = ct) || V), Ut(t, e), (ct = P)) : Ut(t, e),
          qt(e),
          o & 8192)
        ) {
          if (
            ((P = e.memoizedState !== null), (e.stateNode.isHidden = P) && !V && (e.mode & 1) !== 0)
          )
            for (ee = e, V = e.child; V !== null; ) {
              for (H = ee = V; ee !== null; ) {
                switch (((F = ee), (J = F.child), F.tag)) {
                  case 0:
                  case 11:
                  case 14:
                  case 15:
                    bs(4, F, F.return);
                    break;
                  case 1:
                    Sn(F, F.return);
                    var re = F.stateNode;
                    if (typeof re.componentWillUnmount == 'function') {
                      ((o = F), (r = F.return));
                      try {
                        ((t = o),
                          (re.props = t.memoizedProps),
                          (re.state = t.memoizedState),
                          re.componentWillUnmount());
                      } catch (se) {
                        $e(o, r, se);
                      }
                    }
                    break;
                  case 5:
                    Sn(F, F.return);
                    break;
                  case 22:
                    if (F.memoizedState !== null) {
                      Nu(H);
                      continue;
                    }
                }
                J !== null ? ((J.return = F), (ee = J)) : Nu(H);
              }
              V = V.sibling;
            }
          e: for (V = null, H = e; ; ) {
            if (H.tag === 5) {
              if (V === null) {
                V = H;
                try {
                  ((d = H.stateNode),
                    P
                      ? ((f = d.style),
                        typeof f.setProperty == 'function'
                          ? f.setProperty('display', 'none', 'important')
                          : (f.display = 'none'))
                      : ((w = H.stateNode),
                        (_ = H.memoizedProps.style),
                        (x = _ != null && _.hasOwnProperty('display') ? _.display : null),
                        (w.style.display = rc('display', x))));
                } catch (se) {
                  $e(e, e.return, se);
                }
              }
            } else if (H.tag === 6) {
              if (V === null)
                try {
                  H.stateNode.nodeValue = P ? '' : H.memoizedProps;
                } catch (se) {
                  $e(e, e.return, se);
                }
            } else if (
              ((H.tag !== 22 && H.tag !== 23) || H.memoizedState === null || H === e) &&
              H.child !== null
            ) {
              ((H.child.return = H), (H = H.child));
              continue;
            }
            if (H === e) break e;
            for (; H.sibling === null; ) {
              if (H.return === null || H.return === e) break e;
              (V === H && (V = null), (H = H.return));
            }
            (V === H && (V = null), (H.sibling.return = H.return), (H = H.sibling));
          }
        }
        break;
      case 19:
        (Ut(t, e), qt(e), o & 4 && wu(e));
        break;
      case 21:
        break;
      default:
        (Ut(t, e), qt(e));
    }
  }
  function qt(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        e: {
          for (var r = e.return; r !== null; ) {
            if (gu(r)) {
              var o = r;
              break e;
            }
            r = r.return;
          }
          throw Error(i(160));
        }
        switch (o.tag) {
          case 5:
            var d = o.stateNode;
            o.flags & 32 && (Fn(d, ''), (o.flags &= -33));
            var f = vu(e);
            $o(e, f, d);
            break;
          case 3:
          case 4:
            var x = o.stateNode.containerInfo,
              w = vu(e);
            zo(e, w, x);
            break;
          default:
            throw Error(i(161));
        }
      } catch (_) {
        $e(e, e.return, _);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function qh(e, t, r) {
    ((ee = e), bu(e));
  }
  function bu(e, t, r) {
    for (var o = (e.mode & 1) !== 0; ee !== null; ) {
      var d = ee,
        f = d.child;
      if (d.tag === 22 && o) {
        var x = d.memoizedState !== null || Ei;
        if (!x) {
          var w = d.alternate,
            _ = (w !== null && w.memoizedState !== null) || ct;
          w = Ei;
          var P = ct;
          if (((Ei = x), (ct = _) && !P))
            for (ee = d; ee !== null; )
              ((x = ee),
                (_ = x.child),
                x.tag === 22 && x.memoizedState !== null
                  ? _u(d)
                  : _ !== null
                    ? ((_.return = x), (ee = _))
                    : _u(d));
          for (; f !== null; ) ((ee = f), bu(f), (f = f.sibling));
          ((ee = d), (Ei = w), (ct = P));
        }
        ju(e);
      } else (d.subtreeFlags & 8772) !== 0 && f !== null ? ((f.return = d), (ee = f)) : ju(e);
    }
  }
  function ju(e) {
    for (; ee !== null; ) {
      var t = ee;
      if ((t.flags & 8772) !== 0) {
        var r = t.alternate;
        try {
          if ((t.flags & 8772) !== 0)
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                ct || Ri(5, t);
                break;
              case 1:
                var o = t.stateNode;
                if (t.flags & 4 && !ct)
                  if (r === null) o.componentDidMount();
                  else {
                    var d =
                      t.elementType === t.type ? r.memoizedProps : zt(t.type, r.memoizedProps);
                    o.componentDidUpdate(d, r.memoizedState, o.__reactInternalSnapshotBeforeUpdate);
                  }
                var f = t.updateQueue;
                f !== null && Nd(t, f, o);
                break;
              case 3:
                var x = t.updateQueue;
                if (x !== null) {
                  if (((r = null), t.child !== null))
                    switch (t.child.tag) {
                      case 5:
                        r = t.child.stateNode;
                        break;
                      case 1:
                        r = t.child.stateNode;
                    }
                  Nd(t, x, r);
                }
                break;
              case 5:
                var w = t.stateNode;
                if (r === null && t.flags & 4) {
                  r = w;
                  var _ = t.memoizedProps;
                  switch (t.type) {
                    case 'button':
                    case 'input':
                    case 'select':
                    case 'textarea':
                      _.autoFocus && r.focus();
                      break;
                    case 'img':
                      _.src && (r.src = _.src);
                  }
                }
                break;
              case 6:
                break;
              case 4:
                break;
              case 12:
                break;
              case 13:
                if (t.memoizedState === null) {
                  var P = t.alternate;
                  if (P !== null) {
                    var V = P.memoizedState;
                    if (V !== null) {
                      var H = V.dehydrated;
                      H !== null && es(H);
                    }
                  }
                }
                break;
              case 19:
              case 17:
              case 21:
              case 22:
              case 23:
              case 25:
                break;
              default:
                throw Error(i(163));
            }
          ct || (t.flags & 512 && Do(t));
        } catch (F) {
          $e(t, t.return, F);
        }
      }
      if (t === e) {
        ee = null;
        break;
      }
      if (((r = t.sibling), r !== null)) {
        ((r.return = t.return), (ee = r));
        break;
      }
      ee = t.return;
    }
  }
  function Nu(e) {
    for (; ee !== null; ) {
      var t = ee;
      if (t === e) {
        ee = null;
        break;
      }
      var r = t.sibling;
      if (r !== null) {
        ((r.return = t.return), (ee = r));
        break;
      }
      ee = t.return;
    }
  }
  function _u(e) {
    for (; ee !== null; ) {
      var t = ee;
      try {
        switch (t.tag) {
          case 0:
          case 11:
          case 15:
            var r = t.return;
            try {
              Ri(4, t);
            } catch (_) {
              $e(t, r, _);
            }
            break;
          case 1:
            var o = t.stateNode;
            if (typeof o.componentDidMount == 'function') {
              var d = t.return;
              try {
                o.componentDidMount();
              } catch (_) {
                $e(t, d, _);
              }
            }
            var f = t.return;
            try {
              Do(t);
            } catch (_) {
              $e(t, f, _);
            }
            break;
          case 5:
            var x = t.return;
            try {
              Do(t);
            } catch (_) {
              $e(t, x, _);
            }
        }
      } catch (_) {
        $e(t, t.return, _);
      }
      if (t === e) {
        ee = null;
        break;
      }
      var w = t.sibling;
      if (w !== null) {
        ((w.return = t.return), (ee = w));
        break;
      }
      ee = t.return;
    }
  }
  var Qh = Math.ceil,
    Ti = G.ReactCurrentDispatcher,
    Uo = G.ReactCurrentOwner,
    It = G.ReactCurrentBatchConfig,
    Ne = 0,
    Qe = null,
    Fe = null,
    st = 0,
    _t = 0,
    En = vr(0),
    Ke = 0,
    js = null,
    Kr = 0,
    Ii = 0,
    Wo = 0,
    Ns = null,
    yt = null,
    Bo = 0,
    Rn = 1 / 0,
    lr = null,
    Oi = !1,
    Fo = null,
    Nr = null,
    Ai = !1,
    _r = null,
    Li = 0,
    _s = 0,
    Vo = null,
    Mi = -1,
    Pi = 0;
  function ut() {
    return (Ne & 6) !== 0 ? Ue() : Mi !== -1 ? Mi : (Mi = Ue());
  }
  function Cr(e) {
    return (e.mode & 1) === 0
      ? 1
      : (Ne & 2) !== 0 && st !== 0
        ? st & -st
        : Lh.transition !== null
          ? (Pi === 0 && (Pi = vc()), Pi)
          : ((e = Re), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : Sc(e.type))), e);
  }
  function Wt(e, t, r, o) {
    if (50 < _s) throw ((_s = 0), (Vo = null), Error(i(185)));
    (Kn(e, r, o),
      ((Ne & 2) === 0 || e !== Qe) &&
        (e === Qe && ((Ne & 2) === 0 && (Ii |= r), Ke === 4 && Sr(e, st)),
        wt(e, o),
        r === 1 && Ne === 0 && (t.mode & 1) === 0 && ((Rn = Ue() + 500), di && wr())));
  }
  function wt(e, t) {
    var r = e.callbackNode;
    Lf(e, t);
    var o = Hs(e, e === Qe ? st : 0);
    if (o === 0) (r !== null && mc(r), (e.callbackNode = null), (e.callbackPriority = 0));
    else if (((t = o & -o), e.callbackPriority !== t)) {
      if ((r != null && mc(r), t === 1))
        (e.tag === 0 ? Ah(Su.bind(null, e)) : pd(Su.bind(null, e)),
          Rh(function () {
            (Ne & 6) === 0 && wr();
          }),
          (r = null));
      else {
        switch (yc(o)) {
          case 1:
            r = ba;
            break;
          case 4:
            r = xc;
            break;
          case 16:
            r = Ws;
            break;
          case 536870912:
            r = gc;
            break;
          default:
            r = Ws;
        }
        r = Mu(r, Cu.bind(null, e));
      }
      ((e.callbackPriority = t), (e.callbackNode = r));
    }
  }
  function Cu(e, t) {
    if (((Mi = -1), (Pi = 0), (Ne & 6) !== 0)) throw Error(i(327));
    var r = e.callbackNode;
    if (Tn() && e.callbackNode !== r) return null;
    var o = Hs(e, e === Qe ? st : 0);
    if (o === 0) return null;
    if ((o & 30) !== 0 || (o & e.expiredLanes) !== 0 || t) t = Di(e, o);
    else {
      t = o;
      var d = Ne;
      Ne |= 2;
      var f = Ru();
      (Qe !== e || st !== t) && ((lr = null), (Rn = Ue() + 500), Qr(e, t));
      do
        try {
          em();
          break;
        } catch (w) {
          Eu(e, w);
        }
      while (!0);
      (oo(), (Ti.current = f), (Ne = d), Fe !== null ? (t = 0) : ((Qe = null), (st = 0), (t = Ke)));
    }
    if (t !== 0) {
      if ((t === 2 && ((d = ja(e)), d !== 0 && ((o = d), (t = Ho(e, d)))), t === 1))
        throw ((r = js), Qr(e, 0), Sr(e, o), wt(e, Ue()), r);
      if (t === 6) Sr(e, o);
      else {
        if (
          ((d = e.current.alternate),
          (o & 30) === 0 &&
            !Xh(d) &&
            ((t = Di(e, o)),
            t === 2 && ((f = ja(e)), f !== 0 && ((o = f), (t = Ho(e, f)))),
            t === 1))
        )
          throw ((r = js), Qr(e, 0), Sr(e, o), wt(e, Ue()), r);
        switch (((e.finishedWork = d), (e.finishedLanes = o), t)) {
          case 0:
          case 1:
            throw Error(i(345));
          case 2:
            Xr(e, yt, lr);
            break;
          case 3:
            if ((Sr(e, o), (o & 130023424) === o && ((t = Bo + 500 - Ue()), 10 < t))) {
              if (Hs(e, 0) !== 0) break;
              if (((d = e.suspendedLanes), (d & o) !== o)) {
                (ut(), (e.pingedLanes |= e.suspendedLanes & d));
                break;
              }
              e.timeoutHandle = qa(Xr.bind(null, e, yt, lr), t);
              break;
            }
            Xr(e, yt, lr);
            break;
          case 4:
            if ((Sr(e, o), (o & 4194240) === o)) break;
            for (t = e.eventTimes, d = -1; 0 < o; ) {
              var x = 31 - Mt(o);
              ((f = 1 << x), (x = t[x]), x > d && (d = x), (o &= ~f));
            }
            if (
              ((o = d),
              (o = Ue() - o),
              (o =
                (120 > o
                  ? 120
                  : 480 > o
                    ? 480
                    : 1080 > o
                      ? 1080
                      : 1920 > o
                        ? 1920
                        : 3e3 > o
                          ? 3e3
                          : 4320 > o
                            ? 4320
                            : 1960 * Qh(o / 1960)) - o),
              10 < o)
            ) {
              e.timeoutHandle = qa(Xr.bind(null, e, yt, lr), o);
              break;
            }
            Xr(e, yt, lr);
            break;
          case 5:
            Xr(e, yt, lr);
            break;
          default:
            throw Error(i(329));
        }
      }
    }
    return (wt(e, Ue()), e.callbackNode === r ? Cu.bind(null, e) : null);
  }
  function Ho(e, t) {
    var r = Ns;
    return (
      e.current.memoizedState.isDehydrated && (Qr(e, t).flags |= 256),
      (e = Di(e, t)),
      e !== 2 && ((t = yt), (yt = r), t !== null && Go(t)),
      e
    );
  }
  function Go(e) {
    yt === null ? (yt = e) : yt.push.apply(yt, e);
  }
  function Xh(e) {
    for (var t = e; ; ) {
      if (t.flags & 16384) {
        var r = t.updateQueue;
        if (r !== null && ((r = r.stores), r !== null))
          for (var o = 0; o < r.length; o++) {
            var d = r[o],
              f = d.getSnapshot;
            d = d.value;
            try {
              if (!Pt(f(), d)) return !1;
            } catch {
              return !1;
            }
          }
      }
      if (((r = t.child), t.subtreeFlags & 16384 && r !== null)) ((r.return = t), (t = r));
      else {
        if (t === e) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) return !0;
          t = t.return;
        }
        ((t.sibling.return = t.return), (t = t.sibling));
      }
    }
    return !0;
  }
  function Sr(e, t) {
    for (
      t &= ~Wo, t &= ~Ii, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes;
      0 < t;
    ) {
      var r = 31 - Mt(t),
        o = 1 << r;
      ((e[r] = -1), (t &= ~o));
    }
  }
  function Su(e) {
    if ((Ne & 6) !== 0) throw Error(i(327));
    Tn();
    var t = Hs(e, 0);
    if ((t & 1) === 0) return (wt(e, Ue()), null);
    var r = Di(e, t);
    if (e.tag !== 0 && r === 2) {
      var o = ja(e);
      o !== 0 && ((t = o), (r = Ho(e, o)));
    }
    if (r === 1) throw ((r = js), Qr(e, 0), Sr(e, t), wt(e, Ue()), r);
    if (r === 6) throw Error(i(345));
    return (
      (e.finishedWork = e.current.alternate),
      (e.finishedLanes = t),
      Xr(e, yt, lr),
      wt(e, Ue()),
      null
    );
  }
  function Yo(e, t) {
    var r = Ne;
    Ne |= 1;
    try {
      return e(t);
    } finally {
      ((Ne = r), Ne === 0 && ((Rn = Ue() + 500), di && wr()));
    }
  }
  function qr(e) {
    _r !== null && _r.tag === 0 && (Ne & 6) === 0 && Tn();
    var t = Ne;
    Ne |= 1;
    var r = It.transition,
      o = Re;
    try {
      if (((It.transition = null), (Re = 1), e)) return e();
    } finally {
      ((Re = o), (It.transition = r), (Ne = t), (Ne & 6) === 0 && wr());
    }
  }
  function Zo() {
    ((_t = En.current), Ae(En));
  }
  function Qr(e, t) {
    ((e.finishedWork = null), (e.finishedLanes = 0));
    var r = e.timeoutHandle;
    if ((r !== -1 && ((e.timeoutHandle = -1), Eh(r)), Fe !== null))
      for (r = Fe.return; r !== null; ) {
        var o = r;
        switch ((ro(o), o.tag)) {
          case 1:
            ((o = o.type.childContextTypes), o != null && li());
            break;
          case 3:
            (_n(), Ae(xt), Ae(at), xo());
            break;
          case 5:
            ho(o);
            break;
          case 4:
            _n();
            break;
          case 13:
            Ae(Pe);
            break;
          case 19:
            Ae(Pe);
            break;
          case 10:
            lo(o.type._context);
            break;
          case 22:
          case 23:
            Zo();
        }
        r = r.return;
      }
    if (
      ((Qe = e),
      (Fe = e = Er(e.current, null)),
      (st = _t = t),
      (Ke = 0),
      (js = null),
      (Wo = Ii = Kr = 0),
      (yt = Ns = null),
      Gr !== null)
    ) {
      for (t = 0; t < Gr.length; t++)
        if (((r = Gr[t]), (o = r.interleaved), o !== null)) {
          r.interleaved = null;
          var d = o.next,
            f = r.pending;
          if (f !== null) {
            var x = f.next;
            ((f.next = d), (o.next = x));
          }
          r.pending = o;
        }
      Gr = null;
    }
    return e;
  }
  function Eu(e, t) {
    do {
      var r = Fe;
      try {
        if ((oo(), (wi.current = Ni), ki)) {
          for (var o = De.memoizedState; o !== null; ) {
            var d = o.queue;
            (d !== null && (d.pending = null), (o = o.next));
          }
          ki = !1;
        }
        if (
          ((Zr = 0),
          (qe = Ze = De = null),
          (gs = !1),
          (vs = 0),
          (Uo.current = null),
          r === null || r.return === null)
        ) {
          ((Ke = 1), (js = t), (Fe = null));
          break;
        }
        e: {
          var f = e,
            x = r.return,
            w = r,
            _ = t;
          if (
            ((t = st),
            (w.flags |= 32768),
            _ !== null && typeof _ == 'object' && typeof _.then == 'function')
          ) {
            var P = _,
              V = w,
              H = V.tag;
            if ((V.mode & 1) === 0 && (H === 0 || H === 11 || H === 15)) {
              var F = V.alternate;
              F
                ? ((V.updateQueue = F.updateQueue),
                  (V.memoizedState = F.memoizedState),
                  (V.lanes = F.lanes))
                : ((V.updateQueue = null), (V.memoizedState = null));
            }
            var J = Jd(x);
            if (J !== null) {
              ((J.flags &= -257), eu(J, x, w, f, t), J.mode & 1 && Xd(f, P, t), (t = J), (_ = P));
              var re = t.updateQueue;
              if (re === null) {
                var se = new Set();
                (se.add(_), (t.updateQueue = se));
              } else re.add(_);
              break e;
            } else {
              if ((t & 1) === 0) {
                (Xd(f, P, t), Ko());
                break e;
              }
              _ = Error(i(426));
            }
          } else if (Le && w.mode & 1) {
            var We = Jd(x);
            if (We !== null) {
              ((We.flags & 65536) === 0 && (We.flags |= 256), eu(We, x, w, f, t), io(Cn(_, w)));
              break e;
            }
          }
          ((f = _ = Cn(_, w)),
            Ke !== 4 && (Ke = 2),
            Ns === null ? (Ns = [f]) : Ns.push(f),
            (f = x));
          do {
            switch (f.tag) {
              case 3:
                ((f.flags |= 65536), (t &= -t), (f.lanes |= t));
                var O = qd(f, _, t);
                jd(f, O);
                break e;
              case 1:
                w = _;
                var I = f.type,
                  A = f.stateNode;
                if (
                  (f.flags & 128) === 0 &&
                  (typeof I.getDerivedStateFromError == 'function' ||
                    (A !== null &&
                      typeof A.componentDidCatch == 'function' &&
                      (Nr === null || !Nr.has(A))))
                ) {
                  ((f.flags |= 65536), (t &= -t), (f.lanes |= t));
                  var Z = Qd(f, w, t);
                  jd(f, Z);
                  break e;
                }
            }
            f = f.return;
          } while (f !== null);
        }
        Iu(r);
      } catch (ie) {
        ((t = ie), Fe === r && r !== null && (Fe = r = r.return));
        continue;
      }
      break;
    } while (!0);
  }
  function Ru() {
    var e = Ti.current;
    return ((Ti.current = Ni), e === null ? Ni : e);
  }
  function Ko() {
    ((Ke === 0 || Ke === 3 || Ke === 2) && (Ke = 4),
      Qe === null || ((Kr & 268435455) === 0 && (Ii & 268435455) === 0) || Sr(Qe, st));
  }
  function Di(e, t) {
    var r = Ne;
    Ne |= 2;
    var o = Ru();
    (Qe !== e || st !== t) && ((lr = null), Qr(e, t));
    do
      try {
        Jh();
        break;
      } catch (d) {
        Eu(e, d);
      }
    while (!0);
    if ((oo(), (Ne = r), (Ti.current = o), Fe !== null)) throw Error(i(261));
    return ((Qe = null), (st = 0), Ke);
  }
  function Jh() {
    for (; Fe !== null; ) Tu(Fe);
  }
  function em() {
    for (; Fe !== null && !_f(); ) Tu(Fe);
  }
  function Tu(e) {
    var t = Lu(e.alternate, e, _t);
    ((e.memoizedProps = e.pendingProps), t === null ? Iu(e) : (Fe = t), (Uo.current = null));
  }
  function Iu(e) {
    var t = e;
    do {
      var r = t.alternate;
      if (((e = t.return), (t.flags & 32768) === 0)) {
        if (((r = Gh(r, t, _t)), r !== null)) {
          Fe = r;
          return;
        }
      } else {
        if (((r = Yh(r, t)), r !== null)) {
          ((r.flags &= 32767), (Fe = r));
          return;
        }
        if (e !== null) ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null));
        else {
          ((Ke = 6), (Fe = null));
          return;
        }
      }
      if (((t = t.sibling), t !== null)) {
        Fe = t;
        return;
      }
      Fe = t = e;
    } while (t !== null);
    Ke === 0 && (Ke = 5);
  }
  function Xr(e, t, r) {
    var o = Re,
      d = It.transition;
    try {
      ((It.transition = null), (Re = 1), tm(e, t, r, o));
    } finally {
      ((It.transition = d), (Re = o));
    }
    return null;
  }
  function tm(e, t, r, o) {
    do Tn();
    while (_r !== null);
    if ((Ne & 6) !== 0) throw Error(i(327));
    r = e.finishedWork;
    var d = e.finishedLanes;
    if (r === null) return null;
    if (((e.finishedWork = null), (e.finishedLanes = 0), r === e.current)) throw Error(i(177));
    ((e.callbackNode = null), (e.callbackPriority = 0));
    var f = r.lanes | r.childLanes;
    if (
      (Mf(e, f),
      e === Qe && ((Fe = Qe = null), (st = 0)),
      ((r.subtreeFlags & 2064) === 0 && (r.flags & 2064) === 0) ||
        Ai ||
        ((Ai = !0),
        Mu(Ws, function () {
          return (Tn(), null);
        })),
      (f = (r.flags & 15990) !== 0),
      (r.subtreeFlags & 15990) !== 0 || f)
    ) {
      ((f = It.transition), (It.transition = null));
      var x = Re;
      Re = 1;
      var w = Ne;
      ((Ne |= 4),
        (Uo.current = null),
        Kh(e, r),
        ku(r, e),
        kh(Za),
        (Zs = !!Ya),
        (Za = Ya = null),
        (e.current = r),
        qh(r),
        Cf(),
        (Ne = w),
        (Re = x),
        (It.transition = f));
    } else e.current = r;
    if (
      (Ai && ((Ai = !1), (_r = e), (Li = d)),
      (f = e.pendingLanes),
      f === 0 && (Nr = null),
      Rf(r.stateNode),
      wt(e, Ue()),
      t !== null)
    )
      for (o = e.onRecoverableError, r = 0; r < t.length; r++)
        ((d = t[r]), o(d.value, { componentStack: d.stack, digest: d.digest }));
    if (Oi) throw ((Oi = !1), (e = Fo), (Fo = null), e);
    return (
      (Li & 1) !== 0 && e.tag !== 0 && Tn(),
      (f = e.pendingLanes),
      (f & 1) !== 0 ? (e === Vo ? _s++ : ((_s = 0), (Vo = e))) : (_s = 0),
      wr(),
      null
    );
  }
  function Tn() {
    if (_r !== null) {
      var e = yc(Li),
        t = It.transition,
        r = Re;
      try {
        if (((It.transition = null), (Re = 16 > e ? 16 : e), _r === null)) var o = !1;
        else {
          if (((e = _r), (_r = null), (Li = 0), (Ne & 6) !== 0)) throw Error(i(331));
          var d = Ne;
          for (Ne |= 4, ee = e.current; ee !== null; ) {
            var f = ee,
              x = f.child;
            if ((ee.flags & 16) !== 0) {
              var w = f.deletions;
              if (w !== null) {
                for (var _ = 0; _ < w.length; _++) {
                  var P = w[_];
                  for (ee = P; ee !== null; ) {
                    var V = ee;
                    switch (V.tag) {
                      case 0:
                      case 11:
                      case 15:
                        bs(8, V, f);
                    }
                    var H = V.child;
                    if (H !== null) ((H.return = V), (ee = H));
                    else
                      for (; ee !== null; ) {
                        V = ee;
                        var F = V.sibling,
                          J = V.return;
                        if ((xu(V), V === P)) {
                          ee = null;
                          break;
                        }
                        if (F !== null) {
                          ((F.return = J), (ee = F));
                          break;
                        }
                        ee = J;
                      }
                  }
                }
                var re = f.alternate;
                if (re !== null) {
                  var se = re.child;
                  if (se !== null) {
                    re.child = null;
                    do {
                      var We = se.sibling;
                      ((se.sibling = null), (se = We));
                    } while (se !== null);
                  }
                }
                ee = f;
              }
            }
            if ((f.subtreeFlags & 2064) !== 0 && x !== null) ((x.return = f), (ee = x));
            else
              e: for (; ee !== null; ) {
                if (((f = ee), (f.flags & 2048) !== 0))
                  switch (f.tag) {
                    case 0:
                    case 11:
                    case 15:
                      bs(9, f, f.return);
                  }
                var O = f.sibling;
                if (O !== null) {
                  ((O.return = f.return), (ee = O));
                  break e;
                }
                ee = f.return;
              }
          }
          var I = e.current;
          for (ee = I; ee !== null; ) {
            x = ee;
            var A = x.child;
            if ((x.subtreeFlags & 2064) !== 0 && A !== null) ((A.return = x), (ee = A));
            else
              e: for (x = I; ee !== null; ) {
                if (((w = ee), (w.flags & 2048) !== 0))
                  try {
                    switch (w.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Ri(9, w);
                    }
                  } catch (ie) {
                    $e(w, w.return, ie);
                  }
                if (w === x) {
                  ee = null;
                  break e;
                }
                var Z = w.sibling;
                if (Z !== null) {
                  ((Z.return = w.return), (ee = Z));
                  break e;
                }
                ee = w.return;
              }
          }
          if (((Ne = d), wr(), Gt && typeof Gt.onPostCommitFiberRoot == 'function'))
            try {
              Gt.onPostCommitFiberRoot(Bs, e);
            } catch {}
          o = !0;
        }
        return o;
      } finally {
        ((Re = r), (It.transition = t));
      }
    }
    return !1;
  }
  function Ou(e, t, r) {
    ((t = Cn(r, t)),
      (t = qd(e, t, 1)),
      (e = br(e, t, 1)),
      (t = ut()),
      e !== null && (Kn(e, 1, t), wt(e, t)));
  }
  function $e(e, t, r) {
    if (e.tag === 3) Ou(e, e, r);
    else
      for (; t !== null; ) {
        if (t.tag === 3) {
          Ou(t, e, r);
          break;
        } else if (t.tag === 1) {
          var o = t.stateNode;
          if (
            typeof t.type.getDerivedStateFromError == 'function' ||
            (typeof o.componentDidCatch == 'function' && (Nr === null || !Nr.has(o)))
          ) {
            ((e = Cn(r, e)),
              (e = Qd(t, e, 1)),
              (t = br(t, e, 1)),
              (e = ut()),
              t !== null && (Kn(t, 1, e), wt(t, e)));
            break;
          }
        }
        t = t.return;
      }
  }
  function rm(e, t, r) {
    var o = e.pingCache;
    (o !== null && o.delete(t),
      (t = ut()),
      (e.pingedLanes |= e.suspendedLanes & r),
      Qe === e &&
        (st & r) === r &&
        (Ke === 4 || (Ke === 3 && (st & 130023424) === st && 500 > Ue() - Bo)
          ? Qr(e, 0)
          : (Wo |= r)),
      wt(e, t));
  }
  function Au(e, t) {
    t === 0 &&
      ((e.mode & 1) === 0
        ? (t = 1)
        : ((t = Vs), (Vs <<= 1), (Vs & 130023424) === 0 && (Vs = 4194304)));
    var r = ut();
    ((e = ir(e, t)), e !== null && (Kn(e, t, r), wt(e, r)));
  }
  function nm(e) {
    var t = e.memoizedState,
      r = 0;
    (t !== null && (r = t.retryLane), Au(e, r));
  }
  function sm(e, t) {
    var r = 0;
    switch (e.tag) {
      case 13:
        var o = e.stateNode,
          d = e.memoizedState;
        d !== null && (r = d.retryLane);
        break;
      case 19:
        o = e.stateNode;
        break;
      default:
        throw Error(i(314));
    }
    (o !== null && o.delete(t), Au(e, r));
  }
  var Lu;
  Lu = function (e, t, r) {
    if (e !== null)
      if (e.memoizedProps !== t.pendingProps || xt.current) vt = !0;
      else {
        if ((e.lanes & r) === 0 && (t.flags & 128) === 0) return ((vt = !1), Hh(e, t, r));
        vt = (e.flags & 131072) !== 0;
      }
    else ((vt = !1), Le && (t.flags & 1048576) !== 0 && fd(t, pi, t.index));
    switch (((t.lanes = 0), t.tag)) {
      case 2:
        var o = t.type;
        (Si(e, t), (e = t.pendingProps));
        var d = vn(t, at.current);
        (Nn(t, r), (d = yo(null, t, o, e, d, r)));
        var f = wo();
        return (
          (t.flags |= 1),
          typeof d == 'object' &&
          d !== null &&
          typeof d.render == 'function' &&
          d.$$typeof === void 0
            ? ((t.tag = 1),
              (t.memoizedState = null),
              (t.updateQueue = null),
              gt(o) ? ((f = !0), ci(t)) : (f = !1),
              (t.memoizedState = d.state !== null && d.state !== void 0 ? d.state : null),
              po(t),
              (d.updater = _i),
              (t.stateNode = d),
              (d._reactInternals = t),
              Co(t, o, e, r),
              (t = To(null, t, o, !0, f, r)))
            : ((t.tag = 0), Le && f && to(t), dt(null, t, d, r), (t = t.child)),
          t
        );
      case 16:
        o = t.elementType;
        e: {
          switch (
            (Si(e, t),
            (e = t.pendingProps),
            (d = o._init),
            (o = d(o._payload)),
            (t.type = o),
            (d = t.tag = am(o)),
            (e = zt(o, e)),
            d)
          ) {
            case 0:
              t = Ro(null, t, o, e, r);
              break e;
            case 1:
              t = au(null, t, o, e, r);
              break e;
            case 11:
              t = tu(null, t, o, e, r);
              break e;
            case 14:
              t = ru(null, t, o, zt(o.type, e), r);
              break e;
          }
          throw Error(i(306, o, ''));
        }
        return t;
      case 0:
        return (
          (o = t.type),
          (d = t.pendingProps),
          (d = t.elementType === o ? d : zt(o, d)),
          Ro(e, t, o, d, r)
        );
      case 1:
        return (
          (o = t.type),
          (d = t.pendingProps),
          (d = t.elementType === o ? d : zt(o, d)),
          au(e, t, o, d, r)
        );
      case 3:
        e: {
          if ((ou(t), e === null)) throw Error(i(387));
          ((o = t.pendingProps),
            (f = t.memoizedState),
            (d = f.element),
            bd(e, t),
            vi(t, o, null, r));
          var x = t.memoizedState;
          if (((o = x.element), f.isDehydrated))
            if (
              ((f = {
                element: o,
                isDehydrated: !1,
                cache: x.cache,
                pendingSuspenseBoundaries: x.pendingSuspenseBoundaries,
                transitions: x.transitions,
              }),
              (t.updateQueue.baseState = f),
              (t.memoizedState = f),
              t.flags & 256)
            ) {
              ((d = Cn(Error(i(423)), t)), (t = lu(e, t, o, r, d)));
              break e;
            } else if (o !== d) {
              ((d = Cn(Error(i(424)), t)), (t = lu(e, t, o, r, d)));
              break e;
            } else
              for (
                Nt = gr(t.stateNode.containerInfo.firstChild),
                  jt = t,
                  Le = !0,
                  Dt = null,
                  r = wd(t, null, o, r),
                  t.child = r;
                r;
              )
                ((r.flags = (r.flags & -3) | 4096), (r = r.sibling));
          else {
            if ((kn(), o === d)) {
              t = or(e, t, r);
              break e;
            }
            dt(e, t, o, r);
          }
          t = t.child;
        }
        return t;
      case 5:
        return (
          _d(t),
          e === null && so(t),
          (o = t.type),
          (d = t.pendingProps),
          (f = e !== null ? e.memoizedProps : null),
          (x = d.children),
          Ka(o, d) ? (x = null) : f !== null && Ka(o, f) && (t.flags |= 32),
          iu(e, t),
          dt(e, t, x, r),
          t.child
        );
      case 6:
        return (e === null && so(t), null);
      case 13:
        return cu(e, t, r);
      case 4:
        return (
          fo(t, t.stateNode.containerInfo),
          (o = t.pendingProps),
          e === null ? (t.child = bn(t, null, o, r)) : dt(e, t, o, r),
          t.child
        );
      case 11:
        return (
          (o = t.type),
          (d = t.pendingProps),
          (d = t.elementType === o ? d : zt(o, d)),
          tu(e, t, o, d, r)
        );
      case 7:
        return (dt(e, t, t.pendingProps, r), t.child);
      case 8:
        return (dt(e, t, t.pendingProps.children, r), t.child);
      case 12:
        return (dt(e, t, t.pendingProps.children, r), t.child);
      case 10:
        e: {
          if (
            ((o = t.type._context),
            (d = t.pendingProps),
            (f = t.memoizedProps),
            (x = d.value),
            Te(mi, o._currentValue),
            (o._currentValue = x),
            f !== null)
          )
            if (Pt(f.value, x)) {
              if (f.children === d.children && !xt.current) {
                t = or(e, t, r);
                break e;
              }
            } else
              for (f = t.child, f !== null && (f.return = t); f !== null; ) {
                var w = f.dependencies;
                if (w !== null) {
                  x = f.child;
                  for (var _ = w.firstContext; _ !== null; ) {
                    if (_.context === o) {
                      if (f.tag === 1) {
                        ((_ = ar(-1, r & -r)), (_.tag = 2));
                        var P = f.updateQueue;
                        if (P !== null) {
                          P = P.shared;
                          var V = P.pending;
                          (V === null ? (_.next = _) : ((_.next = V.next), (V.next = _)),
                            (P.pending = _));
                        }
                      }
                      ((f.lanes |= r),
                        (_ = f.alternate),
                        _ !== null && (_.lanes |= r),
                        co(f.return, r, t),
                        (w.lanes |= r));
                      break;
                    }
                    _ = _.next;
                  }
                } else if (f.tag === 10) x = f.type === t.type ? null : f.child;
                else if (f.tag === 18) {
                  if (((x = f.return), x === null)) throw Error(i(341));
                  ((x.lanes |= r),
                    (w = x.alternate),
                    w !== null && (w.lanes |= r),
                    co(x, r, t),
                    (x = f.sibling));
                } else x = f.child;
                if (x !== null) x.return = f;
                else
                  for (x = f; x !== null; ) {
                    if (x === t) {
                      x = null;
                      break;
                    }
                    if (((f = x.sibling), f !== null)) {
                      ((f.return = x.return), (x = f));
                      break;
                    }
                    x = x.return;
                  }
                f = x;
              }
          (dt(e, t, d.children, r), (t = t.child));
        }
        return t;
      case 9:
        return (
          (d = t.type),
          (o = t.pendingProps.children),
          Nn(t, r),
          (d = Rt(d)),
          (o = o(d)),
          (t.flags |= 1),
          dt(e, t, o, r),
          t.child
        );
      case 14:
        return ((o = t.type), (d = zt(o, t.pendingProps)), (d = zt(o.type, d)), ru(e, t, o, d, r));
      case 15:
        return nu(e, t, t.type, t.pendingProps, r);
      case 17:
        return (
          (o = t.type),
          (d = t.pendingProps),
          (d = t.elementType === o ? d : zt(o, d)),
          Si(e, t),
          (t.tag = 1),
          gt(o) ? ((e = !0), ci(t)) : (e = !1),
          Nn(t, r),
          Zd(t, o, d),
          Co(t, o, d, r),
          To(null, t, o, !0, e, r)
        );
      case 19:
        return uu(e, t, r);
      case 22:
        return su(e, t, r);
    }
    throw Error(i(156, t.tag));
  };
  function Mu(e, t) {
    return hc(e, t);
  }
  function im(e, t, r, o) {
    ((this.tag = e),
      (this.key = r),
      (this.sibling =
        this.child =
        this.return =
        this.stateNode =
        this.type =
        this.elementType =
          null),
      (this.index = 0),
      (this.ref = null),
      (this.pendingProps = t),
      (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
      (this.mode = o),
      (this.subtreeFlags = this.flags = 0),
      (this.deletions = null),
      (this.childLanes = this.lanes = 0),
      (this.alternate = null));
  }
  function Ot(e, t, r, o) {
    return new im(e, t, r, o);
  }
  function qo(e) {
    return ((e = e.prototype), !(!e || !e.isReactComponent));
  }
  function am(e) {
    if (typeof e == 'function') return qo(e) ? 1 : 0;
    if (e != null) {
      if (((e = e.$$typeof), e === ke)) return 11;
      if (e === et) return 14;
    }
    return 2;
  }
  function Er(e, t) {
    var r = e.alternate;
    return (
      r === null
        ? ((r = Ot(e.tag, t, e.key, e.mode)),
          (r.elementType = e.elementType),
          (r.type = e.type),
          (r.stateNode = e.stateNode),
          (r.alternate = e),
          (e.alternate = r))
        : ((r.pendingProps = t),
          (r.type = e.type),
          (r.flags = 0),
          (r.subtreeFlags = 0),
          (r.deletions = null)),
      (r.flags = e.flags & 14680064),
      (r.childLanes = e.childLanes),
      (r.lanes = e.lanes),
      (r.child = e.child),
      (r.memoizedProps = e.memoizedProps),
      (r.memoizedState = e.memoizedState),
      (r.updateQueue = e.updateQueue),
      (t = e.dependencies),
      (r.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
      (r.sibling = e.sibling),
      (r.index = e.index),
      (r.ref = e.ref),
      r
    );
  }
  function zi(e, t, r, o, d, f) {
    var x = 2;
    if (((o = e), typeof e == 'function')) qo(e) && (x = 1);
    else if (typeof e == 'string') x = 5;
    else
      e: switch (e) {
        case ge:
          return Jr(r.children, d, f, t);
        case Se:
          ((x = 8), (d |= 8));
          break;
        case He:
          return ((e = Ot(12, r, t, d | 2)), (e.elementType = He), (e.lanes = f), e);
        case Ie:
          return ((e = Ot(13, r, t, d)), (e.elementType = Ie), (e.lanes = f), e);
        case Ye:
          return ((e = Ot(19, r, t, d)), (e.elementType = Ye), (e.lanes = f), e);
        case Ee:
          return $i(r, d, f, t);
        default:
          if (typeof e == 'object' && e !== null)
            switch (e.$$typeof) {
              case Ge:
                x = 10;
                break e;
              case Je:
                x = 9;
                break e;
              case ke:
                x = 11;
                break e;
              case et:
                x = 14;
                break e;
              case ze:
                ((x = 16), (o = null));
                break e;
            }
          throw Error(i(130, e == null ? e : typeof e, ''));
      }
    return ((t = Ot(x, r, t, d)), (t.elementType = e), (t.type = o), (t.lanes = f), t);
  }
  function Jr(e, t, r, o) {
    return ((e = Ot(7, e, o, t)), (e.lanes = r), e);
  }
  function $i(e, t, r, o) {
    return (
      (e = Ot(22, e, o, t)),
      (e.elementType = Ee),
      (e.lanes = r),
      (e.stateNode = { isHidden: !1 }),
      e
    );
  }
  function Qo(e, t, r) {
    return ((e = Ot(6, e, null, t)), (e.lanes = r), e);
  }
  function Xo(e, t, r) {
    return (
      (t = Ot(4, e.children !== null ? e.children : [], e.key, t)),
      (t.lanes = r),
      (t.stateNode = {
        containerInfo: e.containerInfo,
        pendingChildren: null,
        implementation: e.implementation,
      }),
      t
    );
  }
  function om(e, t, r, o, d) {
    ((this.tag = t),
      (this.containerInfo = e),
      (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
      (this.timeoutHandle = -1),
      (this.callbackNode = this.pendingContext = this.context = null),
      (this.callbackPriority = 0),
      (this.eventTimes = Na(0)),
      (this.expirationTimes = Na(-1)),
      (this.entangledLanes =
        this.finishedLanes =
        this.mutableReadLanes =
        this.expiredLanes =
        this.pingedLanes =
        this.suspendedLanes =
        this.pendingLanes =
          0),
      (this.entanglements = Na(0)),
      (this.identifierPrefix = o),
      (this.onRecoverableError = d),
      (this.mutableSourceEagerHydrationData = null));
  }
  function Jo(e, t, r, o, d, f, x, w, _) {
    return (
      (e = new om(e, t, r, w, _)),
      t === 1 ? ((t = 1), f === !0 && (t |= 8)) : (t = 0),
      (f = Ot(3, null, null, t)),
      (e.current = f),
      (f.stateNode = e),
      (f.memoizedState = {
        element: o,
        isDehydrated: r,
        cache: null,
        transitions: null,
        pendingSuspenseBoundaries: null,
      }),
      po(f),
      e
    );
  }
  function lm(e, t, r) {
    var o = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: pe,
      key: o == null ? null : '' + o,
      children: e,
      containerInfo: t,
      implementation: r,
    };
  }
  function Pu(e) {
    if (!e) return yr;
    e = e._reactInternals;
    e: {
      if (Wr(e) !== e || e.tag !== 1) throw Error(i(170));
      var t = e;
      do {
        switch (t.tag) {
          case 3:
            t = t.stateNode.context;
            break e;
          case 1:
            if (gt(t.type)) {
              t = t.stateNode.__reactInternalMemoizedMergedChildContext;
              break e;
            }
        }
        t = t.return;
      } while (t !== null);
      throw Error(i(171));
    }
    if (e.tag === 1) {
      var r = e.type;
      if (gt(r)) return dd(e, r, t);
    }
    return t;
  }
  function Du(e, t, r, o, d, f, x, w, _) {
    return (
      (e = Jo(r, o, !0, e, d, f, x, w, _)),
      (e.context = Pu(null)),
      (r = e.current),
      (o = ut()),
      (d = Cr(r)),
      (f = ar(o, d)),
      (f.callback = t ?? null),
      br(r, f, d),
      (e.current.lanes = d),
      Kn(e, d, o),
      wt(e, o),
      e
    );
  }
  function Ui(e, t, r, o) {
    var d = t.current,
      f = ut(),
      x = Cr(d);
    return (
      (r = Pu(r)),
      t.context === null ? (t.context = r) : (t.pendingContext = r),
      (t = ar(f, x)),
      (t.payload = { element: e }),
      (o = o === void 0 ? null : o),
      o !== null && (t.callback = o),
      (e = br(d, t, x)),
      e !== null && (Wt(e, d, x, f), gi(e, d, x)),
      x
    );
  }
  function Wi(e) {
    if (((e = e.current), !e.child)) return null;
    switch (e.child.tag) {
      case 5:
        return e.child.stateNode;
      default:
        return e.child.stateNode;
    }
  }
  function zu(e, t) {
    if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
      var r = e.retryLane;
      e.retryLane = r !== 0 && r < t ? r : t;
    }
  }
  function el(e, t) {
    (zu(e, t), (e = e.alternate) && zu(e, t));
  }
  function cm() {
    return null;
  }
  var $u =
    typeof reportError == 'function'
      ? reportError
      : function (e) {
          console.error(e);
        };
  function tl(e) {
    this._internalRoot = e;
  }
  ((Bi.prototype.render = tl.prototype.render =
    function (e) {
      var t = this._internalRoot;
      if (t === null) throw Error(i(409));
      Ui(e, t, null, null);
    }),
    (Bi.prototype.unmount = tl.prototype.unmount =
      function () {
        var e = this._internalRoot;
        if (e !== null) {
          this._internalRoot = null;
          var t = e.containerInfo;
          (qr(function () {
            Ui(null, e, null, null);
          }),
            (t[tr] = null));
        }
      }));
  function Bi(e) {
    this._internalRoot = e;
  }
  Bi.prototype.unstable_scheduleHydration = function (e) {
    if (e) {
      var t = bc();
      e = { blockedOn: null, target: e, priority: t };
      for (var r = 0; r < hr.length && t !== 0 && t < hr[r].priority; r++);
      (hr.splice(r, 0, e), r === 0 && _c(e));
    }
  };
  function rl(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
  }
  function Fi(e) {
    return !(
      !e ||
      (e.nodeType !== 1 &&
        e.nodeType !== 9 &&
        e.nodeType !== 11 &&
        (e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
    );
  }
  function Uu() {}
  function dm(e, t, r, o, d) {
    if (d) {
      if (typeof o == 'function') {
        var f = o;
        o = function () {
          var P = Wi(x);
          f.call(P);
        };
      }
      var x = Du(t, o, e, 0, null, !1, !1, '', Uu);
      return (
        (e._reactRootContainer = x),
        (e[tr] = x.current),
        cs(e.nodeType === 8 ? e.parentNode : e),
        qr(),
        x
      );
    }
    for (; (d = e.lastChild); ) e.removeChild(d);
    if (typeof o == 'function') {
      var w = o;
      o = function () {
        var P = Wi(_);
        w.call(P);
      };
    }
    var _ = Jo(e, 0, !1, null, null, !1, !1, '', Uu);
    return (
      (e._reactRootContainer = _),
      (e[tr] = _.current),
      cs(e.nodeType === 8 ? e.parentNode : e),
      qr(function () {
        Ui(t, _, r, o);
      }),
      _
    );
  }
  function Vi(e, t, r, o, d) {
    var f = r._reactRootContainer;
    if (f) {
      var x = f;
      if (typeof d == 'function') {
        var w = d;
        d = function () {
          var _ = Wi(x);
          w.call(_);
        };
      }
      Ui(t, x, e, d);
    } else x = dm(r, t, e, d, o);
    return Wi(x);
  }
  ((wc = function (e) {
    switch (e.tag) {
      case 3:
        var t = e.stateNode;
        if (t.current.memoizedState.isDehydrated) {
          var r = Zn(t.pendingLanes);
          r !== 0 && (_a(t, r | 1), wt(t, Ue()), (Ne & 6) === 0 && ((Rn = Ue() + 500), wr()));
        }
        break;
      case 13:
        (qr(function () {
          var o = ir(e, 1);
          if (o !== null) {
            var d = ut();
            Wt(o, e, 1, d);
          }
        }),
          el(e, 1));
    }
  }),
    (Ca = function (e) {
      if (e.tag === 13) {
        var t = ir(e, 134217728);
        if (t !== null) {
          var r = ut();
          Wt(t, e, 134217728, r);
        }
        el(e, 134217728);
      }
    }),
    (kc = function (e) {
      if (e.tag === 13) {
        var t = Cr(e),
          r = ir(e, t);
        if (r !== null) {
          var o = ut();
          Wt(r, e, t, o);
        }
        el(e, t);
      }
    }),
    (bc = function () {
      return Re;
    }),
    (jc = function (e, t) {
      var r = Re;
      try {
        return ((Re = e), t());
      } finally {
        Re = r;
      }
    }),
    (va = function (e, t, r) {
      switch (t) {
        case 'input':
          if ((da(e, r), (t = r.name), r.type === 'radio' && t != null)) {
            for (r = e; r.parentNode; ) r = r.parentNode;
            for (
              r = r.querySelectorAll('input[name=' + JSON.stringify('' + t) + '][type="radio"]'),
                t = 0;
              t < r.length;
              t++
            ) {
              var o = r[t];
              if (o !== e && o.form === e.form) {
                var d = oi(o);
                if (!d) throw Error(i(90));
                (ue(o), da(o, d));
              }
            }
          }
          break;
        case 'textarea':
          Xl(e, r);
          break;
        case 'select':
          ((t = r.value), t != null && an(e, !!r.multiple, t, !1));
      }
    }),
    (oc = Yo),
    (lc = qr));
  var um = { usingClientEntryPoint: !1, Events: [ps, xn, oi, ic, ac, Yo] },
    Cs = {
      findFiberByHostInstance: Br,
      bundleType: 0,
      version: '18.3.1',
      rendererPackageName: 'react-dom',
    },
    pm = {
      bundleType: Cs.bundleType,
      version: Cs.version,
      rendererPackageName: Cs.rendererPackageName,
      rendererConfig: Cs.rendererConfig,
      overrideHookState: null,
      overrideHookStateDeletePath: null,
      overrideHookStateRenamePath: null,
      overrideProps: null,
      overridePropsDeletePath: null,
      overridePropsRenamePath: null,
      setErrorHandler: null,
      setSuspenseHandler: null,
      scheduleUpdate: null,
      currentDispatcherRef: G.ReactCurrentDispatcher,
      findHostInstanceByFiber: function (e) {
        return ((e = pc(e)), e === null ? null : e.stateNode);
      },
      findFiberByHostInstance: Cs.findFiberByHostInstance || cm,
      findHostInstancesForRefresh: null,
      scheduleRefresh: null,
      scheduleRoot: null,
      setRefreshHandler: null,
      getCurrentFiber: null,
      reconcilerVersion: '18.3.1-next-f1338f8080-20240426',
    };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
    var Hi = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Hi.isDisabled && Hi.supportsFiber)
      try {
        ((Bs = Hi.inject(pm)), (Gt = Hi));
      } catch {}
  }
  return (
    (kt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = um),
    (kt.createPortal = function (e, t) {
      var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
      if (!rl(t)) throw Error(i(200));
      return lm(e, t, null, r);
    }),
    (kt.createRoot = function (e, t) {
      if (!rl(e)) throw Error(i(299));
      var r = !1,
        o = '',
        d = $u;
      return (
        t != null &&
          (t.unstable_strictMode === !0 && (r = !0),
          t.identifierPrefix !== void 0 && (o = t.identifierPrefix),
          t.onRecoverableError !== void 0 && (d = t.onRecoverableError)),
        (t = Jo(e, 1, !1, null, null, r, !1, o, d)),
        (e[tr] = t.current),
        cs(e.nodeType === 8 ? e.parentNode : e),
        new tl(t)
      );
    }),
    (kt.findDOMNode = function (e) {
      if (e == null) return null;
      if (e.nodeType === 1) return e;
      var t = e._reactInternals;
      if (t === void 0)
        throw typeof e.render == 'function'
          ? Error(i(188))
          : ((e = Object.keys(e).join(',')), Error(i(268, e)));
      return ((e = pc(t)), (e = e === null ? null : e.stateNode), e);
    }),
    (kt.flushSync = function (e) {
      return qr(e);
    }),
    (kt.hydrate = function (e, t, r) {
      if (!Fi(t)) throw Error(i(200));
      return Vi(null, e, t, !0, r);
    }),
    (kt.hydrateRoot = function (e, t, r) {
      if (!rl(e)) throw Error(i(405));
      var o = (r != null && r.hydratedSources) || null,
        d = !1,
        f = '',
        x = $u;
      if (
        (r != null &&
          (r.unstable_strictMode === !0 && (d = !0),
          r.identifierPrefix !== void 0 && (f = r.identifierPrefix),
          r.onRecoverableError !== void 0 && (x = r.onRecoverableError)),
        (t = Du(t, null, e, 1, r ?? null, d, !1, f, x)),
        (e[tr] = t.current),
        cs(e),
        o)
      )
        for (e = 0; e < o.length; e++)
          ((r = o[e]),
            (d = r._getVersion),
            (d = d(r._source)),
            t.mutableSourceEagerHydrationData == null
              ? (t.mutableSourceEagerHydrationData = [r, d])
              : t.mutableSourceEagerHydrationData.push(r, d));
      return new Bi(t);
    }),
    (kt.render = function (e, t, r) {
      if (!Fi(t)) throw Error(i(200));
      return Vi(null, e, t, !1, r);
    }),
    (kt.unmountComponentAtNode = function (e) {
      if (!Fi(e)) throw Error(i(40));
      return e._reactRootContainer
        ? (qr(function () {
            Vi(null, null, e, !1, function () {
              ((e._reactRootContainer = null), (e[tr] = null));
            });
          }),
          !0)
        : !1;
    }),
    (kt.unstable_batchedUpdates = Yo),
    (kt.unstable_renderSubtreeIntoContainer = function (e, t, r, o) {
      if (!Fi(r)) throw Error(i(200));
      if (e == null || e._reactInternals === void 0) throw Error(i(38));
      return Vi(e, t, r, !1, o);
    }),
    (kt.version = '18.3.1-next-f1338f8080-20240426'),
    kt
  );
}
var Gu;
function Fp() {
  if (Gu) return sl.exports;
  Gu = 1;
  function a() {
    if (
      !(
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
      )
    )
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a);
      } catch (s) {
        console.error(s);
      }
  }
  return (a(), (sl.exports = km()), sl.exports);
}
var Yu;
function bm() {
  if (Yu) return Gi;
  Yu = 1;
  var a = Fp();
  return ((Gi.createRoot = a.createRoot), (Gi.hydrateRoot = a.hydrateRoot), Gi);
}
var jm = bm(),
  ol = { exports: {} },
  Ss = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Zu;
function Nm() {
  if (Zu) return Ss;
  Zu = 1;
  var a = Tl(),
    s = Symbol.for('react.element'),
    i = Symbol.for('react.fragment'),
    l = Object.prototype.hasOwnProperty,
    c = a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    u = { key: !0, ref: !0, __self: !0, __source: !0 };
  function p(h, m, g) {
    var v,
      y = {},
      S = null,
      C = null;
    (g !== void 0 && (S = '' + g),
      m.key !== void 0 && (S = '' + m.key),
      m.ref !== void 0 && (C = m.ref));
    for (v in m) l.call(m, v) && !u.hasOwnProperty(v) && (y[v] = m[v]);
    if (h && h.defaultProps) for (v in ((m = h.defaultProps), m)) y[v] === void 0 && (y[v] = m[v]);
    return { $$typeof: s, type: h, key: S, ref: C, props: y, _owner: c.current };
  }
  return ((Ss.Fragment = i), (Ss.jsx = p), (Ss.jsxs = p), Ss);
}
var Ku;
function _m() {
  return (Ku || ((Ku = 1), (ol.exports = Nm())), ol.exports);
}
var n = _m();
const Vp = { user: null, isAuthenticated: !1, isLoading: !1, error: null };
function Cm(a, s) {
  switch (s.type) {
    case 'LOGIN_START':
    case 'REFRESH_START':
      return { ...a, isLoading: !0, error: null };
    case 'LOGIN_SUCCESS':
    case 'REFRESH_SUCCESS':
      return { user: s.user, isAuthenticated: !0, isLoading: !1, error: null };
    case 'LOGIN_FAILURE':
    case 'REFRESH_FAILURE':
      return { user: null, isAuthenticated: !1, isLoading: !1, error: s.error };
    case 'LOGOUT':
      return { ...Vp };
    default:
      return a;
  }
}
const Il = N.createContext(null);
Il.displayName = 'AuthContext';
function Ol() {
  const a = N.useContext(Il);
  if (!a) throw new Error('useAuth must be used within an <AuthProvider>');
  return a;
}
function Sm({ adapter: a, children: s }) {
  const [i, l] = N.useReducer(Cm, Vp),
    c = N.useCallback(
      async (g) => {
        l({ type: 'LOGIN_START' });
        try {
          const v = await a.login(g);
          l({ type: 'LOGIN_SUCCESS', user: v });
        } catch (v) {
          const y = v instanceof Error ? v.message : 'Login failed';
          l({ type: 'LOGIN_FAILURE', error: y });
        }
      },
      [a],
    ),
    u = N.useCallback(
      async (g) => {
        l({ type: 'LOGIN_START' });
        try {
          if (!a.loginWithOAuth)
            throw new Error('OAuth login is not supported by this auth adapter');
          const v = await a.loginWithOAuth(g);
          l({ type: 'LOGIN_SUCCESS', user: v });
        } catch (v) {
          const y = v instanceof Error ? v.message : 'OAuth login failed';
          l({ type: 'LOGIN_FAILURE', error: y });
        }
      },
      [a],
    ),
    p = N.useCallback(async () => {
      try {
        await a.logout();
      } finally {
        l({ type: 'LOGOUT' });
      }
    }, [a]),
    h = N.useCallback(async () => {
      l({ type: 'REFRESH_START' });
      try {
        const g = await a.refreshSession();
        l({ type: 'REFRESH_SUCCESS', user: g });
      } catch (g) {
        const v = g instanceof Error ? g.message : 'Session refresh failed';
        l({ type: 'REFRESH_FAILURE', error: v });
      }
    }, [a]),
    m = N.useMemo(
      () => ({ ...i, login: c, loginWithOAuth: u, logout: p, refreshSession: h }),
      [i, c, u, p, h],
    );
  return ve.createElement(Il.Provider, { value: m }, s);
}
let qu = 0;
function Em() {
  return ((qu += 1), `notif-${Date.now()}-${String(qu)}`);
}
const Rm = { sidebarMode: 'expanded', theme: 'light', notifications: [], activeWorkflowId: null };
function Tm(a, s) {
  switch (s.type) {
    case 'SET_SIDEBAR_MODE':
      return { ...a, sidebarMode: s.mode };
    case 'SET_THEME':
      return { ...a, theme: s.theme };
    case 'ADD_NOTIFICATION':
      return { ...a, notifications: [...a.notifications, s.notification] };
    case 'DISMISS_NOTIFICATION':
      return {
        ...a,
        notifications: a.notifications.map((i) => (i.id === s.id ? { ...i, dismissed: !0 } : i)),
      };
    case 'CLEAR_NOTIFICATIONS':
      return { ...a, notifications: [] };
    case 'SET_ACTIVE_WORKFLOW':
      return { ...a, activeWorkflowId: s.workflowId };
    default:
      return a;
  }
}
const Hp = N.createContext(null);
Hp.displayName = 'AppContext';
function Im({ initialState: a, children: s }) {
  const i = { ...Rm, ...a },
    [l, c] = N.useReducer(Tm, i);
  N.useEffect(() => {
    const S = document.documentElement;
    if (l.theme === 'system') {
      const C = window.matchMedia('(prefers-color-scheme: dark)').matches;
      S.setAttribute('data-theme', C ? 'dark' : 'light');
      const R = window.matchMedia('(prefers-color-scheme: dark)'),
        j = (b) => {
          S.setAttribute('data-theme', b.matches ? 'dark' : 'light');
        };
      return (R.addEventListener('change', j), () => R.removeEventListener('change', j));
    } else S.setAttribute('data-theme', l.theme);
  }, [l.theme]);
  const u = N.useCallback((S) => {
      c({ type: 'SET_SIDEBAR_MODE', mode: S });
    }, []),
    p = N.useCallback((S) => {
      c({ type: 'SET_THEME', theme: S });
    }, []),
    h = N.useCallback((S, C) => {
      const R = { id: Em(), message: S, level: C, timestamp: Date.now(), dismissed: !1 };
      c({ type: 'ADD_NOTIFICATION', notification: R });
    }, []),
    m = N.useCallback((S) => {
      c({ type: 'DISMISS_NOTIFICATION', id: S });
    }, []),
    g = N.useCallback(() => {
      c({ type: 'CLEAR_NOTIFICATIONS' });
    }, []),
    v = N.useCallback((S) => {
      c({ type: 'SET_ACTIVE_WORKFLOW', workflowId: S });
    }, []),
    y = N.useMemo(
      () => ({
        ...l,
        setSidebarMode: u,
        setTheme: p,
        addNotification: h,
        dismissNotification: m,
        clearNotifications: g,
        setActiveWorkflow: v,
      }),
      [l, u, p, h, m, g, v],
    );
  return ve.createElement(Hp.Provider, { value: y }, s);
}
const Gp = 'crewspace:crews',
  Qu = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
function Es(a) {
  return `${a}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function Xu(a) {
  return Qu[a % Qu.length];
}
function Om() {
  if (typeof window > 'u') return [];
  try {
    const a = localStorage.getItem(Gp);
    return a ? JSON.parse(a) : [];
  } catch {
    return [];
  }
}
function Am(a) {
  typeof window > 'u' || localStorage.setItem(Gp, JSON.stringify(a));
}
function Lm(a, s) {
  switch (s.type) {
    case 'SET_CREWS':
      return { ...a, crews: s.crews };
    case 'ADD_CREW':
      return { ...a, crews: [...a.crews, s.crew] };
    case 'UPDATE_CREW':
      return {
        ...a,
        crews: a.crews.map((i) =>
          i.id === s.crewId ? { ...i, ...s.updates, updatedAt: Date.now() } : i,
        ),
      };
    case 'DELETE_CREW':
      return { ...a, crews: a.crews.filter((i) => i.id !== s.crewId) };
    case 'REPLACE_CREW':
      return { ...a, crews: a.crews.map((i) => (i.id === s.crew.id ? s.crew : i)) };
    default:
      return a;
  }
}
const Al = N.createContext(null);
Al.displayName = 'CrewContext';
function oa() {
  const a = N.useContext(Al);
  if (!a) throw new Error('useCrewStore must be used within a <CrewProvider>');
  return a;
}
function Mm({ initialCrews: a, children: s }) {
  const [i, l] = N.useReducer(Lm, { crews: a ?? Om() });
  N.useEffect(() => {
    Am(i.crews);
  }, [i.crews]);
  const c = N.useCallback((T) => i.crews.find((z) => z.id === T), [i.crews]),
    u = N.useCallback(
      (T) => {
        const z = Date.now(),
          W = (T.workflows ?? []).map((Q, pe) => ({
            id: Es(`wf-${pe}`),
            name: Q.name,
            description: Q.description,
            createdAt: z,
          })),
          G = {
            id: Es('crew'),
            name: T.name,
            description: T.description,
            agents: T.agents ?? [],
            tasks: T.tasks ?? [],
            workflowIds: W.map((Q) => Q.id),
            workflows: W,
            color: T.color ?? Xu(i.crews.length),
            createdAt: z,
            updatedAt: z,
          };
        return (l({ type: 'ADD_CREW', crew: G }), G);
      },
      [i.crews.length],
    ),
    p = N.useCallback((T, z) => {
      l({ type: 'UPDATE_CREW', crewId: T, updates: z });
    }, []),
    h = N.useCallback((T) => {
      l({ type: 'DELETE_CREW', crewId: T });
    }, []),
    m = N.useCallback(
      (T, z) => {
        const W = i.crews.find((ge) => ge.id === T),
          { id: G, ...Q } = z,
          pe = {
            ...Q,
            id: G ?? Es('agent'),
            status: 'idle',
            position: { x: ((W == null ? void 0 : W.agents.length) ?? 0) * 200, y: 100 },
          };
        if (W) {
          const ge = { ...W, agents: [...W.agents, pe], updatedAt: Date.now() };
          l({ type: 'REPLACE_CREW', crew: ge });
        }
        return pe;
      },
      [i.crews],
    ),
    g = N.useCallback(
      (T, z, W) => {
        const G = i.crews.find((pe) => pe.id === T);
        if (!G) return;
        const Q = {
          ...G,
          agents: G.agents.map((pe) => (pe.id === z ? { ...pe, ...W } : pe)),
          updatedAt: Date.now(),
        };
        l({ type: 'REPLACE_CREW', crew: Q });
      },
      [i.crews],
    ),
    v = N.useCallback(
      (T, z) => {
        const W = i.crews.find((Q) => Q.id === T);
        if (!W) return;
        const G = {
          ...W,
          agents: W.agents.filter((Q) => Q.id !== z),
          tasks: W.tasks.map((Q) => (Q.agentId === z ? { ...Q, agentId: '' } : Q)),
          updatedAt: Date.now(),
        };
        l({ type: 'REPLACE_CREW', crew: G });
      },
      [i.crews],
    ),
    y = N.useCallback(
      (T, z) => {
        const W = i.crews.find((Q) => Q.id === T),
          G = { ...z, id: Es('task'), status: 'pending' };
        if (W) {
          const Q = { ...W, tasks: [...W.tasks, G], updatedAt: Date.now() };
          l({ type: 'REPLACE_CREW', crew: Q });
        }
        return G;
      },
      [i.crews],
    ),
    S = N.useCallback(
      (T, z, W) => {
        const G = i.crews.find((pe) => pe.id === T);
        if (!G) return;
        const Q = {
          ...G,
          tasks: G.tasks.map((pe) => (pe.id === z ? { ...pe, ...W } : pe)),
          updatedAt: Date.now(),
        };
        l({ type: 'REPLACE_CREW', crew: Q });
      },
      [i.crews],
    ),
    C = N.useCallback(
      (T, z) => {
        const W = i.crews.find((Q) => Q.id === T);
        if (!W) return;
        const G = { ...W, tasks: W.tasks.filter((Q) => Q.id !== z), updatedAt: Date.now() };
        l({ type: 'REPLACE_CREW', crew: G });
      },
      [i.crews],
    ),
    R = N.useCallback(
      (T, z) => {
        const W = i.crews.find((Q) => Q.id === T);
        if (!W || W.workflowIds.includes(z)) return;
        const G = {
          ...W,
          workflowIds: [...W.workflowIds, z],
          workflows: [
            ...(W.workflows ?? []),
            { id: z, name: `Workflow ${z.slice(0, 8)}`, description: '', createdAt: Date.now() },
          ],
          updatedAt: Date.now(),
        };
        l({ type: 'REPLACE_CREW', crew: G });
      },
      [i.crews],
    ),
    j = N.useCallback(
      (T, z, W, G) => {
        const Q = Date.now(),
          pe = {
            id: Es('crew'),
            name: T,
            description: z,
            agents: W,
            tasks: G,
            workflowIds: [],
            workflows: [],
            color: Xu(i.crews.length),
            createdAt: Q,
            updatedAt: Q,
          };
        return (l({ type: 'ADD_CREW', crew: pe }), pe);
      },
      [i.crews.length],
    ),
    b = N.useMemo(
      () => ({
        ...i,
        createCrew: u,
        updateCrew: p,
        deleteCrew: h,
        addAgentToCrew: m,
        updateAgentInCrew: g,
        removeAgentFromCrew: v,
        addTaskToCrew: y,
        updateTaskInCrew: S,
        removeTaskFromCrew: C,
        addWorkflowToCrew: R,
        getCrewById: c,
        importCrewFromWorkflow: j,
      }),
      [i, u, p, h, m, g, v, y, S, C, R, c, j],
    );
  return ve.createElement(Al.Provider, { value: b }, s);
}
Fp();
/**
 * @remix-run/router v1.23.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function Os() {
  return (
    (Os = Object.assign
      ? Object.assign.bind()
      : function (a) {
          for (var s = 1; s < arguments.length; s++) {
            var i = arguments[s];
            for (var l in i) Object.prototype.hasOwnProperty.call(i, l) && (a[l] = i[l]);
          }
          return a;
        }),
    Os.apply(this, arguments)
  );
}
var Ar;
(function (a) {
  ((a.Pop = 'POP'), (a.Push = 'PUSH'), (a.Replace = 'REPLACE'));
})(Ar || (Ar = {}));
const Ju = 'popstate';
function Pm(a) {
  a === void 0 && (a = {});
  function s(l, c) {
    let { pathname: u, search: p, hash: h } = l.location;
    return xl(
      '',
      { pathname: u, search: p, hash: h },
      (c.state && c.state.usr) || null,
      (c.state && c.state.key) || 'default',
    );
  }
  function i(l, c) {
    return typeof c == 'string' ? c : qi(c);
  }
  return zm(s, i, null, a);
}
function Be(a, s) {
  if (a === !1 || a === null || typeof a > 'u') throw new Error(s);
}
function Ll(a, s) {
  if (!a) {
    typeof console < 'u' && console.warn(s);
    try {
      throw new Error(s);
    } catch {}
  }
}
function Dm() {
  return Math.random().toString(36).substr(2, 8);
}
function ep(a, s) {
  return { usr: a.state, key: a.key, idx: s };
}
function xl(a, s, i, l) {
  return (
    i === void 0 && (i = null),
    Os(
      { pathname: typeof a == 'string' ? a : a.pathname, search: '', hash: '' },
      typeof s == 'string' ? Un(s) : s,
      { state: i, key: (s && s.key) || l || Dm() },
    )
  );
}
function qi(a) {
  let { pathname: s = '/', search: i = '', hash: l = '' } = a;
  return (
    i && i !== '?' && (s += i.charAt(0) === '?' ? i : '?' + i),
    l && l !== '#' && (s += l.charAt(0) === '#' ? l : '#' + l),
    s
  );
}
function Un(a) {
  let s = {};
  if (a) {
    let i = a.indexOf('#');
    i >= 0 && ((s.hash = a.substr(i)), (a = a.substr(0, i)));
    let l = a.indexOf('?');
    (l >= 0 && ((s.search = a.substr(l)), (a = a.substr(0, l))), a && (s.pathname = a));
  }
  return s;
}
function zm(a, s, i, l) {
  l === void 0 && (l = {});
  let { window: c = document.defaultView, v5Compat: u = !1 } = l,
    p = c.history,
    h = Ar.Pop,
    m = null,
    g = v();
  g == null && ((g = 0), p.replaceState(Os({}, p.state, { idx: g }), ''));
  function v() {
    return (p.state || { idx: null }).idx;
  }
  function y() {
    h = Ar.Pop;
    let b = v(),
      T = b == null ? null : b - g;
    ((g = b), m && m({ action: h, location: j.location, delta: T }));
  }
  function S(b, T) {
    h = Ar.Push;
    let z = xl(j.location, b, T);
    g = v() + 1;
    let W = ep(z, g),
      G = j.createHref(z);
    try {
      p.pushState(W, '', G);
    } catch (Q) {
      if (Q instanceof DOMException && Q.name === 'DataCloneError') throw Q;
      c.location.assign(G);
    }
    u && m && m({ action: h, location: j.location, delta: 1 });
  }
  function C(b, T) {
    h = Ar.Replace;
    let z = xl(j.location, b, T);
    g = v();
    let W = ep(z, g),
      G = j.createHref(z);
    (p.replaceState(W, '', G), u && m && m({ action: h, location: j.location, delta: 0 }));
  }
  function R(b) {
    let T = c.location.origin !== 'null' ? c.location.origin : c.location.href,
      z = typeof b == 'string' ? b : qi(b);
    return (
      (z = z.replace(/ $/, '%20')),
      Be(T, 'No window.location.(origin|href) available to create URL for href: ' + z),
      new URL(z, T)
    );
  }
  let j = {
    get action() {
      return h;
    },
    get location() {
      return a(c, p);
    },
    listen(b) {
      if (m) throw new Error('A history only accepts one active listener');
      return (
        c.addEventListener(Ju, y),
        (m = b),
        () => {
          (c.removeEventListener(Ju, y), (m = null));
        }
      );
    },
    createHref(b) {
      return s(c, b);
    },
    createURL: R,
    encodeLocation(b) {
      let T = R(b);
      return { pathname: T.pathname, search: T.search, hash: T.hash };
    },
    push: S,
    replace: C,
    go(b) {
      return p.go(b);
    },
  };
  return j;
}
var tp;
(function (a) {
  ((a.data = 'data'), (a.deferred = 'deferred'), (a.redirect = 'redirect'), (a.error = 'error'));
})(tp || (tp = {}));
function $m(a, s, i) {
  return (i === void 0 && (i = '/'), Um(a, s, i));
}
function Um(a, s, i, l) {
  let c = typeof s == 'string' ? Un(s) : s,
    u = Ml(c.pathname || '/', i);
  if (u == null) return null;
  let p = Yp(a);
  Wm(p);
  let h = null;
  for (let m = 0; h == null && m < p.length; ++m) {
    let g = Jm(u);
    h = qm(p[m], g);
  }
  return h;
}
function Yp(a, s, i, l) {
  (s === void 0 && (s = []), i === void 0 && (i = []), l === void 0 && (l = ''));
  let c = (u, p, h) => {
    let m = {
      relativePath: h === void 0 ? u.path || '' : h,
      caseSensitive: u.caseSensitive === !0,
      childrenIndex: p,
      route: u,
    };
    m.relativePath.startsWith('/') &&
      (Be(
        m.relativePath.startsWith(l),
        'Absolute route path "' +
          m.relativePath +
          '" nested under path ' +
          ('"' + l + '" is not valid. An absolute child route path ') +
          'must start with the combined path of all its parent routes.',
      ),
      (m.relativePath = m.relativePath.slice(l.length)));
    let g = Lr([l, m.relativePath]),
      v = i.concat(m);
    (u.children &&
      u.children.length > 0 &&
      (Be(
        u.index !== !0,
        'Index routes must not have child routes. Please remove ' +
          ('all child routes from route path "' + g + '".'),
      ),
      Yp(u.children, s, v, g)),
      !(u.path == null && !u.index) && s.push({ path: g, score: Zm(g, u.index), routesMeta: v }));
  };
  return (
    a.forEach((u, p) => {
      var h;
      if (u.path === '' || !((h = u.path) != null && h.includes('?'))) c(u, p);
      else for (let m of Zp(u.path)) c(u, p, m);
    }),
    s
  );
}
function Zp(a) {
  let s = a.split('/');
  if (s.length === 0) return [];
  let [i, ...l] = s,
    c = i.endsWith('?'),
    u = i.replace(/\?$/, '');
  if (l.length === 0) return c ? [u, ''] : [u];
  let p = Zp(l.join('/')),
    h = [];
  return (
    h.push(...p.map((m) => (m === '' ? u : [u, m].join('/')))),
    c && h.push(...p),
    h.map((m) => (a.startsWith('/') && m === '' ? '/' : m))
  );
}
function Wm(a) {
  a.sort((s, i) =>
    s.score !== i.score
      ? i.score - s.score
      : Km(
          s.routesMeta.map((l) => l.childrenIndex),
          i.routesMeta.map((l) => l.childrenIndex),
        ),
  );
}
const Bm = /^:[\w-]+$/,
  Fm = 3,
  Vm = 2,
  Hm = 1,
  Gm = 10,
  Ym = -2,
  rp = (a) => a === '*';
function Zm(a, s) {
  let i = a.split('/'),
    l = i.length;
  return (
    i.some(rp) && (l += Ym),
    s && (l += Vm),
    i.filter((c) => !rp(c)).reduce((c, u) => c + (Bm.test(u) ? Fm : u === '' ? Hm : Gm), l)
  );
}
function Km(a, s) {
  return a.length === s.length && a.slice(0, -1).every((l, c) => l === s[c])
    ? a[a.length - 1] - s[s.length - 1]
    : 0;
}
function qm(a, s, i) {
  let { routesMeta: l } = a,
    c = {},
    u = '/',
    p = [];
  for (let h = 0; h < l.length; ++h) {
    let m = l[h],
      g = h === l.length - 1,
      v = u === '/' ? s : s.slice(u.length) || '/',
      y = Qm({ path: m.relativePath, caseSensitive: m.caseSensitive, end: g }, v),
      S = m.route;
    if (!y) return null;
    (Object.assign(c, y.params),
      p.push({
        params: c,
        pathname: Lr([u, y.pathname]),
        pathnameBase: sx(Lr([u, y.pathnameBase])),
        route: S,
      }),
      y.pathnameBase !== '/' && (u = Lr([u, y.pathnameBase])));
  }
  return p;
}
function Qm(a, s) {
  typeof a == 'string' && (a = { path: a, caseSensitive: !1, end: !0 });
  let [i, l] = Xm(a.path, a.caseSensitive, a.end),
    c = s.match(i);
  if (!c) return null;
  let u = c[0],
    p = u.replace(/(.)\/+$/, '$1'),
    h = c.slice(1);
  return {
    params: l.reduce((g, v, y) => {
      let { paramName: S, isOptional: C } = v;
      if (S === '*') {
        let j = h[y] || '';
        p = u.slice(0, u.length - j.length).replace(/(.)\/+$/, '$1');
      }
      const R = h[y];
      return (C && !R ? (g[S] = void 0) : (g[S] = (R || '').replace(/%2F/g, '/')), g);
    }, {}),
    pathname: u,
    pathnameBase: p,
    pattern: a,
  };
}
function Xm(a, s, i) {
  (s === void 0 && (s = !1),
    i === void 0 && (i = !0),
    Ll(
      a === '*' || !a.endsWith('*') || a.endsWith('/*'),
      'Route path "' +
        a +
        '" will be treated as if it were ' +
        ('"' + a.replace(/\*$/, '/*') + '" because the `*` character must ') +
        'always follow a `/` in the pattern. To get rid of this warning, ' +
        ('please change the route path to "' + a.replace(/\*$/, '/*') + '".'),
    ));
  let l = [],
    c =
      '^' +
      a
        .replace(/\/*\*?$/, '')
        .replace(/^\/*/, '/')
        .replace(/[\\.*+^${}|()[\]]/g, '\\$&')
        .replace(
          /\/:([\w-]+)(\?)?/g,
          (p, h, m) => (
            l.push({ paramName: h, isOptional: m != null }),
            m ? '/?([^\\/]+)?' : '/([^\\/]+)'
          ),
        );
  return (
    a.endsWith('*')
      ? (l.push({ paramName: '*' }), (c += a === '*' || a === '/*' ? '(.*)$' : '(?:\\/(.+)|\\/*)$'))
      : i
        ? (c += '\\/*$')
        : a !== '' && a !== '/' && (c += '(?:(?=\\/|$))'),
    [new RegExp(c, s ? void 0 : 'i'), l]
  );
}
function Jm(a) {
  try {
    return a
      .split('/')
      .map((s) => decodeURIComponent(s).replace(/\//g, '%2F'))
      .join('/');
  } catch (s) {
    return (
      Ll(
        !1,
        'The URL path "' +
          a +
          '" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent ' +
          ('encoding (' + s + ').'),
      ),
      a
    );
  }
}
function Ml(a, s) {
  if (s === '/') return a;
  if (!a.toLowerCase().startsWith(s.toLowerCase())) return null;
  let i = s.endsWith('/') ? s.length - 1 : s.length,
    l = a.charAt(i);
  return l && l !== '/' ? null : a.slice(i) || '/';
}
const ex = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  tx = (a) => ex.test(a);
function rx(a, s) {
  s === void 0 && (s = '/');
  let { pathname: i, search: l = '', hash: c = '' } = typeof a == 'string' ? Un(a) : a,
    u;
  if (i)
    if (tx(i)) u = i;
    else {
      if (i.includes('//')) {
        let p = i;
        ((i = i.replace(/\/\/+/g, '/')),
          Ll(
            !1,
            'Pathnames cannot have embedded double slashes - normalizing ' + (p + ' -> ' + i),
          ));
      }
      i.startsWith('/') ? (u = np(i.substring(1), '/')) : (u = np(i, s));
    }
  else u = s;
  return { pathname: u, search: ix(l), hash: ax(c) };
}
function np(a, s) {
  let i = s.replace(/\/+$/, '').split('/');
  return (
    a.split('/').forEach((c) => {
      c === '..' ? i.length > 1 && i.pop() : c !== '.' && i.push(c);
    }),
    i.length > 1 ? i.join('/') : '/'
  );
}
function ll(a, s, i, l) {
  return (
    "Cannot include a '" +
    a +
    "' character in a manually specified " +
    ('`to.' + s + '` field [' + JSON.stringify(l) + '].  Please separate it out to the ') +
    ('`to.' + i + '` field. Alternatively you may provide the full path as ') +
    'a string in <Link to="..."> and the router will parse it for you.'
  );
}
function nx(a) {
  return a.filter((s, i) => i === 0 || (s.route.path && s.route.path.length > 0));
}
function Pl(a, s) {
  let i = nx(a);
  return s
    ? i.map((l, c) => (c === i.length - 1 ? l.pathname : l.pathnameBase))
    : i.map((l) => l.pathnameBase);
}
function Dl(a, s, i, l) {
  l === void 0 && (l = !1);
  let c;
  typeof a == 'string'
    ? (c = Un(a))
    : ((c = Os({}, a)),
      Be(!c.pathname || !c.pathname.includes('?'), ll('?', 'pathname', 'search', c)),
      Be(!c.pathname || !c.pathname.includes('#'), ll('#', 'pathname', 'hash', c)),
      Be(!c.search || !c.search.includes('#'), ll('#', 'search', 'hash', c)));
  let u = a === '' || c.pathname === '',
    p = u ? '/' : c.pathname,
    h;
  if (p == null) h = i;
  else {
    let y = s.length - 1;
    if (!l && p.startsWith('..')) {
      let S = p.split('/');
      for (; S[0] === '..'; ) (S.shift(), (y -= 1));
      c.pathname = S.join('/');
    }
    h = y >= 0 ? s[y] : '/';
  }
  let m = rx(c, h),
    g = p && p !== '/' && p.endsWith('/'),
    v = (u || p === '.') && i.endsWith('/');
  return (!m.pathname.endsWith('/') && (g || v) && (m.pathname += '/'), m);
}
const Lr = (a) => a.join('/').replace(/\/\/+/g, '/'),
  sx = (a) => a.replace(/\/+$/, '').replace(/^\/*/, '/'),
  ix = (a) => (!a || a === '?' ? '' : a.startsWith('?') ? a : '?' + a),
  ax = (a) => (!a || a === '#' ? '' : a.startsWith('#') ? a : '#' + a);
function ox(a) {
  return (
    a != null &&
    typeof a.status == 'number' &&
    typeof a.statusText == 'string' &&
    typeof a.internal == 'boolean' &&
    'data' in a
  );
}
const Kp = ['post', 'put', 'patch', 'delete'];
new Set(Kp);
const lx = ['get', ...Kp];
new Set(lx);
/**
 * React Router v6.30.3
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function As() {
  return (
    (As = Object.assign
      ? Object.assign.bind()
      : function (a) {
          for (var s = 1; s < arguments.length; s++) {
            var i = arguments[s];
            for (var l in i) Object.prototype.hasOwnProperty.call(i, l) && (a[l] = i[l]);
          }
          return a;
        }),
    As.apply(this, arguments)
  );
}
const zl = N.createContext(null),
  cx = N.createContext(null),
  $r = N.createContext(null),
  la = N.createContext(null),
  dr = N.createContext({ outlet: null, matches: [], isDataRoute: !1 }),
  qp = N.createContext(null);
function dx(a, s) {
  let { relative: i } = s === void 0 ? {} : s;
  Wn() || Be(!1);
  let { basename: l, navigator: c } = N.useContext($r),
    { hash: u, pathname: p, search: h } = Xp(a, { relative: i }),
    m = p;
  return (
    l !== '/' && (m = p === '/' ? l : Lr([l, p])),
    c.createHref({ pathname: m, search: h, hash: u })
  );
}
function Wn() {
  return N.useContext(la) != null;
}
function Ur() {
  return (Wn() || Be(!1), N.useContext(la).location);
}
function Qp(a) {
  N.useContext($r).static || N.useLayoutEffect(a);
}
function Ht() {
  let { isDataRoute: a } = N.useContext(dr);
  return a ? jx() : ux();
}
function ux() {
  Wn() || Be(!1);
  let a = N.useContext(zl),
    { basename: s, future: i, navigator: l } = N.useContext($r),
    { matches: c } = N.useContext(dr),
    { pathname: u } = Ur(),
    p = JSON.stringify(Pl(c, i.v7_relativeSplatPath)),
    h = N.useRef(!1);
  return (
    Qp(() => {
      h.current = !0;
    }),
    N.useCallback(
      function (g, v) {
        if ((v === void 0 && (v = {}), !h.current)) return;
        if (typeof g == 'number') {
          l.go(g);
          return;
        }
        let y = Dl(g, JSON.parse(p), u, v.relative === 'path');
        (a == null && s !== '/' && (y.pathname = y.pathname === '/' ? s : Lr([s, y.pathname])),
          (v.replace ? l.replace : l.push)(y, v.state, v));
      },
      [s, l, p, u, a],
    )
  );
}
function $l() {
  let { matches: a } = N.useContext(dr),
    s = a[a.length - 1];
  return s ? s.params : {};
}
function Xp(a, s) {
  let { relative: i } = s === void 0 ? {} : s,
    { future: l } = N.useContext($r),
    { matches: c } = N.useContext(dr),
    { pathname: u } = Ur(),
    p = JSON.stringify(Pl(c, l.v7_relativeSplatPath));
  return N.useMemo(() => Dl(a, JSON.parse(p), u, i === 'path'), [a, p, u, i]);
}
function px(a, s) {
  return fx(a, s);
}
function fx(a, s, i, l) {
  Wn() || Be(!1);
  let { navigator: c } = N.useContext($r),
    { matches: u } = N.useContext(dr),
    p = u[u.length - 1],
    h = p ? p.params : {};
  p && p.pathname;
  let m = p ? p.pathnameBase : '/';
  p && p.route;
  let g = Ur(),
    v;
  if (s) {
    var y;
    let b = typeof s == 'string' ? Un(s) : s;
    (m === '/' || ((y = b.pathname) != null && y.startsWith(m)) || Be(!1), (v = b));
  } else v = g;
  let S = v.pathname || '/',
    C = S;
  if (m !== '/') {
    let b = m.replace(/^\//, '').split('/');
    C = '/' + S.replace(/^\//, '').split('/').slice(b.length).join('/');
  }
  let R = $m(a, { pathname: C }),
    j = vx(
      R &&
        R.map((b) =>
          Object.assign({}, b, {
            params: Object.assign({}, h, b.params),
            pathname: Lr([
              m,
              c.encodeLocation ? c.encodeLocation(b.pathname).pathname : b.pathname,
            ]),
            pathnameBase:
              b.pathnameBase === '/'
                ? m
                : Lr([
                    m,
                    c.encodeLocation ? c.encodeLocation(b.pathnameBase).pathname : b.pathnameBase,
                  ]),
          }),
        ),
      u,
      i,
      l,
    );
  return s && j
    ? N.createElement(
        la.Provider,
        {
          value: {
            location: As({ pathname: '/', search: '', hash: '', state: null, key: 'default' }, v),
            navigationType: Ar.Pop,
          },
        },
        j,
      )
    : j;
}
function hx() {
  let a = bx(),
    s = ox(a) ? a.status + ' ' + a.statusText : a instanceof Error ? a.message : JSON.stringify(a),
    i = a instanceof Error ? a.stack : null,
    c = { padding: '0.5rem', backgroundColor: 'rgba(200,200,200, 0.5)' };
  return N.createElement(
    N.Fragment,
    null,
    N.createElement('h2', null, 'Unexpected Application Error!'),
    N.createElement('h3', { style: { fontStyle: 'italic' } }, s),
    i ? N.createElement('pre', { style: c }, i) : null,
    null,
  );
}
const mx = N.createElement(hx, null);
class xx extends N.Component {
  constructor(s) {
    (super(s),
      (this.state = { location: s.location, revalidation: s.revalidation, error: s.error }));
  }
  static getDerivedStateFromError(s) {
    return { error: s };
  }
  static getDerivedStateFromProps(s, i) {
    return i.location !== s.location || (i.revalidation !== 'idle' && s.revalidation === 'idle')
      ? { error: s.error, location: s.location, revalidation: s.revalidation }
      : {
          error: s.error !== void 0 ? s.error : i.error,
          location: i.location,
          revalidation: s.revalidation || i.revalidation,
        };
  }
  componentDidCatch(s, i) {
    console.error('React Router caught the following error during render', s, i);
  }
  render() {
    return this.state.error !== void 0
      ? N.createElement(
          dr.Provider,
          { value: this.props.routeContext },
          N.createElement(qp.Provider, { value: this.state.error, children: this.props.component }),
        )
      : this.props.children;
  }
}
function gx(a) {
  let { routeContext: s, match: i, children: l } = a,
    c = N.useContext(zl);
  return (
    c &&
      c.static &&
      c.staticContext &&
      (i.route.errorElement || i.route.ErrorBoundary) &&
      (c.staticContext._deepestRenderedBoundaryId = i.route.id),
    N.createElement(dr.Provider, { value: s }, l)
  );
}
function vx(a, s, i, l) {
  var c;
  if (
    (s === void 0 && (s = []), i === void 0 && (i = null), l === void 0 && (l = null), a == null)
  ) {
    var u;
    if (!i) return null;
    if (i.errors) a = i.matches;
    else if (
      (u = l) != null &&
      u.v7_partialHydration &&
      s.length === 0 &&
      !i.initialized &&
      i.matches.length > 0
    )
      a = i.matches;
    else return null;
  }
  let p = a,
    h = (c = i) == null ? void 0 : c.errors;
  if (h != null) {
    let v = p.findIndex((y) => y.route.id && (h == null ? void 0 : h[y.route.id]) !== void 0);
    (v >= 0 || Be(!1), (p = p.slice(0, Math.min(p.length, v + 1))));
  }
  let m = !1,
    g = -1;
  if (i && l && l.v7_partialHydration)
    for (let v = 0; v < p.length; v++) {
      let y = p[v];
      if (((y.route.HydrateFallback || y.route.hydrateFallbackElement) && (g = v), y.route.id)) {
        let { loaderData: S, errors: C } = i,
          R = y.route.loader && S[y.route.id] === void 0 && (!C || C[y.route.id] === void 0);
        if (y.route.lazy || R) {
          ((m = !0), g >= 0 ? (p = p.slice(0, g + 1)) : (p = [p[0]]));
          break;
        }
      }
    }
  return p.reduceRight((v, y, S) => {
    let C,
      R = !1,
      j = null,
      b = null;
    i &&
      ((C = h && y.route.id ? h[y.route.id] : void 0),
      (j = y.route.errorElement || mx),
      m &&
        (g < 0 && S === 0
          ? (Nx('route-fallback'), (R = !0), (b = null))
          : g === S && ((R = !0), (b = y.route.hydrateFallbackElement || null))));
    let T = s.concat(p.slice(0, S + 1)),
      z = () => {
        let W;
        return (
          C
            ? (W = j)
            : R
              ? (W = b)
              : y.route.Component
                ? (W = N.createElement(y.route.Component, null))
                : y.route.element
                  ? (W = y.route.element)
                  : (W = v),
          N.createElement(gx, {
            match: y,
            routeContext: { outlet: v, matches: T, isDataRoute: i != null },
            children: W,
          })
        );
      };
    return i && (y.route.ErrorBoundary || y.route.errorElement || S === 0)
      ? N.createElement(xx, {
          location: i.location,
          revalidation: i.revalidation,
          component: j,
          error: C,
          children: z(),
          routeContext: { outlet: null, matches: T, isDataRoute: !0 },
        })
      : z();
  }, null);
}
var Jp = (function (a) {
    return (
      (a.UseBlocker = 'useBlocker'),
      (a.UseRevalidator = 'useRevalidator'),
      (a.UseNavigateStable = 'useNavigate'),
      a
    );
  })(Jp || {}),
  ef = (function (a) {
    return (
      (a.UseBlocker = 'useBlocker'),
      (a.UseLoaderData = 'useLoaderData'),
      (a.UseActionData = 'useActionData'),
      (a.UseRouteError = 'useRouteError'),
      (a.UseNavigation = 'useNavigation'),
      (a.UseRouteLoaderData = 'useRouteLoaderData'),
      (a.UseMatches = 'useMatches'),
      (a.UseRevalidator = 'useRevalidator'),
      (a.UseNavigateStable = 'useNavigate'),
      (a.UseRouteId = 'useRouteId'),
      a
    );
  })(ef || {});
function yx(a) {
  let s = N.useContext(zl);
  return (s || Be(!1), s);
}
function wx(a) {
  let s = N.useContext(cx);
  return (s || Be(!1), s);
}
function kx(a) {
  let s = N.useContext(dr);
  return (s || Be(!1), s);
}
function tf(a) {
  let s = kx(),
    i = s.matches[s.matches.length - 1];
  return (i.route.id || Be(!1), i.route.id);
}
function bx() {
  var a;
  let s = N.useContext(qp),
    i = wx(),
    l = tf();
  return s !== void 0 ? s : (a = i.errors) == null ? void 0 : a[l];
}
function jx() {
  let { router: a } = yx(Jp.UseNavigateStable),
    s = tf(ef.UseNavigateStable),
    i = N.useRef(!1);
  return (
    Qp(() => {
      i.current = !0;
    }),
    N.useCallback(
      function (c, u) {
        (u === void 0 && (u = {}),
          i.current &&
            (typeof c == 'number' ? a.navigate(c) : a.navigate(c, As({ fromRouteId: s }, u))));
      },
      [a, s],
    )
  );
}
const sp = {};
function Nx(a, s, i) {
  sp[a] || (sp[a] = !0);
}
function _x(a, s) {
  (a == null || a.v7_startTransition, a == null || a.v7_relativeSplatPath);
}
function Cx(a) {
  let { to: s, replace: i, state: l, relative: c } = a;
  Wn() || Be(!1);
  let { future: u, static: p } = N.useContext($r),
    { matches: h } = N.useContext(dr),
    { pathname: m } = Ur(),
    g = Ht(),
    v = Dl(s, Pl(h, u.v7_relativeSplatPath), m, c === 'path'),
    y = JSON.stringify(v);
  return (
    N.useEffect(() => g(JSON.parse(y), { replace: i, state: l, relative: c }), [g, y, c, i, l]),
    null
  );
}
function At(a) {
  Be(!1);
}
function Sx(a) {
  let {
    basename: s = '/',
    children: i = null,
    location: l,
    navigationType: c = Ar.Pop,
    navigator: u,
    static: p = !1,
    future: h,
  } = a;
  Wn() && Be(!1);
  let m = s.replace(/^\/*/, '/'),
    g = N.useMemo(
      () => ({ basename: m, navigator: u, static: p, future: As({ v7_relativeSplatPath: !1 }, h) }),
      [m, h, u, p],
    );
  typeof l == 'string' && (l = Un(l));
  let { pathname: v = '/', search: y = '', hash: S = '', state: C = null, key: R = 'default' } = l,
    j = N.useMemo(() => {
      let b = Ml(v, m);
      return b == null
        ? null
        : { location: { pathname: b, search: y, hash: S, state: C, key: R }, navigationType: c };
    }, [m, v, y, S, C, R, c]);
  return j == null
    ? null
    : N.createElement(
        $r.Provider,
        { value: g },
        N.createElement(la.Provider, { children: i, value: j }),
      );
}
function Ex(a) {
  let { children: s, location: i } = a;
  return px(gl(s), i);
}
new Promise(() => {});
function gl(a, s) {
  s === void 0 && (s = []);
  let i = [];
  return (
    N.Children.forEach(a, (l, c) => {
      if (!N.isValidElement(l)) return;
      let u = [...s, c];
      if (l.type === N.Fragment) {
        i.push.apply(i, gl(l.props.children, u));
        return;
      }
      (l.type !== At && Be(!1), !l.props.index || !l.props.children || Be(!1));
      let p = {
        id: l.props.id || u.join('-'),
        caseSensitive: l.props.caseSensitive,
        element: l.props.element,
        Component: l.props.Component,
        index: l.props.index,
        path: l.props.path,
        loader: l.props.loader,
        action: l.props.action,
        errorElement: l.props.errorElement,
        ErrorBoundary: l.props.ErrorBoundary,
        hasErrorBoundary: l.props.ErrorBoundary != null || l.props.errorElement != null,
        shouldRevalidate: l.props.shouldRevalidate,
        handle: l.props.handle,
        lazy: l.props.lazy,
      };
      (l.props.children && (p.children = gl(l.props.children, u)), i.push(p));
    }),
    i
  );
}
/**
 * React Router DOM v6.30.3
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function vl() {
  return (
    (vl = Object.assign
      ? Object.assign.bind()
      : function (a) {
          for (var s = 1; s < arguments.length; s++) {
            var i = arguments[s];
            for (var l in i) Object.prototype.hasOwnProperty.call(i, l) && (a[l] = i[l]);
          }
          return a;
        }),
    vl.apply(this, arguments)
  );
}
function Rx(a, s) {
  if (a == null) return {};
  var i = {},
    l = Object.keys(a),
    c,
    u;
  for (u = 0; u < l.length; u++) ((c = l[u]), !(s.indexOf(c) >= 0) && (i[c] = a[c]));
  return i;
}
function Tx(a) {
  return !!(a.metaKey || a.altKey || a.ctrlKey || a.shiftKey);
}
function Ix(a, s) {
  return a.button === 0 && (!s || s === '_self') && !Tx(a);
}
const Ox = [
    'onClick',
    'relative',
    'reloadDocument',
    'replace',
    'state',
    'target',
    'to',
    'preventScrollReset',
    'viewTransition',
  ],
  Ax = '6';
try {
  window.__reactRouterVersion = Ax;
} catch {}
const Lx = 'startTransition',
  ip = vm[Lx];
function Mx(a) {
  let { basename: s, children: i, future: l, window: c } = a,
    u = N.useRef();
  u.current == null && (u.current = Pm({ window: c, v5Compat: !0 }));
  let p = u.current,
    [h, m] = N.useState({ action: p.action, location: p.location }),
    { v7_startTransition: g } = l || {},
    v = N.useCallback(
      (y) => {
        g && ip ? ip(() => m(y)) : m(y);
      },
      [m, g],
    );
  return (
    N.useLayoutEffect(() => p.listen(v), [p, v]),
    N.useEffect(() => _x(l), [l]),
    N.createElement(Sx, {
      basename: s,
      children: i,
      location: h.location,
      navigationType: h.action,
      navigator: p,
      future: l,
    })
  );
}
const Px =
    typeof window < 'u' &&
    typeof window.document < 'u' &&
    typeof window.document.createElement < 'u',
  Dx = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  Mr = N.forwardRef(function (s, i) {
    let {
        onClick: l,
        relative: c,
        reloadDocument: u,
        replace: p,
        state: h,
        target: m,
        to: g,
        preventScrollReset: v,
        viewTransition: y,
      } = s,
      S = Rx(s, Ox),
      { basename: C } = N.useContext($r),
      R,
      j = !1;
    if (typeof g == 'string' && Dx.test(g) && ((R = g), Px))
      try {
        let W = new URL(window.location.href),
          G = g.startsWith('//') ? new URL(W.protocol + g) : new URL(g),
          Q = Ml(G.pathname, C);
        G.origin === W.origin && Q != null ? (g = Q + G.search + G.hash) : (j = !0);
      } catch {}
    let b = dx(g, { relative: c }),
      T = zx(g, {
        replace: p,
        state: h,
        target: m,
        preventScrollReset: v,
        relative: c,
        viewTransition: y,
      });
    function z(W) {
      (l && l(W), W.defaultPrevented || T(W));
    }
    return N.createElement(
      'a',
      vl({}, S, { href: R || b, onClick: j || u ? l : z, ref: i, target: m }),
    );
  });
var ap;
(function (a) {
  ((a.UseScrollRestoration = 'useScrollRestoration'),
    (a.UseSubmit = 'useSubmit'),
    (a.UseSubmitFetcher = 'useSubmitFetcher'),
    (a.UseFetcher = 'useFetcher'),
    (a.useViewTransitionState = 'useViewTransitionState'));
})(ap || (ap = {}));
var op;
(function (a) {
  ((a.UseFetcher = 'useFetcher'),
    (a.UseFetchers = 'useFetchers'),
    (a.UseScrollRestoration = 'useScrollRestoration'));
})(op || (op = {}));
function zx(a, s) {
  let {
      target: i,
      replace: l,
      state: c,
      preventScrollReset: u,
      relative: p,
      viewTransition: h,
    } = s === void 0 ? {} : s,
    m = Ht(),
    g = Ur(),
    v = Xp(a, { relative: p });
  return N.useCallback(
    (y) => {
      if (Ix(y, i)) {
        y.preventDefault();
        let S = l !== void 0 ? l : qi(g) === qi(v);
        m(a, { replace: S, state: c, preventScrollReset: u, relative: p, viewTransition: h });
      }
    },
    [g, m, v, l, c, i, a, u, p, h],
  );
}
const it = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CREWS: '/crews',
  CREW_DETAIL: '/crews/:crewId',
  CANVAS: '/canvas/:workflowId',
  WORKFLOW: '/workflow/:workflowId',
  TEMPLATES: '/templates',
  MARKETPLACE: '/marketplace',
  SETTINGS: '/settings',
};
function Qi(a) {
  return `/workflow/${encodeURIComponent(a)}`;
}
function Ul(a) {
  return `/crews/${encodeURIComponent(a)}`;
}
function $x({ children: a, redirectTo: s = '/login' }) {
  const { isAuthenticated: i, isLoading: l } = Ol(),
    c = Ur();
  return l
    ? ve.createElement('div', { 'aria-busy': 'true', role: 'status' }, 'Loading…')
    : i
      ? ve.createElement(ve.Fragment, null, a)
      : ve.createElement(Cx, { to: s, replace: !0, state: { from: c.pathname } });
}
const cl = [
    'Conduct market research in the mobile gaming industry — identify user needs and MVP strategy',
    'Create a content marketing campaign for a SaaS product launch',
    'Analyze competitor pricing strategies in the e-commerce space',
    'Build a customer onboarding workflow with automated follow-ups',
    'Research and summarize the latest AI trends for a board presentation',
    'Design a quality assurance pipeline for a software development team',
  ],
  lp = [
    {
      id: 'crew-1',
      name: 'Research Team Alpha',
      description: 'Market research specialists',
      agentCount: 4,
      workflowCount: 2,
      color: '#6366f1',
      updatedAt: '2 hours ago',
    },
    {
      id: 'crew-2',
      name: 'Content Marketing Squad',
      description: 'Content creation and distribution',
      agentCount: 6,
      workflowCount: 3,
      color: '#06b6d4',
      updatedAt: '1 day ago',
    },
    {
      id: 'crew-3',
      name: 'Data Analysis Crew',
      description: 'Data processing and insights',
      agentCount: 3,
      workflowCount: 1,
      color: '#f59e0b',
      updatedAt: '3 days ago',
    },
  ],
  Ux = [
    {
      num: 1,
      title: 'Start with an idea',
      description:
        'Describe your initiative in plain language — no setup, no config, just your vision.',
      icon: n.jsxs('svg', {
        width: '20',
        height: '20',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        children: [
          n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
          n.jsx('path', { d: 'M2 17l10 5 10-5' }),
          n.jsx('path', { d: 'M2 12l10 5 10-5' }),
        ],
      }),
    },
    {
      num: 2,
      title: 'Watch it come to life',
      description:
        'CrewSpace assembles specialized AI agents, wires them together, and builds your workflow in seconds.',
      icon: n.jsxs('svg', {
        width: '20',
        height: '20',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        children: [
          n.jsx('circle', { cx: '12', cy: '12', r: '10' }),
          n.jsx('polygon', { points: '10 8 16 12 10 16 10 8' }),
        ],
      }),
    },
    {
      num: 3,
      title: 'Refine and ship',
      description:
        'Iterate on the result, tweak agent roles and hand-offs, then run your workflow at scale.',
      icon: n.jsx('svg', {
        width: '20',
        height: '20',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        children: n.jsx('polyline', { points: '20 6 9 17 4 12' }),
      }),
    },
  ],
  Wx = [
    { value: '50+', label: 'Agents Available' },
    { value: '10K+', label: 'Workflows Built' },
    { value: '5M+', label: 'Tasks Completed' },
  ];
function Bx() {
  const a = Ht(),
    { user: s, isAuthenticated: i, logout: l } = Ol(),
    [c, u] = N.useState(''),
    [p, h] = N.useState(!1),
    m = N.useRef(null),
    [g, v] = N.useState(0),
    [y, S] = N.useState(!1),
    C = N.useRef(null);
  (N.useEffect(() => {
    const T = setInterval(() => {
      v((z) => (z + 1) % cl.length);
    }, 4e3);
    return () => clearInterval(T);
  }, []),
    N.useEffect(() => {
      const T = (z) => {
        C.current && !C.current.contains(z.target) && S(!1);
      };
      return (
        document.addEventListener('mousedown', T),
        () => document.removeEventListener('mousedown', T)
      );
    }, []),
    N.useEffect(() => {
      const T = m.current;
      T && ((T.style.height = 'auto'), (T.style.height = `${Math.min(T.scrollHeight, 200)}px`));
    }, [c]));
  const R = N.useCallback(async () => {
      if (!c.trim() || p) return;
      (h(!0), await new Promise((z) => setTimeout(z, 1500)));
      const T = `wf-${Date.now()}`;
      (h(!1), a(Qi(T), { state: { prompt: c.trim() } }));
    }, [c, p, a]),
    j = N.useCallback(
      (T) => {
        T.key === 'Enter' && !T.shiftKey && (T.preventDefault(), R());
      },
      [R],
    ),
    b = N.useCallback((T) => {
      var z;
      (u(T), (z = m.current) == null || z.focus());
    }, []);
  return n.jsxs('div', {
    className: 'min-h-screen bg-[var(--cs-surface-app)] flex flex-col scrollbar-thin',
    children: [
      n.jsx('header', {
        className: 'glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]',
        children: n.jsxs('div', {
          className: 'max-w-6xl mx-auto flex items-center justify-between px-6 py-4',
          children: [
            n.jsxs('div', {
              className: 'flex items-center gap-3',
              children: [
                n.jsx('div', {
                  className:
                    'w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center animate-pulseGlow',
                  children: n.jsxs('svg', {
                    width: '18',
                    height: '18',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'white',
                    strokeWidth: '2.5',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    children: [
                      n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                      n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                      n.jsx('path', { d: 'M2 12l10 5 10-5' }),
                    ],
                  }),
                }),
                n.jsxs('span', {
                  className: 'text-lg font-semibold text-[var(--cs-text-primary)] tracking-tight',
                  children: [
                    n.jsx('span', { className: 'gradient-text', children: 'Crew' }),
                    'Space',
                  ],
                }),
              ],
            }),
            n.jsxs('nav', {
              className: 'hidden md:flex items-center gap-6',
              children: [
                n.jsx('button', {
                  onClick: () => a('/crews'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'My Crews',
                }),
                n.jsx('button', {
                  onClick: () => a('/templates'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Templates',
                }),
                n.jsx('button', {
                  onClick: () => a('/marketplace'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Marketplace',
                }),
              ],
            }),
            n.jsx('div', {
              className: 'flex items-center gap-3',
              children:
                i && s
                  ? n.jsxs('div', {
                      className: 'relative',
                      ref: C,
                      children: [
                        n.jsx('button', {
                          onClick: () => S((T) => !T),
                          className:
                            'flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all focus-ring',
                          'aria-label': 'User menu',
                          children: s.avatarUrl
                            ? n.jsx('img', {
                                src: s.avatarUrl,
                                alt: s.name,
                                className: 'w-8 h-8 rounded-full object-cover',
                              })
                            : n.jsx('div', {
                                className:
                                  'w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white',
                                children: s.name.charAt(0).toUpperCase(),
                              }),
                        }),
                        y &&
                          n.jsxs('div', {
                            className:
                              'absolute right-0 mt-2 w-56 rounded-xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-panel)] shadow-2xl shadow-black/30 py-2 z-50 animate-fadeIn',
                            children: [
                              n.jsxs('div', {
                                className: 'px-4 py-2.5 border-b border-[var(--cs-border-subtle)]',
                                children: [
                                  n.jsx('p', {
                                    className:
                                      'text-sm font-medium text-[var(--cs-text-primary)] truncate',
                                    children: s.name,
                                  }),
                                  n.jsx('p', {
                                    className: 'text-xs text-[var(--cs-text-tertiary)] truncate',
                                    children: s.email,
                                  }),
                                ],
                              }),
                              n.jsx('button', {
                                onClick: () => {
                                  (S(!1), a('/settings'));
                                },
                                className:
                                  'w-full text-left px-4 py-2 text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-white/[0.04] transition-colors',
                                children: 'Settings',
                              }),
                              n.jsx('button', {
                                onClick: () => {
                                  (S(!1), l());
                                },
                                className:
                                  'w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors',
                                children: 'Sign out',
                              }),
                            ],
                          }),
                      ],
                    })
                  : n.jsxs(n.Fragment, {
                      children: [
                        n.jsx('button', {
                          onClick: () => a(it.LOGIN),
                          className:
                            'hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--cs-border-default)] hover:border-[var(--cs-border-hover)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] text-sm font-medium transition-all focus-ring',
                          children: 'Sign in',
                        }),
                        n.jsx('button', {
                          onClick: () => a(it.LOGIN),
                          className:
                            'flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/25 focus-ring',
                          children: 'Get Started',
                        }),
                      ],
                    }),
            }),
          ],
        }),
      }),
      n.jsx('section', {
        className: 'hero-glow relative overflow-hidden pt-20 md:pt-32 pb-8',
        children: n.jsxs('div', {
          className: 'text-center max-w-3xl mx-auto px-6',
          children: [
            n.jsxs('h1', {
              className:
                'animate-fadeInUp text-4xl md:text-6xl font-extrabold text-[var(--cs-text-primary)] tracking-tight leading-tight mb-6',
              children: [
                'Build something',
                ' ',
                n.jsx('span', { className: 'gradient-text', children: 'extraordinary' }),
                n.jsx('br', { className: 'hidden md:block' }),
                ' ',
                'with AI agents',
              ],
            }),
            n.jsx('p', {
              className:
                'animate-fadeInUp text-lg md:text-xl text-[var(--cs-text-secondary)] leading-relaxed max-w-xl mx-auto',
              style: { animationDelay: '120ms' },
              children:
                'Describe what you need and CrewSpace will assemble the perfect team of AI agents to get it done.',
            }),
          ],
        }),
      }),
      n.jsxs('section', {
        className: 'max-w-2xl w-full mx-auto px-4 -mt-2 animate-fadeInUp',
        style: { animationDelay: '240ms' },
        children: [
          n.jsxs('div', {
            className:
              'relative rounded-2xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-panel)] shadow-2xl shadow-indigo-500/5 overflow-hidden transition-all duration-300 focus-within:border-indigo-500/40 focus-within:shadow-indigo-500/10 focus-within:shadow-2xl',
            children: [
              n.jsx('textarea', {
                ref: m,
                value: c,
                onChange: (T) => u(T.target.value),
                onKeyDown: j,
                placeholder: cl[g],
                rows: 1,
                'aria-label': 'Describe your initiative',
                className:
                  'w-full bg-transparent text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] text-base leading-relaxed px-5 pt-5 pb-14 resize-none outline-none min-h-[56px] max-h-[200px]',
              }),
              n.jsxs('div', {
                className:
                  'absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 glass-subtle border-t border-[var(--cs-border-subtle)]',
                children: [
                  n.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      n.jsx('button', {
                        className:
                          'p-1.5 rounded-lg text-[var(--cs-text-tertiary)] hover:text-slate-300 hover:bg-[var(--cs-surface-card)]/20 transition-colors focus-ring',
                        title: 'Attach file',
                        'aria-label': 'Attach file',
                        children: n.jsx('svg', {
                          width: '18',
                          height: '18',
                          viewBox: '0 0 24 24',
                          fill: 'none',
                          stroke: 'currentColor',
                          strokeWidth: '2',
                          strokeLinecap: 'round',
                          strokeLinejoin: 'round',
                          children: n.jsx('path', {
                            d: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48',
                          }),
                        }),
                      }),
                      n.jsx('button', {
                        className:
                          'p-1.5 rounded-lg text-[var(--cs-text-tertiary)] hover:text-slate-300 hover:bg-[var(--cs-surface-card)]/20 transition-colors focus-ring',
                        title: 'Use template',
                        'aria-label': 'Use template',
                        children: n.jsxs('svg', {
                          width: '18',
                          height: '18',
                          viewBox: '0 0 24 24',
                          fill: 'none',
                          stroke: 'currentColor',
                          strokeWidth: '2',
                          strokeLinecap: 'round',
                          strokeLinejoin: 'round',
                          children: [
                            n.jsx('rect', { x: '3', y: '3', width: '7', height: '7' }),
                            n.jsx('rect', { x: '14', y: '3', width: '7', height: '7' }),
                            n.jsx('rect', { x: '14', y: '14', width: '7', height: '7' }),
                            n.jsx('rect', { x: '3', y: '14', width: '7', height: '7' }),
                          ],
                        }),
                      }),
                      n.jsxs('span', {
                        className:
                          'hidden sm:inline text-[11px] text-[var(--cs-text-tertiary)] ml-1',
                        children: [
                          n.jsx('kbd', {
                            className:
                              'px-1.5 py-0.5 rounded border border-[var(--cs-border-default)] bg-[var(--cs-surface-card)] font-mono text-[10px] text-[var(--cs-text-secondary)]',
                            children: 'Enter',
                          }),
                          ' to build',
                        ],
                      }),
                    ],
                  }),
                  n.jsx('button', {
                    onClick: R,
                    disabled: !c.trim() || p,
                    className:
                      'flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-500/25 focus-ring',
                    children: p
                      ? n.jsxs(n.Fragment, {
                          children: [
                            n.jsxs('svg', {
                              className: 'animate-spin h-4 w-4',
                              viewBox: '0 0 24 24',
                              fill: 'none',
                              children: [
                                n.jsx('circle', {
                                  className: 'opacity-25',
                                  cx: '12',
                                  cy: '12',
                                  r: '10',
                                  stroke: 'currentColor',
                                  strokeWidth: '4',
                                }),
                                n.jsx('path', {
                                  className: 'opacity-75',
                                  fill: 'currentColor',
                                  d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
                                }),
                              ],
                            }),
                            'Generating...',
                          ],
                        })
                      : n.jsxs(n.Fragment, {
                          children: [
                            'Build',
                            n.jsxs('svg', {
                              width: '16',
                              height: '16',
                              viewBox: '0 0 24 24',
                              fill: 'none',
                              stroke: 'currentColor',
                              strokeWidth: '2.5',
                              strokeLinecap: 'round',
                              strokeLinejoin: 'round',
                              children: [
                                n.jsx('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
                                n.jsx('polyline', { points: '12 5 19 12 12 19' }),
                              ],
                            }),
                          ],
                        }),
                  }),
                ],
              }),
            ],
          }),
          n.jsx('div', {
            className:
              'mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto animate-fadeInUp',
            style: { animationDelay: '360ms' },
            children: cl
              .slice(0, 4)
              .map((T) =>
                n.jsx(
                  'button',
                  {
                    onClick: () => b(T),
                    className:
                      'card-hover px-3.5 py-2 rounded-xl bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:border-indigo-500/30 transition-all duration-200 text-left leading-relaxed focus-ring',
                    children: T,
                  },
                  T,
                ),
              ),
          }),
        ],
      }),
      n.jsxs('section', {
        className: 'max-w-4xl mx-auto px-6 mt-28',
        children: [
          n.jsx('h2', {
            className:
              'animate-fadeInUp text-center text-2xl md:text-3xl font-bold text-[var(--cs-text-primary)] tracking-tight mb-14',
            children: 'How it works',
          }),
          n.jsx('div', {
            className: 'stagger-children grid grid-cols-1 md:grid-cols-3 gap-6',
            children: Ux.map((T) =>
              n.jsxs(
                'div',
                {
                  className:
                    'flex flex-col items-start text-left rounded-xl border border-[var(--cs-border-subtle)] bg-white/[0.02] p-5 group hover:bg-white/[0.04] hover:border-[var(--cs-border-default)] transition-all',
                  children: [
                    n.jsxs('div', {
                      className: 'flex items-center gap-3 mb-3',
                      children: [
                        n.jsxs('span', {
                          className: 'text-sm font-semibold text-indigo-400',
                          children: [T.num, '.'],
                        }),
                        n.jsx('h3', {
                          className: 'text-sm font-semibold text-[var(--cs-text-primary)]',
                          children: T.title,
                        }),
                      ],
                    }),
                    n.jsx('p', {
                      className: 'text-sm text-[var(--cs-text-secondary)] leading-relaxed',
                      children: T.description,
                    }),
                  ],
                },
                T.num,
              ),
            ),
          }),
        ],
      }),
      n.jsx('section', {
        className: 'max-w-3xl mx-auto px-6 mt-24',
        children: n.jsx('div', {
          className: 'flex items-center justify-center gap-8 md:gap-14 py-6 animate-fadeIn',
          children: Wx.map((T, z) =>
            n.jsxs(
              ve.Fragment,
              {
                children: [
                  z > 0 && n.jsx('div', { className: 'w-px h-8 bg-[var(--cs-border-subtle)]' }),
                  n.jsxs('div', {
                    className: 'flex flex-col items-center gap-1',
                    children: [
                      n.jsx('span', {
                        className:
                          'text-2xl md:text-3xl font-bold text-[var(--cs-text-primary)] tabular-nums',
                        children: T.value,
                      }),
                      n.jsx('span', {
                        className:
                          'text-[11px] text-[var(--cs-text-tertiary)] tracking-wide uppercase',
                        children: T.label,
                      }),
                    ],
                  }),
                ],
              },
              T.label,
            ),
          ),
        }),
      }),
      lp.length > 0 &&
        n.jsxs('section', {
          className: 'max-w-3xl mx-auto px-6 mt-24 w-full',
          children: [
            n.jsxs('div', {
              className: 'flex items-center justify-between mb-5',
              children: [
                n.jsx('p', {
                  className: 'text-sm text-[var(--cs-text-secondary)]',
                  children: 'Your crews',
                }),
                n.jsx('button', {
                  onClick: () => a('/crews'),
                  className:
                    'text-xs text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'All crews →',
                }),
              ],
            }),
            n.jsx('div', {
              className: 'stagger-children grid grid-cols-1 sm:grid-cols-3 gap-3',
              children: lp.map((T) => {
                const z = T.name
                  .split(' ')
                  .map((W) => W[0])
                  .join('')
                  .slice(0, 2);
                return n.jsxs(
                  'button',
                  {
                    onClick: () => a(Ul(T.id)),
                    className:
                      'card-hover text-left rounded-xl bg-white/[0.02] border border-[var(--cs-border-subtle)] hover:bg-white/[0.05] hover:border-[var(--cs-border-default)] transition-all duration-200 p-4 group focus-ring',
                    style: { borderTopColor: T.color, borderTopWidth: '3px' },
                    children: [
                      n.jsxs('div', {
                        className: 'flex items-center gap-3 mb-3',
                        children: [
                          n.jsx('div', {
                            className:
                              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 text-white',
                            style: { backgroundColor: T.color },
                            children: z,
                          }),
                          n.jsxs('div', {
                            className: 'flex-1 min-w-0',
                            children: [
                              n.jsx('p', {
                                className:
                                  'text-sm font-medium text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors truncate',
                                children: T.name,
                              }),
                              n.jsx('p', {
                                className: 'text-[11px] text-[var(--cs-text-tertiary)] truncate',
                                children: T.description,
                              }),
                            ],
                          }),
                        ],
                      }),
                      n.jsxs('div', {
                        className:
                          'flex items-center justify-between text-[11px] text-[var(--cs-text-tertiary)]',
                        children: [
                          n.jsxs('span', {
                            children: [T.agentCount, ' agents · ', T.workflowCount, ' workflows'],
                          }),
                          n.jsx('span', { children: T.updatedAt }),
                        ],
                      }),
                    ],
                  },
                  T.id,
                );
              }),
            }),
          ],
        }),
      n.jsx('footer', {
        className:
          'mt-32 px-6 py-8 border-t border-[var(--cs-border-subtle)] flex items-center justify-center',
        children: n.jsxs('p', {
          className: 'text-xs text-[var(--cs-text-tertiary)]',
          children: [
            '© ',
            new Date().getFullYear(),
            ' CrewSpace — AI Agent Orchestration Platform',
          ],
        }),
      }),
    ],
  });
}
const Fx = [
  {
    id: 'github',
    label: 'Continue with GitHub',
    icon: n.jsx('svg', {
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      children: n.jsx('path', {
        d: 'M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z',
      }),
    }),
  },
  {
    id: 'google',
    label: 'Continue with Google',
    icon: n.jsxs('svg', {
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      children: [
        n.jsx('path', {
          d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z',
          fill: '#4285F4',
        }),
        n.jsx('path', {
          d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z',
          fill: '#34A853',
        }),
        n.jsx('path', {
          d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z',
          fill: '#FBBC05',
        }),
        n.jsx('path', {
          d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z',
          fill: '#EA4335',
        }),
      ],
    }),
  },
  {
    id: 'microsoft',
    label: 'Continue with Microsoft',
    icon: n.jsxs('svg', {
      width: '18',
      height: '18',
      viewBox: '0 0 23 23',
      children: [
        n.jsx('rect', { x: '1', y: '1', width: '10', height: '10', fill: '#F25022' }),
        n.jsx('rect', { x: '12', y: '1', width: '10', height: '10', fill: '#7FBA00' }),
        n.jsx('rect', { x: '1', y: '12', width: '10', height: '10', fill: '#00A4EF' }),
        n.jsx('rect', { x: '12', y: '12', width: '10', height: '10', fill: '#FFB900' }),
      ],
    }),
  },
];
function Vx() {
  var j;
  const { login: a, loginWithOAuth: s, isLoading: i, error: l } = Ol(),
    c = Ht(),
    u = Ur(),
    [p, h] = N.useState(''),
    [m, g] = N.useState(''),
    [v, y] = N.useState(null),
    S = ((j = u.state) == null ? void 0 : j.from) ?? it.DASHBOARD,
    C = async (b) => {
      (b.preventDefault(), await a({ email: p, password: m }), c(S, { replace: !0 }));
    },
    R = N.useCallback(
      async (b) => {
        y(b);
        try {
          (await s(b), c(S, { replace: !0 }));
        } finally {
          y(null);
        }
      },
      [s, c, S],
    );
  return n.jsxs('main', {
    'data-testid': 'login-page',
    className:
      'min-h-screen bg-[var(--cs-surface-app)] flex flex-col items-center justify-center p-4 hero-glow',
    children: [
      n.jsxs('div', {
        className: 'flex items-center gap-3 mb-8 animate-fadeInDown',
        children: [
          n.jsx('div', {
            className:
              'w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center animate-pulseGlow',
            children: n.jsxs('svg', {
              width: '22',
              height: '22',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'white',
              strokeWidth: '2.5',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              children: [
                n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                n.jsx('path', { d: 'M2 12l10 5 10-5' }),
              ],
            }),
          }),
          n.jsxs('span', {
            className: 'text-xl font-semibold text-[var(--cs-text-primary)] tracking-tight',
            children: [n.jsx('span', { className: 'gradient-text', children: 'Crew' }), 'Space'],
          }),
        ],
      }),
      n.jsxs('div', {
        className:
          'w-full max-w-md animate-fadeInUp rounded-2xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-panel)] p-8',
        children: [
          n.jsxs('div', {
            className: 'mb-6 text-center',
            children: [
              n.jsx('h1', {
                className: 'text-2xl font-bold text-[var(--cs-text-primary)]',
                children: 'Welcome back',
              }),
              n.jsx('p', {
                className: 'mt-1 text-sm text-[var(--cs-text-secondary)]',
                children: 'Sign in to orchestrate your AI agent workflows',
              }),
            ],
          }),
          l &&
            n.jsxs('div', {
              role: 'alert',
              'data-testid': 'login-error',
              className:
                'mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2.5 text-sm text-rose-400 flex items-center gap-2',
              children: [
                n.jsxs('svg', {
                  width: '14',
                  height: '14',
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: '2',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  children: [
                    n.jsx('circle', { cx: '12', cy: '12', r: '10' }),
                    n.jsx('line', { x1: '15', y1: '9', x2: '9', y2: '15' }),
                    n.jsx('line', { x1: '9', y1: '9', x2: '15', y2: '15' }),
                  ],
                }),
                l,
              ],
            }),
          n.jsx('div', {
            className: 'flex flex-col gap-2.5 mb-6',
            children: Fx.map((b) => {
              const T = v === b.id;
              return n.jsxs(
                'button',
                {
                  onClick: () => R(b.id),
                  disabled: i || v !== null,
                  className:
                    'flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-card)] hover:bg-white/[0.06] hover:border-[var(--cs-border-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-[var(--cs-text-primary)] transition-all duration-200 focus-ring',
                  children: [
                    T
                      ? n.jsxs('svg', {
                          className: 'animate-spin h-4 w-4 text-[var(--cs-text-secondary)]',
                          viewBox: '0 0 24 24',
                          fill: 'none',
                          children: [
                            n.jsx('circle', {
                              className: 'opacity-25',
                              cx: '12',
                              cy: '12',
                              r: '10',
                              stroke: 'currentColor',
                              strokeWidth: '4',
                            }),
                            n.jsx('path', {
                              className: 'opacity-75',
                              fill: 'currentColor',
                              d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
                            }),
                          ],
                        })
                      : b.icon,
                    b.label,
                  ],
                },
                b.id,
              );
            }),
          }),
          n.jsxs('div', {
            className: 'flex items-center gap-3 mb-6',
            children: [
              n.jsx('div', { className: 'flex-1 h-px bg-[var(--cs-border-subtle)]' }),
              n.jsx('span', {
                className: 'text-xs text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                children: 'or',
              }),
              n.jsx('div', { className: 'flex-1 h-px bg-[var(--cs-border-subtle)]' }),
            ],
          }),
          n.jsxs('form', {
            onSubmit: C,
            'aria-label': 'Login form',
            className: 'flex flex-col gap-4',
            children: [
              n.jsxs('div', {
                children: [
                  n.jsx('label', {
                    htmlFor: 'email',
                    className: 'block text-xs font-medium text-[var(--cs-text-secondary)] mb-1.5',
                    children: 'Email',
                  }),
                  n.jsx('input', {
                    id: 'email',
                    type: 'email',
                    value: p,
                    onChange: (b) => h(b.target.value),
                    required: !0,
                    placeholder: 'you@example.com',
                    className:
                      'w-full px-3.5 py-2.5 rounded-xl bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors',
                  }),
                ],
              }),
              n.jsxs('div', {
                children: [
                  n.jsx('label', {
                    htmlFor: 'password',
                    className: 'block text-xs font-medium text-[var(--cs-text-secondary)] mb-1.5',
                    children: 'Password',
                  }),
                  n.jsx('input', {
                    id: 'password',
                    type: 'password',
                    value: m,
                    onChange: (b) => g(b.target.value),
                    required: !0,
                    placeholder: '••••••••',
                    className:
                      'w-full px-3.5 py-2.5 rounded-xl bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors',
                  }),
                ],
              }),
              n.jsx('button', {
                type: 'submit',
                disabled: i || v !== null,
                className:
                  'w-full mt-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 focus-ring',
                children: i && !v ? 'Signing in…' : 'Sign in',
              }),
            ],
          }),
          n.jsxs('p', {
            className: 'mt-6 text-center text-xs text-[var(--cs-text-tertiary)]',
            children: [
              "Don't have an account?",
              ' ',
              n.jsx('button', {
                className: 'text-indigo-400 hover:text-indigo-300 transition-colors focus-ring',
                children: 'Get started free',
              }),
            ],
          }),
        ],
      }),
      n.jsxs('p', {
        className: 'mt-8 text-xs text-[var(--cs-text-tertiary)] animate-fadeIn',
        style: { animationDelay: '400ms' },
        children: ['© ', new Date().getFullYear(), ' CrewSpace · AI Agent Orchestration'],
      }),
    ],
  });
}
const Yi = [
    {
      id: 'proj-1',
      name: 'Mobile Game MVP Research',
      description: 'Market research in the mobile gaming industry',
      agents: 4,
      tasks: 5,
      status: 'completed',
      updatedAt: '2 hours ago',
    },
    {
      id: 'proj-2',
      name: 'SaaS Launch Campaign',
      description: 'Content marketing campaign for a SaaS product',
      agents: 6,
      tasks: 8,
      status: 'running',
      updatedAt: '1 day ago',
    },
    {
      id: 'proj-3',
      name: 'Competitor Analysis',
      description: 'Pricing strategy analysis in e-commerce',
      agents: 3,
      tasks: 4,
      status: 'draft',
      updatedAt: '3 days ago',
    },
    {
      id: 'proj-4',
      name: 'Customer Onboarding Flow',
      description: 'Automated onboarding workflow with follow-ups',
      agents: 5,
      tasks: 7,
      status: 'completed',
      updatedAt: '1 week ago',
    },
    {
      id: 'proj-5',
      name: 'AI Trends Summary',
      description: 'Board presentation on AI trends',
      agents: 2,
      tasks: 3,
      status: 'failed',
      updatedAt: '2 weeks ago',
    },
    {
      id: 'proj-6',
      name: 'QA Pipeline',
      description: 'Automated quality assurance for dev team',
      agents: 4,
      tasks: 6,
      status: 'draft',
      updatedAt: '2 weeks ago',
    },
  ],
  Hx = {
    'proj-1': '#10b981',
    'proj-2': '#f59e0b',
    'proj-3': '#6366f1',
    'proj-4': '#06b6d4',
    'proj-5': '#ef4444',
    'proj-6': '#6366f1',
  };
function Gx() {
  const a = Ht(),
    [s, i] = N.useState(''),
    [l, c] = N.useState('all'),
    u = Yi.filter(
      (p) =>
        !(
          (l !== 'all' && p.status !== l) ||
          (s && !p.name.toLowerCase().includes(s.toLowerCase()))
        ),
    );
  return n.jsxs('div', {
    className: 'min-h-screen bg-[var(--cs-surface-app)] scrollbar-thin',
    children: [
      n.jsx('header', {
        className: 'glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]',
        children: n.jsxs('div', {
          className: 'max-w-6xl mx-auto flex items-center justify-between px-6 py-4',
          children: [
            n.jsx('div', {
              className: 'flex items-center gap-3',
              children: n.jsxs(Mr, {
                to: '/',
                className: 'flex items-center gap-2 focus-ring rounded-lg',
                children: [
                  n.jsx('div', {
                    className:
                      'w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center',
                    children: n.jsxs('svg', {
                      width: '18',
                      height: '18',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'white',
                      strokeWidth: '2.5',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      children: [
                        n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                        n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                        n.jsx('path', { d: 'M2 12l10 5 10-5' }),
                      ],
                    }),
                  }),
                  n.jsxs('span', {
                    className: 'text-lg font-semibold text-[var(--cs-text-primary)] tracking-tight',
                    children: [
                      n.jsx('span', { className: 'gradient-text', children: 'Crew' }),
                      'Space',
                    ],
                  }),
                ],
              }),
            }),
            n.jsxs('nav', {
              className: 'hidden md:flex items-center gap-6',
              children: [
                n.jsx('span', {
                  className: 'text-sm text-[var(--cs-text-primary)] font-medium',
                  children: 'Projects',
                }),
                n.jsx('button', {
                  onClick: () => a('/templates'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Templates',
                }),
                n.jsx('button', {
                  onClick: () => a('/marketplace'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Marketplace',
                }),
              ],
            }),
            n.jsxs('div', {
              className: 'flex items-center gap-3',
              children: [
                n.jsx('button', {
                  onClick: () => a('/settings'),
                  className:
                    'p-2 rounded-lg text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-[var(--cs-surface-card)]/20 transition-colors focus-ring',
                  'aria-label': 'Settings',
                  children: n.jsxs('svg', {
                    width: '16',
                    height: '16',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    children: [
                      n.jsx('circle', { cx: '12', cy: '12', r: '3' }),
                      n.jsx('path', {
                        d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
                      }),
                    ],
                  }),
                }),
                n.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-[var(--cs-text-primary)]',
                  children: 'D',
                }),
              ],
            }),
          ],
        }),
      }),
      n.jsxs('main', {
        className: 'max-w-6xl mx-auto px-6 py-8',
        children: [
          n.jsxs('div', {
            className: 'flex items-center justify-between mb-8 animate-fadeInDown',
            children: [
              n.jsxs('div', {
                className: 'flex items-center gap-4',
                children: [
                  n.jsx('h1', {
                    className: 'text-2xl font-bold text-[var(--cs-text-primary)]',
                    children: 'Projects',
                  }),
                  n.jsxs('div', {
                    className:
                      'hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--cs-text-tertiary)]',
                    children: [
                      n.jsxs('span', {
                        className:
                          'px-2 py-0.5 rounded-md bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] tabular-nums',
                        children: [Yi.length, ' total'],
                      }),
                      n.jsxs('span', {
                        className:
                          'px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/15 tabular-nums',
                        children: [Yi.filter((p) => p.status === 'running').length, ' running'],
                      }),
                      n.jsxs('span', {
                        className:
                          'px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 tabular-nums',
                        children: [Yi.filter((p) => p.status === 'completed').length, ' done'],
                      }),
                    ],
                  }),
                ],
              }),
              n.jsxs('button', {
                onClick: () => a('/'),
                className:
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 focus-ring',
                children: [
                  n.jsxs('svg', {
                    width: '14',
                    height: '14',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2.5',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    children: [
                      n.jsx('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
                      n.jsx('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
                    ],
                  }),
                  'New Project',
                ],
              }),
            ],
          }),
          n.jsxs('div', {
            className:
              'flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 animate-fadeIn',
            children: [
              n.jsxs('div', {
                className: 'flex-1 relative',
                children: [
                  n.jsxs('svg', {
                    width: '16',
                    height: '16',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    className:
                      'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-text-tertiary)]',
                    children: [
                      n.jsx('circle', { cx: '11', cy: '11', r: '8' }),
                      n.jsx('line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }),
                    ],
                  }),
                  n.jsx('input', {
                    type: 'text',
                    value: s,
                    onChange: (p) => i(p.target.value),
                    placeholder: 'Search projects...',
                    'aria-label': 'Search projects',
                    className:
                      'w-full bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] outline-none focus:border-indigo-500/40 focus:shadow-sm focus:shadow-indigo-500/10 transition-all',
                  }),
                ],
              }),
              n.jsx('div', {
                className:
                  'flex items-center bg-[var(--cs-surface-card)]/20 rounded-xl p-1 border border-[var(--cs-border-subtle)]',
                children: ['all', 'draft', 'running', 'completed', 'failed'].map((p) =>
                  n.jsx(
                    'button',
                    {
                      onClick: () => c(p),
                      className: `px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize focus-ring ${l === p ? 'bg-indigo-600/20 text-indigo-300 shadow-sm' : 'text-[var(--cs-text-tertiary)] hover:text-slate-300'}`,
                      children: p,
                    },
                    p,
                  ),
                ),
              }),
            ],
          }),
          n.jsxs('div', {
            className:
              'rounded-xl border border-[var(--cs-border-subtle)] overflow-hidden stagger-children',
            children: [
              n.jsxs('div', {
                className:
                  'hidden md:grid grid-cols-[1fr_100px_80px_80px_100px] gap-4 px-5 py-2.5 bg-white/[0.02] border-b border-[var(--cs-border-subtle)] text-[10px] text-[var(--cs-text-tertiary)] uppercase tracking-wider font-medium',
                children: [
                  n.jsx('span', { children: 'Project' }),
                  n.jsx('span', { children: 'Status' }),
                  n.jsx('span', { children: 'Agents' }),
                  n.jsx('span', { children: 'Tasks' }),
                  n.jsx('span', { className: 'text-right', children: 'Updated' }),
                ],
              }),
              u.map((p, h) => {
                const m = p.name
                    .split(' ')
                    .map((v) => v[0])
                    .join('')
                    .slice(0, 2),
                  g = Hx[p.id] ?? '#6366f1';
                return n.jsxs(
                  'button',
                  {
                    onClick: () => a(Qi(p.id)),
                    className: `w-full text-left flex md:grid md:grid-cols-[1fr_100px_80px_80px_100px] items-center gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-all group focus-ring ${h < u.length - 1 ? 'border-b border-[var(--cs-border-subtle)]' : ''}`,
                    children: [
                      n.jsxs('div', {
                        className: 'flex items-center gap-3 flex-1 min-w-0',
                        children: [
                          n.jsx('div', {
                            className:
                              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                            style: {
                              backgroundColor: `${g}25`,
                              color: g,
                              border: `1px solid ${g}30`,
                            },
                            children: m,
                          }),
                          n.jsxs('div', {
                            className: 'min-w-0',
                            children: [
                              n.jsx('p', {
                                className:
                                  'text-sm font-medium text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors truncate',
                                children: p.name,
                              }),
                              n.jsx('p', {
                                className:
                                  'text-xs text-[var(--cs-text-tertiary)] truncate hidden sm:block',
                                children: p.description,
                              }),
                            ],
                          }),
                        ],
                      }),
                      n.jsx('div', {
                        className: 'hidden md:block',
                        children: n.jsx(cp, { status: p.status }),
                      }),
                      n.jsx('span', {
                        className:
                          'hidden md:block text-xs text-[var(--cs-text-secondary)] tabular-nums',
                        children: p.agents,
                      }),
                      n.jsx('span', {
                        className:
                          'hidden md:block text-xs text-[var(--cs-text-secondary)] tabular-nums',
                        children: p.tasks,
                      }),
                      n.jsx('span', {
                        className:
                          'hidden md:block text-xs text-[var(--cs-text-tertiary)] text-right',
                        children: p.updatedAt,
                      }),
                      n.jsxs('div', {
                        className: 'flex md:hidden items-center gap-2 flex-shrink-0',
                        children: [
                          n.jsx(cp, { status: p.status }),
                          n.jsx('svg', {
                            width: '14',
                            height: '14',
                            viewBox: '0 0 24 24',
                            fill: 'none',
                            stroke: 'currentColor',
                            strokeWidth: '2',
                            className: 'text-[var(--cs-text-tertiary)]',
                            children: n.jsx('polyline', { points: '9 18 15 12 9 6' }),
                          }),
                        ],
                      }),
                    ],
                  },
                  p.id,
                );
              }),
            ],
          }),
          u.length === 0 &&
            n.jsxs('div', {
              className: 'text-center py-20 animate-fadeIn',
              children: [
                n.jsx('div', {
                  className:
                    'w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--cs-surface-card)]/20 border border-[var(--cs-border-default)] flex items-center justify-center',
                  children: n.jsxs('svg', {
                    width: '24',
                    height: '24',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '1.5',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    className: 'text-[var(--cs-text-tertiary)]',
                    children: [
                      n.jsx('circle', { cx: '11', cy: '11', r: '8' }),
                      n.jsx('line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }),
                    ],
                  }),
                }),
                n.jsx('p', {
                  className: 'text-sm text-[var(--cs-text-secondary)] mb-1',
                  children: 'No projects found',
                }),
                n.jsx('p', {
                  className: 'text-xs text-[var(--cs-text-tertiary)]',
                  children: 'Try adjusting your search or filter',
                }),
              ],
            }),
        ],
      }),
    ],
  });
}
function cp({ status: a }) {
  const s = {
    draft: 'bg-slate-500/15 text-[var(--cs-text-secondary)] border-slate-500/20',
    running: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    failed: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  };
  return n.jsxs('span', {
    className: `px-2.5 py-1 rounded-full text-[10px] font-semibold border ${s[a]}`,
    children: [
      a === 'running' &&
        n.jsx('span', {
          className:
            'inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1.5 align-middle',
        }),
      a,
    ],
  });
}
function rf(a) {
  var s,
    i,
    l = '';
  if (typeof a == 'string' || typeof a == 'number') l += a;
  else if (typeof a == 'object')
    if (Array.isArray(a)) {
      var c = a.length;
      for (s = 0; s < c; s++) a[s] && (i = rf(a[s])) && (l && (l += ' '), (l += i));
    } else for (i in a) a[i] && (l && (l += ' '), (l += i));
  return l;
}
function nf() {
  for (var a, s, i = 0, l = '', c = arguments.length; i < c; i++)
    (a = arguments[i]) && (s = rf(a)) && (l && (l += ' '), (l += s));
  return l;
}
const Yx = {
    primary:
      'bg-brand-primary text-white hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-brand-primary',
    secondary:
      'bg-surface-elevated text-slate-200 hover:bg-slate-600 active:bg-slate-500 border border-slate-600 focus-visible:ring-brand-primary',
    ghost:
      'bg-transparent text-slate-300 hover:bg-surface-elevated hover:text-white active:bg-slate-600 focus-visible:ring-brand-primary',
    danger:
      'bg-status-error text-white hover:bg-rose-600 active:bg-rose-700 focus-visible:ring-status-error',
  },
  Zx = {
    sm: 'h-7 px-2.5 text-xs gap-1 rounded',
    md: 'h-9 px-3.5 text-sm gap-1.5 rounded-md',
    lg: 'h-11 px-5 text-base gap-2 rounded-lg',
    icon: 'h-9 w-9 rounded-md justify-center',
  },
  sf = N.forwardRef(
    (
      {
        variant: a = 'primary',
        size: s = 'md',
        loading: i = !1,
        disabled: l,
        className: c,
        children: u,
        ...p
      },
      h,
    ) =>
      n.jsxs('button', {
        ref: h,
        disabled: l || i,
        className: nf(
          'inline-flex items-center font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app',
          'disabled:opacity-50 disabled:pointer-events-none',
          Yx[a],
          Zx[s],
          c,
        ),
        ...p,
        children: [
          i &&
            n.jsxs('svg', {
              className: 'animate-spin h-4 w-4',
              viewBox: '0 0 24 24',
              fill: 'none',
              'aria-hidden': 'true',
              children: [
                n.jsx('circle', {
                  className: 'opacity-25',
                  cx: '12',
                  cy: '12',
                  r: '10',
                  stroke: 'currentColor',
                  strokeWidth: '4',
                }),
                n.jsx('path', {
                  className: 'opacity-75',
                  fill: 'currentColor',
                  d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
                }),
              ],
            }),
          u,
        ],
      }),
  );
sf.displayName = 'Button';
const Kx = {
    default: 'bg-surface-elevated text-slate-300 border-slate-600',
    brand: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
    success: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
    warning: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
    error: 'bg-rose-900/30 text-rose-300 border-rose-700/50',
    info: 'bg-sky-900/30 text-sky-300 border-sky-700/50',
  },
  af = N.forwardRef(({ variant: a = 'default', className: s, children: i, ...l }, c) =>
    n.jsx('span', {
      ref: c,
      className: nf(
        'inline-flex items-center rounded-full border px-2 py-0.5',
        'text-node-badge font-semibold uppercase tracking-wider',
        Kx[a],
        s,
      ),
      ...l,
      children: i,
    }),
  );
af.displayName = 'Badge';
function qx() {
  const { workflowId: a } = $l();
  return n.jsxs('main', {
    'data-testid': 'canvas-page',
    className: 'min-h-screen bg-surface-canvas flex flex-col',
    children: [
      n.jsxs('div', {
        className:
          'border-b border-border-default bg-surface-panel px-4 py-3 flex items-center gap-3',
        children: [
          n.jsx('h1', {
            className: 'text-lg font-semibold text-text-primary',
            children: 'Canvas Editor',
          }),
          n.jsx(af, { variant: 'info', children: a ?? 'new' }),
        ],
      }),
      n.jsx('div', {
        className: 'flex-1 flex items-center justify-center',
        children: n.jsx('p', {
          className: 'text-text-tertiary text-sm',
          children: 'Drag agents and tasks from the toolbar to build your workflow.',
        }),
      }),
    ],
  });
}
function Qx({ messages: a, onSendMessage: s, isGenerating: i, workflow: l }) {
  var v;
  const [c, u] = N.useState(''),
    p = N.useRef(null),
    h = N.useRef(null);
  (N.useEffect(() => {
    var y;
    (y = p.current) == null || y.scrollIntoView({ behavior: 'smooth' });
  }, [a]),
    N.useEffect(() => {
      const y = h.current;
      y && ((y.style.height = 'auto'), (y.style.height = `${Math.min(y.scrollHeight, 120)}px`));
    }, [c]));
  const m = N.useCallback(() => {
      !c.trim() || i || (s(c.trim()), u(''));
    }, [c, i, s]),
    g = N.useCallback(
      (y) => {
        y.key === 'Enter' && !y.shiftKey && (y.preventDefault(), m());
      },
      [m],
    );
  return n.jsxs('div', {
    className: 'flex flex-col h-full',
    children: [
      n.jsxs('div', {
        className:
          'flex items-center gap-3 px-4 py-3 border-b border-[var(--cs-border-subtle)] glass-subtle',
        children: [
          n.jsx('div', {
            className:
              'w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0',
            children: n.jsx('svg', {
              width: '14',
              height: '14',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'white',
              strokeWidth: '2.5',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              children: n.jsx('path', {
                d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
              }),
            }),
          }),
          n.jsxs('div', {
            className: 'flex-1 min-w-0',
            children: [
              n.jsx('h3', {
                className: 'text-sm font-semibold text-[var(--cs-text-primary)] truncate',
                children: 'Workflow Assistant',
              }),
              n.jsx('p', {
                className: 'text-xs text-[var(--cs-text-tertiary)]',
                children: i
                  ? 'Thinking...'
                  : l
                    ? `${l.agents.length} agents · ${l.tasks.length} tasks`
                    : 'Ready to help',
              }),
            ],
          }),
        ],
      }),
      n.jsxs('div', {
        className: 'flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin',
        children: [
          a.length === 0 &&
            n.jsxs('div', {
              className: 'flex flex-col items-center justify-center h-full text-center px-4',
              children: [
                n.jsx('div', {
                  className:
                    'w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mb-4',
                  children: n.jsxs('svg', {
                    width: '24',
                    height: '24',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'rgb(167 139 250)',
                    strokeWidth: '1.5',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    children: [
                      n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                      n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                      n.jsx('path', { d: 'M2 12l10 5 10-5' }),
                    ],
                  }),
                }),
                n.jsx('p', {
                  className: 'text-sm text-[var(--cs-text-secondary)] mb-2',
                  children: 'Describe your initiative',
                }),
                n.jsx('p', {
                  className: 'text-xs text-[var(--cs-text-tertiary)] leading-relaxed',
                  children:
                    "Tell me what you want to accomplish and I'll assemble the right team of AI agents.",
                }),
              ],
            }),
          a.map((y) => n.jsx(Xx, { message: y }, y.id)),
          i &&
            n.jsxs('div', {
              className: 'flex items-start gap-3',
              children: [
                n.jsx('div', {
                  className:
                    'w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5',
                  children: n.jsxs('svg', {
                    width: '14',
                    height: '14',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'white',
                    strokeWidth: '2.5',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    children: [
                      n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                      n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                      n.jsx('path', { d: 'M2 12l10 5 10-5' }),
                    ],
                  }),
                }),
                n.jsxs('div', {
                  className:
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--cs-surface-card)]',
                  children: [
                    n.jsx('span', {
                      className: 'w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce',
                      style: { animationDelay: '0ms' },
                    }),
                    n.jsx('span', {
                      className: 'w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce',
                      style: { animationDelay: '150ms' },
                    }),
                    n.jsx('span', {
                      className: 'w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce',
                      style: { animationDelay: '300ms' },
                    }),
                  ],
                }),
              ],
            }),
          n.jsx('div', { ref: p }),
        ],
      }),
      l &&
        !i &&
        n.jsx('div', {
          className: 'px-4 pb-2 flex gap-1.5 flex-wrap',
          children:
            l.status === 'completed'
              ? n.jsxs(n.Fragment, {
                  children: [
                    n.jsx(en, {
                      label: 'Summarize the results',
                      onClick: () => s('Summarize the workflow results'),
                    }),
                    n.jsx(en, {
                      label: 'Export as report',
                      onClick: () => s('Export the results as a structured report'),
                    }),
                  ],
                })
              : l.status === 'failed'
                ? n.jsxs(n.Fragment, {
                    children: [
                      n.jsx(en, {
                        label: 'What went wrong?',
                        onClick: () => s('Explain what failed and suggest fixes'),
                      }),
                      n.jsx(en, {
                        label: 'Retry failed tasks',
                        onClick: () => s('Retry the failed tasks'),
                      }),
                    ],
                  })
                : n.jsxs(n.Fragment, {
                    children: [
                      l.agents.length > 0 &&
                        n.jsx(en, {
                          label: `Explain ${((v = l.agents[0]) == null ? void 0 : v.role) ?? 'agent'}'s role`,
                          onClick: () => {
                            var y;
                            return s(
                              `Explain what the ${((y = l.agents[0]) == null ? void 0 : y.role) ?? 'first agent'} does in this workflow`,
                            );
                          },
                        }),
                      l.tasks.length > 0 &&
                        n.jsx(en, {
                          label: 'Show task dependencies',
                          onClick: () => s('Show me how the tasks depend on each other'),
                        }),
                      n.jsx(en, {
                        label: 'Optimize this workflow',
                        onClick: () => s('Suggest optimizations for this workflow'),
                      }),
                    ],
                  }),
        }),
      n.jsx('div', {
        className: 'p-3 border-t border-[var(--cs-border-subtle)]',
        children: n.jsxs('div', {
          className:
            'relative rounded-xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-card)] focus-within:border-indigo-500/40 transition-colors',
          children: [
            n.jsx('textarea', {
              ref: h,
              value: c,
              onChange: (y) => u(y.target.value),
              onKeyDown: g,
              placeholder: 'Ask anything about the workflow...',
              rows: 1,
              className:
                'w-full bg-transparent text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] px-3 pt-2.5 pb-9 resize-none outline-none min-h-[40px] max-h-[120px]',
            }),
            n.jsxs('div', {
              className:
                'absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5',
              children: [
                n.jsx('div', {
                  className: 'flex items-center gap-1',
                  children: n.jsx('button', {
                    className:
                      'p-1 rounded text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] transition-colors',
                    title: 'Attach',
                    children: n.jsx('svg', {
                      width: '14',
                      height: '14',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: '2',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      children: n.jsx('path', {
                        d: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48',
                      }),
                    }),
                  }),
                }),
                n.jsx('button', {
                  onClick: m,
                  disabled: !c.trim() || i,
                  className:
                    'p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:cursor-not-allowed text-white transition-all',
                  children: n.jsxs('svg', {
                    width: '14',
                    height: '14',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2.5',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    children: [
                      n.jsx('line', { x1: '22', y1: '2', x2: '11', y2: '13' }),
                      n.jsx('polygon', { points: '22 2 15 22 11 13 2 9 22 2' }),
                    ],
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
function Xx({ message: a }) {
  return a.role === 'system'
    ? n.jsxs('div', {
        className: 'flex items-center gap-2 py-1',
        children: [
          n.jsx('div', { className: 'h-px flex-1 bg-[var(--cs-surface-card)]' }),
          n.jsx('span', {
            className: 'text-[11px] text-[var(--cs-text-tertiary)] px-2',
            children: a.content,
          }),
          n.jsx('div', { className: 'h-px flex-1 bg-[var(--cs-surface-card)]' }),
        ],
      })
    : a.role === 'user'
      ? n.jsx('div', {
          className: 'flex justify-end',
          children: n.jsx('div', {
            className:
              'max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-md bg-indigo-600/90 text-sm text-white leading-relaxed',
            children: a.content,
          }),
        })
      : n.jsxs('div', {
          className: 'flex items-start gap-3',
          children: [
            n.jsx('div', {
              className:
                'w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5',
              children: n.jsxs('svg', {
                width: '14',
                height: '14',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'white',
                strokeWidth: '2.5',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                children: [
                  n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                  n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                  n.jsx('path', { d: 'M2 12l10 5 10-5' }),
                ],
              }),
            }),
            n.jsx('div', {
              className: 'max-w-[85%] text-sm text-[var(--cs-text-primary)] leading-relaxed',
              children: n.jsx(Jx, { text: a.content }),
            }),
          ],
        });
}
function Jx({ text: a }) {
  var l;
  const s = a.split(`
`),
    i = [];
  for (let c = 0; c < s.length; c++) {
    const u = s[c] ?? '';
    if (u.startsWith('•') || u.startsWith('-'))
      i.push(
        n.jsxs(
          'div',
          {
            className: 'flex gap-2 ml-1 mt-0.5',
            children: [
              n.jsx('span', { className: 'text-indigo-400 mt-px', children: '•' }),
              n.jsx('span', { children: dl(u.replace(/^[•\-]\s*/, '')) }),
            ],
          },
          c,
        ),
      );
    else if (/^\d+\./.test(u)) {
      const p = ((l = u.match(/^(\d+)\./)) == null ? void 0 : l[1]) ?? '';
      i.push(
        n.jsxs(
          'div',
          {
            className: 'flex gap-2 ml-1 mt-0.5',
            children: [
              n.jsxs('span', {
                className: 'text-indigo-400 font-mono text-xs mt-0.5 w-4',
                children: [p, '.'],
              }),
              n.jsx('span', { children: dl(u.replace(/^\d+\.\s*/, '')) }),
            ],
          },
          c,
        ),
      );
    } else
      u.trim() === ''
        ? i.push(n.jsx('div', { className: 'h-2' }, c))
        : i.push(n.jsx('p', { className: 'mt-0.5', children: dl(u) }, c));
  }
  return n.jsx(n.Fragment, { children: i });
}
function dl(a) {
  return a
    .split(/(\*\*[^*]+\*\*)/g)
    .map((i, l) =>
      i.startsWith('**') && i.endsWith('**')
        ? n.jsx(
            'span',
            { className: 'font-semibold text-[var(--cs-text-primary)]', children: i.slice(2, -2) },
            l,
          )
        : i,
    );
}
function en({ label: a, onClick: s }) {
  return n.jsx('button', {
    onClick: s,
    className:
      'px-2.5 py-1 rounded-lg bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all focus-ring',
    children: a,
  });
}
const dp = {
    'agent-business-analyst': n.jsxs(n.Fragment, {
      children: [
        n.jsx('rect', {
          x: '2',
          y: '14',
          width: '5',
          height: '8',
          rx: '1',
          fill: 'currentColor',
          opacity: '.4',
        }),
        n.jsx('rect', {
          x: '9.5',
          y: '9',
          width: '5',
          height: '13',
          rx: '1',
          fill: 'currentColor',
          opacity: '.7',
        }),
        n.jsx('rect', { x: '17', y: '4', width: '5', height: '18', rx: '1', fill: 'currentColor' }),
      ],
    }),
    'agent-content-marketer': n.jsx('path', {
      d: 'M15.5 2.5L21 8 8.5 20.5H3V15L15.5 2.5z',
      fill: 'currentColor',
    }),
    'agent-customer-success-manager': n.jsx('path', {
      d: 'M12 21c-.5-.4-8-6.3-8-11.7C4 5.9 6 4 8.5 4c1.4 0 2.7.7 3.5 1.7C12.8 4.7 14.1 4 15.5 4 18 4 20 5.9 20 9.3 20 14.7 12.5 20.6 12 21z',
      fill: 'currentColor',
    }),
    'agent-legal-advisor': n.jsx('path', {
      d: 'M12 2L4 6v5c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z',
      fill: 'currentColor',
    }),
    'agent-license-engineer': n.jsxs(n.Fragment, {
      children: [
        n.jsx('circle', { cx: '8', cy: '12', r: '5', fill: 'currentColor' }),
        n.jsx('rect', {
          x: '12',
          y: '10.5',
          width: '10',
          height: '3',
          rx: '1.5',
          fill: 'currentColor',
        }),
        n.jsx('rect', {
          x: '18',
          y: '13',
          width: '2',
          height: '3',
          rx: '.5',
          fill: 'currentColor',
        }),
      ],
    }),
    'agent-product-manager': n.jsxs(n.Fragment, {
      children: [
        n.jsx('circle', { cx: '12', cy: '12', r: '10', fill: 'currentColor', opacity: '.25' }),
        n.jsx('circle', { cx: '12', cy: '12', r: '6.5', fill: 'currentColor', opacity: '.5' }),
        n.jsx('circle', { cx: '12', cy: '12', r: '3', fill: 'currentColor' }),
      ],
    }),
    'agent-project-manager': n.jsxs(n.Fragment, {
      children: [
        n.jsx('rect', {
          x: '4',
          y: '3',
          width: '16',
          height: '19',
          rx: '2',
          fill: 'currentColor',
          opacity: '.25',
        }),
        n.jsx('rect', { x: '7.5', y: '8', width: '9', height: '2', rx: '1', fill: 'currentColor' }),
        n.jsx('rect', {
          x: '7.5',
          y: '12',
          width: '7',
          height: '2',
          rx: '1',
          fill: 'currentColor',
          opacity: '.7',
        }),
        n.jsx('rect', {
          x: '7.5',
          y: '16',
          width: '5',
          height: '2',
          rx: '1',
          fill: 'currentColor',
          opacity: '.5',
        }),
      ],
    }),
    'agent-sales-engineer': n.jsxs(n.Fragment, {
      children: [
        n.jsx('path', { d: 'M3 20L12 4l9 16H3z', fill: 'currentColor', opacity: '.3' }),
        n.jsx('path', { d: 'M7 20L12 10l5 10H7z', fill: 'currentColor' }),
      ],
    }),
    'agent-scrum-master': n.jsx('path', {
      d: 'M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z',
      fill: 'currentColor',
    }),
    'agent-technical-writer': n.jsxs(n.Fragment, {
      children: [
        n.jsx('path', {
          d: 'M2 4h8c1.1 0 2 .9 2 2v14c-1-1-2.5-1.5-4-1.5H2V4z',
          fill: 'currentColor',
          opacity: '.55',
        }),
        n.jsx('path', {
          d: 'M22 4h-8c-1.1 0-2 .9-2 2v14c1-1 2.5-1.5 4-1.5h6V4z',
          fill: 'currentColor',
        }),
      ],
    }),
    'agent-ux-researcher': n.jsxs(n.Fragment, {
      children: [
        n.jsx('path', {
          d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z',
          fill: 'currentColor',
          opacity: '.35',
        }),
        n.jsx('circle', { cx: '12', cy: '12', r: '4', fill: 'currentColor' }),
      ],
    }),
    'agent-wordpress-master': n.jsxs(n.Fragment, {
      children: [
        n.jsx('path', {
          d: 'M9 4L3 12l6 8',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '2.5',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        n.jsx('path', {
          d: 'M15 4l6 8-6 8',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '2.5',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      ],
    }),
    'agent-research-analyst': n.jsx('path', {
      d: 'M9 2h6v7l5 9.5c.6 1.2-.2 2.5-1.7 2.5H5.7c-1.5 0-2.3-1.3-1.7-2.5L9 9V2z',
      fill: 'currentColor',
    }),
    'agent-search-specialist': n.jsxs(n.Fragment, {
      children: [
        n.jsx('circle', { cx: '12', cy: '12', r: '2.5', fill: 'currentColor' }),
        n.jsx('circle', {
          cx: '12',
          cy: '12',
          r: '6',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '2',
          opacity: '.5',
        }),
        n.jsx('circle', {
          cx: '12',
          cy: '12',
          r: '10',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '2',
          opacity: '.25',
        }),
      ],
    }),
    'agent-trend-analyst': n.jsx('path', {
      d: 'M13 2L4 14h7l-2 8 11-12h-7z',
      fill: 'currentColor',
    }),
    'agent-competitive-analyst': n.jsxs(n.Fragment, {
      children: [
        n.jsx('rect', {
          x: '3',
          y: '2',
          width: '2.5',
          height: '20',
          rx: '1',
          fill: 'currentColor',
          opacity: '.45',
        }),
        n.jsx('path', { d: 'M5.5 4h13l-3.5 5 3.5 5H5.5V4z', fill: 'currentColor' }),
      ],
    }),
    'agent-market-researcher': n.jsxs(n.Fragment, {
      children: [
        n.jsx('circle', { cx: '12', cy: '12', r: '10', fill: 'currentColor', opacity: '.3' }),
        n.jsx('path', { d: 'M12 2a10 10 0 0110 10H12V2z', fill: 'currentColor' }),
      ],
    }),
    'agent-project-idea-validator': n.jsx('path', {
      d: 'M12 2L2 10l10 12 10-12L12 2z',
      fill: 'currentColor',
    }),
    'agent-data-researcher': n.jsxs(n.Fragment, {
      children: [
        n.jsx('ellipse', { cx: '12', cy: '5.5', rx: '9', ry: '3.5', fill: 'currentColor' }),
        n.jsx('ellipse', {
          cx: '12',
          cy: '12',
          rx: '9',
          ry: '3.5',
          fill: 'currentColor',
          opacity: '.55',
        }),
        n.jsx('ellipse', {
          cx: '12',
          cy: '18.5',
          rx: '9',
          ry: '3.5',
          fill: 'currentColor',
          opacity: '.25',
        }),
      ],
    }),
    'agent-scientific-literature-researcher': n.jsxs(n.Fragment, {
      children: [
        n.jsx('circle', { cx: '12', cy: '12', r: '2.5', fill: 'currentColor' }),
        n.jsx('ellipse', {
          cx: '12',
          cy: '12',
          rx: '10',
          ry: '4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.5',
        }),
        n.jsx('ellipse', {
          cx: '12',
          cy: '12',
          rx: '10',
          ry: '4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.5',
          transform: 'rotate(60 12 12)',
        }),
        n.jsx('ellipse', {
          cx: '12',
          cy: '12',
          rx: '10',
          ry: '4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.5',
          transform: 'rotate(120 12 12)',
        }),
      ],
    }),
  },
  eg = [
    [['business', 'analyst', 'requirements', 'stakeholder'], 'agent-business-analyst'],
    [
      ['content', 'marketer', 'marketing', 'copywriter', 'copy', 'writer', 'blog', 'editorial'],
      'agent-content-marketer',
    ],
    [
      ['customer', 'success', 'support', 'onboarding', 'retention'],
      'agent-customer-success-manager',
    ],
    [['legal', 'lawyer', 'compliance', 'privacy', 'regulation'], 'agent-legal-advisor'],
    [['license', 'licensing', 'oss', 'ip'], 'agent-license-engineer'],
    [['product', 'manager', 'strategy', 'strategist', 'roadmap'], 'agent-product-manager'],
    [['project', 'manager', 'delivery', 'planning', 'coordinator'], 'agent-project-manager'],
    [['sales', 'engineer', 'pre-sales', 'demo'], 'agent-sales-engineer'],
    [['scrum', 'agile', 'sprint', 'kanban'], 'agent-scrum-master'],
    [
      ['technical', 'writer', 'documentation', 'docs', 'editor', 'review'],
      'agent-technical-writer',
    ],
    [['ux', 'user', 'research', 'usability', 'persona'], 'agent-ux-researcher'],
    [['wordpress', 'cms', 'theme', 'plugin'], 'agent-wordpress-master'],
    [['research', 'analyst', 'investigation'], 'agent-research-analyst'],
    [
      ['search', 'specialist', 'retrieval', 'discovery', 'seo', 'keyword', 'optimization'],
      'agent-search-specialist',
    ],
    [['trend', 'forecast', 'signal', 'emerging'], 'agent-trend-analyst'],
    [['competitive', 'competitor', 'benchmark', 'swot'], 'agent-competitive-analyst'],
    [['market', 'researcher', 'consumer', 'segmentation'], 'agent-market-researcher'],
    [['idea', 'validator', 'mvp', 'validate', 'feasibility'], 'agent-project-idea-validator'],
    [['data', 'researcher', 'mining', 'dataset', 'statistical'], 'agent-data-researcher'],
    [
      ['scientific', 'literature', 'paper', 'evidence', 'systematic'],
      'agent-scientific-literature-researcher',
    ],
  ];
function tg(a) {
  const s = a.toLowerCase().split(/[\s\-_\/]+/);
  let i = null,
    l = 0;
  for (const [c, u] of eg) {
    let p = 0;
    for (const h of s) for (const m of c) (m.includes(h) || h.includes(m)) && (p += 1);
    p > l && ((l = p), (i = u));
  }
  return l > 0 ? i : null;
}
function Ft({ id: a, size: s = 20, className: i = '', fallback: l }) {
  let c = dp[a];
  if (!c && l) {
    const u = tg(l);
    u && (c = dp[u]);
  }
  return c
    ? n.jsx('svg', {
        width: s,
        height: s,
        viewBox: '0 0 24 24',
        className: i,
        'aria-hidden': 'true',
        children: c,
      })
    : n.jsx('span', {
        className: `font-bold leading-none ${i}`,
        style: { fontSize: s * 0.55 },
        children: (l == null ? void 0 : l.charAt(0).toUpperCase()) ?? '?',
      });
}
function rg({
  workflow: a,
  viewMode: s,
  selectedNodeId: i,
  onSelectNode: l,
  isGenerating: c,
  onWorkflowChange: u,
}) {
  return c && !a
    ? n.jsx(ug, {})
    : a
      ? n.jsxs('div', {
          className: 'h-full flex flex-col',
          children: [
            s === 'graph' &&
              n.jsx(og, { workflow: a, selectedNodeId: i, onSelectNode: l, onWorkflowChange: u }),
            s === 'list' && n.jsx(lg, { workflow: a, selectedNodeId: i, onSelectNode: l }),
            s === 'timeline' && n.jsx(cg, { workflow: a, selectedNodeId: i, onSelectNode: l }),
          ],
        })
      : n.jsx(pg, {});
}
const nn = 220,
  On = 280,
  tn = 72,
  rn = 88,
  ng = 80,
  sg = 24,
  up = 60,
  ig = 60;
function ag(a) {
  return N.useMemo(() => {
    const s = a.tasks;
    if (s.length === 0) return { positions: new Map(), columns: 0, maxRow: 0 };
    const i = new Map(),
      l = new Map(),
      c = new Map();
    for (const R of s) (i.set(R.id, 0), l.set(R.id, []), c.set(R.id, []));
    for (const R of s)
      for (const j of R.dependencies)
        l.has(j) && (l.get(j).push(R.id), c.get(R.id).push(j), i.set(R.id, (i.get(R.id) ?? 0) + 1));
    const u = new Map(),
      p = [];
    for (const R of s) (i.get(R.id) ?? 0) === 0 && (p.push(R.id), u.set(R.id, 0));
    let h = 0;
    for (; p.length > 0; ) {
      const R = p.shift(),
        j = u.get(R) ?? 0;
      for (const b of l.get(R) ?? []) {
        const T = Math.max(u.get(b) ?? 0, j + 1);
        (u.set(b, T), (h = Math.max(h, T)));
        const z = (i.get(b) ?? 1) - 1;
        (i.set(b, z), z <= 0 && p.push(b));
      }
    }
    for (const R of s) u.has(R.id) || u.set(R.id, 0);
    const m = new Map();
    for (const R of s) {
      const j = u.get(R.id) ?? 0;
      (m.has(j) || m.set(j, []), m.get(j).push(R));
    }
    const g = new Map();
    for (const [R, j] of m) {
      let b = nn;
      for (const T of j) T.discussion && (b = Math.max(b, On));
      g.set(R, b);
    }
    const v = new Map();
    let y = up;
    for (let R = 0; R <= h; R++) (v.set(R, y), (y += (g.get(R) ?? nn) + ng));
    const S = new Map();
    let C = 0;
    for (const [R, j] of m) {
      j.sort((T, z) => T.agentId.localeCompare(z.agentId));
      let b = ig;
      j.forEach((T, z) => {
        const W = T.discussion ? rn : tn;
        (S.set(T.id, { x: v.get(R) ?? up, y: b, col: R, row: z }),
          (b += W + sg),
          (C = Math.max(C, z)));
      });
    }
    return { positions: S, columns: h + 1, maxRow: C };
  }, [a.tasks]);
}
function pp(a, s, i, l) {
  const c = Math.abs(i - a),
    u = Math.max(c * 0.5, 50);
  return `M ${a} ${s} C ${a + u} ${s}, ${i - u} ${l}, ${i} ${l}`;
}
function og({ workflow: a, selectedNodeId: s, onSelectNode: i, onWorkflowChange: l }) {
  var et, ze, Ee, M;
  const { positions: c, columns: u, maxRow: p } = ag(a),
    h = N.useRef(null),
    [m, g] = N.useState(new Map()),
    [v, y] = N.useState(null),
    S = a.tasks.map((E) => E.id).join(','),
    C = N.useRef(S);
  N.useEffect(() => {
    C.current !== S && (g(new Map()), (C.current = S));
  }, [S]);
  const R = N.useCallback(
      (E) => {
        const L = c.get(E);
        if (!L) return null;
        const k = m.get(E);
        return {
          x: L.x + ((k == null ? void 0 : k.dx) ?? 0),
          y: L.y + ((k == null ? void 0 : k.dy) ?? 0),
        };
      },
      [c, m],
    ),
    j = N.useCallback(
      (E, L) => {
        var D, te;
        (E.stopPropagation(), E.preventDefault());
        const k = m.get(L);
        (y({
          taskId: L,
          startX: E.clientX,
          startY: E.clientY,
          origDx: (k == null ? void 0 : k.dx) ?? 0,
          origDy: (k == null ? void 0 : k.dy) ?? 0,
        }),
          (te = (D = E.target).setPointerCapture) == null || te.call(D, E.pointerId));
      },
      [m],
    ),
    b = N.useCallback(
      (E) => {
        if (!v) return;
        const L = v.origDx + (E.clientX - v.startX),
          k = v.origDy + (E.clientY - v.startY);
        g((D) => {
          const te = new Map(D);
          return (te.set(v.taskId, { dx: L, dy: k }), te);
        });
      },
      [v],
    ),
    T = N.useCallback(() => {
      y(null);
    }, []),
    [z, W] = N.useState(null),
    G = N.useCallback((E, L) => {
      (E.stopPropagation(), E.preventDefault());
      const k = h.current;
      if (!k) return;
      const D = k.getBoundingClientRect();
      W({
        fromTaskId: L,
        mouseX: E.clientX - D.left + k.scrollLeft,
        mouseY: E.clientY - D.top + k.scrollTop,
      });
    }, []),
    Q = N.useCallback(
      (E) => {
        if (!z) return;
        const L = h.current;
        if (!L) return;
        const k = L.getBoundingClientRect();
        W((D) =>
          D
            ? {
                ...D,
                mouseX: E.clientX - k.left + L.scrollLeft,
                mouseY: E.clientY - k.top + L.scrollTop,
              }
            : null,
        );
      },
      [z],
    ),
    pe = N.useCallback(
      (E) => {
        if (!z || !l) {
          W(null);
          return;
        }
        const L = h.current;
        if (!L) {
          W(null);
          return;
        }
        const k = L.getBoundingClientRect(),
          D = E.clientX - k.left + L.scrollLeft,
          te = E.clientY - k.top + L.scrollTop;
        for (const B of a.tasks) {
          if (B.id === z.fromTaskId) continue;
          const U = R(B.id);
          if (!U) continue;
          const $ = B.discussion ? On : nn,
            Y = B.discussion ? rn : tn;
          if (D >= U.x && D <= U.x + $ && te >= U.y && te <= U.y + Y) {
            (B.dependencies.includes(z.fromTaskId) ||
              l({
                ...a,
                tasks: a.tasks.map((q) =>
                  q.id === B.id ? { ...q, dependencies: [...q.dependencies, z.fromTaskId] } : q,
                ),
              }),
              W(null));
            return;
          }
        }
        W(null);
      },
      [z, a, l, R],
    ),
    [ge, Se] = N.useState(null);
  N.useEffect(() => {
    if (!ge) return;
    const E = () => Se(null);
    return (
      window.addEventListener('click', E),
      window.addEventListener('contextmenu', E),
      () => {
        (window.removeEventListener('click', E), window.removeEventListener('contextmenu', E));
      }
    );
  }, [ge]);
  const He = [
    '#6366f1',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#ef4444',
    '#6366f1',
    '#ec4899',
    '#14b8a6',
  ];
  N.useCallback(() => {
    if (!l) return;
    const E = `agent-${Date.now()}`,
      L = a.agents.length,
      k = He[L % He.length] ?? '#6366f1',
      D = {
        id: E,
        role: `Agent ${L + 1}`,
        goal: 'New agent',
        backstory: '',
        tools: [],
        status: 'idle',
        color: k,
        position: { x: 0, y: 0 },
      };
    (l({ ...a, agents: [...a.agents, D] }), i(E));
  }, [a, l, i, He]);
  const Ge = N.useCallback(
      (E) => {
        if (!l) return;
        const L = `task-${Date.now()}`,
          k = {
            id: L,
            description: 'New task',
            agentId: E,
            dependencies: [],
            expectedOutput: '',
            status: 'pending',
          };
        (l({ ...a, tasks: [...a.tasks, k] }), i(L));
      },
      [a, l, i],
    ),
    Je = N.useCallback(
      (E) => {
        l &&
          (l({
            ...a,
            tasks: a.tasks
              .filter((L) => L.id !== E)
              .map((L) => ({ ...L, dependencies: L.dependencies.filter((k) => k !== E) })),
          }),
          s === E && i(null));
      },
      [a, l, s, i],
    );
  N.useCallback(
    (E) => {
      l &&
        (l({
          ...a,
          agents: a.agents.filter((L) => L.id !== E),
          tasks: a.tasks.map((L) => (L.agentId === E ? { ...L, agentId: '' } : L)),
          discussionEdges: (a.discussionEdges ?? []).filter(
            (L) => L.fromAgentId !== E && L.toAgentId !== E,
          ),
        }),
        s === E && i(null));
    },
    [a, l, s, i],
  );
  const ke = N.useCallback(
      (E, L) => {
        l &&
          l({
            ...a,
            tasks: a.tasks.map((k) =>
              k.id === E ? { ...k, dependencies: k.dependencies.filter((D) => D !== L) } : k,
            ),
          });
      },
      [a, l],
    ),
    Ie = N.useMemo(() => {
      let E = 900,
        L = 600;
      for (const k of a.tasks) {
        const D = R(k.id),
          te = k.discussion ? On : nn,
          B = k.discussion ? rn : tn;
        D && ((E = Math.max(E, D.x + te + 100)), (L = Math.max(L, D.y + B + 100)));
      }
      return { width: E, height: L };
    }, [a.tasks, R]),
    Ye = N.useMemo(() => {
      const E = [];
      for (const L of a.tasks)
        for (const k of L.dependencies)
          a.tasks.some((D) => D.id === k) && E.push({ from: k, to: L.id });
      return E;
    }, [a.tasks]);
  return n.jsxs('div', {
    className: 'h-full relative overflow-auto bg-[var(--cs-surface-app)]',
    onClick: () => {
      (i(null), Se(null));
    },
    onPointerMove: (E) => {
      (b(E), Q(E));
    },
    onPointerUp: (E) => {
      (T(), pe(E));
    },
    onContextMenu: (E) => {
      (E.preventDefault(), Se({ x: E.clientX, y: E.clientY, type: 'canvas' }));
    },
    children: [
      n.jsx('div', {
        className: 'absolute inset-0 pointer-events-none',
        style: {
          backgroundImage: 'radial-gradient(circle, rgba(113,113,122,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        },
      }),
      n.jsxs('svg', {
        className: 'absolute inset-0 pointer-events-none',
        style: { minWidth: Ie.width, minHeight: Ie.height, overflow: 'visible' },
        children: [
          n.jsxs('defs', {
            children: [
              n.jsx('marker', {
                id: 'n8n-arrow',
                viewBox: '0 0 10 8',
                refX: '9',
                refY: '4',
                markerWidth: '8',
                markerHeight: '8',
                orient: 'auto',
                children: n.jsx('path', {
                  d: 'M 0 0 L 10 4 L 0 8 z',
                  fill: 'rgba(113,113,122,0.5)',
                }),
              }),
              n.jsx('marker', {
                id: 'n8n-arrow-hover',
                viewBox: '0 0 10 8',
                refX: '9',
                refY: '4',
                markerWidth: '8',
                markerHeight: '8',
                orient: 'auto',
                children: n.jsx('path', { d: 'M 0 0 L 10 4 L 0 8 z', fill: '#ef4444' }),
              }),
              n.jsx('marker', {
                id: 'n8n-arrow-draw',
                viewBox: '0 0 10 8',
                refX: '9',
                refY: '4',
                markerWidth: '8',
                markerHeight: '8',
                orient: 'auto',
                children: n.jsx('path', {
                  d: 'M 0 0 L 10 4 L 0 8 z',
                  fill: 'rgba(99,102,241,0.7)',
                }),
              }),
              n.jsx('marker', {
                id: 'n8n-arrow-active',
                viewBox: '0 0 10 8',
                refX: '9',
                refY: '4',
                markerWidth: '8',
                markerHeight: '8',
                orient: 'auto',
                children: n.jsx('path', { d: 'M 0 0 L 10 4 L 0 8 z', fill: '#22d3ee' }),
              }),
            ],
          }),
          Ye.map((E, L) => {
            const k = R(E.from),
              D = R(E.to);
            if (!k || !D) return null;
            const te = a.tasks.find((rt) => rt.id === E.from),
              B = a.tasks.find((rt) => rt.id === E.to),
              U = te != null && te.discussion ? On : nn,
              $ = te != null && te.discussion ? rn : tn,
              Y = B != null && B.discussion ? rn : tn,
              q = k.x + U,
              oe = k.y + $ / 2,
              fe = D.x,
              tt = D.y + Y / 2,
              ue = pp(q, oe, fe, tt);
            return n.jsxs(
              'g',
              {
                className: 'pointer-events-auto group/edge cursor-pointer',
                onClick: (rt) => {
                  (rt.stopPropagation(), ke(E.to, E.from));
                },
                onContextMenu: (rt) => {
                  (rt.preventDefault(),
                    rt.stopPropagation(),
                    Se({
                      x: rt.clientX,
                      y: rt.clientY,
                      type: 'edge',
                      edgeKey: `${E.from}:${E.to}`,
                    }));
                },
                children: [
                  n.jsx('path', { d: ue, fill: 'none', stroke: 'transparent', strokeWidth: '14' }),
                  n.jsx('path', {
                    d: ue,
                    fill: 'none',
                    stroke: 'rgba(113,113,122,0.25)',
                    strokeWidth: '2',
                    markerEnd: 'url(#n8n-arrow)',
                    className: 'group-hover/edge:stroke-rose-400/60 transition-colors',
                  }),
                  n.jsxs('g', {
                    className: 'opacity-0 group-hover/edge:opacity-100 transition-opacity',
                    transform: `translate(${(q + fe) / 2}, ${(oe + tt) / 2})`,
                    children: [
                      n.jsx('circle', { r: '10', fill: 'rgba(244,63,94,0.9)' }),
                      n.jsx('text', {
                        textAnchor: 'middle',
                        dy: '4',
                        fontSize: '12',
                        fill: 'white',
                        fontWeight: '700',
                        children: '×',
                      }),
                    ],
                  }),
                ],
              },
              `dep-${L}`,
            );
          }),
          z &&
            (() => {
              const E = R(z.fromTaskId);
              if (!E) return null;
              const L = a.tasks.find(($) => $.id === z.fromTaskId),
                k = L != null && L.discussion ? On : nn,
                D = L != null && L.discussion ? rn : tn,
                te = E.x + k,
                B = E.y + D / 2,
                U = pp(te, B, z.mouseX, z.mouseY);
              return n.jsx('path', {
                d: U,
                fill: 'none',
                stroke: 'rgba(99,102,241,0.6)',
                strokeWidth: '2',
                strokeDasharray: '8 4',
                markerEnd: 'url(#n8n-arrow-draw)',
                className: 'pointer-events-none',
              });
            })(),
        ],
      }),
      z &&
        n.jsx('div', {
          className:
            'fixed z-50 px-2 py-1 rounded-md bg-indigo-600/90 text-[10px] text-white font-medium pointer-events-none whitespace-nowrap shadow-lg',
          style: {
            left:
              z.mouseX +
              (((et = h.current) == null ? void 0 : et.getBoundingClientRect().left) ?? 0) -
              (((ze = h.current) == null ? void 0 : ze.scrollLeft) ?? 0) +
              14,
            top:
              z.mouseY +
              (((Ee = h.current) == null ? void 0 : Ee.getBoundingClientRect().top) ?? 0) -
              (((M = h.current) == null ? void 0 : M.scrollTop) ?? 0) -
              10,
          },
          children: 'Drop on a task to connect',
        }),
      n.jsx('div', {
        ref: h,
        className: 'relative',
        style: { minWidth: Ie.width, minHeight: Ie.height },
        children: a.tasks.map((E) => {
          const L = R(E.id);
          if (!L) return null;
          const k = a.agents.find((ue) => ue.id === E.agentId),
            D = (k == null ? void 0 : k.color) ?? '#52525b',
            te = s === E.id,
            B = (v == null ? void 0 : v.taskId) === E.id,
            U = !!E.discussion,
            $ = U ? (a.discussionEdges ?? []).filter((ue) => ue.taskId === E.id) : [],
            Y = $.length > 0 ? $[0].status : 'idle',
            q =
              $.length > 0
                ? Math.max(
                    ...$.map((ue) =>
                      ue.messages.length > 0 ? ue.messages[ue.messages.length - 1].round : 0,
                    ),
                  )
                : 0,
            oe = U
              ? E.discussion.participantIds
                  .map((ue) => a.agents.find((rt) => rt.id === ue))
                  .filter(Boolean)
              : [],
            fe = U ? On : nn,
            tt = U ? rn : tn;
          return n.jsxs(
            'div',
            {
              className: 'absolute group/card',
              style: { left: L.x, top: L.y, width: fe, height: tt, zIndex: B ? 50 : te ? 40 : 10 },
              children: [
                n.jsx('div', {
                  className:
                    'absolute -left-[5px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border-2 border-[rgba(113,113,122,0.3)] bg-[var(--cs-surface-app)] z-20 opacity-0 group-hover/card:opacity-100 transition-opacity hover:!border-indigo-400 hover:!bg-indigo-400/20 hover:!scale-150 cursor-pointer',
                  title: 'Input',
                }),
                n.jsx('div', {
                  className:
                    'absolute -right-[5px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border-2 border-[rgba(113,113,122,0.3)] bg-[var(--cs-surface-app)] z-20 opacity-0 group-hover/card:opacity-100 transition-opacity hover:!border-indigo-400 hover:!bg-indigo-500 hover:!scale-150 cursor-crosshair',
                  onPointerDown: (ue) => G(ue, E.id),
                  title: 'Drag to connect',
                }),
                z &&
                  z.fromTaskId !== E.id &&
                  n.jsx('div', {
                    className:
                      'absolute -inset-1 rounded-xl border-2 border-dashed border-indigo-400/50 bg-indigo-500/5 z-5 pointer-events-none animate-pulse',
                  }),
                U
                  ? n.jsxs('div', {
                      className: `w-full h-full rounded-xl border-2 transition-all duration-150 flex flex-col select-none ${te ? 'border-cyan-400 bg-[var(--cs-surface-card)] shadow-lg shadow-cyan-400/20 ring-1 ring-cyan-400/30' : Y === 'active' ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/[0.06] to-indigo-500/[0.04] hover:border-cyan-400/60 hover:shadow-md hover:shadow-cyan-500/10' : Y === 'converged' ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.05] to-cyan-500/[0.03] hover:border-emerald-400/50 hover:shadow-md' : 'border-[var(--cs-border-subtle)] bg-gradient-to-br from-cyan-500/[0.03] to-[var(--cs-surface-card)]/80 hover:border-[var(--cs-border-default)] hover:shadow-md hover:shadow-black/10'} ${B ? 'shadow-xl scale-[1.02] ring-2 ring-cyan-400/20' : ''}`,
                      style: { cursor: B ? 'grabbing' : 'grab' },
                      onPointerDown: (ue) => j(ue, E.id),
                      onClick: (ue) => {
                        (ue.stopPropagation(), v || i(E.id));
                      },
                      onContextMenu: (ue) => {
                        (ue.preventDefault(),
                          ue.stopPropagation(),
                          Se({ x: ue.clientX, y: ue.clientY, type: 'task', taskId: E.id }));
                      },
                      children: [
                        n.jsxs('div', {
                          className: 'flex items-center gap-2.5 px-3 pt-2.5 pb-1',
                          children: [
                            n.jsx('div', {
                              className: `w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${Y === 'active' ? 'bg-cyan-500/15 border border-cyan-400/30' : Y === 'converged' ? 'bg-emerald-500/15 border border-emerald-400/30' : 'bg-cyan-500/10 border border-cyan-500/20'}`,
                              children:
                                Y === 'converged'
                                  ? n.jsx('svg', {
                                      width: '14',
                                      height: '14',
                                      viewBox: '0 0 24 24',
                                      fill: 'none',
                                      stroke: '#10b981',
                                      strokeWidth: '2.5',
                                      strokeLinecap: 'round',
                                      children: n.jsx('polyline', { points: '20 6 9 17 4 12' }),
                                    })
                                  : n.jsx('svg', {
                                      width: '14',
                                      height: '14',
                                      viewBox: '0 0 24 24',
                                      fill: 'none',
                                      stroke: Y === 'active' ? '#22d3ee' : '#a1a1aa',
                                      strokeWidth: '1.5',
                                      strokeLinecap: 'round',
                                      strokeLinejoin: 'round',
                                      children: n.jsx('path', {
                                        d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
                                      }),
                                    }),
                            }),
                            n.jsx('div', {
                              className: 'flex-1 min-w-0',
                              children: n.jsx('p', {
                                className:
                                  'text-[11px] font-semibold text-[var(--cs-text-primary)] leading-tight line-clamp-1',
                                children:
                                  E.discussion.topic ??
                                  E.description.slice(0, 45) +
                                    (E.description.length > 45 ? '…' : ''),
                              }),
                            }),
                            n.jsx('div', {
                              className: `flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${Y === 'converged' ? 'bg-emerald-500/20 text-emerald-400' : Y === 'active' ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' : Y === 'max-rounds' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`,
                              children:
                                Y === 'converged'
                                  ? '✓'
                                  : Y === 'active'
                                    ? `⟳ ${q}`
                                    : q > 0
                                      ? `${q}r`
                                      : '—',
                            }),
                          ],
                        }),
                        n.jsxs('div', {
                          className: 'flex items-center gap-1.5 px-3 pb-2',
                          children: [
                            n.jsx('div', {
                              className: 'flex -space-x-1.5',
                              children: oe
                                .slice(0, 4)
                                .map((ue) =>
                                  n.jsx(
                                    'div',
                                    {
                                      className:
                                        'w-5 h-5 rounded-full flex items-center justify-center text-white border border-[var(--cs-surface-card)]',
                                      style: { backgroundColor: ue.color },
                                      title: ue.role,
                                      children: n.jsx(Ft, {
                                        id: ue.id,
                                        size: 12,
                                        fallback: ue.role,
                                      }),
                                    },
                                    ue.id,
                                  ),
                                ),
                            }),
                            n.jsx('span', {
                              className: 'text-[9px] text-[var(--cs-text-tertiary)] truncate',
                              children: oe.map((ue) => ue.role).join(' + '),
                            }),
                            n.jsx('span', {
                              className:
                                'ml-auto text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400/80 font-medium flex-shrink-0',
                              children: E.discussion.convergenceStrategy,
                            }),
                          ],
                        }),
                        Y === 'active' &&
                          n.jsx('div', {
                            className:
                              'h-[2px] w-full bg-gradient-to-r from-cyan-500/0 via-cyan-400/60 to-cyan-500/0 animate-pulse',
                          }),
                      ],
                    })
                  : n.jsxs('div', {
                      className: `relative w-full h-full rounded-xl border transition-all duration-150 flex items-center gap-3 px-3 select-none ${te ? 'border-indigo-500 bg-[var(--cs-surface-card)] shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/30' : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-card)]/80 hover:border-[var(--cs-border-default)] hover:shadow-md hover:shadow-black/10'} ${B ? 'shadow-xl scale-[1.02] ring-2 ring-indigo-500/20' : ''}`,
                      style: {
                        borderLeftWidth: 3,
                        borderLeftColor: D,
                        cursor: B ? 'grabbing' : 'grab',
                      },
                      onPointerDown: (ue) => j(ue, E.id),
                      onClick: (ue) => {
                        (ue.stopPropagation(), v || i(E.id));
                      },
                      onContextMenu: (ue) => {
                        (ue.preventDefault(),
                          ue.stopPropagation(),
                          Se({ x: ue.clientX, y: ue.clientY, type: 'task', taskId: E.id }));
                      },
                      children: [
                        E.status === 'running' &&
                          n.jsxs(n.Fragment, {
                            children: [
                              n.jsx('span', { className: 'pulse-wave-ring' }),
                              n.jsx('span', { className: 'pulse-wave-ring' }),
                              n.jsx('span', { className: 'pulse-wave-ring' }),
                            ],
                          }),
                        n.jsx('div', {
                          className: 'relative w-9 h-9 flex-shrink-0',
                          children: k
                            ? n.jsxs(n.Fragment, {
                                children: [
                                  n.jsx('div', {
                                    className:
                                      'w-9 h-9 rounded-lg flex items-center justify-center text-white',
                                    style: { backgroundColor: k.color },
                                    children: n.jsx(Ft, { id: k.id, size: 18, fallback: k.role }),
                                  }),
                                  E.status !== 'pending' &&
                                    n.jsx('div', {
                                      className:
                                        'absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] flex items-center justify-center',
                                      children:
                                        E.status === 'completed'
                                          ? n.jsx('svg', {
                                              width: '10',
                                              height: '10',
                                              viewBox: '0 0 24 24',
                                              fill: 'none',
                                              stroke: '#10b981',
                                              strokeWidth: '3',
                                              strokeLinecap: 'round',
                                              children: n.jsx('polyline', {
                                                points: '20 6 9 17 4 12',
                                              }),
                                            })
                                          : E.status === 'running'
                                            ? n.jsxs('svg', {
                                                className: 'animate-spin',
                                                width: '10',
                                                height: '10',
                                                viewBox: '0 0 24 24',
                                                fill: 'none',
                                                children: [
                                                  n.jsx('circle', {
                                                    className: 'opacity-25',
                                                    cx: '12',
                                                    cy: '12',
                                                    r: '10',
                                                    stroke: '#f59e0b',
                                                    strokeWidth: '4',
                                                  }),
                                                  n.jsx('path', {
                                                    className: 'opacity-75',
                                                    fill: '#f59e0b',
                                                    d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
                                                  }),
                                                ],
                                              })
                                            : n.jsxs('svg', {
                                                width: '10',
                                                height: '10',
                                                viewBox: '0 0 24 24',
                                                fill: 'none',
                                                stroke: '#ef4444',
                                                strokeWidth: '3',
                                                strokeLinecap: 'round',
                                                children: [
                                                  n.jsx('line', {
                                                    x1: '18',
                                                    y1: '6',
                                                    x2: '6',
                                                    y2: '18',
                                                  }),
                                                  n.jsx('line', {
                                                    x1: '6',
                                                    y1: '6',
                                                    x2: '18',
                                                    y2: '18',
                                                  }),
                                                ],
                                              }),
                                    }),
                                ],
                              })
                            : n.jsx('div', {
                                className: 'w-9 h-9 rounded-lg flex items-center justify-center',
                                style: { backgroundColor: `${D}15`, border: `1.5px solid ${D}30` },
                                children:
                                  E.status === 'completed'
                                    ? n.jsx('svg', {
                                        width: '16',
                                        height: '16',
                                        viewBox: '0 0 24 24',
                                        fill: 'none',
                                        stroke: '#10b981',
                                        strokeWidth: '2.5',
                                        strokeLinecap: 'round',
                                        children: n.jsx('polyline', { points: '20 6 9 17 4 12' }),
                                      })
                                    : E.status === 'running'
                                      ? n.jsxs('svg', {
                                          className: 'animate-spin',
                                          width: '16',
                                          height: '16',
                                          viewBox: '0 0 24 24',
                                          fill: 'none',
                                          children: [
                                            n.jsx('circle', {
                                              className: 'opacity-25',
                                              cx: '12',
                                              cy: '12',
                                              r: '10',
                                              stroke: D,
                                              strokeWidth: '4',
                                            }),
                                            n.jsx('path', {
                                              className: 'opacity-75',
                                              fill: D,
                                              d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
                                            }),
                                          ],
                                        })
                                      : n.jsxs('svg', {
                                          width: '16',
                                          height: '16',
                                          viewBox: '0 0 24 24',
                                          fill: 'none',
                                          stroke: D,
                                          strokeWidth: '1.5',
                                          strokeLinecap: 'round',
                                          strokeLinejoin: 'round',
                                          children: [
                                            n.jsx('rect', {
                                              x: '3',
                                              y: '3',
                                              width: '18',
                                              height: '18',
                                              rx: '2',
                                              ry: '2',
                                            }),
                                            n.jsx('line', { x1: '9', y1: '9', x2: '15', y2: '15' }),
                                            n.jsx('line', { x1: '15', y1: '9', x2: '9', y2: '15' }),
                                          ],
                                        }),
                              }),
                        }),
                        n.jsxs('div', {
                          className: 'flex-1 min-w-0 py-1',
                          children: [
                            n.jsx('p', {
                              className:
                                'text-[11px] font-semibold text-[var(--cs-text-primary)] leading-tight line-clamp-2',
                              children:
                                E.description.length > 50
                                  ? E.description.slice(0, 50) + '…'
                                  : E.description,
                            }),
                            k &&
                              n.jsx('p', {
                                className: 'text-[10px] mt-0.5 font-medium truncate',
                                style: { color: D },
                                children: k.role,
                              }),
                          ],
                        }),
                        n.jsx('div', {
                          className: `relative w-2 h-2 rounded-full flex-shrink-0 ${E.status === 'completed' ? 'bg-emerald-400' : E.status === 'running' ? 'bg-amber-400' : E.status === 'failed' ? 'bg-rose-400' : 'bg-slate-500/40'}`,
                          children:
                            E.status === 'running' &&
                            n.jsx('span', { className: 'pulse-wave-dot' }),
                        }),
                      ],
                    }),
              ],
            },
            E.id,
          );
        }),
      }),
      n.jsxs('div', {
        className:
          'absolute bottom-4 left-4 flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--cs-surface-panel)]/80 backdrop-blur-sm border border-[var(--cs-border-subtle)]',
        children: [
          n.jsxs('span', {
            className: 'text-[10px] text-[var(--cs-text-tertiary)]',
            children: [a.agents.length, ' agents'],
          }),
          n.jsx('span', { className: 'text-[8px] text-[var(--cs-border-default)]', children: '/' }),
          n.jsxs('span', {
            className: 'text-[10px] text-[var(--cs-text-tertiary)]',
            children: [a.tasks.length, ' tasks'],
          }),
          n.jsx('span', { className: 'text-[8px] text-[var(--cs-border-default)]', children: '/' }),
          n.jsxs('span', {
            className: 'text-[10px] text-[var(--cs-text-tertiary)]',
            children: [Ye.length, ' connections'],
          }),
        ],
      }),
      n.jsxs('div', {
        className:
          'absolute bottom-4 right-4 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[var(--cs-surface-panel)]/60 backdrop-blur-sm border border-[var(--cs-border-subtle)]',
        children: [
          n.jsxs('span', {
            className: 'text-[9px] text-[var(--cs-text-tertiary)]',
            children: [
              n.jsx('span', { className: 'text-indigo-400', children: 'Drag' }),
              ' cards to move',
            ],
          }),
          n.jsx('span', { className: 'text-[8px] text-[var(--cs-border-default)]', children: '|' }),
          n.jsxs('span', {
            className: 'text-[9px] text-[var(--cs-text-tertiary)]',
            children: [
              n.jsx('span', { className: 'text-indigo-400', children: 'Drag port' }),
              ' to connect',
            ],
          }),
          n.jsx('span', { className: 'text-[8px] text-[var(--cs-border-default)]', children: '|' }),
          n.jsxs('span', {
            className: 'text-[9px] text-[var(--cs-text-tertiary)]',
            children: [
              n.jsx('span', { className: 'text-rose-400', children: 'Click edge' }),
              ' to remove',
            ],
          }),
          n.jsx('span', { className: 'text-[8px] text-[var(--cs-border-default)]', children: '|' }),
          n.jsxs('span', {
            className: 'text-[9px] text-[var(--cs-text-tertiary)]',
            children: [
              n.jsx('span', { className: 'text-indigo-400', children: 'Right-click' }),
              ' for menu',
            ],
          }),
        ],
      }),
      ge &&
        n.jsxs('div', {
          className:
            'fixed z-50 min-w-[180px] rounded-xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-panel)] shadow-2xl overflow-hidden animate-fadeIn',
          style: { left: ge.x, top: ge.y },
          onClick: (E) => E.stopPropagation(),
          children: [
            ge.type === 'canvas' &&
              n.jsx(n.Fragment, {
                children:
                  a.agents.length > 0 &&
                  a.agents.map((E) =>
                    n.jsx(
                      Zi,
                      {
                        label: `Add task to ${E.role}`,
                        icon: n.jsxs('svg', {
                          width: '12',
                          height: '12',
                          viewBox: '0 0 24 24',
                          fill: 'none',
                          stroke: 'currentColor',
                          strokeWidth: '2',
                          children: [
                            n.jsx('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
                            n.jsx('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
                          ],
                        }),
                        onClick: () => {
                          (Ge(E.id), Se(null));
                        },
                      },
                      E.id,
                    ),
                  ),
              }),
            ge.type === 'task' &&
              ge.taskId &&
              (() => {
                const E = a.tasks.find((L) => L.id === ge.taskId);
                return (
                  E && a.agents.find((L) => L.id === E.agentId),
                  n.jsxs(n.Fragment, {
                    children: [
                      n.jsx('div', {
                        className:
                          'px-3 py-1.5 text-[10px] text-[var(--cs-text-tertiary)] uppercase tracking-wider font-medium border-b border-[var(--cs-border-subtle)]',
                        children: (E == null ? void 0 : E.description.slice(0, 30)) ?? 'Task',
                      }),
                      a.agents
                        .filter((L) => L.id !== (E == null ? void 0 : E.agentId))
                        .map((L) =>
                          n.jsx(
                            Zi,
                            {
                              label: `Move to ${L.role}`,
                              icon: n.jsxs('svg', {
                                width: '12',
                                height: '12',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: 'currentColor',
                                strokeWidth: '2',
                                children: [
                                  n.jsx('polyline', { points: '15 10 20 15 15 20' }),
                                  n.jsx('path', { d: 'M4 4v7a4 4 0 004 4h12' }),
                                ],
                              }),
                              onClick: () => {
                                (l &&
                                  E &&
                                  l({
                                    ...a,
                                    tasks: a.tasks.map((k) =>
                                      k.id === E.id ? { ...k, agentId: L.id } : k,
                                    ),
                                  }),
                                  Se(null));
                              },
                            },
                            L.id,
                          ),
                        ),
                      n.jsx('div', { className: 'border-t border-[var(--cs-border-subtle)]' }),
                      n.jsx(Zi, {
                        label: 'Delete task',
                        icon: n.jsxs('svg', {
                          width: '12',
                          height: '12',
                          viewBox: '0 0 24 24',
                          fill: 'none',
                          stroke: 'currentColor',
                          strokeWidth: '2',
                          children: [
                            n.jsx('polyline', { points: '3 6 5 6 21 6' }),
                            n.jsx('path', {
                              d: 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
                            }),
                          ],
                        }),
                        danger: !0,
                        onClick: () => {
                          (Je(ge.taskId), Se(null));
                        },
                      }),
                    ],
                  })
                );
              })(),
            ge.type === 'edge' &&
              ge.edgeKey &&
              (() => {
                const [E, L] = ge.edgeKey.split(':');
                return n.jsx(Zi, {
                  label: 'Remove connection',
                  icon: n.jsxs('svg', {
                    width: '12',
                    height: '12',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    children: [
                      n.jsx('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
                      n.jsx('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
                    ],
                  }),
                  danger: !0,
                  onClick: () => {
                    (E && L && ke(L, E), Se(null));
                  },
                });
              })(),
          ],
        }),
      s &&
        !ge &&
        n.jsx(dg, { workflow: a, nodeId: s, onClose: () => i(null), onWorkflowChange: l }),
    ],
  });
}
function Zi({ label: a, icon: s, onClick: i, danger: l }) {
  return n.jsxs('button', {
    onClick: i,
    className: `w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${l ? 'text-rose-400 hover:bg-rose-500/10' : 'text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-card)]/30 hover:text-[var(--cs-text-primary)]'}`,
    children: [s, n.jsx('span', { className: 'truncate', children: a })],
  });
}
function lg({ workflow: a, selectedNodeId: s, onSelectNode: i }) {
  const l = a.tasks.filter((p) => p.status === 'completed').length,
    c = a.tasks.length,
    u = a.tasks.some((p) => p.output);
  return n.jsx('div', {
    className: 'h-full overflow-auto bg-[var(--cs-surface-app)] p-6 scrollbar-thin',
    children: n.jsxs('div', {
      className: 'max-w-3xl mx-auto',
      children: [
        n.jsxs('div', {
          className: 'flex items-center justify-between mb-6',
          children: [
            n.jsxs('div', {
              children: [
                n.jsx('h2', {
                  className: 'text-lg font-semibold text-[var(--cs-text-primary)]',
                  children: 'Results',
                }),
                n.jsxs('p', {
                  className: 'text-xs text-[var(--cs-text-tertiary)] mt-0.5',
                  children: [l, ' of ', c, ' tasks completed'],
                }),
              ],
            }),
            n.jsxs('div', {
              className: 'flex items-center gap-3',
              children: [
                n.jsx('div', {
                  className: 'w-32 h-1.5 rounded-full bg-[var(--cs-surface-card)] overflow-hidden',
                  children: n.jsx('div', {
                    className: 'h-full rounded-full bg-emerald-500 transition-all duration-500',
                    style: { width: `${c > 0 ? (l / c) * 100 : 0}%` },
                  }),
                }),
                n.jsxs('span', {
                  className: 'text-xs text-[var(--cs-text-tertiary)] tabular-nums',
                  children: [c > 0 ? Math.round((l / c) * 100) : 0, '%'],
                }),
              ],
            }),
          ],
        }),
        !u && a.status !== 'running'
          ? n.jsxs('div', {
              className: 'text-center py-16',
              children: [
                n.jsx('div', {
                  className:
                    'w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--cs-surface-card)]/20 border border-[var(--cs-border-default)] flex items-center justify-center',
                  children: n.jsxs('svg', {
                    width: '20',
                    height: '20',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '1.5',
                    className: 'text-[var(--cs-text-tertiary)]',
                    children: [
                      n.jsx('path', {
                        d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
                      }),
                      n.jsx('polyline', { points: '14 2 14 8 20 8' }),
                    ],
                  }),
                }),
                n.jsx('p', {
                  className: 'text-sm text-[var(--cs-text-secondary)]',
                  children: 'No results yet',
                }),
                n.jsx('p', {
                  className: 'text-xs text-[var(--cs-text-tertiary)] mt-1',
                  children: 'Run the workflow to see task outputs here',
                }),
              ],
            })
          : n.jsx('div', {
              className: 'space-y-3 stagger-children',
              children: a.tasks.map((p, h) => {
                const m = a.agents.find((g) => g.id === p.agentId);
                return n.jsxs(
                  'div',
                  {
                    className: `rounded-xl border transition-all ${p.status === 'completed' ? 'border-emerald-500/15 bg-emerald-500/[0.02]' : p.status === 'running' ? 'border-amber-500/20 bg-amber-500/[0.02]' : p.status === 'failed' ? 'border-rose-500/15 bg-rose-500/[0.02]' : 'border-[var(--cs-border-subtle)] bg-white/[0.01]'}`,
                    children: [
                      n.jsxs('div', {
                        className: 'flex items-start gap-3 px-4 py-3',
                        children: [
                          n.jsx('span', {
                            className: `w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5 ${p.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : p.status === 'running' ? 'bg-amber-500/15 text-amber-400' : 'bg-[var(--cs-surface-card)]/20 text-[var(--cs-text-tertiary)]'}`,
                            children:
                              p.status === 'completed'
                                ? n.jsx('svg', {
                                    width: '12',
                                    height: '12',
                                    viewBox: '0 0 24 24',
                                    fill: 'none',
                                    stroke: 'currentColor',
                                    strokeWidth: '2.5',
                                    children: n.jsx('polyline', { points: '20 6 9 17 4 12' }),
                                  })
                                : p.status === 'running'
                                  ? n.jsxs('svg', {
                                      className: 'animate-spin h-3 w-3',
                                      viewBox: '0 0 24 24',
                                      fill: 'none',
                                      children: [
                                        n.jsx('circle', {
                                          className: 'opacity-25',
                                          cx: '12',
                                          cy: '12',
                                          r: '10',
                                          stroke: 'currentColor',
                                          strokeWidth: '4',
                                        }),
                                        n.jsx('path', {
                                          className: 'opacity-75',
                                          fill: 'currentColor',
                                          d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
                                        }),
                                      ],
                                    })
                                  : h + 1,
                          }),
                          n.jsxs('div', {
                            className: 'flex-1 min-w-0',
                            children: [
                              n.jsx('p', {
                                className: 'text-sm text-[var(--cs-text-primary)] leading-relaxed',
                                children: p.description,
                              }),
                              n.jsxs('div', {
                                className: 'flex items-center gap-2 mt-1.5',
                                children: [
                                  m &&
                                    n.jsx('span', {
                                      className:
                                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                                      style: { backgroundColor: `${m.color}20`, color: m.color },
                                      children: m.role,
                                    }),
                                  n.jsx(of, { status: p.status }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      p.output &&
                        n.jsx('div', {
                          className: 'px-4 pb-3 pt-0',
                          children: n.jsx('div', {
                            className:
                              'rounded-lg bg-[var(--cs-surface-card)]/30 border border-[var(--cs-border-subtle)] p-3',
                            children: n.jsx('p', {
                              className:
                                'text-xs text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap',
                              children: p.output,
                            }),
                          }),
                        }),
                      p.status === 'running' &&
                        !p.output &&
                        n.jsx('div', {
                          className: 'px-4 pb-3 pt-0',
                          children: n.jsx('div', {
                            className: 'rounded-lg bg-amber-500/5 border border-amber-500/10 p-3',
                            children: n.jsxs('p', {
                              className: 'text-xs text-amber-400/80 animate-pulse',
                              children: [
                                (m == null ? void 0 : m.role) ?? 'Agent',
                                ' is working on this task…',
                              ],
                            }),
                          }),
                        }),
                    ],
                  },
                  p.id,
                );
              }),
            }),
      ],
    }),
  });
}
function cg({ workflow: a, selectedNodeId: s, onSelectNode: i }) {
  return n.jsx('div', {
    className: 'h-full overflow-auto bg-[var(--cs-surface-app)] p-6',
    children: n.jsx('div', {
      className: 'max-w-4xl mx-auto',
      children: n.jsx('div', {
        className: 'space-y-1',
        children: a.agents.map((l) => {
          const c = a.tasks.filter((u) => u.agentId === l.id);
          return n.jsxs(
            'div',
            {
              className: 'flex items-stretch gap-3 min-h-[60px]',
              children: [
                n.jsx('div', {
                  className:
                    'w-40 flex-shrink-0 flex items-center px-3 py-2 rounded-l-lg border-r-2',
                  style: { borderColor: l.color },
                  children: n.jsxs('div', {
                    className: 'min-w-0',
                    children: [
                      n.jsx('p', {
                        className: 'text-xs font-semibold text-[var(--cs-text-primary)] truncate',
                        children: l.role,
                      }),
                      n.jsxs('p', {
                        className: 'text-[10px] text-[var(--cs-text-tertiary)]',
                        children: [c.length, ' tasks'],
                      }),
                    ],
                  }),
                }),
                n.jsxs('div', {
                  className: 'flex-1 flex items-center gap-2 py-1.5 overflow-x-auto',
                  children: [
                    c.map((u) =>
                      n.jsx(
                        'button',
                        {
                          onClick: () => i(u.id),
                          className: `flex-shrink-0 px-3 py-2 rounded-lg border text-xs transition-all ${s === u.id ? 'border-indigo-500/40 bg-indigo-500/10 text-white' : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-card)]/20 text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-card)]/30 hover:text-[var(--cs-text-primary)]'}`,
                          style: {
                            minWidth: '120px',
                            borderLeftWidth: '3px',
                            borderLeftColor:
                              u.status === 'completed'
                                ? '#10b981'
                                : u.status === 'running'
                                  ? '#f59e0b'
                                  : l.color,
                          },
                          children: n.jsx('p', {
                            className: 'truncate max-w-[200px]',
                            children: u.description,
                          }),
                        },
                        u.id,
                      ),
                    ),
                    c.length === 0 &&
                      n.jsx('span', {
                        className: 'text-xs text-[var(--cs-text-tertiary)] italic',
                        children: 'No tasks assigned',
                      }),
                  ],
                }),
              ],
            },
            l.id,
          );
        }),
      }),
    }),
  });
}
function dg({ workflow: a, nodeId: s, onClose: i, onWorkflowChange: l }) {
  const c = a.agents.find((y) => y.id === s),
    u = a.tasks.find((y) => y.id === s),
    p = !!l,
    h = N.useCallback(
      (y) => {
        !l || !c || l({ ...a, agents: a.agents.map((S) => (S.id === c.id ? { ...S, ...y } : S)) });
      },
      [l, a, c],
    ),
    m = N.useCallback(
      (y) => {
        var C;
        if (!l || !u) return;
        const S = a.tasks.map((R) => (R.id === u.id ? { ...R, ...y } : R));
        if ((C = y.discussion) != null && C.participantIds) {
          const R = y.discussion.participantIds,
            j = (a.discussionEdges ?? []).filter((T) => T.taskId !== u.id),
            b = [];
          for (let T = 0; T < R.length; T++)
            for (let z = T + 1; z < R.length; z++)
              b.push({
                id: `edge-${u.id}-${R[T]}-${R[z]}`,
                fromAgentId: R[T],
                toAgentId: R[z],
                taskId: u.id,
                status: 'idle',
                messages: [],
              });
          l({ ...a, tasks: S, discussionEdges: [...j, ...b] });
        } else l({ ...a, tasks: S });
      },
      [l, a, u],
    ),
    g =
      'w-full bg-[var(--cs-surface-card)]/20 border border-[var(--cs-border-subtle)] rounded-lg px-2.5 py-1.5 text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors',
    v = g + ' resize-none';
  return n.jsxs('div', {
    className:
      'fixed right-0 top-[49px] bottom-0 w-80 bg-[var(--cs-surface-panel)] border-l border-[var(--cs-border-subtle)] shadow-2xl z-20 overflow-y-auto animate-slideInRight scrollbar-thin',
    onClick: (y) => y.stopPropagation(),
    onPointerDown: (y) => y.stopPropagation(),
    children: [
      n.jsxs('div', {
        className:
          'flex items-center justify-between px-4 py-3 border-b border-[var(--cs-border-subtle)]',
        children: [
          n.jsx('h3', {
            className: 'text-sm font-semibold text-[var(--cs-text-primary)]',
            children: c ? 'Edit Agent' : u ? 'Edit Task' : 'Details',
          }),
          n.jsx('button', {
            onClick: i,
            className:
              'p-1 rounded-lg hover:bg-[var(--cs-surface-card)]/20 text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors',
            children: n.jsxs('svg', {
              width: '16',
              height: '16',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              children: [
                n.jsx('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
                n.jsx('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
              ],
            }),
          }),
        ],
      }),
      n.jsxs('div', {
        className: 'p-4 space-y-4',
        children: [
          c &&
            n.jsxs(n.Fragment, {
              children: [
                n.jsxs('div', {
                  children: [
                    n.jsx('label', {
                      className:
                        'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                      children: 'Role',
                    }),
                    p
                      ? n.jsx('input', {
                          className: g + ' mt-1',
                          value: c.role,
                          onChange: (y) => h({ role: y.target.value }),
                          placeholder: 'e.g. Research Analyst',
                        })
                      : n.jsx('p', {
                          className: 'text-sm text-[var(--cs-text-primary)] mt-1',
                          children: c.role,
                        }),
                  ],
                }),
                n.jsxs('div', {
                  children: [
                    n.jsx('label', {
                      className:
                        'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                      children: 'Goal',
                    }),
                    p
                      ? n.jsx('textarea', {
                          className: v + ' mt-1',
                          rows: 2,
                          value: c.goal,
                          onChange: (y) => h({ goal: y.target.value }),
                          placeholder: 'What should this agent accomplish?',
                        })
                      : n.jsx('p', {
                          className: 'text-sm text-[var(--cs-text-secondary)] mt-1',
                          children: c.goal,
                        }),
                  ],
                }),
                n.jsxs('div', {
                  children: [
                    n.jsx('label', {
                      className:
                        'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                      children: 'Backstory',
                    }),
                    p
                      ? n.jsx('textarea', {
                          className: v + ' mt-1 text-xs',
                          rows: 3,
                          value: c.backstory,
                          onChange: (y) => h({ backstory: y.target.value }),
                          placeholder: "Describe this agent's expertise and background...",
                        })
                      : n.jsx('p', {
                          className: 'text-xs text-[var(--cs-text-secondary)] mt-1 leading-relaxed',
                          children: c.backstory,
                        }),
                  ],
                }),
                n.jsxs('div', {
                  children: [
                    n.jsx('label', {
                      className:
                        'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                      children: 'Tools',
                    }),
                    p
                      ? n.jsx('input', {
                          className: g + ' mt-1 text-xs',
                          value: c.tools.join(', '),
                          onChange: (y) =>
                            h({
                              tools: y.target.value
                                .split(',')
                                .map((S) => S.trim())
                                .filter(Boolean),
                            }),
                          placeholder: 'web-search, file-read, code-exec (comma-separated)',
                        })
                      : n.jsx('div', {
                          className: 'flex flex-wrap gap-1 mt-1.5',
                          children: c.tools.map((y) =>
                            n.jsx(
                              'span',
                              {
                                className:
                                  'px-2 py-0.5 rounded-md bg-[var(--cs-surface-card)]/20 text-[10px] text-[var(--cs-text-secondary)] border border-[var(--cs-border-subtle)]',
                                children: y,
                              },
                              y,
                            ),
                          ),
                        }),
                  ],
                }),
                n.jsxs('div', {
                  children: [
                    n.jsx('label', {
                      className:
                        'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                      children: 'Color',
                    }),
                    n.jsx('div', {
                      className: 'flex gap-1.5 mt-1.5',
                      children: [
                        '#6366f1',
                        '#f59e0b',
                        '#10b981',
                        '#06b6d4',
                        '#ef4444',
                        '#6366f1',
                        '#ec4899',
                        '#14b8a6',
                      ].map((y) =>
                        n.jsx(
                          'button',
                          {
                            onClick: () => p && h({ color: y }),
                            className: `w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${c.color === y ? 'border-white scale-110' : 'border-transparent'}`,
                            style: { backgroundColor: y },
                          },
                          y,
                        ),
                      ),
                    }),
                  ],
                }),
                n.jsxs('div', {
                  children: [
                    n.jsx('label', {
                      className:
                        'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                      children: 'Assigned Tasks',
                    }),
                    n.jsx('div', {
                      className: 'space-y-1 mt-1.5',
                      children: a.tasks
                        .filter((y) => y.agentId === c.id)
                        .map((y) =>
                          n.jsxs(
                            'div',
                            {
                              className:
                                'flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--cs-surface-card)]/10 border border-[var(--cs-border-subtle)]',
                              children: [
                                n.jsx(fp, { status: y.status }),
                                n.jsx('span', {
                                  className:
                                    'text-xs text-[var(--cs-text-secondary)] line-clamp-2 flex-1',
                                  children: y.description,
                                }),
                                p &&
                                  n.jsx('button', {
                                    onClick: () =>
                                      l({
                                        ...a,
                                        tasks: a.tasks.map((S) =>
                                          S.id === y.id ? { ...S, agentId: '' } : S,
                                        ),
                                      }),
                                    className:
                                      'p-0.5 rounded hover:bg-rose-500/20 text-[var(--cs-text-tertiary)] hover:text-rose-400 transition-colors flex-shrink-0',
                                    title: 'Unassign task',
                                    children: n.jsxs('svg', {
                                      width: '10',
                                      height: '10',
                                      viewBox: '0 0 24 24',
                                      fill: 'none',
                                      stroke: 'currentColor',
                                      strokeWidth: '2.5',
                                      children: [
                                        n.jsx('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
                                        n.jsx('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
                                      ],
                                    }),
                                  }),
                              ],
                            },
                            y.id,
                          ),
                        ),
                    }),
                  ],
                }),
              ],
            }),
          u &&
            n.jsxs(n.Fragment, {
              children: [
                n.jsxs('div', {
                  children: [
                    n.jsx('label', {
                      className:
                        'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                      children: 'Description',
                    }),
                    p
                      ? n.jsx('textarea', {
                          className: v + ' mt-1',
                          rows: 3,
                          value: u.description,
                          onChange: (y) => m({ description: y.target.value }),
                          placeholder: 'Describe what this task should accomplish...',
                        })
                      : n.jsx('p', {
                          className: 'text-sm text-[var(--cs-text-primary)] mt-1',
                          children: u.description,
                        }),
                  ],
                }),
                n.jsxs('div', {
                  children: [
                    n.jsx('label', {
                      className:
                        'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                      children: 'Assigned Agent',
                    }),
                    p
                      ? n.jsxs('select', {
                          className: g + ' mt-1',
                          value: u.agentId,
                          onChange: (y) => m({ agentId: y.target.value }),
                          children: [
                            n.jsx('option', { value: '', children: '— Unassigned —' }),
                            a.agents.map((y) =>
                              n.jsx('option', { value: y.id, children: y.role }, y.id),
                            ),
                          ],
                        })
                      : (() => {
                          const y = a.agents.find((S) => S.id === u.agentId);
                          return y
                            ? n.jsxs('div', {
                                className: 'flex items-center gap-2 mt-1.5',
                                children: [
                                  n.jsx('div', {
                                    className:
                                      'w-6 h-6 rounded-md flex items-center justify-center text-white',
                                    style: { backgroundColor: `${y.color}30` },
                                    children: n.jsx(Ft, { id: y.id, size: 14, fallback: y.role }),
                                  }),
                                  n.jsx('span', {
                                    className: 'text-sm text-[var(--cs-text-secondary)]',
                                    children: y.role,
                                  }),
                                ],
                              })
                            : null;
                        })(),
                  ],
                }),
                n.jsxs('div', {
                  children: [
                    n.jsx('label', {
                      className:
                        'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                      children: 'Expected Output',
                    }),
                    p
                      ? n.jsx('textarea', {
                          className: v + ' mt-1 text-xs',
                          rows: 2,
                          value: u.expectedOutput,
                          onChange: (y) => m({ expectedOutput: y.target.value }),
                          placeholder: 'What output should the agent produce?',
                        })
                      : n.jsx('p', {
                          className: 'text-xs text-[var(--cs-text-secondary)] mt-1',
                          children: u.expectedOutput,
                        }),
                  ],
                }),
                u.dependencies.length > 0 &&
                  n.jsxs('div', {
                    children: [
                      n.jsx('label', {
                        className:
                          'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                        children: 'Dependencies',
                      }),
                      n.jsx('div', {
                        className: 'space-y-1 mt-1.5',
                        children: u.dependencies.map((y) => {
                          const S = a.tasks.find((C) => C.id === y);
                          return S
                            ? n.jsxs(
                                'div',
                                {
                                  className:
                                    'flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--cs-surface-card)]/10 border border-[var(--cs-border-subtle)]',
                                  children: [
                                    n.jsx(fp, { status: S.status }),
                                    n.jsx('span', {
                                      className:
                                        'text-xs text-[var(--cs-text-secondary)] line-clamp-2 flex-1',
                                      children: S.description,
                                    }),
                                    p &&
                                      n.jsx('button', {
                                        onClick: () =>
                                          m({
                                            dependencies: u.dependencies.filter((C) => C !== y),
                                          }),
                                        className:
                                          'p-0.5 rounded hover:bg-rose-500/20 text-[var(--cs-text-tertiary)] hover:text-rose-400 transition-colors flex-shrink-0',
                                        title: 'Remove dependency',
                                        children: n.jsxs('svg', {
                                          width: '10',
                                          height: '10',
                                          viewBox: '0 0 24 24',
                                          fill: 'none',
                                          stroke: 'currentColor',
                                          strokeWidth: '2.5',
                                          children: [
                                            n.jsx('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
                                            n.jsx('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
                                          ],
                                        }),
                                      }),
                                  ],
                                },
                                y,
                              )
                            : null;
                        }),
                      }),
                    ],
                  }),
                n.jsxs('div', {
                  children: [
                    n.jsx('label', {
                      className:
                        'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                      children: 'Status',
                    }),
                    n.jsx('div', {
                      className: 'mt-1.5',
                      children: n.jsx(of, { status: u.status }),
                    }),
                  ],
                }),
                u.output &&
                  n.jsxs('div', {
                    className: 'animate-fadeInUp',
                    children: [
                      n.jsxs('label', {
                        className:
                          'text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5',
                        children: [
                          n.jsx('svg', {
                            width: '10',
                            height: '10',
                            viewBox: '0 0 24 24',
                            fill: 'none',
                            stroke: 'currentColor',
                            strokeWidth: '2.5',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            children: n.jsx('polyline', { points: '20 6 9 17 4 12' }),
                          }),
                          'Result',
                        ],
                      }),
                      n.jsx('div', {
                        className:
                          'mt-1.5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15',
                        children: n.jsx('p', {
                          className:
                            'text-xs text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap',
                          children: u.output,
                        }),
                      }),
                    ],
                  }),
                u.status === 'running' &&
                  !u.output &&
                  n.jsxs('div', {
                    className: 'animate-fadeIn',
                    children: [
                      n.jsxs('label', {
                        className:
                          'text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5',
                        children: [
                          n.jsxs('svg', {
                            className: 'animate-spin h-2.5 w-2.5',
                            viewBox: '0 0 24 24',
                            fill: 'none',
                            children: [
                              n.jsx('circle', {
                                className: 'opacity-25',
                                cx: '12',
                                cy: '12',
                                r: '10',
                                stroke: 'currentColor',
                                strokeWidth: '4',
                              }),
                              n.jsx('path', {
                                className: 'opacity-75',
                                fill: 'currentColor',
                                d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
                              }),
                            ],
                          }),
                          'In Progress',
                        ],
                      }),
                      n.jsx('div', {
                        className:
                          'mt-1.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15',
                        children: n.jsx('p', {
                          className: 'text-xs text-[var(--cs-text-secondary)] animate-pulse',
                          children: 'Agent is working on this task...',
                        }),
                      }),
                    ],
                  }),
                u.discussion &&
                  (() => {
                    const y = (a.discussionEdges ?? []).filter((j) => j.taskId === u.id),
                      S = y.flatMap((j) => j.messages).sort((j, b) => j.timestamp - b.timestamp),
                      C = y.length > 0 ? y[0].status : 'idle',
                      R = u.discussion.participantIds
                        .map((j) => a.agents.find((b) => b.id === j))
                        .filter(Boolean);
                    return n.jsxs(n.Fragment, {
                      children: [
                        n.jsx('div', {
                          className: 'border-t border-cyan-500/15 pt-3 mt-1',
                          children: n.jsxs('label', {
                            className:
                              'text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5',
                            children: [
                              n.jsx('svg', {
                                width: '10',
                                height: '10',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: 'currentColor',
                                strokeWidth: '2.5',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                children: n.jsx('path', {
                                  d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
                                }),
                              }),
                              'Discussion',
                              n.jsx('span', {
                                className: `ml-auto px-1.5 py-0.5 rounded-full text-[8px] font-bold ${C === 'converged' ? 'bg-emerald-500/20 text-emerald-400' : C === 'active' ? 'bg-cyan-500/20 text-cyan-300' : C === 'max-rounds' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/15 text-slate-400'}`,
                                children: C,
                              }),
                            ],
                          }),
                        }),
                        n.jsxs('div', {
                          children: [
                            n.jsxs('label', {
                              className:
                                'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                              children: ['Participants (', R.length, ')'],
                            }),
                            n.jsx('div', {
                              className: 'flex items-center gap-1.5 mt-1.5 flex-wrap',
                              children: R.map((j) =>
                                n.jsxs(
                                  'div',
                                  {
                                    className:
                                      'flex items-center gap-1 px-1.5 py-1 rounded-lg bg-[var(--cs-surface-card)]/15 border border-[var(--cs-border-subtle)] group/chip',
                                    children: [
                                      n.jsx('div', {
                                        className:
                                          'w-4 h-4 rounded-full flex items-center justify-center text-white',
                                        style: { backgroundColor: j.color },
                                        children: n.jsx(Ft, {
                                          id: j.id,
                                          size: 10,
                                          fallback: j.role,
                                        }),
                                      }),
                                      n.jsx('span', {
                                        className: 'text-[10px] text-[var(--cs-text-secondary)]',
                                        children: j.role,
                                      }),
                                      p &&
                                        R.length > 2 &&
                                        n.jsx('button', {
                                          className:
                                            'ml-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[var(--cs-text-tertiary)] hover:text-rose-400 hover:bg-rose-500/15 transition-colors opacity-0 group-hover/chip:opacity-100',
                                          title: `Remove ${j.role} from discussion`,
                                          onClick: () => {
                                            const b = u.discussion.participantIds.filter(
                                              (T) => T !== j.id,
                                            );
                                            m({
                                              discussion: { ...u.discussion, participantIds: b },
                                            });
                                          },
                                          children: n.jsxs('svg', {
                                            width: '8',
                                            height: '8',
                                            viewBox: '0 0 24 24',
                                            fill: 'none',
                                            stroke: 'currentColor',
                                            strokeWidth: '3',
                                            strokeLinecap: 'round',
                                            children: [
                                              n.jsx('line', {
                                                x1: '18',
                                                y1: '6',
                                                x2: '6',
                                                y2: '18',
                                              }),
                                              n.jsx('line', {
                                                x1: '6',
                                                y1: '6',
                                                x2: '18',
                                                y2: '18',
                                              }),
                                            ],
                                          }),
                                        }),
                                    ],
                                  },
                                  j.id,
                                ),
                              ),
                            }),
                            p &&
                              (() => {
                                const j = a.agents.filter(
                                  (b) => !u.discussion.participantIds.includes(b.id),
                                );
                                return j.length === 0
                                  ? null
                                  : n.jsxs('select', {
                                      className:
                                        'mt-2 w-full bg-[var(--cs-surface-card)]/20 border border-dashed border-cyan-500/30 rounded-lg px-2 py-1.5 text-[10px] text-cyan-400 cursor-pointer hover:border-cyan-400/50 hover:bg-cyan-500/5 transition-colors focus:outline-none focus:border-cyan-400',
                                      value: '',
                                      onChange: (b) => {
                                        if (!b.target.value) return;
                                        const T = [...u.discussion.participantIds, b.target.value];
                                        (m({ discussion: { ...u.discussion, participantIds: T } }),
                                          (b.target.value = ''));
                                      },
                                      children: [
                                        n.jsx('option', {
                                          value: '',
                                          children: '+ Add participant…',
                                        }),
                                        j.map((b) =>
                                          n.jsx('option', { value: b.id, children: b.role }, b.id),
                                        ),
                                      ],
                                    });
                              })(),
                            p &&
                              R.length <= 2 &&
                              n.jsx('p', {
                                className: 'text-[9px] text-amber-400/60 mt-1',
                                children: 'Minimum 2 participants required',
                              }),
                          ],
                        }),
                        n.jsxs('div', {
                          className: 'flex items-center gap-3',
                          children: [
                            n.jsxs('div', {
                              children: [
                                n.jsx('label', {
                                  className:
                                    'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                                  children: 'Strategy',
                                }),
                                p
                                  ? n.jsxs('select', {
                                      className: g + ' mt-1 text-xs',
                                      value: u.discussion.convergenceStrategy,
                                      onChange: (j) =>
                                        m({
                                          discussion: {
                                            ...u.discussion,
                                            convergenceStrategy: j.target.value,
                                          },
                                        }),
                                      children: [
                                        n.jsx('option', {
                                          value: 'unanimous',
                                          children: 'Unanimous',
                                        }),
                                        n.jsx('option', {
                                          value: 'majority',
                                          children: 'Majority',
                                        }),
                                        n.jsx('option', {
                                          value: 'llm-judge',
                                          children: 'LLM Judge',
                                        }),
                                        n.jsx('option', {
                                          value: 'stable-output',
                                          children: 'Stable Output',
                                        }),
                                      ],
                                    })
                                  : n.jsx('p', {
                                      className: 'text-xs text-[var(--cs-text-secondary)] mt-1',
                                      children: u.discussion.convergenceStrategy,
                                    }),
                              ],
                            }),
                            n.jsxs('div', {
                              children: [
                                n.jsx('label', {
                                  className:
                                    'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                                  children: 'Max Rounds',
                                }),
                                p
                                  ? n.jsx('input', {
                                      type: 'number',
                                      min: 1,
                                      max: 20,
                                      className: g + ' mt-1 text-xs w-16',
                                      value: u.discussion.maxRounds,
                                      onChange: (j) =>
                                        m({
                                          discussion: {
                                            ...u.discussion,
                                            maxRounds: Math.max(1, parseInt(j.target.value) || 3),
                                          },
                                        }),
                                    })
                                  : n.jsx('p', {
                                      className: 'text-xs text-[var(--cs-text-secondary)] mt-1',
                                      children: u.discussion.maxRounds,
                                    }),
                              ],
                            }),
                          ],
                        }),
                        S.length > 0 &&
                          n.jsxs('div', {
                            children: [
                              n.jsxs('label', {
                                className:
                                  'text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider',
                                children: ['Conversation (', S.length, ' messages)'],
                              }),
                              n.jsx('div', {
                                className:
                                  'mt-1.5 space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin pr-1',
                                children: S.map((j) => {
                                  const b = a.agents.find((z) => z.id === j.fromAgentId),
                                    T = {
                                      proposal: 'bg-indigo-500/15 text-indigo-400',
                                      feedback: 'bg-blue-500/15 text-blue-400',
                                      revision: 'bg-amber-500/15 text-amber-400',
                                      agreement: 'bg-emerald-500/15 text-emerald-400',
                                      disagreement: 'bg-rose-500/15 text-rose-400',
                                      question: 'bg-sky-500/15 text-sky-400',
                                      answer: 'bg-indigo-500/15 text-indigo-400',
                                    };
                                  return n.jsxs(
                                    'div',
                                    {
                                      className:
                                        'rounded-lg bg-[var(--cs-surface-card)]/10 border border-[var(--cs-border-subtle)] p-2',
                                      children: [
                                        n.jsxs('div', {
                                          className: 'flex items-center gap-1.5 mb-1',
                                          children: [
                                            n.jsx('div', {
                                              className:
                                                'w-4 h-4 rounded-full flex items-center justify-center text-white flex-shrink-0',
                                              style: {
                                                backgroundColor:
                                                  (b == null ? void 0 : b.color) ?? '#6366f1',
                                              },
                                              children: n.jsx(Ft, {
                                                id: (b == null ? void 0 : b.id) ?? '',
                                                size: 10,
                                                fallback: b == null ? void 0 : b.role,
                                              }),
                                            }),
                                            n.jsx('span', {
                                              className: 'text-[10px] font-semibold',
                                              style: {
                                                color: (b == null ? void 0 : b.color) ?? '#818cf8',
                                              },
                                              children:
                                                (b == null ? void 0 : b.role) ?? j.fromAgentId,
                                            }),
                                            n.jsx('span', {
                                              className: `text-[8px] px-1 py-0.5 rounded font-medium ${T[j.type] ?? 'bg-slate-500/15 text-slate-400'}`,
                                              children: j.type,
                                            }),
                                            n.jsxs('span', {
                                              className:
                                                'text-[8px] text-[var(--cs-text-tertiary)] ml-auto',
                                              children: ['R', j.round],
                                            }),
                                          ],
                                        }),
                                        n.jsxs('p', {
                                          className:
                                            'text-[10px] text-[var(--cs-text-secondary)] leading-relaxed',
                                          children: [
                                            j.content
                                              .replace(
                                                /^\[(?:AGREE|DISAGREE|REVISE|QUESTION|PROPOSAL)\]\s*/i,
                                                '',
                                              )
                                              .slice(0, 200),
                                            j.content.length > 200 ? '…' : '',
                                          ],
                                        }),
                                      ],
                                    },
                                    j.id,
                                  );
                                }),
                              }),
                            ],
                          }),
                        S.length === 0 &&
                          C === 'idle' &&
                          n.jsx('div', {
                            className:
                              'rounded-lg bg-cyan-500/5 border border-cyan-500/10 p-3 text-center',
                            children: n.jsx('p', {
                              className: 'text-[10px] text-cyan-400/60',
                              children: 'Discussion will start when this task is executed',
                            }),
                          }),
                      ],
                    });
                  })(),
              ],
            }),
        ],
      }),
    ],
  });
}
function ug() {
  return n.jsx('div', {
    className: 'h-full flex items-center justify-center bg-[var(--cs-surface-app)]',
    children: n.jsxs('div', {
      className: 'text-center',
      children: [
        n.jsxs('div', {
          className: 'relative w-16 h-16 mx-auto mb-6',
          children: [
            n.jsx('div', {
              className:
                'absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 animate-pulse',
            }),
            n.jsx('div', {
              className:
                'absolute inset-1 rounded-xl bg-[var(--cs-surface-app)] flex items-center justify-center',
              children: n.jsxs('svg', {
                className: 'animate-spin h-6 w-6 text-indigo-400',
                viewBox: '0 0 24 24',
                fill: 'none',
                children: [
                  n.jsx('circle', {
                    className: 'opacity-25',
                    cx: '12',
                    cy: '12',
                    r: '10',
                    stroke: 'currentColor',
                    strokeWidth: '4',
                  }),
                  n.jsx('path', {
                    className: 'opacity-75',
                    fill: 'currentColor',
                    d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
                  }),
                ],
              }),
            }),
          ],
        }),
        n.jsx('h3', {
          className: 'text-lg font-semibold text-[var(--cs-text-primary)] mb-2',
          children: 'Assembling your agent team...',
        }),
        n.jsx('p', {
          className: 'text-sm text-[var(--cs-text-secondary)]',
          children: 'Analyzing your requirements and creating the optimal workflow',
        }),
        n.jsx('div', {
          className: 'mt-6 flex items-center justify-center gap-1',
          children: ['Identifying roles', 'Mapping tasks', 'Setting dependencies'].map((a, s) =>
            n.jsx(
              'span',
              {
                className:
                  'px-2.5 py-1 rounded-full bg-[var(--cs-surface-card)]/20 text-[10px] text-[var(--cs-text-tertiary)] animate-pulse',
                style: { animationDelay: `${s * 200}ms` },
                children: a,
              },
              a,
            ),
          ),
        }),
      ],
    }),
  });
}
function pg() {
  return n.jsx('div', {
    className: 'h-full flex items-center justify-center bg-[var(--cs-surface-app)]',
    children: n.jsxs('div', {
      className: 'text-center max-w-sm px-4',
      children: [
        n.jsx('div', {
          className:
            'w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--cs-surface-card)]/20 border border-[var(--cs-border-default)] flex items-center justify-center',
          children: n.jsxs('svg', {
            width: '24',
            height: '24',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.5',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            className: 'text-[var(--cs-text-tertiary)]',
            children: [
              n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
              n.jsx('path', { d: 'M2 17l10 5 10-5' }),
              n.jsx('path', { d: 'M2 12l10 5 10-5' }),
            ],
          }),
        }),
        n.jsx('h3', {
          className: 'text-sm font-medium text-[var(--cs-text-secondary)] mb-1',
          children: 'No workflow yet',
        }),
        n.jsx('p', {
          className: 'text-xs text-[var(--cs-text-tertiary)]',
          children: 'Describe your initiative in the chat to generate a workflow',
        }),
      ],
    }),
  });
}
function of({ status: a }) {
  const s = {
    pending: 'bg-slate-500/20 text-[var(--cs-text-secondary)]',
    running: 'bg-amber-500/20 text-amber-400 animate-pulse',
    completed: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-rose-500/20 text-rose-400',
  };
  return n.jsx('span', {
    className: `px-1.5 py-0.5 rounded text-[10px] font-medium ${s[a]}`,
    children: a,
  });
}
function fp({ status: a }) {
  return a === 'completed'
    ? n.jsx('svg', {
        width: '14',
        height: '14',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: '#10b981',
        strokeWidth: '2.5',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        children: n.jsx('polyline', { points: '20 6 9 17 4 12' }),
      })
    : a === 'running'
      ? n.jsxs('svg', {
          width: '14',
          height: '14',
          viewBox: '0 0 24 24',
          fill: 'none',
          className: 'animate-spin',
          children: [
            n.jsx('circle', {
              className: 'opacity-25',
              cx: '12',
              cy: '12',
              r: '10',
              stroke: '#f59e0b',
              strokeWidth: '4',
            }),
            n.jsx('path', {
              className: 'opacity-75',
              fill: '#f59e0b',
              d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
            }),
          ],
        })
      : a === 'failed'
        ? n.jsxs('svg', {
            width: '14',
            height: '14',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: '#ef4444',
            strokeWidth: '2.5',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            children: [
              n.jsx('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
              n.jsx('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
            ],
          })
        : n.jsx('svg', {
            width: '14',
            height: '14',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: '#52525b',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            children: n.jsx('circle', { cx: '12', cy: '12', r: '10' }),
          });
}
function fg({
  workflow: a,
  viewMode: s,
  onViewModeChange: i,
  onRun: l,
  onBack: c,
  onSettings: u,
  isGenerating: p,
  onToggleCrewBlade: h,
  isCrewBladeOpen: m,
  onSaveAsCrew: g,
}) {
  return n.jsxs('header', {
    className:
      'flex items-center gap-3 px-4 py-2.5 glass border-b border-[var(--cs-border-subtle)] flex-shrink-0 z-10',
    children: [
      n.jsx('button', {
        onClick: c,
        className:
          'p-1.5 rounded-lg hover:bg-[var(--cs-surface-card)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors',
        title: 'Back to home',
        children: n.jsxs('svg', {
          width: '18',
          height: '18',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '2',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          children: [
            n.jsx('line', { x1: '19', y1: '12', x2: '5', y2: '12' }),
            n.jsx('polyline', { points: '12 19 5 12 12 5' }),
          ],
        }),
      }),
      n.jsxs('div', {
        className: 'flex items-center gap-2',
        children: [
          n.jsx('div', {
            className:
              'w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center',
            children: n.jsxs('svg', {
              width: '12',
              height: '12',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'white',
              strokeWidth: '2.5',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              children: [
                n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                n.jsx('path', { d: 'M2 12l10 5 10-5' }),
              ],
            }),
          }),
          n.jsx('span', {
            className: 'text-sm font-semibold text-[var(--cs-text-primary)] hidden sm:inline',
            children: 'CrewSpace',
          }),
        ],
      }),
      n.jsx('div', { className: 'w-px h-5 bg-[var(--cs-border-default)] hidden sm:block' }),
      n.jsx('div', {
        className: 'flex-1 min-w-0',
        children: a
          ? n.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                n.jsx('span', {
                  className: 'text-sm text-[var(--cs-text-secondary)] truncate max-w-[300px]',
                  children:
                    a.description.length > 60 ? a.description.slice(0, 60) + '...' : a.description,
                }),
                n.jsx(hg, { status: a.status }),
              ],
            })
          : p
            ? n.jsx('span', {
                className: 'text-sm text-[var(--cs-text-tertiary)] animate-pulse',
                children: 'Generating workflow...',
              })
            : n.jsx('span', {
                className: 'text-sm text-[var(--cs-text-tertiary)]',
                children: 'New workflow',
              }),
      }),
      n.jsxs('div', {
        className:
          'hidden md:flex items-center bg-[var(--cs-surface-card)] rounded-lg p-0.5 border border-[var(--cs-border-subtle)]',
        children: [
          n.jsx(hp, {
            active: s === 'graph',
            onClick: () => i('graph'),
            label: 'Graph',
            icon: n.jsxs('svg', {
              width: '14',
              height: '14',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              children: [
                n.jsx('circle', { cx: '18', cy: '5', r: '3' }),
                n.jsx('circle', { cx: '6', cy: '12', r: '3' }),
                n.jsx('circle', { cx: '18', cy: '19', r: '3' }),
                n.jsx('line', { x1: '8.59', y1: '13.51', x2: '15.42', y2: '17.49' }),
                n.jsx('line', { x1: '15.41', y1: '6.51', x2: '8.59', y2: '10.49' }),
              ],
            }),
          }),
          n.jsx(hp, {
            active: s === 'list',
            onClick: () => i('list'),
            label: 'Results',
            icon: n.jsxs('svg', {
              width: '14',
              height: '14',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              children: [
                n.jsx('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
                n.jsx('polyline', { points: '14 2 14 8 20 8' }),
                n.jsx('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
                n.jsx('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
                n.jsx('polyline', { points: '10 9 9 9 8 9' }),
              ],
            }),
          }),
        ],
      }),
      n.jsx('div', { className: 'w-px h-5 bg-[var(--cs-border-default)]' }),
      n.jsxs('div', {
        className: 'flex items-center gap-2',
        children: [
          n.jsx('button', {
            onClick: u,
            className:
              'p-2 rounded-lg hover:bg-[var(--cs-surface-card)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
            title: 'LLM Settings',
            'aria-label': 'LLM Settings',
            children: n.jsxs('svg', {
              width: '16',
              height: '16',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              children: [
                n.jsx('circle', { cx: '12', cy: '12', r: '3' }),
                n.jsx('path', {
                  d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
                }),
              ],
            }),
          }),
          h &&
            n.jsx('button', {
              onClick: h,
              className: `p-2 rounded-lg transition-colors focus-ring ${m ? 'bg-indigo-500/15 text-indigo-400' : 'hover:bg-[var(--cs-surface-card)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)]'}`,
              title: m ? 'Close Crew panel' : 'Open Crew panel',
              'aria-label': 'Toggle Crew panel',
              children: n.jsxs('svg', {
                width: '16',
                height: '16',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                children: [
                  n.jsx('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
                  n.jsx('circle', { cx: '9', cy: '7', r: '4' }),
                  n.jsx('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
                  n.jsx('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }),
                ],
              }),
            }),
          g &&
            n.jsxs('button', {
              onClick: g,
              disabled: !a,
              className:
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors focus-ring',
              title: 'Save workflow as a crew',
              children: [
                n.jsxs('svg', {
                  width: '14',
                  height: '14',
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: '2',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  children: [
                    n.jsx('path', {
                      d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z',
                    }),
                    n.jsx('polyline', { points: '17 21 17 13 7 13 7 21' }),
                    n.jsx('polyline', { points: '7 3 7 8 15 8' }),
                  ],
                }),
                'Save Crew',
              ],
            }),
          n.jsx('button', {
            className:
              'p-2 rounded-lg hover:bg-[var(--cs-surface-card)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors',
            title: 'Share workflow',
            children: n.jsxs('svg', {
              width: '16',
              height: '16',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              children: [
                n.jsx('circle', { cx: '18', cy: '5', r: '3' }),
                n.jsx('circle', { cx: '6', cy: '12', r: '3' }),
                n.jsx('circle', { cx: '18', cy: '19', r: '3' }),
                n.jsx('line', { x1: '8.59', y1: '13.51', x2: '15.42', y2: '17.49' }),
                n.jsx('line', { x1: '15.41', y1: '6.51', x2: '8.59', y2: '10.49' }),
              ],
            }),
          }),
          n.jsx('button', {
            className:
              'p-2 rounded-lg hover:bg-[var(--cs-surface-card)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors',
            title: 'Save workflow',
            disabled: !a,
            children: n.jsxs('svg', {
              width: '16',
              height: '16',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              children: [
                n.jsx('path', {
                  d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z',
                }),
                n.jsx('polyline', { points: '17 21 17 13 7 13 7 21' }),
                n.jsx('polyline', { points: '7 3 7 8 15 8' }),
              ],
            }),
          }),
          n.jsx('button', {
            onClick: l,
            disabled: !a || a.status === 'running' || p,
            className:
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/30 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 focus-ring',
            children:
              (a == null ? void 0 : a.status) === 'running'
                ? n.jsxs(n.Fragment, {
                    children: [
                      n.jsxs('svg', {
                        className: 'animate-spin h-3.5 w-3.5',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        children: [
                          n.jsx('circle', {
                            className: 'opacity-25',
                            cx: '12',
                            cy: '12',
                            r: '10',
                            stroke: 'currentColor',
                            strokeWidth: '4',
                          }),
                          n.jsx('path', {
                            className: 'opacity-75',
                            fill: 'currentColor',
                            d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
                          }),
                        ],
                      }),
                      'Running',
                    ],
                  })
                : n.jsxs(n.Fragment, {
                    children: [
                      n.jsx('svg', {
                        width: '14',
                        height: '14',
                        viewBox: '0 0 24 24',
                        fill: 'currentColor',
                        children: n.jsx('polygon', { points: '5 3 19 12 5 21 5 3' }),
                      }),
                      'Run',
                    ],
                  }),
          }),
        ],
      }),
    ],
  });
}
function hp({ active: a, onClick: s, label: i, icon: l }) {
  return n.jsxs('button', {
    onClick: s,
    className: `flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${a ? 'bg-indigo-500/15 text-indigo-300 shadow-sm' : 'text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-primary)]'}`,
    title: i,
    children: [l, n.jsx('span', { className: 'hidden lg:inline', children: i })],
  });
}
function hg({ status: a }) {
  const s = {
    draft: 'bg-slate-500/20 text-[var(--cs-text-secondary)] border-slate-500/20',
    running: 'bg-amber-500/20 text-amber-400 border-amber-500/20 animate-pulse',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
    failed: 'bg-rose-500/20 text-rose-400 border-rose-500/20',
  };
  return n.jsx('span', {
    className: `px-2 py-0.5 rounded-full text-[10px] font-medium border ${s[a]}`,
    children: a,
  });
}
const mg = {
    id: 'agent-business-analyst',
    role: 'Business Analyst',
    subtitle: 'Requirements specialist',
    goal: 'Translate business needs into technical requirements through stakeholder communication, process analysis, and solution design. Ensure technology solves real business problems.',
    backstory:
      'You are a senior business analyst with expertise in bridging business needs and technical solutions. Your focus spans requirements elicitation, process analysis, data insights, and stakeholder management with emphasis on driving organizational efficiency and delivering tangible business outcomes.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'sonnet',
    category: 'business-product',
  },
  xg = {
    id: 'agent-content-marketer',
    role: 'Content Marketer',
    subtitle: 'Content marketing specialist',
    goal: 'Create compelling technical and marketing content. Drive growth through strategic content creation, SEO, content strategy, and audience engagement.',
    backstory:
      'You are a senior content marketer with expertise in creating compelling content that drives engagement and conversions. Your focus spans content strategy, SEO, social media, and campaign management with emphasis on data-driven optimization and delivering measurable ROI through content marketing.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'haiku',
    category: 'business-product',
  },
  gg = {
    id: 'agent-customer-success-manager',
    role: 'Customer Success Manager',
    subtitle: 'Customer success expert',
    goal: 'Ensure users achieve their goals through onboarding, retention, and customer advocacy. Transform users into champions through proactive support.',
    backstory:
      'You are a senior customer success manager with expertise in building strong customer relationships, driving product adoption, and maximizing customer lifetime value. Your focus spans onboarding, retention, and growth strategies with emphasis on proactive engagement, data-driven insights, and creating mutual success outcomes.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'sonnet',
    category: 'business-product',
  },
  vg = {
    id: 'agent-legal-advisor',
    role: 'Legal Advisor',
    subtitle: 'Legal and compliance specialist',
    goal: 'Navigate technology law and compliance. Master privacy regulations, intellectual property, and contract negotiations. Protect businesses while enabling innovation.',
    backstory:
      'You are a senior legal advisor with expertise in technology law and business protection. Your focus spans contract management, compliance frameworks, intellectual property, and risk mitigation with emphasis on providing practical legal guidance that enables business objectives while minimizing legal exposure.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'sonnet',
    category: 'business-product',
  },
  yg = {
    id: 'agent-license-engineer',
    role: 'License Engineer',
    subtitle: 'Software licensing and compliance systems specialist',
    goal: 'Design OSS and proprietary licensing architectures for software products. Master license selection, dependency compliance pipelines, dual-licensing strategies, and deployment risk controls.',
    backstory:
      'You are a senior legal engineer with expertise in designing and implementing comprehensive software licensing systems. Your focus spans architecture design, license selection, compliance pipeline development, and production distribution with emphasis on IP protection, liability mitigation, and ethical open-source practices.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'opus',
    category: 'business-product',
  },
  wg = {
    id: 'agent-product-manager',
    role: 'Product Manager',
    subtitle: 'Product strategy expert',
    goal: 'Define what to build and why. Expert in market analysis, user needs, and product strategy. Drive product success from conception to market leadership.',
    backstory:
      'You are a senior product manager with expertise in building successful products that delight users and achieve business objectives. Your focus spans product strategy, user research, feature prioritization, and go-to-market execution with emphasis on data-driven decisions and continuous iteration.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'haiku',
    category: 'business-product',
  },
  kg = {
    id: 'agent-project-manager',
    role: 'Project Manager',
    subtitle: 'Project management specialist',
    goal: 'Ensure successful delivery through Agile methodologies, resource planning, and stakeholder management. Keep projects on time, on budget, and on target.',
    backstory:
      'You are a senior project manager with expertise in leading complex projects to successful completion. Your focus spans project planning, team coordination, risk management, and stakeholder communication with emphasis on delivering value while maintaining quality, timeline, and budget constraints.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'haiku',
    category: 'business-product',
  },
  bg = {
    id: 'agent-sales-engineer',
    role: 'Sales Engineer',
    subtitle: 'Technical sales expert',
    goal: 'Bridge technical complexity and customer needs. Expert in demos, POCs, and technical objections. Help customers understand and adopt technical solutions.',
    backstory:
      'You are a senior sales engineer with expertise in technical sales, solution design, and customer success enablement. Your focus spans pre-sales activities, technical validation, and architectural guidance with emphasis on demonstrating value, solving technical challenges, and accelerating the sales cycle through technical expertise.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'sonnet',
    category: 'business-product',
  },
  jg = {
    id: 'agent-scrum-master',
    role: 'Scrum Master',
    subtitle: 'Agile methodology expert',
    goal: 'Ensure teams work effectively through Scrum framework, team dynamics, and continuous improvement. Remove impediments and foster high-performing teams.',
    backstory:
      'You are a certified Scrum Master with expertise in facilitating agile teams, removing impediments, and driving continuous improvement. Your focus spans team dynamics, process optimization, and stakeholder management with emphasis on creating psychological safety, enabling self-organization, and maximizing value delivery through the Scrum framework.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'haiku',
    category: 'business-product',
  },
  Ng = {
    id: 'agent-technical-writer',
    role: 'Technical Writer',
    subtitle: 'Technical documentation specialist',
    goal: 'Make complex technical concepts accessible. Master various documentation types, tools, and user-focused writing. Create documentation users actually read.',
    backstory:
      'You are a senior technical writer with expertise in creating comprehensive, user-friendly documentation. Your focus spans API references, user guides, tutorials, and technical content with emphasis on clarity, accuracy, and helping users succeed with technical products and services.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'haiku',
    category: 'business-product',
  },
  _g = {
    id: 'agent-ux-researcher',
    role: 'UX Researcher',
    subtitle: 'User research expert',
    goal: 'Uncover user needs and behaviors through research methodologies, usability testing, and insight synthesis. Ensure products are built on real user understanding.',
    backstory:
      'You are a senior UX researcher with expertise in uncovering deep user insights through mixed-methods research. Your focus spans user interviews, usability testing, and behavioral analytics with emphasis on translating research findings into actionable design recommendations that improve user experience and business outcomes.',
    tools: ['web-search', 'document-reader'],
    model: 'sonnet',
    category: 'business-product',
  },
  Cg = {
    id: 'agent-wordpress-master',
    role: 'WordPress Master',
    subtitle: 'WordPress architecture and optimization specialist',
    goal: 'Architect, optimize, and troubleshoot WordPress implementations from custom theme/plugin development to enterprise-scale multisite platforms.',
    backstory:
      'You are a senior WordPress architect with 15+ years of expertise spanning core development, custom solutions, performance engineering, and enterprise deployments. Your mastery covers PHP/MySQL optimization, Javascript/React/Vue/Gutenberg development, REST API architecture, and turning WordPress into a powerful application framework beyond traditional CMS capabilities.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer', 'code-executor'],
    model: 'sonnet',
    category: 'business-product',
  },
  Sg = {
    id: 'agent-research-analyst',
    role: 'Research Analyst',
    subtitle: 'Comprehensive research specialist',
    goal: 'Conduct thorough investigations across domains. Master research methodologies, source validation, and insight synthesis. Deliver comprehensive research reports on any topic.',
    backstory:
      'You are a senior research analyst with expertise in conducting thorough research across diverse domains. Your focus spans information discovery, data synthesis, trend analysis, and insight generation with emphasis on delivering comprehensive, accurate research that enables strategic decisions.',
    tools: ['web-search', 'document-reader'],
    model: 'sonnet',
    category: 'research-analysis',
  },
  Eg = {
    id: 'agent-search-specialist',
    role: 'Search Specialist',
    subtitle: 'Advanced information retrieval expert',
    goal: 'Find needles in information haystacks. Master advanced search techniques, query optimization, and source discovery. Locate hard-to-find information efficiently.',
    backstory:
      'You are a senior search specialist with expertise in advanced information retrieval and knowledge discovery. Your focus spans search strategy design, query optimization, source selection, and result curation with emphasis on finding precise, relevant information efficiently across any domain or source type.',
    tools: ['web-search', 'document-reader'],
    model: 'sonnet',
    category: 'research-analysis',
  },
  Rg = {
    id: 'agent-trend-analyst',
    role: 'Trend Analyst',
    subtitle: 'Emerging trends and forecasting expert',
    goal: 'Spot patterns before they become obvious. Expert in trend analysis, future forecasting, and weak signal detection. Help organizations stay ahead of change.',
    backstory:
      'You are a senior trend analyst with expertise in detecting and analyzing emerging trends across industries and domains. Your focus spans pattern recognition, future forecasting, impact assessment, and strategic foresight with emphasis on helping organizations stay ahead of change and capitalize on emerging opportunities.',
    tools: ['web-search', 'document-reader'],
    model: 'sonnet',
    category: 'research-analysis',
  },
  Tg = {
    id: 'agent-competitive-analyst',
    role: 'Competitive Analyst',
    subtitle: 'Competitive intelligence specialist',
    goal: 'Analyze competitor strategies and market positioning. Master competitive benchmarking, SWOT analysis, and strategic recommendations. Provide actionable competitive insights.',
    backstory:
      'You are a senior competitive analyst with expertise in gathering and analyzing competitive intelligence. Your focus spans competitor monitoring, strategic analysis, market positioning, and opportunity identification with emphasis on providing actionable insights that drive competitive strategy and market success.',
    tools: ['web-search', 'document-reader'],
    model: 'sonnet',
    category: 'research-analysis',
  },
  Ig = {
    id: 'agent-market-researcher',
    role: 'Market Researcher',
    subtitle: 'Market analysis and consumer insights',
    goal: 'Understand market dynamics and consumer behavior. Expert in market sizing, segmentation, and opportunity identification. Reveal market opportunities and risks.',
    backstory:
      'You are a senior market researcher with expertise in comprehensive market analysis and consumer behavior research. Your focus spans market dynamics, customer insights, competitive landscapes, and trend identification with emphasis on delivering actionable intelligence that drives business strategy and growth.',
    tools: ['web-search', 'document-reader'],
    model: 'sonnet',
    category: 'research-analysis',
  },
  Og = {
    id: 'agent-project-idea-validator',
    role: 'Project Idea Validator',
    subtitle: 'Brutal go or no-go idea validator',
    goal: 'Pressure-test concepts against competitors, demand signals, and adoption friction. Kill weak ideas early and sharpen strong ones into evidence-backed MVPs.',
    backstory:
      'You are a senior product strategist, Y Combinator-style partner, and ruthless idea validator. Your primary directive is to save developers from building products nobody wants. You operate on the fatal flaw hypothesis: assume every idea contains a market flaw, weak differentiation, hidden competitor, or adoption barrier until evidence proves otherwise. You strictly forbid sycophancy. You do not validate an idea because it sounds clever. You actively hunt for the mistake, the missing demand, or the distribution failure that will kill the project. If an idea survives scrutiny, give explicit objective credit and shift from flaw-hunting to execution strategy.',
    tools: ['web-search', 'web-scraper', 'document-reader', 'document-writer'],
    model: 'sonnet',
    category: 'research-analysis',
  },
  Ag = {
    id: 'agent-data-researcher',
    role: 'Data Researcher',
    subtitle: 'Data discovery and analysis expert',
    goal: 'Extract insights from complex datasets. Master data mining, statistical analysis, and pattern recognition. Transform raw data into meaningful findings.',
    backstory:
      'You are a senior data researcher with expertise in discovering and analyzing data from multiple sources. Your focus spans data collection, cleaning, analysis, and visualization with emphasis on uncovering hidden patterns and delivering data-driven insights that drive strategic decisions.',
    tools: ['web-search', 'document-reader'],
    model: 'sonnet',
    category: 'research-analysis',
  },
  Lg = {
    id: 'agent-scientific-literature-researcher',
    role: 'Scientific Literature Researcher',
    subtitle: 'Scientific paper search and evidence synthesis',
    goal: 'Search scientific literature and retrieve structured experimental data from published studies. Deliver evidence-grounded analysis from full-text research papers, including methods, results, sample sizes, and quality scores.',
    backstory:
      'You are a senior scientific literature researcher with expertise in evidence-based analysis and systematic review. Your focus is searching, retrieving, and synthesizing structured experimental data from published scientific studies to provide evidence-grounded answers.',
    tools: ['web-search', 'document-reader'],
    model: 'sonnet',
    category: 'research-analysis',
  },
  Wl = [mg, xg, gg, vg, yg, wg, kg, bg, jg, Ng, _g, Cg],
  Bl = [Sg, Eg, Rg, Tg, Ig, Og, Ag, Lg],
  Ln = [...Wl, ...Bl],
  mp = ['#6366f1', '#2563eb', '#059669', '#d97706', '#dc2626', '#ec4899', '#06b6d4', '#6366f1'];
function xp({ agent: a, onSave: s, onCancel: i, onDelete: l, existingAgentIds: c = [] }) {
  const [u, p] = N.useState(!1),
    [h, m] = N.useState('all'),
    [g, v] = N.useState(''),
    y = !!a,
    S = (() => {
      let j;
      switch (h) {
        case 'business-product':
          j = Wl;
          break;
        case 'research-analysis':
          j = Bl;
          break;
        default:
          j = Ln;
      }
      if (g.trim()) {
        const b = g.toLowerCase();
        j = j.filter(
          (T) =>
            T.role.toLowerCase().includes(b) ||
            T.subtitle.toLowerCase().includes(b) ||
            T.goal.toLowerCase().includes(b),
        );
      }
      return j;
    })(),
    C = N.useCallback(
      (j) => {
        const b = c.length;
        s({
          id: j.id,
          role: j.role,
          goal: j.goal,
          backstory: j.backstory,
          tools: [...j.tools],
          color: mp[b % mp.length] ?? '#6366f1',
        });
      },
      [s, c],
    ),
    R = N.useCallback(() => {
      a && l && l(a.id);
    }, [a, l]);
  return y && a
    ? n.jsxs('div', {
        className: 'p-4 space-y-4',
        children: [
          n.jsx('div', {
            className: 'flex items-center justify-between',
            children: n.jsx('h3', {
              className: 'text-sm font-semibold text-[var(--cs-text-primary)]',
              children: 'Agent Details',
            }),
          }),
          n.jsxs('div', {
            className: 'space-y-1.5',
            children: [
              n.jsx('label', {
                className: 'text-xs font-medium text-[var(--cs-text-secondary)]',
                children: 'Role',
              }),
              n.jsx('div', {
                className:
                  'w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)]',
                children: a.role,
              }),
            ],
          }),
          n.jsxs('div', {
            className: 'space-y-1.5',
            children: [
              n.jsx('label', {
                className: 'text-xs font-medium text-[var(--cs-text-secondary)]',
                children: 'Goal',
              }),
              n.jsx('div', {
                className:
                  'w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] whitespace-pre-wrap',
                children: a.goal,
              }),
            ],
          }),
          n.jsxs('div', {
            className: 'space-y-1.5',
            children: [
              n.jsx('label', {
                className: 'text-xs font-medium text-[var(--cs-text-secondary)]',
                children: 'Backstory',
              }),
              n.jsx('div', {
                className:
                  'w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] whitespace-pre-wrap',
                children: a.backstory,
              }),
            ],
          }),
          a.tools.length > 0 &&
            n.jsxs('div', {
              className: 'space-y-1.5',
              children: [
                n.jsx('label', {
                  className: 'text-xs font-medium text-[var(--cs-text-secondary)]',
                  children: 'Tools',
                }),
                n.jsx('div', {
                  className: 'flex flex-wrap gap-1.5',
                  children: a.tools.map((j) =>
                    n.jsx(
                      'span',
                      {
                        className:
                          'px-2.5 py-1 text-xs rounded-md bg-indigo-600/20 border border-indigo-500/40 text-indigo-300',
                        children: j,
                      },
                      j,
                    ),
                  ),
                }),
              ],
            }),
          n.jsxs('div', {
            className: 'space-y-1.5',
            children: [
              n.jsx('label', {
                className: 'text-xs font-medium text-[var(--cs-text-secondary)]',
                children: 'Color',
              }),
              n.jsx('div', {
                className: 'w-6 h-6 rounded-full',
                style: { backgroundColor: a.color },
              }),
            ],
          }),
          n.jsxs('div', {
            className: 'flex items-center gap-2 pt-2 border-t border-[var(--cs-border-subtle)]',
            children: [
              n.jsx('button', {
                onClick: i,
                className:
                  'flex-1 px-3 py-2 text-sm font-medium rounded-md text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-white/5 transition-colors',
                children: 'Back',
              }),
              l &&
                n.jsx(n.Fragment, {
                  children: u
                    ? n.jsxs('div', {
                        className: 'flex items-center gap-1.5',
                        children: [
                          n.jsx('button', {
                            onClick: R,
                            className:
                              'px-2.5 py-1.5 text-xs font-medium rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors',
                            children: 'Confirm',
                          }),
                          n.jsx('button', {
                            onClick: () => p(!1),
                            className:
                              'px-2.5 py-1.5 text-xs font-medium rounded-md text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] transition-colors',
                            children: 'No',
                          }),
                        ],
                      })
                    : n.jsx('button', {
                        onClick: () => p(!0),
                        className:
                          'px-3 py-2 text-sm font-medium rounded-md text-red-400 hover:bg-red-600/10 transition-colors',
                        children: 'Remove',
                      }),
                }),
            ],
          }),
        ],
      })
    : n.jsxs('div', {
        className: 'p-4 space-y-3 h-full flex flex-col',
        children: [
          n.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              n.jsx('h3', {
                className: 'text-sm font-semibold text-[var(--cs-text-primary)]',
                children: 'Select Agent',
              }),
              n.jsx('button', {
                onClick: i,
                className:
                  'text-xs text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] transition-colors',
                children: 'Cancel',
              }),
            ],
          }),
          n.jsx('input', {
            type: 'text',
            value: g,
            onChange: (j) => v(j.target.value),
            placeholder: 'Search agents...',
            className:
              'w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors',
          }),
          n.jsx('div', {
            className: 'flex gap-1.5',
            children: ['all', 'business-product', 'research-analysis'].map((j) =>
              n.jsx(
                'button',
                {
                  onClick: () => m(j),
                  className: `px-2.5 py-1 text-xs rounded-md border transition-colors ${h === j ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-[var(--cs-surface-app)] border-[var(--cs-border-subtle)] text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)]'}`,
                  children:
                    j === 'all'
                      ? 'All'
                      : j === 'business-product'
                        ? 'Business & Product'
                        : 'Research & Analysis',
                },
                j,
              ),
            ),
          }),
          n.jsxs('div', {
            className: 'flex-1 overflow-y-auto space-y-1.5 scrollbar-thin',
            children: [
              S.map((j) => {
                const b = c.includes(j.id);
                return n.jsx(
                  'button',
                  {
                    onClick: () => !b && C(j),
                    disabled: b,
                    className: `w-full text-left p-3 rounded-lg border transition-all ${b ? 'opacity-40 cursor-not-allowed border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/30' : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/50 hover:bg-white/5 hover:border-indigo-500/30'}`,
                    children: n.jsxs('div', {
                      className: 'flex items-start gap-2',
                      children: [
                        n.jsx(Ft, {
                          id: j.id,
                          size: 18,
                          className: 'shrink-0 mt-0.5 text-[var(--cs-text-secondary)]',
                        }),
                        n.jsxs('div', {
                          className: 'flex-1 min-w-0',
                          children: [
                            n.jsxs('div', {
                              className: 'flex items-center gap-2',
                              children: [
                                n.jsx('span', {
                                  className: 'text-sm font-medium text-[var(--cs-text-primary)]',
                                  children: j.role,
                                }),
                                b &&
                                  n.jsx('span', {
                                    className:
                                      'text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[var(--cs-text-tertiary)]',
                                    children: 'Added',
                                  }),
                              ],
                            }),
                            n.jsx('p', {
                              className: 'text-xs text-[var(--cs-text-tertiary)] mt-0.5',
                              children: j.subtitle,
                            }),
                            n.jsx('p', {
                              className: 'text-xs text-[var(--cs-text-tertiary)] mt-1 line-clamp-2',
                              children: j.goal,
                            }),
                          ],
                        }),
                      ],
                    }),
                  },
                  j.id,
                );
              }),
              S.length === 0 &&
                n.jsx('p', {
                  className: 'text-xs text-[var(--cs-text-tertiary)] text-center py-4',
                  children: 'No agents match your search.',
                }),
            ],
          }),
        ],
      });
}
const Mg = {
  idle: { dot: 'bg-gray-400', label: 'Idle' },
  working: { dot: 'bg-amber-400 animate-flicker', label: 'Working' },
  error: { dot: 'bg-red-400', label: 'Error' },
  completed: { dot: 'bg-emerald-400', label: 'Completed' },
};
function Pg({ agents: a, selectedAgentId: s, onSelect: i, onAdd: l, onUpdate: c, onDelete: u }) {
  const [p, h] = N.useState(!1),
    m = a.find((C) => C.id === s),
    g = (C) => {
      if ('id' in C && C.id && a.some((R) => R.id === C.id)) {
        const { id: R, ...j } = C;
        c(R, j);
      } else l(C);
      (i(null), h(!1));
    },
    v = () => {
      (i(null), h(!1));
    },
    y = (C) => {
      (u(C), i(null));
    },
    S = a.map((C) => C.id);
  return m
    ? n.jsx('div', {
        className: 'h-full overflow-y-auto scrollbar-thin',
        children: n.jsx(xp, { agent: m, onSave: g, onCancel: v, onDelete: y, existingAgentIds: S }),
      })
    : p
      ? n.jsx('div', {
          className: 'h-full overflow-y-auto scrollbar-thin',
          children: n.jsx(xp, { onSave: g, onCancel: v, existingAgentIds: S }),
        })
      : n.jsxs('div', {
          className: 'h-full flex flex-col',
          children: [
            n.jsx('div', {
              className: 'flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2',
              children:
                a.length === 0
                  ? n.jsxs('div', {
                      className: 'flex flex-col items-center justify-center py-12 text-center',
                      children: [
                        n.jsx('div', {
                          className:
                            'w-10 h-10 rounded-full bg-indigo-600/10 flex items-center justify-center mb-3',
                          children: n.jsxs('svg', {
                            width: '20',
                            height: '20',
                            viewBox: '0 0 20 20',
                            fill: 'none',
                            stroke: 'currentColor',
                            strokeWidth: '1.5',
                            className: 'text-indigo-400',
                            children: [
                              n.jsx('circle', { cx: '10', cy: '7', r: '3' }),
                              n.jsx('path', { d: 'M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6' }),
                            ],
                          }),
                        }),
                        n.jsx('p', {
                          className: 'text-sm text-[var(--cs-text-tertiary)]',
                          children: 'No agents yet',
                        }),
                        n.jsx('p', {
                          className: 'text-xs text-[var(--cs-text-tertiary)] mt-1',
                          children: 'Add your first agent to get started',
                        }),
                      ],
                    })
                  : a.map((C) => {
                      const R = Mg[C.status];
                      return n.jsx(
                        'button',
                        {
                          onClick: () => i(C.id),
                          className:
                            'w-full text-left p-3 rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/50 hover:bg-white/5 transition-all group',
                          children: n.jsxs('div', {
                            className: 'flex items-start gap-2.5',
                            children: [
                              n.jsx('div', {
                                className: 'w-3 h-3 rounded-full mt-0.5 shrink-0',
                                style: { backgroundColor: C.color },
                              }),
                              n.jsxs('div', {
                                className: 'flex-1 min-w-0',
                                children: [
                                  n.jsxs('div', {
                                    className: 'flex items-center justify-between gap-2',
                                    children: [
                                      n.jsx('span', {
                                        className:
                                          'text-sm font-medium text-[var(--cs-text-primary)] truncate',
                                        children: C.role,
                                      }),
                                      n.jsxs('div', {
                                        className: 'flex items-center gap-1.5 shrink-0',
                                        children: [
                                          n.jsx('div', {
                                            className: `w-1.5 h-1.5 rounded-full ${R.dot}`,
                                          }),
                                          n.jsx('span', {
                                            className: 'text-[10px] text-[var(--cs-text-tertiary)]',
                                            children: R.label,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  C.goal &&
                                    n.jsx('p', {
                                      className:
                                        'text-xs text-[var(--cs-text-tertiary)] mt-1 truncate',
                                      children: C.goal,
                                    }),
                                  C.tools.length > 0 &&
                                    n.jsx('div', {
                                      className: 'flex flex-wrap gap-1 mt-2',
                                      children: C.tools.map((j) =>
                                        n.jsx(
                                          'span',
                                          {
                                            className:
                                              'px-1.5 py-0.5 text-[10px] rounded bg-white/5 text-[var(--cs-text-tertiary)]',
                                            children: j,
                                          },
                                          j,
                                        ),
                                      ),
                                    }),
                                ],
                              }),
                            ],
                          }),
                        },
                        C.id,
                      );
                    }),
            }),
            n.jsx('div', {
              className: 'p-3 border-t border-[var(--cs-border-subtle)]',
              children: n.jsxs('button', {
                onClick: () => h(!0),
                className:
                  'w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-dashed border-[var(--cs-border-subtle)] text-[var(--cs-text-secondary)] hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-600/5 transition-colors',
                children: [
                  n.jsx('svg', {
                    width: '14',
                    height: '14',
                    viewBox: '0 0 14 14',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    children: n.jsx('path', { d: 'M7 1v12M1 7h12' }),
                  }),
                  'Add Agent',
                ],
              }),
            }),
          ],
        });
}
function gp({ task: a, agents: s, tasks: i, onSave: l, onCancel: c, onDelete: u }) {
  const [p, h] = N.useState((a == null ? void 0 : a.description) ?? ''),
    [m, g] = N.useState((a == null ? void 0 : a.agentId) ?? ''),
    [v, y] = N.useState((a == null ? void 0 : a.dependencies) ?? []),
    [S, C] = N.useState((a == null ? void 0 : a.expectedOutput) ?? ''),
    [R, j] = N.useState(!1),
    b = i.filter((G) => G.id !== (a == null ? void 0 : a.id)),
    T = N.useCallback((G) => {
      y((Q) => (Q.includes(G) ? Q.filter((pe) => pe !== G) : [...Q, G]));
    }, []),
    z = N.useCallback(() => {
      p.trim() &&
        l(
          a
            ? { id: a.id, description: p, agentId: m, dependencies: v, expectedOutput: S }
            : { description: p, agentId: m, dependencies: v, expectedOutput: S },
        );
    }, [a, p, m, v, S, l]),
    W = N.useCallback(() => {
      a && u && u(a.id);
    }, [a, u]);
  return n.jsxs('div', {
    className: 'p-4 space-y-4',
    children: [
      n.jsx('div', {
        className: 'flex items-center justify-between',
        children: n.jsx('h3', {
          className: 'text-sm font-semibold text-[var(--cs-text-primary)]',
          children: a ? 'Edit Task' : 'New Task',
        }),
      }),
      n.jsxs('div', {
        className: 'space-y-1.5',
        children: [
          n.jsxs('label', {
            className: 'text-xs font-medium text-[var(--cs-text-secondary)]',
            children: ['Description ', n.jsx('span', { className: 'text-red-400', children: '*' })],
          }),
          n.jsx('textarea', {
            value: p,
            onChange: (G) => h(G.target.value),
            placeholder: 'Describe what this task should accomplish...',
            rows: 3,
            className:
              'w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors resize-none',
          }),
        ],
      }),
      n.jsxs('div', {
        className: 'space-y-1.5',
        children: [
          n.jsx('label', {
            className: 'text-xs font-medium text-[var(--cs-text-secondary)]',
            children: 'Assigned Agent',
          }),
          n.jsxs('select', {
            value: m,
            onChange: (G) => g(G.target.value),
            className:
              'w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] focus-ring transition-colors',
            children: [
              n.jsx('option', { value: '', children: 'Unassigned' }),
              s.map((G) => n.jsx('option', { value: G.id, children: G.role }, G.id)),
            ],
          }),
        ],
      }),
      b.length > 0 &&
        n.jsxs('div', {
          className: 'space-y-1.5',
          children: [
            n.jsx('label', {
              className: 'text-xs font-medium text-[var(--cs-text-secondary)]',
              children: 'Dependencies',
            }),
            n.jsx('div', {
              className: 'space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin',
              children: b.map((G) =>
                n.jsxs(
                  'label',
                  {
                    className:
                      'flex items-start gap-2.5 p-2 rounded-md bg-[var(--cs-surface-app)]/50 border border-[var(--cs-border-subtle)] cursor-pointer hover:bg-white/5 transition-colors',
                    children: [
                      n.jsx('input', {
                        type: 'checkbox',
                        checked: v.includes(G.id),
                        onChange: () => T(G.id),
                        className:
                          'mt-0.5 rounded border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0',
                      }),
                      n.jsx('span', {
                        className: 'text-xs text-[var(--cs-text-secondary)] line-clamp-2',
                        children: G.description,
                      }),
                    ],
                  },
                  G.id,
                ),
              ),
            }),
          ],
        }),
      n.jsxs('div', {
        className: 'space-y-1.5',
        children: [
          n.jsx('label', {
            className: 'text-xs font-medium text-[var(--cs-text-secondary)]',
            children: 'Expected Output',
          }),
          n.jsx('textarea', {
            value: S,
            onChange: (G) => C(G.target.value),
            placeholder: 'What output should this task produce?',
            rows: 2,
            className:
              'w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors resize-none',
          }),
        ],
      }),
      n.jsxs('div', {
        className: 'flex items-center gap-2 pt-2 border-t border-[var(--cs-border-subtle)]',
        children: [
          n.jsx('button', {
            onClick: z,
            disabled: !p.trim(),
            className:
              'flex-1 px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
            children: a ? 'Save' : 'Add Task',
          }),
          n.jsx('button', {
            onClick: c,
            className:
              'px-3 py-2 text-sm font-medium rounded-md text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-white/5 transition-colors',
            children: 'Cancel',
          }),
          a &&
            u &&
            n.jsx(n.Fragment, {
              children: R
                ? n.jsxs('div', {
                    className: 'flex items-center gap-1.5',
                    children: [
                      n.jsx('button', {
                        onClick: W,
                        className:
                          'px-2.5 py-1.5 text-xs font-medium rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors',
                        children: 'Confirm',
                      }),
                      n.jsx('button', {
                        onClick: () => j(!1),
                        className:
                          'px-2.5 py-1.5 text-xs font-medium rounded-md text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] transition-colors',
                        children: 'No',
                      }),
                    ],
                  })
                : n.jsx('button', {
                    onClick: () => j(!0),
                    className:
                      'px-3 py-2 text-sm font-medium rounded-md text-red-400 hover:bg-red-600/10 transition-colors',
                    children: 'Delete',
                  }),
            }),
        ],
      }),
    ],
  });
}
const Dg = {
  pending: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Pending' },
  running: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Running' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Completed' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Failed' },
};
function zg({
  tasks: a,
  agents: s,
  selectedTaskId: i,
  onSelect: l,
  onAdd: c,
  onUpdate: u,
  onDelete: p,
}) {
  const [h, m] = N.useState(!1),
    g = a.find((R) => R.id === i),
    v = (R) => s.find((j) => j.id === R),
    y = (R) => {
      if ('id' in R) {
        const { id: j, ...b } = R;
        u(j, b);
      } else c(R);
      (l(null), m(!1));
    },
    S = () => {
      (l(null), m(!1));
    },
    C = (R) => {
      (p(R), l(null));
    };
  return g
    ? n.jsx('div', {
        className: 'h-full overflow-y-auto scrollbar-thin',
        children: n.jsx(gp, { task: g, agents: s, tasks: a, onSave: y, onCancel: S, onDelete: C }),
      })
    : h
      ? n.jsx('div', {
          className: 'h-full overflow-y-auto scrollbar-thin',
          children: n.jsx(gp, { agents: s, tasks: a, onSave: y, onCancel: S }),
        })
      : n.jsxs('div', {
          className: 'h-full flex flex-col',
          children: [
            n.jsx('div', {
              className: 'flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2',
              children:
                a.length === 0
                  ? n.jsxs('div', {
                      className: 'flex flex-col items-center justify-center py-12 text-center',
                      children: [
                        n.jsx('div', {
                          className:
                            'w-10 h-10 rounded-full bg-indigo-600/10 flex items-center justify-center mb-3',
                          children: n.jsxs('svg', {
                            width: '20',
                            height: '20',
                            viewBox: '0 0 20 20',
                            fill: 'none',
                            stroke: 'currentColor',
                            strokeWidth: '1.5',
                            className: 'text-indigo-400',
                            children: [
                              n.jsx('rect', { x: '3', y: '3', width: '14', height: '14', rx: '2' }),
                              n.jsx('path', { d: 'M7 10l2 2 4-4' }),
                            ],
                          }),
                        }),
                        n.jsx('p', {
                          className: 'text-sm text-[var(--cs-text-tertiary)]',
                          children: 'No tasks yet',
                        }),
                        n.jsx('p', {
                          className: 'text-xs text-[var(--cs-text-tertiary)] mt-1',
                          children: 'Add your first task to get started',
                        }),
                      ],
                    })
                  : a.map((R) => {
                      const j = Dg[R.status],
                        b = v(R.agentId);
                      return n.jsx(
                        'button',
                        {
                          onClick: () => l(R.id),
                          className:
                            'w-full text-left p-3 rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/50 hover:bg-white/5 transition-all group',
                          children: n.jsxs('div', {
                            className: 'space-y-2',
                            children: [
                              n.jsx('p', {
                                className: 'text-sm text-[var(--cs-text-primary)] line-clamp-2',
                                children: R.description,
                              }),
                              n.jsxs('div', {
                                className: 'flex items-center justify-between gap-2',
                                children: [
                                  n.jsxs('div', {
                                    className: 'flex items-center gap-2 min-w-0',
                                    children: [
                                      b
                                        ? n.jsxs('div', {
                                            className: 'flex items-center gap-1.5 min-w-0',
                                            children: [
                                              n.jsx('div', {
                                                className: 'w-2 h-2 rounded-full shrink-0',
                                                style: { backgroundColor: b.color },
                                              }),
                                              n.jsx('span', {
                                                className:
                                                  'text-xs text-[var(--cs-text-tertiary)] truncate',
                                                children: b.role,
                                              }),
                                            ],
                                          })
                                        : n.jsx('span', {
                                            className:
                                              'text-xs text-[var(--cs-text-tertiary)] italic',
                                            children: 'Unassigned',
                                          }),
                                      R.dependencies.length > 0 &&
                                        n.jsxs('span', {
                                          className:
                                            'px-1.5 py-0.5 text-[10px] rounded bg-white/5 text-[var(--cs-text-tertiary)] shrink-0',
                                          children: [
                                            R.dependencies.length,
                                            ' dep',
                                            R.dependencies.length !== 1 ? 's' : '',
                                          ],
                                        }),
                                    ],
                                  }),
                                  n.jsx('span', {
                                    className: `px-1.5 py-0.5 text-[10px] rounded shrink-0 ${j.bg} ${j.text}`,
                                    children: j.label,
                                  }),
                                ],
                              }),
                            ],
                          }),
                        },
                        R.id,
                      );
                    }),
            }),
            n.jsx('div', {
              className: 'p-3 border-t border-[var(--cs-border-subtle)]',
              children: n.jsxs('button', {
                onClick: () => m(!0),
                className:
                  'w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-dashed border-[var(--cs-border-subtle)] text-[var(--cs-text-secondary)] hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-600/5 transition-colors',
                children: [
                  n.jsx('svg', {
                    width: '14',
                    height: '14',
                    viewBox: '0 0 14 14',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    children: n.jsx('path', { d: 'M7 1v12M1 7h12' }),
                  }),
                  'Add Task',
                ],
              }),
            }),
          ],
        });
}
function $g({
  isOpen: a,
  onClose: s,
  agents: i,
  tasks: l,
  selectedNodeId: c,
  onAgentAdd: u,
  onAgentUpdate: p,
  onAgentDelete: h,
  onTaskAdd: m,
  onTaskUpdate: g,
  onTaskDelete: v,
  onNodeSelect: y,
}) {
  const [S, C] = N.useState('agents'),
    R = i.find((z) => z.id === c) ? c : null,
    j = l.find((z) => z.id === c) ? c : null,
    b = N.useCallback(
      (z) => {
        (y(z), z && C('agents'));
      },
      [y],
    ),
    T = N.useCallback(
      (z) => {
        (y(z), z && C('tasks'));
      },
      [y],
    );
  return n.jsxs(n.Fragment, {
    children: [
      a && n.jsx('div', { className: 'fixed inset-0 bg-black/40 z-40 lg:hidden', onClick: s }),
      n.jsxs('div', {
        className: `fixed top-0 right-0 h-full w-[400px] max-w-full z-50 flex flex-col glass border-l border-[var(--cs-border-subtle)] transition-transform duration-300 ease-in-out ${a ? 'translate-x-0' : 'translate-x-full'}`,
        children: [
          n.jsxs('div', {
            className:
              'flex items-center justify-between px-4 py-3 border-b border-[var(--cs-border-subtle)]',
            children: [
              n.jsx('h2', {
                className: 'text-base font-semibold text-[var(--cs-text-primary)]',
                children: 'Crew',
              }),
              n.jsx('button', {
                onClick: s,
                className:
                  'p-1.5 rounded-md text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-primary)] hover:bg-white/5 transition-colors',
                'aria-label': 'Close panel',
                children: n.jsx('svg', {
                  width: '16',
                  height: '16',
                  viewBox: '0 0 16 16',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: '2',
                  strokeLinecap: 'round',
                  children: n.jsx('path', { d: 'M4 4l8 8M12 4l-8 8' }),
                }),
              }),
            ],
          }),
          n.jsxs('div', {
            className: 'flex border-b border-[var(--cs-border-subtle)]',
            children: [
              n.jsxs('button', {
                onClick: () => C('agents'),
                className: `flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${S === 'agents' ? 'text-indigo-400' : 'text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)]'}`,
                children: [
                  n.jsxs('span', {
                    className: 'flex items-center justify-center gap-2',
                    children: [
                      'Agents',
                      n.jsx('span', {
                        className: `text-xs px-1.5 py-0.5 rounded-full ${S === 'agents' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-white/5 text-[var(--cs-text-tertiary)]'}`,
                        children: i.length,
                      }),
                    ],
                  }),
                  S === 'agents' &&
                    n.jsx('div', {
                      className: 'absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500',
                    }),
                ],
              }),
              n.jsxs('button', {
                onClick: () => C('tasks'),
                className: `flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${S === 'tasks' ? 'text-indigo-400' : 'text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)]'}`,
                children: [
                  n.jsxs('span', {
                    className: 'flex items-center justify-center gap-2',
                    children: [
                      'Tasks',
                      n.jsx('span', {
                        className: `text-xs px-1.5 py-0.5 rounded-full ${S === 'tasks' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-white/5 text-[var(--cs-text-tertiary)]'}`,
                        children: l.length,
                      }),
                    ],
                  }),
                  S === 'tasks' &&
                    n.jsx('div', {
                      className: 'absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500',
                    }),
                ],
              }),
            ],
          }),
          n.jsx('div', {
            className: 'flex-1 overflow-hidden',
            children:
              S === 'agents'
                ? n.jsx(Pg, {
                    agents: i,
                    selectedAgentId: R,
                    onSelect: b,
                    onAdd: u,
                    onUpdate: p,
                    onDelete: h,
                  })
                : n.jsx(zg, {
                    tasks: l,
                    agents: i,
                    selectedTaskId: j,
                    onSelect: T,
                    onAdd: m,
                    onUpdate: g,
                    onDelete: v,
                  }),
          }),
        ],
      }),
    ],
  });
}
var ul = { exports: {} },
  vp;
function Ug() {
  return (
    vp ||
      ((vp = 1),
      (function (a) {
        var s = Object.prototype.hasOwnProperty,
          i = '~';
        function l() {}
        Object.create && ((l.prototype = Object.create(null)), new l().__proto__ || (i = !1));
        function c(m, g, v) {
          ((this.fn = m), (this.context = g), (this.once = v || !1));
        }
        function u(m, g, v, y, S) {
          if (typeof v != 'function') throw new TypeError('The listener must be a function');
          var C = new c(v, y || m, S),
            R = i ? i + g : g;
          return (
            m._events[R]
              ? m._events[R].fn
                ? (m._events[R] = [m._events[R], C])
                : m._events[R].push(C)
              : ((m._events[R] = C), m._eventsCount++),
            m
          );
        }
        function p(m, g) {
          --m._eventsCount === 0 ? (m._events = new l()) : delete m._events[g];
        }
        function h() {
          ((this._events = new l()), (this._eventsCount = 0));
        }
        ((h.prototype.eventNames = function () {
          var g = [],
            v,
            y;
          if (this._eventsCount === 0) return g;
          for (y in (v = this._events)) s.call(v, y) && g.push(i ? y.slice(1) : y);
          return Object.getOwnPropertySymbols ? g.concat(Object.getOwnPropertySymbols(v)) : g;
        }),
          (h.prototype.listeners = function (g) {
            var v = i ? i + g : g,
              y = this._events[v];
            if (!y) return [];
            if (y.fn) return [y.fn];
            for (var S = 0, C = y.length, R = new Array(C); S < C; S++) R[S] = y[S].fn;
            return R;
          }),
          (h.prototype.listenerCount = function (g) {
            var v = i ? i + g : g,
              y = this._events[v];
            return y ? (y.fn ? 1 : y.length) : 0;
          }),
          (h.prototype.emit = function (g, v, y, S, C, R) {
            var j = i ? i + g : g;
            if (!this._events[j]) return !1;
            var b = this._events[j],
              T = arguments.length,
              z,
              W;
            if (b.fn) {
              switch ((b.once && this.removeListener(g, b.fn, void 0, !0), T)) {
                case 1:
                  return (b.fn.call(b.context), !0);
                case 2:
                  return (b.fn.call(b.context, v), !0);
                case 3:
                  return (b.fn.call(b.context, v, y), !0);
                case 4:
                  return (b.fn.call(b.context, v, y, S), !0);
                case 5:
                  return (b.fn.call(b.context, v, y, S, C), !0);
                case 6:
                  return (b.fn.call(b.context, v, y, S, C, R), !0);
              }
              for (W = 1, z = new Array(T - 1); W < T; W++) z[W - 1] = arguments[W];
              b.fn.apply(b.context, z);
            } else {
              var G = b.length,
                Q;
              for (W = 0; W < G; W++)
                switch ((b[W].once && this.removeListener(g, b[W].fn, void 0, !0), T)) {
                  case 1:
                    b[W].fn.call(b[W].context);
                    break;
                  case 2:
                    b[W].fn.call(b[W].context, v);
                    break;
                  case 3:
                    b[W].fn.call(b[W].context, v, y);
                    break;
                  case 4:
                    b[W].fn.call(b[W].context, v, y, S);
                    break;
                  default:
                    if (!z) for (Q = 1, z = new Array(T - 1); Q < T; Q++) z[Q - 1] = arguments[Q];
                    b[W].fn.apply(b[W].context, z);
                }
            }
            return !0;
          }),
          (h.prototype.on = function (g, v, y) {
            return u(this, g, v, y, !1);
          }),
          (h.prototype.once = function (g, v, y) {
            return u(this, g, v, y, !0);
          }),
          (h.prototype.removeListener = function (g, v, y, S) {
            var C = i ? i + g : g;
            if (!this._events[C]) return this;
            if (!v) return (p(this, C), this);
            var R = this._events[C];
            if (R.fn) R.fn === v && (!S || R.once) && (!y || R.context === y) && p(this, C);
            else {
              for (var j = 0, b = [], T = R.length; j < T; j++)
                (R[j].fn !== v || (S && !R[j].once) || (y && R[j].context !== y)) && b.push(R[j]);
              b.length ? (this._events[C] = b.length === 1 ? b[0] : b) : p(this, C);
            }
            return this;
          }),
          (h.prototype.removeAllListeners = function (g) {
            var v;
            return (
              g
                ? ((v = i ? i + g : g), this._events[v] && p(this, v))
                : ((this._events = new l()), (this._eventsCount = 0)),
              this
            );
          }),
          (h.prototype.off = h.prototype.removeListener),
          (h.prototype.addListener = h.prototype.on),
          (h.prefixed = i),
          (h.EventEmitter = h),
          (a.exports = h));
      })(ul)),
    ul.exports
  );
}
var Wg = Ug();
const Fl = Bp(Wg);
var Ce;
(function (a) {
  a.assertEqual = (c) => {};
  function s(c) {}
  a.assertIs = s;
  function i(c) {
    throw new Error();
  }
  ((a.assertNever = i),
    (a.arrayToEnum = (c) => {
      const u = {};
      for (const p of c) u[p] = p;
      return u;
    }),
    (a.getValidEnumValues = (c) => {
      const u = a.objectKeys(c).filter((h) => typeof c[c[h]] != 'number'),
        p = {};
      for (const h of u) p[h] = c[h];
      return a.objectValues(p);
    }),
    (a.objectValues = (c) =>
      a.objectKeys(c).map(function (u) {
        return c[u];
      })),
    (a.objectKeys =
      typeof Object.keys == 'function'
        ? (c) => Object.keys(c)
        : (c) => {
            const u = [];
            for (const p in c) Object.prototype.hasOwnProperty.call(c, p) && u.push(p);
            return u;
          }),
    (a.find = (c, u) => {
      for (const p of c) if (u(p)) return p;
    }),
    (a.isInteger =
      typeof Number.isInteger == 'function'
        ? (c) => Number.isInteger(c)
        : (c) => typeof c == 'number' && Number.isFinite(c) && Math.floor(c) === c));
  function l(c, u = ' | ') {
    return c.map((p) => (typeof p == 'string' ? `'${p}'` : p)).join(u);
  }
  ((a.joinValues = l),
    (a.jsonStringifyReplacer = (c, u) => (typeof u == 'bigint' ? u.toString() : u)));
})(Ce || (Ce = {}));
var yp;
(function (a) {
  a.mergeShapes = (s, i) => ({ ...s, ...i });
})(yp || (yp = {}));
const ne = Ce.arrayToEnum([
    'string',
    'nan',
    'number',
    'integer',
    'float',
    'boolean',
    'date',
    'bigint',
    'symbol',
    'function',
    'undefined',
    'null',
    'array',
    'object',
    'unknown',
    'promise',
    'void',
    'never',
    'map',
    'set',
  ]),
  Or = (a) => {
    switch (typeof a) {
      case 'undefined':
        return ne.undefined;
      case 'string':
        return ne.string;
      case 'number':
        return Number.isNaN(a) ? ne.nan : ne.number;
      case 'boolean':
        return ne.boolean;
      case 'function':
        return ne.function;
      case 'bigint':
        return ne.bigint;
      case 'symbol':
        return ne.symbol;
      case 'object':
        return Array.isArray(a)
          ? ne.array
          : a === null
            ? ne.null
            : a.then && typeof a.then == 'function' && a.catch && typeof a.catch == 'function'
              ? ne.promise
              : typeof Map < 'u' && a instanceof Map
                ? ne.map
                : typeof Set < 'u' && a instanceof Set
                  ? ne.set
                  : typeof Date < 'u' && a instanceof Date
                    ? ne.date
                    : ne.object;
      default:
        return ne.unknown;
    }
  },
  K = Ce.arrayToEnum([
    'invalid_type',
    'invalid_literal',
    'custom',
    'invalid_union',
    'invalid_union_discriminator',
    'invalid_enum_value',
    'unrecognized_keys',
    'invalid_arguments',
    'invalid_return_type',
    'invalid_date',
    'invalid_string',
    'too_small',
    'too_big',
    'invalid_intersection_types',
    'not_multiple_of',
    'not_finite',
  ]);
class Vt extends Error {
  get errors() {
    return this.issues;
  }
  constructor(s) {
    (super(),
      (this.issues = []),
      (this.addIssue = (l) => {
        this.issues = [...this.issues, l];
      }),
      (this.addIssues = (l = []) => {
        this.issues = [...this.issues, ...l];
      }));
    const i = new.target.prototype;
    (Object.setPrototypeOf ? Object.setPrototypeOf(this, i) : (this.__proto__ = i),
      (this.name = 'ZodError'),
      (this.issues = s));
  }
  format(s) {
    const i =
        s ||
        function (u) {
          return u.message;
        },
      l = { _errors: [] },
      c = (u) => {
        for (const p of u.issues)
          if (p.code === 'invalid_union') p.unionErrors.map(c);
          else if (p.code === 'invalid_return_type') c(p.returnTypeError);
          else if (p.code === 'invalid_arguments') c(p.argumentsError);
          else if (p.path.length === 0) l._errors.push(i(p));
          else {
            let h = l,
              m = 0;
            for (; m < p.path.length; ) {
              const g = p.path[m];
              (m === p.path.length - 1
                ? ((h[g] = h[g] || { _errors: [] }), h[g]._errors.push(i(p)))
                : (h[g] = h[g] || { _errors: [] }),
                (h = h[g]),
                m++);
            }
          }
      };
    return (c(this), l);
  }
  static assert(s) {
    if (!(s instanceof Vt)) throw new Error(`Not a ZodError: ${s}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, Ce.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(s = (i) => i.message) {
    const i = {},
      l = [];
    for (const c of this.issues)
      if (c.path.length > 0) {
        const u = c.path[0];
        ((i[u] = i[u] || []), i[u].push(s(c)));
      } else l.push(s(c));
    return { formErrors: l, fieldErrors: i };
  }
  get formErrors() {
    return this.flatten();
  }
}
Vt.create = (a) => new Vt(a);
const yl = (a, s) => {
  let i;
  switch (a.code) {
    case K.invalid_type:
      a.received === ne.undefined
        ? (i = 'Required')
        : (i = `Expected ${a.expected}, received ${a.received}`);
      break;
    case K.invalid_literal:
      i = `Invalid literal value, expected ${JSON.stringify(a.expected, Ce.jsonStringifyReplacer)}`;
      break;
    case K.unrecognized_keys:
      i = `Unrecognized key(s) in object: ${Ce.joinValues(a.keys, ', ')}`;
      break;
    case K.invalid_union:
      i = 'Invalid input';
      break;
    case K.invalid_union_discriminator:
      i = `Invalid discriminator value. Expected ${Ce.joinValues(a.options)}`;
      break;
    case K.invalid_enum_value:
      i = `Invalid enum value. Expected ${Ce.joinValues(a.options)}, received '${a.received}'`;
      break;
    case K.invalid_arguments:
      i = 'Invalid function arguments';
      break;
    case K.invalid_return_type:
      i = 'Invalid function return type';
      break;
    case K.invalid_date:
      i = 'Invalid date';
      break;
    case K.invalid_string:
      typeof a.validation == 'object'
        ? 'includes' in a.validation
          ? ((i = `Invalid input: must include "${a.validation.includes}"`),
            typeof a.validation.position == 'number' &&
              (i = `${i} at one or more positions greater than or equal to ${a.validation.position}`))
          : 'startsWith' in a.validation
            ? (i = `Invalid input: must start with "${a.validation.startsWith}"`)
            : 'endsWith' in a.validation
              ? (i = `Invalid input: must end with "${a.validation.endsWith}"`)
              : Ce.assertNever(a.validation)
        : a.validation !== 'regex'
          ? (i = `Invalid ${a.validation}`)
          : (i = 'Invalid');
      break;
    case K.too_small:
      a.type === 'array'
        ? (i = `Array must contain ${a.exact ? 'exactly' : a.inclusive ? 'at least' : 'more than'} ${a.minimum} element(s)`)
        : a.type === 'string'
          ? (i = `String must contain ${a.exact ? 'exactly' : a.inclusive ? 'at least' : 'over'} ${a.minimum} character(s)`)
          : a.type === 'number'
            ? (i = `Number must be ${a.exact ? 'exactly equal to ' : a.inclusive ? 'greater than or equal to ' : 'greater than '}${a.minimum}`)
            : a.type === 'bigint'
              ? (i = `Number must be ${a.exact ? 'exactly equal to ' : a.inclusive ? 'greater than or equal to ' : 'greater than '}${a.minimum}`)
              : a.type === 'date'
                ? (i = `Date must be ${a.exact ? 'exactly equal to ' : a.inclusive ? 'greater than or equal to ' : 'greater than '}${new Date(Number(a.minimum))}`)
                : (i = 'Invalid input');
      break;
    case K.too_big:
      a.type === 'array'
        ? (i = `Array must contain ${a.exact ? 'exactly' : a.inclusive ? 'at most' : 'less than'} ${a.maximum} element(s)`)
        : a.type === 'string'
          ? (i = `String must contain ${a.exact ? 'exactly' : a.inclusive ? 'at most' : 'under'} ${a.maximum} character(s)`)
          : a.type === 'number'
            ? (i = `Number must be ${a.exact ? 'exactly' : a.inclusive ? 'less than or equal to' : 'less than'} ${a.maximum}`)
            : a.type === 'bigint'
              ? (i = `BigInt must be ${a.exact ? 'exactly' : a.inclusive ? 'less than or equal to' : 'less than'} ${a.maximum}`)
              : a.type === 'date'
                ? (i = `Date must be ${a.exact ? 'exactly' : a.inclusive ? 'smaller than or equal to' : 'smaller than'} ${new Date(Number(a.maximum))}`)
                : (i = 'Invalid input');
      break;
    case K.custom:
      i = 'Invalid input';
      break;
    case K.invalid_intersection_types:
      i = 'Intersection results could not be merged';
      break;
    case K.not_multiple_of:
      i = `Number must be a multiple of ${a.multipleOf}`;
      break;
    case K.not_finite:
      i = 'Number must be finite';
      break;
    default:
      ((i = s.defaultError), Ce.assertNever(a));
  }
  return { message: i };
};
let Bg = yl;
function Fg() {
  return Bg;
}
const Vg = (a) => {
  const { data: s, path: i, errorMaps: l, issueData: c } = a,
    u = [...i, ...(c.path || [])],
    p = { ...c, path: u };
  if (c.message !== void 0) return { ...c, path: u, message: c.message };
  let h = '';
  const m = l
    .filter((g) => !!g)
    .slice()
    .reverse();
  for (const g of m) h = g(p, { data: s, defaultError: h }).message;
  return { ...c, path: u, message: h };
};
function X(a, s) {
  const i = Fg(),
    l = Vg({
      issueData: s,
      data: a.data,
      path: a.path,
      errorMaps: [a.common.contextualErrorMap, a.schemaErrorMap, i, i === yl ? void 0 : yl].filter(
        (c) => !!c,
      ),
    });
  a.common.issues.push(l);
}
class mt {
  constructor() {
    this.value = 'valid';
  }
  dirty() {
    this.value === 'valid' && (this.value = 'dirty');
  }
  abort() {
    this.value !== 'aborted' && (this.value = 'aborted');
  }
  static mergeArray(s, i) {
    const l = [];
    for (const c of i) {
      if (c.status === 'aborted') return xe;
      (c.status === 'dirty' && s.dirty(), l.push(c.value));
    }
    return { status: s.value, value: l };
  }
  static async mergeObjectAsync(s, i) {
    const l = [];
    for (const c of i) {
      const u = await c.key,
        p = await c.value;
      l.push({ key: u, value: p });
    }
    return mt.mergeObjectSync(s, l);
  }
  static mergeObjectSync(s, i) {
    const l = {};
    for (const c of i) {
      const { key: u, value: p } = c;
      if (u.status === 'aborted' || p.status === 'aborted') return xe;
      (u.status === 'dirty' && s.dirty(),
        p.status === 'dirty' && s.dirty(),
        u.value !== '__proto__' && (typeof p.value < 'u' || c.alwaysSet) && (l[u.value] = p.value));
    }
    return { status: s.value, value: l };
  }
}
const xe = Object.freeze({ status: 'aborted' }),
  Rs = (a) => ({ status: 'dirty', value: a }),
  Lt = (a) => ({ status: 'valid', value: a }),
  wp = (a) => a.status === 'aborted',
  kp = (a) => a.status === 'dirty',
  Mn = (a) => a.status === 'valid',
  Xi = (a) => typeof Promise < 'u' && a instanceof Promise;
var ae;
(function (a) {
  ((a.errToObj = (s) => (typeof s == 'string' ? { message: s } : s || {})),
    (a.toString = (s) => (typeof s == 'string' ? s : s == null ? void 0 : s.message)));
})(ae || (ae = {}));
class Jt {
  constructor(s, i, l, c) {
    ((this._cachedPath = []),
      (this.parent = s),
      (this.data = i),
      (this._path = l),
      (this._key = c));
  }
  get path() {
    return (
      this._cachedPath.length ||
        (Array.isArray(this._key)
          ? this._cachedPath.push(...this._path, ...this._key)
          : this._cachedPath.push(...this._path, this._key)),
      this._cachedPath
    );
  }
}
const bp = (a, s) => {
  if (Mn(s)) return { success: !0, data: s.value };
  if (!a.common.issues.length) throw new Error('Validation failed but no issues detected.');
  return {
    success: !1,
    get error() {
      if (this._error) return this._error;
      const i = new Vt(a.common.issues);
      return ((this._error = i), this._error);
    },
  };
};
function ye(a) {
  if (!a) return {};
  const { errorMap: s, invalid_type_error: i, required_error: l, description: c } = a;
  if (s && (i || l))
    throw new Error(
      `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
    );
  return s
    ? { errorMap: s, description: c }
    : {
        errorMap: (p, h) => {
          const { message: m } = a;
          return p.code === 'invalid_enum_value'
            ? { message: m ?? h.defaultError }
            : typeof h.data > 'u'
              ? { message: m ?? l ?? h.defaultError }
              : p.code !== 'invalid_type'
                ? { message: h.defaultError }
                : { message: m ?? i ?? h.defaultError };
        },
        description: c,
      };
}
class be {
  get description() {
    return this._def.description;
  }
  _getType(s) {
    return Or(s.data);
  }
  _getOrReturnCtx(s, i) {
    return (
      i || {
        common: s.parent.common,
        data: s.data,
        parsedType: Or(s.data),
        schemaErrorMap: this._def.errorMap,
        path: s.path,
        parent: s.parent,
      }
    );
  }
  _processInputParams(s) {
    return {
      status: new mt(),
      ctx: {
        common: s.parent.common,
        data: s.data,
        parsedType: Or(s.data),
        schemaErrorMap: this._def.errorMap,
        path: s.path,
        parent: s.parent,
      },
    };
  }
  _parseSync(s) {
    const i = this._parse(s);
    if (Xi(i)) throw new Error('Synchronous parse encountered promise.');
    return i;
  }
  _parseAsync(s) {
    const i = this._parse(s);
    return Promise.resolve(i);
  }
  parse(s, i) {
    const l = this.safeParse(s, i);
    if (l.success) return l.data;
    throw l.error;
  }
  safeParse(s, i) {
    const l = {
        common: {
          issues: [],
          async: (i == null ? void 0 : i.async) ?? !1,
          contextualErrorMap: i == null ? void 0 : i.errorMap,
        },
        path: (i == null ? void 0 : i.path) || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data: s,
        parsedType: Or(s),
      },
      c = this._parseSync({ data: s, path: l.path, parent: l });
    return bp(l, c);
  }
  '~validate'(s) {
    var l, c;
    const i = {
      common: { issues: [], async: !!this['~standard'].async },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: s,
      parsedType: Or(s),
    };
    if (!this['~standard'].async)
      try {
        const u = this._parseSync({ data: s, path: [], parent: i });
        return Mn(u) ? { value: u.value } : { issues: i.common.issues };
      } catch (u) {
        ((c = (l = u == null ? void 0 : u.message) == null ? void 0 : l.toLowerCase()) != null &&
          c.includes('encountered') &&
          (this['~standard'].async = !0),
          (i.common = { issues: [], async: !0 }));
      }
    return this._parseAsync({ data: s, path: [], parent: i }).then((u) =>
      Mn(u) ? { value: u.value } : { issues: i.common.issues },
    );
  }
  async parseAsync(s, i) {
    const l = await this.safeParseAsync(s, i);
    if (l.success) return l.data;
    throw l.error;
  }
  async safeParseAsync(s, i) {
    const l = {
        common: { issues: [], contextualErrorMap: i == null ? void 0 : i.errorMap, async: !0 },
        path: (i == null ? void 0 : i.path) || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data: s,
        parsedType: Or(s),
      },
      c = this._parse({ data: s, path: l.path, parent: l }),
      u = await (Xi(c) ? c : Promise.resolve(c));
    return bp(l, u);
  }
  refine(s, i) {
    const l = (c) =>
      typeof i == 'string' || typeof i > 'u' ? { message: i } : typeof i == 'function' ? i(c) : i;
    return this._refinement((c, u) => {
      const p = s(c),
        h = () => u.addIssue({ code: K.custom, ...l(c) });
      return typeof Promise < 'u' && p instanceof Promise
        ? p.then((m) => (m ? !0 : (h(), !1)))
        : p
          ? !0
          : (h(), !1);
    });
  }
  refinement(s, i) {
    return this._refinement((l, c) =>
      s(l) ? !0 : (c.addIssue(typeof i == 'function' ? i(l, c) : i), !1),
    );
  }
  _refinement(s) {
    return new zn({
      schema: this,
      typeName: me.ZodEffects,
      effect: { type: 'refinement', refinement: s },
    });
  }
  superRefine(s) {
    return this._refinement(s);
  }
  constructor(s) {
    ((this.spa = this.safeParseAsync),
      (this._def = s),
      (this.parse = this.parse.bind(this)),
      (this.safeParse = this.safeParse.bind(this)),
      (this.parseAsync = this.parseAsync.bind(this)),
      (this.safeParseAsync = this.safeParseAsync.bind(this)),
      (this.spa = this.spa.bind(this)),
      (this.refine = this.refine.bind(this)),
      (this.refinement = this.refinement.bind(this)),
      (this.superRefine = this.superRefine.bind(this)),
      (this.optional = this.optional.bind(this)),
      (this.nullable = this.nullable.bind(this)),
      (this.nullish = this.nullish.bind(this)),
      (this.array = this.array.bind(this)),
      (this.promise = this.promise.bind(this)),
      (this.or = this.or.bind(this)),
      (this.and = this.and.bind(this)),
      (this.transform = this.transform.bind(this)),
      (this.brand = this.brand.bind(this)),
      (this.default = this.default.bind(this)),
      (this.catch = this.catch.bind(this)),
      (this.describe = this.describe.bind(this)),
      (this.pipe = this.pipe.bind(this)),
      (this.readonly = this.readonly.bind(this)),
      (this.isNullable = this.isNullable.bind(this)),
      (this.isOptional = this.isOptional.bind(this)),
      (this['~standard'] = { version: 1, vendor: 'zod', validate: (i) => this['~validate'](i) }));
  }
  optional() {
    return Pr.create(this, this._def);
  }
  nullable() {
    return $n.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return Xt.create(this);
  }
  promise() {
    return na.create(this, this._def);
  }
  or(s) {
    return ea.create([this, s], this._def);
  }
  and(s) {
    return ta.create(this, s, this._def);
  }
  transform(s) {
    return new zn({
      ...ye(this._def),
      schema: this,
      typeName: me.ZodEffects,
      effect: { type: 'transform', transform: s },
    });
  }
  default(s) {
    const i = typeof s == 'function' ? s : () => s;
    return new Nl({ ...ye(this._def), innerType: this, defaultValue: i, typeName: me.ZodDefault });
  }
  brand() {
    return new f0({ typeName: me.ZodBranded, type: this, ...ye(this._def) });
  }
  catch(s) {
    const i = typeof s == 'function' ? s : () => s;
    return new _l({ ...ye(this._def), innerType: this, catchValue: i, typeName: me.ZodCatch });
  }
  describe(s) {
    const i = this.constructor;
    return new i({ ...this._def, description: s });
  }
  pipe(s) {
    return Vl.create(this, s);
  }
  readonly() {
    return Cl.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const Hg = /^c[^\s-]{8,}$/i,
  Gg = /^[0-9a-z]+$/,
  Yg = /^[0-9A-HJKMNP-TV-Z]{26}$/i,
  Zg = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i,
  Kg = /^[a-z0-9_-]{21}$/i,
  qg = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
  Qg =
    /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/,
  Xg = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
  Jg = '^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$';
let pl;
const e0 =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  t0 =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  r0 =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  n0 =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  s0 = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  i0 = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  lf =
    '((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))',
  a0 = new RegExp(`^${lf}$`);
function cf(a) {
  let s = '[0-5]\\d';
  a.precision ? (s = `${s}\\.\\d{${a.precision}}`) : a.precision == null && (s = `${s}(\\.\\d+)?`);
  const i = a.precision ? '+' : '?';
  return `([01]\\d|2[0-3]):[0-5]\\d(:${s})${i}`;
}
function o0(a) {
  return new RegExp(`^${cf(a)}$`);
}
function l0(a) {
  let s = `${lf}T${cf(a)}`;
  const i = [];
  return (
    i.push(a.local ? 'Z?' : 'Z'),
    a.offset && i.push('([+-]\\d{2}:?\\d{2})'),
    (s = `${s}(${i.join('|')})`),
    new RegExp(`^${s}$`)
  );
}
function c0(a, s) {
  return !!(((s === 'v4' || !s) && e0.test(a)) || ((s === 'v6' || !s) && r0.test(a)));
}
function d0(a, s) {
  if (!qg.test(a)) return !1;
  try {
    const [i] = a.split('.');
    if (!i) return !1;
    const l = i
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(i.length + ((4 - (i.length % 4)) % 4), '='),
      c = JSON.parse(atob(l));
    return !(
      typeof c != 'object' ||
      c === null ||
      ('typ' in c && (c == null ? void 0 : c.typ) !== 'JWT') ||
      !c.alg ||
      (s && c.alg !== s)
    );
  } catch {
    return !1;
  }
}
function u0(a, s) {
  return !!(((s === 'v4' || !s) && t0.test(a)) || ((s === 'v6' || !s) && n0.test(a)));
}
class cr extends be {
  _parse(s) {
    if ((this._def.coerce && (s.data = String(s.data)), this._getType(s) !== ne.string)) {
      const u = this._getOrReturnCtx(s);
      return (X(u, { code: K.invalid_type, expected: ne.string, received: u.parsedType }), xe);
    }
    const l = new mt();
    let c;
    for (const u of this._def.checks)
      if (u.kind === 'min')
        s.data.length < u.value &&
          ((c = this._getOrReturnCtx(s, c)),
          X(c, {
            code: K.too_small,
            minimum: u.value,
            type: 'string',
            inclusive: !0,
            exact: !1,
            message: u.message,
          }),
          l.dirty());
      else if (u.kind === 'max')
        s.data.length > u.value &&
          ((c = this._getOrReturnCtx(s, c)),
          X(c, {
            code: K.too_big,
            maximum: u.value,
            type: 'string',
            inclusive: !0,
            exact: !1,
            message: u.message,
          }),
          l.dirty());
      else if (u.kind === 'length') {
        const p = s.data.length > u.value,
          h = s.data.length < u.value;
        (p || h) &&
          ((c = this._getOrReturnCtx(s, c)),
          p
            ? X(c, {
                code: K.too_big,
                maximum: u.value,
                type: 'string',
                inclusive: !0,
                exact: !0,
                message: u.message,
              })
            : h &&
              X(c, {
                code: K.too_small,
                minimum: u.value,
                type: 'string',
                inclusive: !0,
                exact: !0,
                message: u.message,
              }),
          l.dirty());
      } else if (u.kind === 'email')
        Xg.test(s.data) ||
          ((c = this._getOrReturnCtx(s, c)),
          X(c, { validation: 'email', code: K.invalid_string, message: u.message }),
          l.dirty());
      else if (u.kind === 'emoji')
        (pl || (pl = new RegExp(Jg, 'u')),
          pl.test(s.data) ||
            ((c = this._getOrReturnCtx(s, c)),
            X(c, { validation: 'emoji', code: K.invalid_string, message: u.message }),
            l.dirty()));
      else if (u.kind === 'uuid')
        Zg.test(s.data) ||
          ((c = this._getOrReturnCtx(s, c)),
          X(c, { validation: 'uuid', code: K.invalid_string, message: u.message }),
          l.dirty());
      else if (u.kind === 'nanoid')
        Kg.test(s.data) ||
          ((c = this._getOrReturnCtx(s, c)),
          X(c, { validation: 'nanoid', code: K.invalid_string, message: u.message }),
          l.dirty());
      else if (u.kind === 'cuid')
        Hg.test(s.data) ||
          ((c = this._getOrReturnCtx(s, c)),
          X(c, { validation: 'cuid', code: K.invalid_string, message: u.message }),
          l.dirty());
      else if (u.kind === 'cuid2')
        Gg.test(s.data) ||
          ((c = this._getOrReturnCtx(s, c)),
          X(c, { validation: 'cuid2', code: K.invalid_string, message: u.message }),
          l.dirty());
      else if (u.kind === 'ulid')
        Yg.test(s.data) ||
          ((c = this._getOrReturnCtx(s, c)),
          X(c, { validation: 'ulid', code: K.invalid_string, message: u.message }),
          l.dirty());
      else if (u.kind === 'url')
        try {
          new URL(s.data);
        } catch {
          ((c = this._getOrReturnCtx(s, c)),
            X(c, { validation: 'url', code: K.invalid_string, message: u.message }),
            l.dirty());
        }
      else
        u.kind === 'regex'
          ? ((u.regex.lastIndex = 0),
            u.regex.test(s.data) ||
              ((c = this._getOrReturnCtx(s, c)),
              X(c, { validation: 'regex', code: K.invalid_string, message: u.message }),
              l.dirty()))
          : u.kind === 'trim'
            ? (s.data = s.data.trim())
            : u.kind === 'includes'
              ? s.data.includes(u.value, u.position) ||
                ((c = this._getOrReturnCtx(s, c)),
                X(c, {
                  code: K.invalid_string,
                  validation: { includes: u.value, position: u.position },
                  message: u.message,
                }),
                l.dirty())
              : u.kind === 'toLowerCase'
                ? (s.data = s.data.toLowerCase())
                : u.kind === 'toUpperCase'
                  ? (s.data = s.data.toUpperCase())
                  : u.kind === 'startsWith'
                    ? s.data.startsWith(u.value) ||
                      ((c = this._getOrReturnCtx(s, c)),
                      X(c, {
                        code: K.invalid_string,
                        validation: { startsWith: u.value },
                        message: u.message,
                      }),
                      l.dirty())
                    : u.kind === 'endsWith'
                      ? s.data.endsWith(u.value) ||
                        ((c = this._getOrReturnCtx(s, c)),
                        X(c, {
                          code: K.invalid_string,
                          validation: { endsWith: u.value },
                          message: u.message,
                        }),
                        l.dirty())
                      : u.kind === 'datetime'
                        ? l0(u).test(s.data) ||
                          ((c = this._getOrReturnCtx(s, c)),
                          X(c, {
                            code: K.invalid_string,
                            validation: 'datetime',
                            message: u.message,
                          }),
                          l.dirty())
                        : u.kind === 'date'
                          ? a0.test(s.data) ||
                            ((c = this._getOrReturnCtx(s, c)),
                            X(c, {
                              code: K.invalid_string,
                              validation: 'date',
                              message: u.message,
                            }),
                            l.dirty())
                          : u.kind === 'time'
                            ? o0(u).test(s.data) ||
                              ((c = this._getOrReturnCtx(s, c)),
                              X(c, {
                                code: K.invalid_string,
                                validation: 'time',
                                message: u.message,
                              }),
                              l.dirty())
                            : u.kind === 'duration'
                              ? Qg.test(s.data) ||
                                ((c = this._getOrReturnCtx(s, c)),
                                X(c, {
                                  validation: 'duration',
                                  code: K.invalid_string,
                                  message: u.message,
                                }),
                                l.dirty())
                              : u.kind === 'ip'
                                ? c0(s.data, u.version) ||
                                  ((c = this._getOrReturnCtx(s, c)),
                                  X(c, {
                                    validation: 'ip',
                                    code: K.invalid_string,
                                    message: u.message,
                                  }),
                                  l.dirty())
                                : u.kind === 'jwt'
                                  ? d0(s.data, u.alg) ||
                                    ((c = this._getOrReturnCtx(s, c)),
                                    X(c, {
                                      validation: 'jwt',
                                      code: K.invalid_string,
                                      message: u.message,
                                    }),
                                    l.dirty())
                                  : u.kind === 'cidr'
                                    ? u0(s.data, u.version) ||
                                      ((c = this._getOrReturnCtx(s, c)),
                                      X(c, {
                                        validation: 'cidr',
                                        code: K.invalid_string,
                                        message: u.message,
                                      }),
                                      l.dirty())
                                    : u.kind === 'base64'
                                      ? s0.test(s.data) ||
                                        ((c = this._getOrReturnCtx(s, c)),
                                        X(c, {
                                          validation: 'base64',
                                          code: K.invalid_string,
                                          message: u.message,
                                        }),
                                        l.dirty())
                                      : u.kind === 'base64url'
                                        ? i0.test(s.data) ||
                                          ((c = this._getOrReturnCtx(s, c)),
                                          X(c, {
                                            validation: 'base64url',
                                            code: K.invalid_string,
                                            message: u.message,
                                          }),
                                          l.dirty())
                                        : Ce.assertNever(u);
    return { status: l.value, value: s.data };
  }
  _regex(s, i, l) {
    return this.refinement((c) => s.test(c), {
      validation: i,
      code: K.invalid_string,
      ...ae.errToObj(l),
    });
  }
  _addCheck(s) {
    return new cr({ ...this._def, checks: [...this._def.checks, s] });
  }
  email(s) {
    return this._addCheck({ kind: 'email', ...ae.errToObj(s) });
  }
  url(s) {
    return this._addCheck({ kind: 'url', ...ae.errToObj(s) });
  }
  emoji(s) {
    return this._addCheck({ kind: 'emoji', ...ae.errToObj(s) });
  }
  uuid(s) {
    return this._addCheck({ kind: 'uuid', ...ae.errToObj(s) });
  }
  nanoid(s) {
    return this._addCheck({ kind: 'nanoid', ...ae.errToObj(s) });
  }
  cuid(s) {
    return this._addCheck({ kind: 'cuid', ...ae.errToObj(s) });
  }
  cuid2(s) {
    return this._addCheck({ kind: 'cuid2', ...ae.errToObj(s) });
  }
  ulid(s) {
    return this._addCheck({ kind: 'ulid', ...ae.errToObj(s) });
  }
  base64(s) {
    return this._addCheck({ kind: 'base64', ...ae.errToObj(s) });
  }
  base64url(s) {
    return this._addCheck({ kind: 'base64url', ...ae.errToObj(s) });
  }
  jwt(s) {
    return this._addCheck({ kind: 'jwt', ...ae.errToObj(s) });
  }
  ip(s) {
    return this._addCheck({ kind: 'ip', ...ae.errToObj(s) });
  }
  cidr(s) {
    return this._addCheck({ kind: 'cidr', ...ae.errToObj(s) });
  }
  datetime(s) {
    return typeof s == 'string'
      ? this._addCheck({ kind: 'datetime', precision: null, offset: !1, local: !1, message: s })
      : this._addCheck({
          kind: 'datetime',
          precision:
            typeof (s == null ? void 0 : s.precision) > 'u'
              ? null
              : s == null
                ? void 0
                : s.precision,
          offset: (s == null ? void 0 : s.offset) ?? !1,
          local: (s == null ? void 0 : s.local) ?? !1,
          ...ae.errToObj(s == null ? void 0 : s.message),
        });
  }
  date(s) {
    return this._addCheck({ kind: 'date', message: s });
  }
  time(s) {
    return typeof s == 'string'
      ? this._addCheck({ kind: 'time', precision: null, message: s })
      : this._addCheck({
          kind: 'time',
          precision:
            typeof (s == null ? void 0 : s.precision) > 'u'
              ? null
              : s == null
                ? void 0
                : s.precision,
          ...ae.errToObj(s == null ? void 0 : s.message),
        });
  }
  duration(s) {
    return this._addCheck({ kind: 'duration', ...ae.errToObj(s) });
  }
  regex(s, i) {
    return this._addCheck({ kind: 'regex', regex: s, ...ae.errToObj(i) });
  }
  includes(s, i) {
    return this._addCheck({
      kind: 'includes',
      value: s,
      position: i == null ? void 0 : i.position,
      ...ae.errToObj(i == null ? void 0 : i.message),
    });
  }
  startsWith(s, i) {
    return this._addCheck({ kind: 'startsWith', value: s, ...ae.errToObj(i) });
  }
  endsWith(s, i) {
    return this._addCheck({ kind: 'endsWith', value: s, ...ae.errToObj(i) });
  }
  min(s, i) {
    return this._addCheck({ kind: 'min', value: s, ...ae.errToObj(i) });
  }
  max(s, i) {
    return this._addCheck({ kind: 'max', value: s, ...ae.errToObj(i) });
  }
  length(s, i) {
    return this._addCheck({ kind: 'length', value: s, ...ae.errToObj(i) });
  }
  nonempty(s) {
    return this.min(1, ae.errToObj(s));
  }
  trim() {
    return new cr({ ...this._def, checks: [...this._def.checks, { kind: 'trim' }] });
  }
  toLowerCase() {
    return new cr({ ...this._def, checks: [...this._def.checks, { kind: 'toLowerCase' }] });
  }
  toUpperCase() {
    return new cr({ ...this._def, checks: [...this._def.checks, { kind: 'toUpperCase' }] });
  }
  get isDatetime() {
    return !!this._def.checks.find((s) => s.kind === 'datetime');
  }
  get isDate() {
    return !!this._def.checks.find((s) => s.kind === 'date');
  }
  get isTime() {
    return !!this._def.checks.find((s) => s.kind === 'time');
  }
  get isDuration() {
    return !!this._def.checks.find((s) => s.kind === 'duration');
  }
  get isEmail() {
    return !!this._def.checks.find((s) => s.kind === 'email');
  }
  get isURL() {
    return !!this._def.checks.find((s) => s.kind === 'url');
  }
  get isEmoji() {
    return !!this._def.checks.find((s) => s.kind === 'emoji');
  }
  get isUUID() {
    return !!this._def.checks.find((s) => s.kind === 'uuid');
  }
  get isNANOID() {
    return !!this._def.checks.find((s) => s.kind === 'nanoid');
  }
  get isCUID() {
    return !!this._def.checks.find((s) => s.kind === 'cuid');
  }
  get isCUID2() {
    return !!this._def.checks.find((s) => s.kind === 'cuid2');
  }
  get isULID() {
    return !!this._def.checks.find((s) => s.kind === 'ulid');
  }
  get isIP() {
    return !!this._def.checks.find((s) => s.kind === 'ip');
  }
  get isCIDR() {
    return !!this._def.checks.find((s) => s.kind === 'cidr');
  }
  get isBase64() {
    return !!this._def.checks.find((s) => s.kind === 'base64');
  }
  get isBase64url() {
    return !!this._def.checks.find((s) => s.kind === 'base64url');
  }
  get minLength() {
    let s = null;
    for (const i of this._def.checks)
      i.kind === 'min' && (s === null || i.value > s) && (s = i.value);
    return s;
  }
  get maxLength() {
    let s = null;
    for (const i of this._def.checks)
      i.kind === 'max' && (s === null || i.value < s) && (s = i.value);
    return s;
  }
}
cr.create = (a) =>
  new cr({
    checks: [],
    typeName: me.ZodString,
    coerce: (a == null ? void 0 : a.coerce) ?? !1,
    ...ye(a),
  });
function p0(a, s) {
  const i = (a.toString().split('.')[1] || '').length,
    l = (s.toString().split('.')[1] || '').length,
    c = i > l ? i : l,
    u = Number.parseInt(a.toFixed(c).replace('.', '')),
    p = Number.parseInt(s.toFixed(c).replace('.', ''));
  return (u % p) / 10 ** c;
}
class Pn extends be {
  constructor() {
    (super(...arguments),
      (this.min = this.gte),
      (this.max = this.lte),
      (this.step = this.multipleOf));
  }
  _parse(s) {
    if ((this._def.coerce && (s.data = Number(s.data)), this._getType(s) !== ne.number)) {
      const u = this._getOrReturnCtx(s);
      return (X(u, { code: K.invalid_type, expected: ne.number, received: u.parsedType }), xe);
    }
    let l;
    const c = new mt();
    for (const u of this._def.checks)
      u.kind === 'int'
        ? Ce.isInteger(s.data) ||
          ((l = this._getOrReturnCtx(s, l)),
          X(l, {
            code: K.invalid_type,
            expected: 'integer',
            received: 'float',
            message: u.message,
          }),
          c.dirty())
        : u.kind === 'min'
          ? (u.inclusive ? s.data < u.value : s.data <= u.value) &&
            ((l = this._getOrReturnCtx(s, l)),
            X(l, {
              code: K.too_small,
              minimum: u.value,
              type: 'number',
              inclusive: u.inclusive,
              exact: !1,
              message: u.message,
            }),
            c.dirty())
          : u.kind === 'max'
            ? (u.inclusive ? s.data > u.value : s.data >= u.value) &&
              ((l = this._getOrReturnCtx(s, l)),
              X(l, {
                code: K.too_big,
                maximum: u.value,
                type: 'number',
                inclusive: u.inclusive,
                exact: !1,
                message: u.message,
              }),
              c.dirty())
            : u.kind === 'multipleOf'
              ? p0(s.data, u.value) !== 0 &&
                ((l = this._getOrReturnCtx(s, l)),
                X(l, { code: K.not_multiple_of, multipleOf: u.value, message: u.message }),
                c.dirty())
              : u.kind === 'finite'
                ? Number.isFinite(s.data) ||
                  ((l = this._getOrReturnCtx(s, l)),
                  X(l, { code: K.not_finite, message: u.message }),
                  c.dirty())
                : Ce.assertNever(u);
    return { status: c.value, value: s.data };
  }
  gte(s, i) {
    return this.setLimit('min', s, !0, ae.toString(i));
  }
  gt(s, i) {
    return this.setLimit('min', s, !1, ae.toString(i));
  }
  lte(s, i) {
    return this.setLimit('max', s, !0, ae.toString(i));
  }
  lt(s, i) {
    return this.setLimit('max', s, !1, ae.toString(i));
  }
  setLimit(s, i, l, c) {
    return new Pn({
      ...this._def,
      checks: [...this._def.checks, { kind: s, value: i, inclusive: l, message: ae.toString(c) }],
    });
  }
  _addCheck(s) {
    return new Pn({ ...this._def, checks: [...this._def.checks, s] });
  }
  int(s) {
    return this._addCheck({ kind: 'int', message: ae.toString(s) });
  }
  positive(s) {
    return this._addCheck({ kind: 'min', value: 0, inclusive: !1, message: ae.toString(s) });
  }
  negative(s) {
    return this._addCheck({ kind: 'max', value: 0, inclusive: !1, message: ae.toString(s) });
  }
  nonpositive(s) {
    return this._addCheck({ kind: 'max', value: 0, inclusive: !0, message: ae.toString(s) });
  }
  nonnegative(s) {
    return this._addCheck({ kind: 'min', value: 0, inclusive: !0, message: ae.toString(s) });
  }
  multipleOf(s, i) {
    return this._addCheck({ kind: 'multipleOf', value: s, message: ae.toString(i) });
  }
  finite(s) {
    return this._addCheck({ kind: 'finite', message: ae.toString(s) });
  }
  safe(s) {
    return this._addCheck({
      kind: 'min',
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: ae.toString(s),
    })._addCheck({
      kind: 'max',
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: ae.toString(s),
    });
  }
  get minValue() {
    let s = null;
    for (const i of this._def.checks)
      i.kind === 'min' && (s === null || i.value > s) && (s = i.value);
    return s;
  }
  get maxValue() {
    let s = null;
    for (const i of this._def.checks)
      i.kind === 'max' && (s === null || i.value < s) && (s = i.value);
    return s;
  }
  get isInt() {
    return !!this._def.checks.find(
      (s) => s.kind === 'int' || (s.kind === 'multipleOf' && Ce.isInteger(s.value)),
    );
  }
  get isFinite() {
    let s = null,
      i = null;
    for (const l of this._def.checks) {
      if (l.kind === 'finite' || l.kind === 'int' || l.kind === 'multipleOf') return !0;
      l.kind === 'min'
        ? (i === null || l.value > i) && (i = l.value)
        : l.kind === 'max' && (s === null || l.value < s) && (s = l.value);
    }
    return Number.isFinite(i) && Number.isFinite(s);
  }
}
Pn.create = (a) =>
  new Pn({
    checks: [],
    typeName: me.ZodNumber,
    coerce: (a == null ? void 0 : a.coerce) || !1,
    ...ye(a),
  });
class Ls extends be {
  constructor() {
    (super(...arguments), (this.min = this.gte), (this.max = this.lte));
  }
  _parse(s) {
    if (this._def.coerce)
      try {
        s.data = BigInt(s.data);
      } catch {
        return this._getInvalidInput(s);
      }
    if (this._getType(s) !== ne.bigint) return this._getInvalidInput(s);
    let l;
    const c = new mt();
    for (const u of this._def.checks)
      u.kind === 'min'
        ? (u.inclusive ? s.data < u.value : s.data <= u.value) &&
          ((l = this._getOrReturnCtx(s, l)),
          X(l, {
            code: K.too_small,
            type: 'bigint',
            minimum: u.value,
            inclusive: u.inclusive,
            message: u.message,
          }),
          c.dirty())
        : u.kind === 'max'
          ? (u.inclusive ? s.data > u.value : s.data >= u.value) &&
            ((l = this._getOrReturnCtx(s, l)),
            X(l, {
              code: K.too_big,
              type: 'bigint',
              maximum: u.value,
              inclusive: u.inclusive,
              message: u.message,
            }),
            c.dirty())
          : u.kind === 'multipleOf'
            ? s.data % u.value !== BigInt(0) &&
              ((l = this._getOrReturnCtx(s, l)),
              X(l, { code: K.not_multiple_of, multipleOf: u.value, message: u.message }),
              c.dirty())
            : Ce.assertNever(u);
    return { status: c.value, value: s.data };
  }
  _getInvalidInput(s) {
    const i = this._getOrReturnCtx(s);
    return (X(i, { code: K.invalid_type, expected: ne.bigint, received: i.parsedType }), xe);
  }
  gte(s, i) {
    return this.setLimit('min', s, !0, ae.toString(i));
  }
  gt(s, i) {
    return this.setLimit('min', s, !1, ae.toString(i));
  }
  lte(s, i) {
    return this.setLimit('max', s, !0, ae.toString(i));
  }
  lt(s, i) {
    return this.setLimit('max', s, !1, ae.toString(i));
  }
  setLimit(s, i, l, c) {
    return new Ls({
      ...this._def,
      checks: [...this._def.checks, { kind: s, value: i, inclusive: l, message: ae.toString(c) }],
    });
  }
  _addCheck(s) {
    return new Ls({ ...this._def, checks: [...this._def.checks, s] });
  }
  positive(s) {
    return this._addCheck({
      kind: 'min',
      value: BigInt(0),
      inclusive: !1,
      message: ae.toString(s),
    });
  }
  negative(s) {
    return this._addCheck({
      kind: 'max',
      value: BigInt(0),
      inclusive: !1,
      message: ae.toString(s),
    });
  }
  nonpositive(s) {
    return this._addCheck({
      kind: 'max',
      value: BigInt(0),
      inclusive: !0,
      message: ae.toString(s),
    });
  }
  nonnegative(s) {
    return this._addCheck({
      kind: 'min',
      value: BigInt(0),
      inclusive: !0,
      message: ae.toString(s),
    });
  }
  multipleOf(s, i) {
    return this._addCheck({ kind: 'multipleOf', value: s, message: ae.toString(i) });
  }
  get minValue() {
    let s = null;
    for (const i of this._def.checks)
      i.kind === 'min' && (s === null || i.value > s) && (s = i.value);
    return s;
  }
  get maxValue() {
    let s = null;
    for (const i of this._def.checks)
      i.kind === 'max' && (s === null || i.value < s) && (s = i.value);
    return s;
  }
}
Ls.create = (a) =>
  new Ls({
    checks: [],
    typeName: me.ZodBigInt,
    coerce: (a == null ? void 0 : a.coerce) ?? !1,
    ...ye(a),
  });
class wl extends be {
  _parse(s) {
    if ((this._def.coerce && (s.data = !!s.data), this._getType(s) !== ne.boolean)) {
      const l = this._getOrReturnCtx(s);
      return (X(l, { code: K.invalid_type, expected: ne.boolean, received: l.parsedType }), xe);
    }
    return Lt(s.data);
  }
}
wl.create = (a) =>
  new wl({ typeName: me.ZodBoolean, coerce: (a == null ? void 0 : a.coerce) || !1, ...ye(a) });
class Ji extends be {
  _parse(s) {
    if ((this._def.coerce && (s.data = new Date(s.data)), this._getType(s) !== ne.date)) {
      const u = this._getOrReturnCtx(s);
      return (X(u, { code: K.invalid_type, expected: ne.date, received: u.parsedType }), xe);
    }
    if (Number.isNaN(s.data.getTime())) {
      const u = this._getOrReturnCtx(s);
      return (X(u, { code: K.invalid_date }), xe);
    }
    const l = new mt();
    let c;
    for (const u of this._def.checks)
      u.kind === 'min'
        ? s.data.getTime() < u.value &&
          ((c = this._getOrReturnCtx(s, c)),
          X(c, {
            code: K.too_small,
            message: u.message,
            inclusive: !0,
            exact: !1,
            minimum: u.value,
            type: 'date',
          }),
          l.dirty())
        : u.kind === 'max'
          ? s.data.getTime() > u.value &&
            ((c = this._getOrReturnCtx(s, c)),
            X(c, {
              code: K.too_big,
              message: u.message,
              inclusive: !0,
              exact: !1,
              maximum: u.value,
              type: 'date',
            }),
            l.dirty())
          : Ce.assertNever(u);
    return { status: l.value, value: new Date(s.data.getTime()) };
  }
  _addCheck(s) {
    return new Ji({ ...this._def, checks: [...this._def.checks, s] });
  }
  min(s, i) {
    return this._addCheck({ kind: 'min', value: s.getTime(), message: ae.toString(i) });
  }
  max(s, i) {
    return this._addCheck({ kind: 'max', value: s.getTime(), message: ae.toString(i) });
  }
  get minDate() {
    let s = null;
    for (const i of this._def.checks)
      i.kind === 'min' && (s === null || i.value > s) && (s = i.value);
    return s != null ? new Date(s) : null;
  }
  get maxDate() {
    let s = null;
    for (const i of this._def.checks)
      i.kind === 'max' && (s === null || i.value < s) && (s = i.value);
    return s != null ? new Date(s) : null;
  }
}
Ji.create = (a) =>
  new Ji({
    checks: [],
    coerce: (a == null ? void 0 : a.coerce) || !1,
    typeName: me.ZodDate,
    ...ye(a),
  });
class jp extends be {
  _parse(s) {
    if (this._getType(s) !== ne.symbol) {
      const l = this._getOrReturnCtx(s);
      return (X(l, { code: K.invalid_type, expected: ne.symbol, received: l.parsedType }), xe);
    }
    return Lt(s.data);
  }
}
jp.create = (a) => new jp({ typeName: me.ZodSymbol, ...ye(a) });
class Np extends be {
  _parse(s) {
    if (this._getType(s) !== ne.undefined) {
      const l = this._getOrReturnCtx(s);
      return (X(l, { code: K.invalid_type, expected: ne.undefined, received: l.parsedType }), xe);
    }
    return Lt(s.data);
  }
}
Np.create = (a) => new Np({ typeName: me.ZodUndefined, ...ye(a) });
class _p extends be {
  _parse(s) {
    if (this._getType(s) !== ne.null) {
      const l = this._getOrReturnCtx(s);
      return (X(l, { code: K.invalid_type, expected: ne.null, received: l.parsedType }), xe);
    }
    return Lt(s.data);
  }
}
_p.create = (a) => new _p({ typeName: me.ZodNull, ...ye(a) });
class Ms extends be {
  constructor() {
    (super(...arguments), (this._any = !0));
  }
  _parse(s) {
    return Lt(s.data);
  }
}
Ms.create = (a) => new Ms({ typeName: me.ZodAny, ...ye(a) });
class kl extends be {
  constructor() {
    (super(...arguments), (this._unknown = !0));
  }
  _parse(s) {
    return Lt(s.data);
  }
}
kl.create = (a) => new kl({ typeName: me.ZodUnknown, ...ye(a) });
class Dr extends be {
  _parse(s) {
    const i = this._getOrReturnCtx(s);
    return (X(i, { code: K.invalid_type, expected: ne.never, received: i.parsedType }), xe);
  }
}
Dr.create = (a) => new Dr({ typeName: me.ZodNever, ...ye(a) });
class Cp extends be {
  _parse(s) {
    if (this._getType(s) !== ne.undefined) {
      const l = this._getOrReturnCtx(s);
      return (X(l, { code: K.invalid_type, expected: ne.void, received: l.parsedType }), xe);
    }
    return Lt(s.data);
  }
}
Cp.create = (a) => new Cp({ typeName: me.ZodVoid, ...ye(a) });
class Xt extends be {
  _parse(s) {
    const { ctx: i, status: l } = this._processInputParams(s),
      c = this._def;
    if (i.parsedType !== ne.array)
      return (X(i, { code: K.invalid_type, expected: ne.array, received: i.parsedType }), xe);
    if (c.exactLength !== null) {
      const p = i.data.length > c.exactLength.value,
        h = i.data.length < c.exactLength.value;
      (p || h) &&
        (X(i, {
          code: p ? K.too_big : K.too_small,
          minimum: h ? c.exactLength.value : void 0,
          maximum: p ? c.exactLength.value : void 0,
          type: 'array',
          inclusive: !0,
          exact: !0,
          message: c.exactLength.message,
        }),
        l.dirty());
    }
    if (
      (c.minLength !== null &&
        i.data.length < c.minLength.value &&
        (X(i, {
          code: K.too_small,
          minimum: c.minLength.value,
          type: 'array',
          inclusive: !0,
          exact: !1,
          message: c.minLength.message,
        }),
        l.dirty()),
      c.maxLength !== null &&
        i.data.length > c.maxLength.value &&
        (X(i, {
          code: K.too_big,
          maximum: c.maxLength.value,
          type: 'array',
          inclusive: !0,
          exact: !1,
          message: c.maxLength.message,
        }),
        l.dirty()),
      i.common.async)
    )
      return Promise.all(
        [...i.data].map((p, h) => c.type._parseAsync(new Jt(i, p, i.path, h))),
      ).then((p) => mt.mergeArray(l, p));
    const u = [...i.data].map((p, h) => c.type._parseSync(new Jt(i, p, i.path, h)));
    return mt.mergeArray(l, u);
  }
  get element() {
    return this._def.type;
  }
  min(s, i) {
    return new Xt({ ...this._def, minLength: { value: s, message: ae.toString(i) } });
  }
  max(s, i) {
    return new Xt({ ...this._def, maxLength: { value: s, message: ae.toString(i) } });
  }
  length(s, i) {
    return new Xt({ ...this._def, exactLength: { value: s, message: ae.toString(i) } });
  }
  nonempty(s) {
    return this.min(1, s);
  }
}
Xt.create = (a, s) =>
  new Xt({
    type: a,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: me.ZodArray,
    ...ye(s),
  });
function An(a) {
  if (a instanceof Ve) {
    const s = {};
    for (const i in a.shape) {
      const l = a.shape[i];
      s[i] = Pr.create(An(l));
    }
    return new Ve({ ...a._def, shape: () => s });
  } else
    return a instanceof Xt
      ? new Xt({ ...a._def, type: An(a.element) })
      : a instanceof Pr
        ? Pr.create(An(a.unwrap()))
        : a instanceof $n
          ? $n.create(An(a.unwrap()))
          : a instanceof sn
            ? sn.create(a.items.map((s) => An(s)))
            : a;
}
class Ve extends be {
  constructor() {
    (super(...arguments),
      (this._cached = null),
      (this.nonstrict = this.passthrough),
      (this.augment = this.extend));
  }
  _getCached() {
    if (this._cached !== null) return this._cached;
    const s = this._def.shape(),
      i = Ce.objectKeys(s);
    return ((this._cached = { shape: s, keys: i }), this._cached);
  }
  _parse(s) {
    if (this._getType(s) !== ne.object) {
      const g = this._getOrReturnCtx(s);
      return (X(g, { code: K.invalid_type, expected: ne.object, received: g.parsedType }), xe);
    }
    const { status: l, ctx: c } = this._processInputParams(s),
      { shape: u, keys: p } = this._getCached(),
      h = [];
    if (!(this._def.catchall instanceof Dr && this._def.unknownKeys === 'strip'))
      for (const g in c.data) p.includes(g) || h.push(g);
    const m = [];
    for (const g of p) {
      const v = u[g],
        y = c.data[g];
      m.push({
        key: { status: 'valid', value: g },
        value: v._parse(new Jt(c, y, c.path, g)),
        alwaysSet: g in c.data,
      });
    }
    if (this._def.catchall instanceof Dr) {
      const g = this._def.unknownKeys;
      if (g === 'passthrough')
        for (const v of h)
          m.push({
            key: { status: 'valid', value: v },
            value: { status: 'valid', value: c.data[v] },
          });
      else if (g === 'strict')
        h.length > 0 && (X(c, { code: K.unrecognized_keys, keys: h }), l.dirty());
      else if (g !== 'strip')
        throw new Error('Internal ZodObject error: invalid unknownKeys value.');
    } else {
      const g = this._def.catchall;
      for (const v of h) {
        const y = c.data[v];
        m.push({
          key: { status: 'valid', value: v },
          value: g._parse(new Jt(c, y, c.path, v)),
          alwaysSet: v in c.data,
        });
      }
    }
    return c.common.async
      ? Promise.resolve()
          .then(async () => {
            const g = [];
            for (const v of m) {
              const y = await v.key,
                S = await v.value;
              g.push({ key: y, value: S, alwaysSet: v.alwaysSet });
            }
            return g;
          })
          .then((g) => mt.mergeObjectSync(l, g))
      : mt.mergeObjectSync(l, m);
  }
  get shape() {
    return this._def.shape();
  }
  strict(s) {
    return (
      ae.errToObj,
      new Ve({
        ...this._def,
        unknownKeys: 'strict',
        ...(s !== void 0
          ? {
              errorMap: (i, l) => {
                var u, p;
                const c =
                  ((p = (u = this._def).errorMap) == null ? void 0 : p.call(u, i, l).message) ??
                  l.defaultError;
                return i.code === 'unrecognized_keys'
                  ? { message: ae.errToObj(s).message ?? c }
                  : { message: c };
              },
            }
          : {}),
      })
    );
  }
  strip() {
    return new Ve({ ...this._def, unknownKeys: 'strip' });
  }
  passthrough() {
    return new Ve({ ...this._def, unknownKeys: 'passthrough' });
  }
  extend(s) {
    return new Ve({ ...this._def, shape: () => ({ ...this._def.shape(), ...s }) });
  }
  merge(s) {
    return new Ve({
      unknownKeys: s._def.unknownKeys,
      catchall: s._def.catchall,
      shape: () => ({ ...this._def.shape(), ...s._def.shape() }),
      typeName: me.ZodObject,
    });
  }
  setKey(s, i) {
    return this.augment({ [s]: i });
  }
  catchall(s) {
    return new Ve({ ...this._def, catchall: s });
  }
  pick(s) {
    const i = {};
    for (const l of Ce.objectKeys(s)) s[l] && this.shape[l] && (i[l] = this.shape[l]);
    return new Ve({ ...this._def, shape: () => i });
  }
  omit(s) {
    const i = {};
    for (const l of Ce.objectKeys(this.shape)) s[l] || (i[l] = this.shape[l]);
    return new Ve({ ...this._def, shape: () => i });
  }
  deepPartial() {
    return An(this);
  }
  partial(s) {
    const i = {};
    for (const l of Ce.objectKeys(this.shape)) {
      const c = this.shape[l];
      s && !s[l] ? (i[l] = c) : (i[l] = c.optional());
    }
    return new Ve({ ...this._def, shape: () => i });
  }
  required(s) {
    const i = {};
    for (const l of Ce.objectKeys(this.shape))
      if (s && !s[l]) i[l] = this.shape[l];
      else {
        let u = this.shape[l];
        for (; u instanceof Pr; ) u = u._def.innerType;
        i[l] = u;
      }
    return new Ve({ ...this._def, shape: () => i });
  }
  keyof() {
    return df(Ce.objectKeys(this.shape));
  }
}
Ve.create = (a, s) =>
  new Ve({
    shape: () => a,
    unknownKeys: 'strip',
    catchall: Dr.create(),
    typeName: me.ZodObject,
    ...ye(s),
  });
Ve.strictCreate = (a, s) =>
  new Ve({
    shape: () => a,
    unknownKeys: 'strict',
    catchall: Dr.create(),
    typeName: me.ZodObject,
    ...ye(s),
  });
Ve.lazycreate = (a, s) =>
  new Ve({
    shape: a,
    unknownKeys: 'strip',
    catchall: Dr.create(),
    typeName: me.ZodObject,
    ...ye(s),
  });
class ea extends be {
  _parse(s) {
    const { ctx: i } = this._processInputParams(s),
      l = this._def.options;
    function c(u) {
      for (const h of u) if (h.result.status === 'valid') return h.result;
      for (const h of u)
        if (h.result.status === 'dirty')
          return (i.common.issues.push(...h.ctx.common.issues), h.result);
      const p = u.map((h) => new Vt(h.ctx.common.issues));
      return (X(i, { code: K.invalid_union, unionErrors: p }), xe);
    }
    if (i.common.async)
      return Promise.all(
        l.map(async (u) => {
          const p = { ...i, common: { ...i.common, issues: [] }, parent: null };
          return { result: await u._parseAsync({ data: i.data, path: i.path, parent: p }), ctx: p };
        }),
      ).then(c);
    {
      let u;
      const p = [];
      for (const m of l) {
        const g = { ...i, common: { ...i.common, issues: [] }, parent: null },
          v = m._parseSync({ data: i.data, path: i.path, parent: g });
        if (v.status === 'valid') return v;
        (v.status === 'dirty' && !u && (u = { result: v, ctx: g }),
          g.common.issues.length && p.push(g.common.issues));
      }
      if (u) return (i.common.issues.push(...u.ctx.common.issues), u.result);
      const h = p.map((m) => new Vt(m));
      return (X(i, { code: K.invalid_union, unionErrors: h }), xe);
    }
  }
  get options() {
    return this._def.options;
  }
}
ea.create = (a, s) => new ea({ options: a, typeName: me.ZodUnion, ...ye(s) });
function bl(a, s) {
  const i = Or(a),
    l = Or(s);
  if (a === s) return { valid: !0, data: a };
  if (i === ne.object && l === ne.object) {
    const c = Ce.objectKeys(s),
      u = Ce.objectKeys(a).filter((h) => c.indexOf(h) !== -1),
      p = { ...a, ...s };
    for (const h of u) {
      const m = bl(a[h], s[h]);
      if (!m.valid) return { valid: !1 };
      p[h] = m.data;
    }
    return { valid: !0, data: p };
  } else if (i === ne.array && l === ne.array) {
    if (a.length !== s.length) return { valid: !1 };
    const c = [];
    for (let u = 0; u < a.length; u++) {
      const p = a[u],
        h = s[u],
        m = bl(p, h);
      if (!m.valid) return { valid: !1 };
      c.push(m.data);
    }
    return { valid: !0, data: c };
  } else return i === ne.date && l === ne.date && +a == +s ? { valid: !0, data: a } : { valid: !1 };
}
class ta extends be {
  _parse(s) {
    const { status: i, ctx: l } = this._processInputParams(s),
      c = (u, p) => {
        if (wp(u) || wp(p)) return xe;
        const h = bl(u.value, p.value);
        return h.valid
          ? ((kp(u) || kp(p)) && i.dirty(), { status: i.value, value: h.data })
          : (X(l, { code: K.invalid_intersection_types }), xe);
      };
    return l.common.async
      ? Promise.all([
          this._def.left._parseAsync({ data: l.data, path: l.path, parent: l }),
          this._def.right._parseAsync({ data: l.data, path: l.path, parent: l }),
        ]).then(([u, p]) => c(u, p))
      : c(
          this._def.left._parseSync({ data: l.data, path: l.path, parent: l }),
          this._def.right._parseSync({ data: l.data, path: l.path, parent: l }),
        );
  }
}
ta.create = (a, s, i) => new ta({ left: a, right: s, typeName: me.ZodIntersection, ...ye(i) });
class sn extends be {
  _parse(s) {
    const { status: i, ctx: l } = this._processInputParams(s);
    if (l.parsedType !== ne.array)
      return (X(l, { code: K.invalid_type, expected: ne.array, received: l.parsedType }), xe);
    if (l.data.length < this._def.items.length)
      return (
        X(l, {
          code: K.too_small,
          minimum: this._def.items.length,
          inclusive: !0,
          exact: !1,
          type: 'array',
        }),
        xe
      );
    !this._def.rest &&
      l.data.length > this._def.items.length &&
      (X(l, {
        code: K.too_big,
        maximum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: 'array',
      }),
      i.dirty());
    const u = [...l.data]
      .map((p, h) => {
        const m = this._def.items[h] || this._def.rest;
        return m ? m._parse(new Jt(l, p, l.path, h)) : null;
      })
      .filter((p) => !!p);
    return l.common.async ? Promise.all(u).then((p) => mt.mergeArray(i, p)) : mt.mergeArray(i, u);
  }
  get items() {
    return this._def.items;
  }
  rest(s) {
    return new sn({ ...this._def, rest: s });
  }
}
sn.create = (a, s) => {
  if (!Array.isArray(a)) throw new Error('You must pass an array of schemas to z.tuple([ ... ])');
  return new sn({ items: a, typeName: me.ZodTuple, rest: null, ...ye(s) });
};
class ra extends be {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(s) {
    const { status: i, ctx: l } = this._processInputParams(s);
    if (l.parsedType !== ne.object)
      return (X(l, { code: K.invalid_type, expected: ne.object, received: l.parsedType }), xe);
    const c = [],
      u = this._def.keyType,
      p = this._def.valueType;
    for (const h in l.data)
      c.push({
        key: u._parse(new Jt(l, h, l.path, h)),
        value: p._parse(new Jt(l, l.data[h], l.path, h)),
        alwaysSet: h in l.data,
      });
    return l.common.async ? mt.mergeObjectAsync(i, c) : mt.mergeObjectSync(i, c);
  }
  get element() {
    return this._def.valueType;
  }
  static create(s, i, l) {
    return i instanceof be
      ? new ra({ keyType: s, valueType: i, typeName: me.ZodRecord, ...ye(l) })
      : new ra({ keyType: cr.create(), valueType: s, typeName: me.ZodRecord, ...ye(i) });
  }
}
class Sp extends be {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(s) {
    const { status: i, ctx: l } = this._processInputParams(s);
    if (l.parsedType !== ne.map)
      return (X(l, { code: K.invalid_type, expected: ne.map, received: l.parsedType }), xe);
    const c = this._def.keyType,
      u = this._def.valueType,
      p = [...l.data.entries()].map(([h, m], g) => ({
        key: c._parse(new Jt(l, h, l.path, [g, 'key'])),
        value: u._parse(new Jt(l, m, l.path, [g, 'value'])),
      }));
    if (l.common.async) {
      const h = new Map();
      return Promise.resolve().then(async () => {
        for (const m of p) {
          const g = await m.key,
            v = await m.value;
          if (g.status === 'aborted' || v.status === 'aborted') return xe;
          ((g.status === 'dirty' || v.status === 'dirty') && i.dirty(), h.set(g.value, v.value));
        }
        return { status: i.value, value: h };
      });
    } else {
      const h = new Map();
      for (const m of p) {
        const g = m.key,
          v = m.value;
        if (g.status === 'aborted' || v.status === 'aborted') return xe;
        ((g.status === 'dirty' || v.status === 'dirty') && i.dirty(), h.set(g.value, v.value));
      }
      return { status: i.value, value: h };
    }
  }
}
Sp.create = (a, s, i) => new Sp({ valueType: s, keyType: a, typeName: me.ZodMap, ...ye(i) });
class Ps extends be {
  _parse(s) {
    const { status: i, ctx: l } = this._processInputParams(s);
    if (l.parsedType !== ne.set)
      return (X(l, { code: K.invalid_type, expected: ne.set, received: l.parsedType }), xe);
    const c = this._def;
    (c.minSize !== null &&
      l.data.size < c.minSize.value &&
      (X(l, {
        code: K.too_small,
        minimum: c.minSize.value,
        type: 'set',
        inclusive: !0,
        exact: !1,
        message: c.minSize.message,
      }),
      i.dirty()),
      c.maxSize !== null &&
        l.data.size > c.maxSize.value &&
        (X(l, {
          code: K.too_big,
          maximum: c.maxSize.value,
          type: 'set',
          inclusive: !0,
          exact: !1,
          message: c.maxSize.message,
        }),
        i.dirty()));
    const u = this._def.valueType;
    function p(m) {
      const g = new Set();
      for (const v of m) {
        if (v.status === 'aborted') return xe;
        (v.status === 'dirty' && i.dirty(), g.add(v.value));
      }
      return { status: i.value, value: g };
    }
    const h = [...l.data.values()].map((m, g) => u._parse(new Jt(l, m, l.path, g)));
    return l.common.async ? Promise.all(h).then((m) => p(m)) : p(h);
  }
  min(s, i) {
    return new Ps({ ...this._def, minSize: { value: s, message: ae.toString(i) } });
  }
  max(s, i) {
    return new Ps({ ...this._def, maxSize: { value: s, message: ae.toString(i) } });
  }
  size(s, i) {
    return this.min(s, i).max(s, i);
  }
  nonempty(s) {
    return this.min(1, s);
  }
}
Ps.create = (a, s) =>
  new Ps({ valueType: a, minSize: null, maxSize: null, typeName: me.ZodSet, ...ye(s) });
class Ep extends be {
  get schema() {
    return this._def.getter();
  }
  _parse(s) {
    const { ctx: i } = this._processInputParams(s);
    return this._def.getter()._parse({ data: i.data, path: i.path, parent: i });
  }
}
Ep.create = (a, s) => new Ep({ getter: a, typeName: me.ZodLazy, ...ye(s) });
class Rp extends be {
  _parse(s) {
    if (s.data !== this._def.value) {
      const i = this._getOrReturnCtx(s);
      return (X(i, { received: i.data, code: K.invalid_literal, expected: this._def.value }), xe);
    }
    return { status: 'valid', value: s.data };
  }
  get value() {
    return this._def.value;
  }
}
Rp.create = (a, s) => new Rp({ value: a, typeName: me.ZodLiteral, ...ye(s) });
function df(a, s) {
  return new Dn({ values: a, typeName: me.ZodEnum, ...ye(s) });
}
class Dn extends be {
  _parse(s) {
    if (typeof s.data != 'string') {
      const i = this._getOrReturnCtx(s),
        l = this._def.values;
      return (
        X(i, { expected: Ce.joinValues(l), received: i.parsedType, code: K.invalid_type }),
        xe
      );
    }
    if ((this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(s.data))) {
      const i = this._getOrReturnCtx(s),
        l = this._def.values;
      return (X(i, { received: i.data, code: K.invalid_enum_value, options: l }), xe);
    }
    return Lt(s.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const s = {};
    for (const i of this._def.values) s[i] = i;
    return s;
  }
  get Values() {
    const s = {};
    for (const i of this._def.values) s[i] = i;
    return s;
  }
  get Enum() {
    const s = {};
    for (const i of this._def.values) s[i] = i;
    return s;
  }
  extract(s, i = this._def) {
    return Dn.create(s, { ...this._def, ...i });
  }
  exclude(s, i = this._def) {
    return Dn.create(
      this.options.filter((l) => !s.includes(l)),
      { ...this._def, ...i },
    );
  }
}
Dn.create = df;
class jl extends be {
  _parse(s) {
    const i = Ce.getValidEnumValues(this._def.values),
      l = this._getOrReturnCtx(s);
    if (l.parsedType !== ne.string && l.parsedType !== ne.number) {
      const c = Ce.objectValues(i);
      return (
        X(l, { expected: Ce.joinValues(c), received: l.parsedType, code: K.invalid_type }),
        xe
      );
    }
    if (
      (this._cache || (this._cache = new Set(Ce.getValidEnumValues(this._def.values))),
      !this._cache.has(s.data))
    ) {
      const c = Ce.objectValues(i);
      return (X(l, { received: l.data, code: K.invalid_enum_value, options: c }), xe);
    }
    return Lt(s.data);
  }
  get enum() {
    return this._def.values;
  }
}
jl.create = (a, s) => new jl({ values: a, typeName: me.ZodNativeEnum, ...ye(s) });
class na extends be {
  unwrap() {
    return this._def.type;
  }
  _parse(s) {
    const { ctx: i } = this._processInputParams(s);
    if (i.parsedType !== ne.promise && i.common.async === !1)
      return (X(i, { code: K.invalid_type, expected: ne.promise, received: i.parsedType }), xe);
    const l = i.parsedType === ne.promise ? i.data : Promise.resolve(i.data);
    return Lt(
      l.then((c) =>
        this._def.type.parseAsync(c, { path: i.path, errorMap: i.common.contextualErrorMap }),
      ),
    );
  }
}
na.create = (a, s) => new na({ type: a, typeName: me.ZodPromise, ...ye(s) });
class zn extends be {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === me.ZodEffects
      ? this._def.schema.sourceType()
      : this._def.schema;
  }
  _parse(s) {
    const { status: i, ctx: l } = this._processInputParams(s),
      c = this._def.effect || null,
      u = {
        addIssue: (p) => {
          (X(l, p), p.fatal ? i.abort() : i.dirty());
        },
        get path() {
          return l.path;
        },
      };
    if (((u.addIssue = u.addIssue.bind(u)), c.type === 'preprocess')) {
      const p = c.transform(l.data, u);
      if (l.common.async)
        return Promise.resolve(p).then(async (h) => {
          if (i.value === 'aborted') return xe;
          const m = await this._def.schema._parseAsync({ data: h, path: l.path, parent: l });
          return m.status === 'aborted'
            ? xe
            : m.status === 'dirty' || i.value === 'dirty'
              ? Rs(m.value)
              : m;
        });
      {
        if (i.value === 'aborted') return xe;
        const h = this._def.schema._parseSync({ data: p, path: l.path, parent: l });
        return h.status === 'aborted'
          ? xe
          : h.status === 'dirty' || i.value === 'dirty'
            ? Rs(h.value)
            : h;
      }
    }
    if (c.type === 'refinement') {
      const p = (h) => {
        const m = c.refinement(h, u);
        if (l.common.async) return Promise.resolve(m);
        if (m instanceof Promise)
          throw new Error(
            'Async refinement encountered during synchronous parse operation. Use .parseAsync instead.',
          );
        return h;
      };
      if (l.common.async === !1) {
        const h = this._def.schema._parseSync({ data: l.data, path: l.path, parent: l });
        return h.status === 'aborted'
          ? xe
          : (h.status === 'dirty' && i.dirty(), p(h.value), { status: i.value, value: h.value });
      } else
        return this._def.schema
          ._parseAsync({ data: l.data, path: l.path, parent: l })
          .then((h) =>
            h.status === 'aborted'
              ? xe
              : (h.status === 'dirty' && i.dirty(),
                p(h.value).then(() => ({ status: i.value, value: h.value }))),
          );
    }
    if (c.type === 'transform')
      if (l.common.async === !1) {
        const p = this._def.schema._parseSync({ data: l.data, path: l.path, parent: l });
        if (!Mn(p)) return xe;
        const h = c.transform(p.value, u);
        if (h instanceof Promise)
          throw new Error(
            'Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.',
          );
        return { status: i.value, value: h };
      } else
        return this._def.schema
          ._parseAsync({ data: l.data, path: l.path, parent: l })
          .then((p) =>
            Mn(p)
              ? Promise.resolve(c.transform(p.value, u)).then((h) => ({
                  status: i.value,
                  value: h,
                }))
              : xe,
          );
    Ce.assertNever(c);
  }
}
zn.create = (a, s, i) => new zn({ schema: a, typeName: me.ZodEffects, effect: s, ...ye(i) });
zn.createWithPreprocess = (a, s, i) =>
  new zn({
    schema: s,
    effect: { type: 'preprocess', transform: a },
    typeName: me.ZodEffects,
    ...ye(i),
  });
class Pr extends be {
  _parse(s) {
    return this._getType(s) === ne.undefined ? Lt(void 0) : this._def.innerType._parse(s);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Pr.create = (a, s) => new Pr({ innerType: a, typeName: me.ZodOptional, ...ye(s) });
class $n extends be {
  _parse(s) {
    return this._getType(s) === ne.null ? Lt(null) : this._def.innerType._parse(s);
  }
  unwrap() {
    return this._def.innerType;
  }
}
$n.create = (a, s) => new $n({ innerType: a, typeName: me.ZodNullable, ...ye(s) });
class Nl extends be {
  _parse(s) {
    const { ctx: i } = this._processInputParams(s);
    let l = i.data;
    return (
      i.parsedType === ne.undefined && (l = this._def.defaultValue()),
      this._def.innerType._parse({ data: l, path: i.path, parent: i })
    );
  }
  removeDefault() {
    return this._def.innerType;
  }
}
Nl.create = (a, s) =>
  new Nl({
    innerType: a,
    typeName: me.ZodDefault,
    defaultValue: typeof s.default == 'function' ? s.default : () => s.default,
    ...ye(s),
  });
class _l extends be {
  _parse(s) {
    const { ctx: i } = this._processInputParams(s),
      l = { ...i, common: { ...i.common, issues: [] } },
      c = this._def.innerType._parse({ data: l.data, path: l.path, parent: { ...l } });
    return Xi(c)
      ? c.then((u) => ({
          status: 'valid',
          value:
            u.status === 'valid'
              ? u.value
              : this._def.catchValue({
                  get error() {
                    return new Vt(l.common.issues);
                  },
                  input: l.data,
                }),
        }))
      : {
          status: 'valid',
          value:
            c.status === 'valid'
              ? c.value
              : this._def.catchValue({
                  get error() {
                    return new Vt(l.common.issues);
                  },
                  input: l.data,
                }),
        };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
_l.create = (a, s) =>
  new _l({
    innerType: a,
    typeName: me.ZodCatch,
    catchValue: typeof s.catch == 'function' ? s.catch : () => s.catch,
    ...ye(s),
  });
class Tp extends be {
  _parse(s) {
    if (this._getType(s) !== ne.nan) {
      const l = this._getOrReturnCtx(s);
      return (X(l, { code: K.invalid_type, expected: ne.nan, received: l.parsedType }), xe);
    }
    return { status: 'valid', value: s.data };
  }
}
Tp.create = (a) => new Tp({ typeName: me.ZodNaN, ...ye(a) });
class f0 extends be {
  _parse(s) {
    const { ctx: i } = this._processInputParams(s),
      l = i.data;
    return this._def.type._parse({ data: l, path: i.path, parent: i });
  }
  unwrap() {
    return this._def.type;
  }
}
class Vl extends be {
  _parse(s) {
    const { status: i, ctx: l } = this._processInputParams(s);
    if (l.common.async)
      return (async () => {
        const u = await this._def.in._parseAsync({ data: l.data, path: l.path, parent: l });
        return u.status === 'aborted'
          ? xe
          : u.status === 'dirty'
            ? (i.dirty(), Rs(u.value))
            : this._def.out._parseAsync({ data: u.value, path: l.path, parent: l });
      })();
    {
      const c = this._def.in._parseSync({ data: l.data, path: l.path, parent: l });
      return c.status === 'aborted'
        ? xe
        : c.status === 'dirty'
          ? (i.dirty(), { status: 'dirty', value: c.value })
          : this._def.out._parseSync({ data: c.value, path: l.path, parent: l });
    }
  }
  static create(s, i) {
    return new Vl({ in: s, out: i, typeName: me.ZodPipeline });
  }
}
class Cl extends be {
  _parse(s) {
    const i = this._def.innerType._parse(s),
      l = (c) => (Mn(c) && (c.value = Object.freeze(c.value)), c);
    return Xi(i) ? i.then((c) => l(c)) : l(i);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Cl.create = (a, s) => new Cl({ innerType: a, typeName: me.ZodReadonly, ...ye(s) });
function Ip(a, s) {
  const i = typeof a == 'function' ? a(s) : typeof a == 'string' ? { message: a } : a;
  return typeof i == 'string' ? { message: i } : i;
}
function Sl(a, s = {}, i) {
  return a
    ? Ms.create().superRefine((l, c) => {
        const u = a(l);
        if (u instanceof Promise)
          return u.then((p) => {
            if (!p) {
              const h = Ip(s, l),
                m = h.fatal ?? i ?? !0;
              c.addIssue({ code: 'custom', ...h, fatal: m });
            }
          });
        if (!u) {
          const p = Ip(s, l),
            h = p.fatal ?? i ?? !0;
          c.addIssue({ code: 'custom', ...p, fatal: h });
        }
      })
    : Ms.create();
}
var me;
(function (a) {
  ((a.ZodString = 'ZodString'),
    (a.ZodNumber = 'ZodNumber'),
    (a.ZodNaN = 'ZodNaN'),
    (a.ZodBigInt = 'ZodBigInt'),
    (a.ZodBoolean = 'ZodBoolean'),
    (a.ZodDate = 'ZodDate'),
    (a.ZodSymbol = 'ZodSymbol'),
    (a.ZodUndefined = 'ZodUndefined'),
    (a.ZodNull = 'ZodNull'),
    (a.ZodAny = 'ZodAny'),
    (a.ZodUnknown = 'ZodUnknown'),
    (a.ZodNever = 'ZodNever'),
    (a.ZodVoid = 'ZodVoid'),
    (a.ZodArray = 'ZodArray'),
    (a.ZodObject = 'ZodObject'),
    (a.ZodUnion = 'ZodUnion'),
    (a.ZodDiscriminatedUnion = 'ZodDiscriminatedUnion'),
    (a.ZodIntersection = 'ZodIntersection'),
    (a.ZodTuple = 'ZodTuple'),
    (a.ZodRecord = 'ZodRecord'),
    (a.ZodMap = 'ZodMap'),
    (a.ZodSet = 'ZodSet'),
    (a.ZodFunction = 'ZodFunction'),
    (a.ZodLazy = 'ZodLazy'),
    (a.ZodLiteral = 'ZodLiteral'),
    (a.ZodEnum = 'ZodEnum'),
    (a.ZodEffects = 'ZodEffects'),
    (a.ZodNativeEnum = 'ZodNativeEnum'),
    (a.ZodOptional = 'ZodOptional'),
    (a.ZodNullable = 'ZodNullable'),
    (a.ZodDefault = 'ZodDefault'),
    (a.ZodCatch = 'ZodCatch'),
    (a.ZodPromise = 'ZodPromise'),
    (a.ZodBranded = 'ZodBranded'),
    (a.ZodPipeline = 'ZodPipeline'),
    (a.ZodReadonly = 'ZodReadonly'));
})(me || (me = {}));
const Ct = cr.create,
  sa = Pn.create,
  El = wl.create;
Ms.create;
const h0 = kl.create;
Dr.create;
const Ds = Xt.create,
  ia = Ve.create;
ea.create;
ta.create;
sn.create;
const m0 = ra.create;
Dn.create;
const x0 = jl.create;
na.create;
Pr.create;
$n.create;
var er = ((a) => (
  (a.UNKNOWN = 'UNKNOWN'),
  (a.AGENT_CONFIG = 'AGENT_CONFIG'),
  (a.AGENT_EXECUTION = 'AGENT_EXECUTION'),
  (a.CREW_CONFIG = 'CREW_CONFIG'),
  (a.CREW_EXECUTION = 'CREW_EXECUTION'),
  (a.ENGINE_CONFIG = 'ENGINE_CONFIG'),
  (a.ENGINE_EXECUTION = 'ENGINE_EXECUTION'),
  (a.TASK_CONFIG = 'TASK_CONFIG'),
  (a.TASK_EXECUTION = 'TASK_EXECUTION'),
  (a.TASK_TIMEOUT = 'TASK_TIMEOUT'),
  (a.TASK_CIRCULAR_DEPENDENCY = 'TASK_CIRCULAR_DEPENDENCY'),
  (a.LLM_PROVIDER = 'LLM_PROVIDER'),
  (a.LLM_RATE_LIMIT = 'LLM_RATE_LIMIT'),
  (a.LLM_AUTHENTICATION = 'LLM_AUTHENTICATION'),
  (a.LLM_CONTEXT_LENGTH = 'LLM_CONTEXT_LENGTH'),
  (a.LLM_STREAM = 'LLM_STREAM'),
  (a.TOOL_CONFIG = 'TOOL_CONFIG'),
  (a.TOOL_NOT_FOUND = 'TOOL_NOT_FOUND'),
  (a.TOOL_EXECUTION = 'TOOL_EXECUTION'),
  (a.TOOL_PERMISSION = 'TOOL_PERMISSION'),
  (a.TOOL_TIMEOUT = 'TOOL_TIMEOUT'),
  (a.TOOL_COMPOSITION = 'TOOL_COMPOSITION'),
  (a.TOOL_INPUT_VALIDATION = 'TOOL_INPUT_VALIDATION'),
  (a.MEMORY_CONFIG = 'MEMORY_CONFIG'),
  (a.MEMORY_OPERATION = 'MEMORY_OPERATION'),
  (a.MEMORY_QUERY = 'MEMORY_QUERY'),
  a
))(er || {});
class zr extends Error {
  constructor(i, l, c) {
    super(i);
    le(this, 'code');
    le(this, 'isRetryable');
    le(this, 'timestamp');
    le(this, 'cause');
    ((this.code = l),
      (this.isRetryable = (c == null ? void 0 : c.isRetryable) ?? !1),
      (this.cause = c == null ? void 0 : c.cause),
      (this.timestamp = new Date().toISOString()),
      Object.setPrototypeOf(this, new.target.prototype));
  }
  static isCrewspaceError(i) {
    return i instanceof zr;
  }
  getDetails() {
    return {};
  }
  toJSON() {
    let i;
    return (
      this.cause &&
        (zr.isCrewspaceError(this.cause)
          ? (i = this.cause.toJSON())
          : (i = { message: this.cause.message })),
      {
        name: this.name,
        message: this.message,
        code: this.code,
        isRetryable: this.isRetryable,
        timestamp: this.timestamp,
        stack: this.stack,
        cause: i,
        details: this.getDetails(),
      }
    );
  }
}
class Op extends zr {
  constructor(i, l) {
    super(l ? `Agent "${l}": ${i}` : i, er.AGENT_CONFIG);
    le(this, 'agentId');
    ((this.name = 'AgentConfigError'), (this.agentId = l));
  }
  getDetails() {
    return { agentId: this.agentId };
  }
}
class fl extends zr {
  constructor(i, l, c) {
    super(`Agent "${i}" execution failed: ${l}`, er.AGENT_EXECUTION, { cause: c });
    le(this, 'agentId');
    ((this.name = 'AgentExecutionError'), (this.agentId = i));
  }
  getDetails() {
    return { agentId: this.agentId };
  }
}
class Tr extends zr {
  constructor(i, l) {
    super(l ? `Crew "${l}": ${i}` : i, er.CREW_CONFIG);
    le(this, 'crewId');
    ((this.name = 'CrewConfigError'), (this.crewId = l));
  }
  getDetails() {
    return { crewId: this.crewId };
  }
}
class In extends zr {
  constructor(i, l, c, u) {
    const p = c ? ` (task "${c}")` : '';
    super(`Crew "${i}"${p} execution failed: ${l}`, er.CREW_EXECUTION, { cause: u });
    le(this, 'crewId');
    le(this, 'taskId');
    ((this.name = 'CrewExecutionError'), (this.crewId = i), (this.taskId = c));
  }
  getDetails() {
    return { crewId: this.crewId, taskId: this.taskId };
  }
}
class je extends zr {
  constructor(i, l, c, u) {
    const p = c !== void 0 && (c >= 500 || c === 429);
    super(`LLM provider "${i}": ${l}`, er.LLM_PROVIDER, { cause: u, isRetryable: p });
    le(this, 'provider');
    le(this, 'statusCode');
    ((this.name = 'LLMProviderError'), (this.provider = i), (this.statusCode = c));
  }
  getDetails() {
    return { provider: this.provider, statusCode: this.statusCode };
  }
}
class Hl extends je {
  constructor(i, l, c, u) {
    super(i, l, 429, u);
    le(this, 'retryAfterMs');
    ((this.name = 'LLMRateLimitError'), (this.retryAfterMs = c), (this.code = er.LLM_RATE_LIMIT));
  }
  getDetails() {
    return { ...super.getDetails(), retryAfterMs: this.retryAfterMs };
  }
}
class aa extends je {
  constructor(s, i, l) {
    (super(s, i, 401, l),
      (this.name = 'LLMAuthenticationError'),
      (this.code = er.LLM_AUTHENTICATION),
      (this.isRetryable = !1));
  }
}
class uf extends je {
  constructor(i, l, c, u, p) {
    super(i, l, 400, p);
    le(this, 'requestTokens');
    le(this, 'maxTokens');
    ((this.name = 'LLMContextLengthError'),
      (this.requestTokens = c),
      (this.maxTokens = u),
      (this.code = er.LLM_CONTEXT_LENGTH),
      (this.isRetryable = !1));
  }
  getDetails() {
    return { ...super.getDetails(), requestTokens: this.requestTokens, maxTokens: this.maxTokens };
  }
}
class Ap extends je {
  constructor(i, l, c, u, p) {
    super(i, l, void 0, p);
    le(this, 'chunksReceived');
    le(this, 'partialContent');
    ((this.name = 'LLMStreamError'),
      (this.chunksReceived = c),
      (this.partialContent = u),
      (this.code = er.LLM_STREAM),
      (this.isRetryable = !0));
  }
  getDetails() {
    return {
      ...super.getDetails(),
      chunksReceived: this.chunksReceived,
      partialContent: this.partialContent,
    };
  }
}
var Ts = ((a) => ((a.IDLE = 'idle'), (a.EXECUTING = 'executing'), (a.ERROR = 'error'), a))(
    Ts || {},
  ),
  Me = ((a) => (
    (a.SYSTEM = 'system'),
    (a.USER = 'user'),
    (a.ASSISTANT = 'assistant'),
    (a.TOOL = 'tool'),
    a
  ))(Me || {});
const g0 = /^[a-zA-Z0-9_-]+$/,
  v0 = 10,
  Lp = 100,
  y0 = ia({
    id: Ct()
      .min(1, 'Agent id must not be empty')
      .regex(g0, 'Agent id must be alphanumeric (dashes and underscores allowed)'),
    role: Ct().min(1, 'Agent role must not be empty'),
    goal: Ct().min(1, 'Agent goal must not be empty'),
    backstory: Ct().optional(),
    tools: Ds(
      Sl((a) => typeof a == 'object' && a !== null && 'name' in a && 'execute' in a),
    ).optional(),
    llmProvider: Sl().optional(),
    maxIterations: sa()
      .int()
      .positive()
      .max(Lp, `maxIterations must be ≤ ${String(Lp)}`)
      .optional(),
    verbose: El().optional(),
  });
class w0 {
  constructor(s) {
    le(this, 'id');
    le(this, 'role');
    le(this, 'goal');
    le(this, 'backstory');
    le(this, 'maxIterations');
    le(this, 'verbose');
    le(this, '_tools');
    le(this, '_emitter');
    le(this, '_llmProvider');
    le(this, '_status');
    try {
      const i = y0.parse(s);
      if (
        ((this.id = i.id),
        (this.role = i.role),
        (this.goal = i.goal),
        (this.backstory = i.backstory ?? ''),
        (this.maxIterations = i.maxIterations ?? v0),
        (this.verbose = i.verbose ?? !1),
        (this._tools = new Map()),
        (this._emitter = new Fl()),
        (this._status = Ts.IDLE),
        i.tools)
      )
        for (const l of i.tools) this._tools.set(l.name, l);
      this._llmProvider = i.llmProvider;
    } catch (i) {
      if (i instanceof Vt) {
        const l = i.errors.map((c) => c.message).join('; ');
        throw new Op(l, typeof s.id == 'string' ? s.id : void 0);
      }
      throw i;
    }
  }
  get status() {
    return this._status;
  }
  get tools() {
    return this._tools;
  }
  get llmProvider() {
    return this._llmProvider;
  }
  setLLMProvider(s) {
    this._llmProvider = s;
  }
  addTool(s) {
    if (this._tools.has(s.name)) throw new Op(`Tool "${s.name}" is already registered`, this.id);
    this._tools.set(s.name, s);
  }
  removeTool(s) {
    return this._tools.delete(s);
  }
  hasTool(s) {
    return this._tools.has(s);
  }
  on(s, i) {
    return (this._emitter.on(s, i), this);
  }
  off(s, i) {
    return (this._emitter.off(s, i), this);
  }
  once(s, i) {
    return (this._emitter.once(s, i), this);
  }
  async execute(s) {
    if (!this._llmProvider)
      throw new fl(this.id, 'No LLM provider configured. Call setLLMProvider() before execute().');
    (this._setStatus(Ts.EXECUTING), this._emit('agent:start', this.id, s));
    const i = Date.now();
    try {
      const l = this._buildMessages(s);
      this._emit('agent:llm:start', this.id);
      const c = await this._llmProvider.generateText(l);
      this._emit('agent:llm:complete', this.id, c);
      const u = {
        output: c.content,
        agentId: this.id,
        duration: Date.now() - i,
        tokenUsage: c.tokenUsage,
      };
      return (this._setStatus(Ts.IDLE), this._emit('agent:complete', this.id, u), u);
    } catch (l) {
      this._setStatus(Ts.ERROR);
      const c = l instanceof Error ? l : new Error(String(l));
      throw (
        this._emit('agent:error', this.id, c),
        l instanceof fl ? l : new fl(this.id, c.message, c)
      );
    }
  }
  buildSystemPrompt() {
    const s = [
      'You are a specialist AI agent.',
      `Role: ${this.role}`,
      `Primary objective: ${this.goal}`,
    ];
    if (
      (this.backstory && s.push(`Professional background: ${this.backstory}`), this._tools.size > 0)
    ) {
      const i = Array.from(this._tools.values()).map((l) => `- ${l.name}: ${l.description}`).join(`
`);
      s.push(`Available tools:
${i}`);
    }
    return (
      s.push(`Operating principles:
- Think step by step before producing your final answer
- Draw on your specialized expertise and methodology described in your background
- Be thorough and precise — quality over speed
- Structure your output clearly with headings or bullet points when appropriate
- If you lack information to confidently answer, state what you know and what remains uncertain
- Stay focused on your assigned task — do not drift into areas outside your specialty`),
      s.join(`

`)
    );
  }
  _buildMessages(s) {
    const i = this.buildSystemPrompt();
    let l = `## Task Assignment

${s.description}`;
    return (
      s.expectedOutput &&
        (l += `

## Expected Output
Format and content: ${s.expectedOutput}`),
      s.context &&
        Object.keys(s.context).length > 0 &&
        (l += `

## Context from Previous Tasks
${JSON.stringify(s.context, null, 2)}`),
      (l += `

## Instructions
Apply your specialist expertise to complete this task. Think through your approach step by step, then provide your final output.`),
      [
        { role: Me.SYSTEM, content: i },
        { role: Me.USER, content: l },
      ]
    );
  }
  _setStatus(s) {
    ((this._status = s), this._emit('agent:status-changed', this.id, s));
  }
  _emit(s, ...i) {
    this._emitter.emit(s, ...i);
  }
}
var ht = ((a) => (
    (a.PROPOSAL = 'proposal'),
    (a.FEEDBACK = 'feedback'),
    (a.REVISION = 'revision'),
    (a.AGREEMENT = 'agreement'),
    (a.DISAGREEMENT = 'disagreement'),
    (a.QUESTION = 'question'),
    (a.ANSWER = 'answer'),
    a
  ))(ht || {}),
  Is = ((a) => (
    (a.PENDING = 'pending'),
    (a.ACTIVE = 'active'),
    (a.CONVERGED = 'converged'),
    (a.DIVERGED = 'diverged'),
    (a.MAX_ROUNDS_REACHED = 'max-rounds-reached'),
    (a.ERROR = 'error'),
    a
  ))(Is || {}),
  Bt = ((a) => (
    (a.UNANIMOUS = 'unanimous'),
    (a.MAJORITY = 'majority'),
    (a.LLM_JUDGE = 'llm-judge'),
    (a.STABLE_OUTPUT = 'stable-output'),
    a
  ))(Bt || {});
const k0 = 2;
class b0 {
  constructor(s, i) {
    le(this, '_emitter');
    le(this, '_agents');
    le(this, '_convergenceJudge');
    ((this._emitter = new Fl()), (this._agents = s), (this._convergenceJudge = i));
  }
  on(s, i) {
    return (this._emitter.on(s, i), this);
  }
  off(s, i) {
    return (this._emitter.off(s, i), this);
  }
  once(s, i) {
    return (this._emitter.once(s, i), this);
  }
  async runDiscussion(s) {
    var g;
    for (const v of s.participantIds)
      if (!this._agents.has(v))
        throw new Error(`Discussion "${s.id}": unknown participant agent "${v}"`);
    if (s.participantIds.length < 2)
      throw new Error(`Discussion "${s.id}": at least 2 participants required`);
    const i = Date.now(),
      l = [],
      c = [];
    let u = Is.ACTIVE,
      p;
    this._emit('discussion:start', s.id, s.participantIds);
    try {
      for (let v = 1; v <= s.maxRounds; v++) {
        this._emit('discussion:round:start', s.id, v);
        const y = [],
          S = this._orderParticipants(s, v);
        for (const j of S) {
          const b = this._agents.get(j),
            T = this._buildConversationPrompt(s, b, c, v),
            z = await b.execute({
              description: T,
              expectedOutput:
                'Your response in this discussion. Start your message with one of: [AGREE], [DISAGREE], [REVISE], [QUESTION], or [PROPOSAL] to indicate your stance, then provide your reasoning.',
            }),
            W = this._parseMessageType(z.output),
            G = this._getNextParticipant(j, S),
            Q = {
              id: `${s.id}-r${String(v)}-${j}`,
              fromAgentId: j,
              toAgentId: G,
              content: z.output,
              round: v,
              timestamp: Date.now(),
              type: W,
            };
          (y.push(Q), c.push(Q), this._emit('discussion:message', s.id, Q));
        }
        const C = { roundNumber: v, messages: y, timestamp: Date.now() };
        if (
          (l.push(C),
          this._emit('discussion:round:complete', s.id, C),
          await this._checkConvergence(s, y, l, v))
        ) {
          ((u = Is.CONVERGED), (p = v));
          const j = ((g = y[y.length - 1]) == null ? void 0 : g.content) ?? '';
          this._emit('discussion:converged', s.id, v, j);
          break;
        }
        v === s.maxRounds &&
          ((u = Is.MAX_ROUNDS_REACHED), this._emit('discussion:max-rounds', s.id, s.maxRounds));
      }
    } catch (v) {
      u = Is.ERROR;
      const y = v instanceof Error ? v : new Error(String(v));
      throw (this._emit('discussion:error', s.id, y), y);
    }
    const h = this._synthesizeFinalOutput(c),
      m = {
        discussionId: s.id,
        status: u,
        rounds: l,
        finalOutput: h,
        totalMessages: c.length,
        participantIds: [...s.participantIds],
        duration: Date.now() - i,
        ...(p !== void 0 ? { convergenceRound: p } : {}),
      };
    return (this._emit('discussion:complete', s.id, m), m);
  }
  _orderParticipants(s, i) {
    if (i === 1 && s.initiatorId) {
      const l = s.participantIds.filter((c) => c !== s.initiatorId);
      return [s.initiatorId, ...l];
    }
    return s.participantIds;
  }
  _buildConversationPrompt(s, i, l, c) {
    const u = [];
    if (
      (u.push(`You are participating in a collaborative discussion as "${i.role}".`),
      u.push(`Your goal: ${i.goal}`),
      u.push(''),
      u.push(`Discussion topic: ${s.topic}`),
      s.initialContext &&
        (u.push(''),
        u.push(`Initial context:
${s.initialContext}`)),
      l.length > 0)
    ) {
      (u.push(''), u.push('--- Discussion History ---'));
      let p = 0;
      for (const h of l) {
        h.round !== p && (u.push(''), u.push(`[Round ${String(h.round)}]`), (p = h.round));
        const m = this._agents.get(h.fromAgentId),
          g = m ? m.role : h.fromAgentId;
        u.push(`${g}: ${h.content}`);
      }
      u.push('--- End History ---');
    }
    return (
      u.push(''),
      u.push(`It is now Round ${String(c)}. Please provide your response.`),
      u.push(
        'Start with [AGREE], [DISAGREE], [REVISE], [QUESTION], or [PROPOSAL] to indicate your stance, then explain your reasoning.',
      ),
      c > 1 &&
        u.push(
          'If you are satisfied with the current direction and have no further changes, respond with [AGREE].',
        ),
      u.join(`
`)
    );
  }
  _parseMessageType(s) {
    const i = s.trimStart().toUpperCase();
    return i.startsWith('[AGREE')
      ? ht.AGREEMENT
      : i.startsWith('[DISAGREE')
        ? ht.DISAGREEMENT
        : i.startsWith('[REVISE')
          ? ht.REVISION
          : i.startsWith('[QUESTION')
            ? ht.QUESTION
            : i.startsWith('[PROPOSAL')
              ? ht.PROPOSAL
              : i.startsWith('[ANSWER')
                ? ht.ANSWER
                : ht.FEEDBACK;
  }
  async _checkConvergence(s, i, l, c) {
    switch (s.convergenceStrategy) {
      case Bt.UNANIMOUS:
        return i.every((u) => u.type === ht.AGREEMENT);
      case Bt.MAJORITY:
        return i.filter((p) => p.type === ht.AGREEMENT).length > i.length / 2;
      case Bt.STABLE_OUTPUT: {
        const u = s.stabilityThreshold ?? k0;
        return l.length < u
          ? !1
          : l
              .slice(-u)
              .every((m) =>
                m.messages.every((g) => g.type === ht.AGREEMENT || g.type === ht.FEEDBACK),
              );
      }
      case Bt.LLM_JUDGE: {
        if (!this._convergenceJudge) return i.every((h) => h.type === ht.AGREEMENT);
        const u = i.map((h) => {
          const m = this._agents.get(h.fromAgentId);
          return `${(m == null ? void 0 : m.role) ?? h.fromAgentId}: ${h.content}`;
        }).join(`

`);
        return (
          await this._convergenceJudge.generateText([
            {
              role: Me.SYSTEM,
              content:
                'You are a discussion moderator. Given the following round of discussion, determine if the participants have reached a satisfactory consensus. Respond with ONLY "CONVERGED" or "CONTINUE".',
            },
            {
              role: Me.USER,
              content: `Topic: ${s.topic}

Round ${String(c)} messages:
${u}`,
            },
          ])
        ).content
          .trim()
          .toUpperCase()
          .startsWith('CONVERGED');
      }
      default:
        return !1;
    }
  }
  _synthesizeFinalOutput(s) {
    var i;
    for (let l = s.length - 1; l >= 0; l--) {
      const c = s[l];
      if (c.type === ht.AGREEMENT || c.type === ht.REVISION) return c.content;
    }
    return ((i = s[s.length - 1]) == null ? void 0 : i.content) ?? '';
  }
  _getNextParticipant(s, i) {
    const l = i.indexOf(s);
    return i[(l + 1) % i.length] ?? i[0] ?? s;
  }
  _emit(s, ...i) {
    this._emitter.emit(s, ...i);
  }
}
var Ir = ((a) => (
  (a.IDLE = 'idle'),
  (a.RUNNING = 'running'),
  (a.COMPLETED = 'completed'),
  (a.ERROR = 'error'),
  a
))(Ir || {});
const pf = /^[a-zA-Z0-9_-]+$/,
  j0 = ia({
    id: Ct()
      .min(1, 'Task id must not be empty')
      .regex(pf, 'Task id must be alphanumeric (dashes and underscores allowed)'),
    description: Ct().min(1, 'Task description must not be empty'),
    expectedOutput: Ct().optional(),
    agentId: Ct().min(1, 'Task agentId must not be empty'),
    context: m0(h0()).optional(),
    dependencies: Ds(Ct()).optional(),
    discussion: ia({
      participantIds: Ds(Ct()).min(2, 'Discussion requires at least 2 participants'),
      maxRounds: sa().int().positive().max(20),
      convergenceStrategy: x0(Bt),
      topic: Ct().optional(),
      stabilityThreshold: sa().int().positive().optional(),
    }).optional(),
  }),
  N0 = ia({
    id: Ct()
      .min(1, 'Crew id must not be empty')
      .regex(pf, 'Crew id must be alphanumeric (dashes and underscores allowed)'),
    name: Ct().optional(),
    agents: Ds(Sl((a) => typeof a == 'object' && a !== null && 'id' in a && 'execute' in a)).min(
      1,
      'Crew must have at least one agent',
    ),
    tasks: Ds(j0).min(1, 'Crew must have at least one task'),
    verbose: El().optional(),
    parallel: El().optional(),
    maxConcurrency: sa().int().positive().optional(),
  });
class _0 {
  constructor(s) {
    le(this, 'id');
    le(this, 'name');
    le(this, 'verbose');
    le(this, 'parallel');
    le(this, 'maxConcurrency');
    le(this, '_agents');
    le(this, '_tasks');
    le(this, '_emitter');
    le(this, '_status');
    try {
      const i = N0.parse(s);
      ((this.id = i.id),
        (this.name = i.name ?? i.id),
        (this.verbose = i.verbose ?? !1),
        (this.parallel = i.parallel ?? !1),
        (this.maxConcurrency = i.maxConcurrency ?? 1 / 0));
      const l = new Map();
      for (const p of i.agents) {
        if (l.has(p.id)) throw new Tr(`Duplicate agent id "${p.id}"`, i.id);
        l.set(p.id, p);
      }
      this._agents = l;
      const c = new Set();
      for (const p of i.tasks) {
        if (c.has(p.id)) throw new Tr(`Duplicate task id "${p.id}"`, i.id);
        if ((c.add(p.id), !l.has(p.agentId)))
          throw new Tr(`Task "${p.id}" references unknown agent "${p.agentId}"`, i.id);
      }
      for (const p of i.tasks)
        if (p.dependencies)
          for (const h of p.dependencies) {
            if (!c.has(h)) throw new Tr(`Task "${p.id}" depends on unknown task "${h}"`, i.id);
            if (h === p.id) throw new Tr(`Task "${p.id}" cannot depend on itself`, i.id);
          }
      const u = i.tasks.map((p) => ({
        id: p.id,
        description: p.description,
        agentId: p.agentId,
        ...(p.expectedOutput !== void 0 ? { expectedOutput: p.expectedOutput } : {}),
        ...(p.context !== void 0 ? { context: p.context } : {}),
        ...(p.dependencies !== void 0 ? { dependencies: p.dependencies } : {}),
        ...(p.discussion !== void 0 ? { discussion: p.discussion } : {}),
      }));
      (this._detectCycles(u, i.id),
        (this._tasks = u),
        (this._emitter = new Fl()),
        (this._status = Ir.IDLE));
    } catch (i) {
      if (i instanceof Vt) {
        const l = i.errors.map((c) => c.message).join('; ');
        throw new Tr(l, typeof s.id == 'string' ? s.id : void 0);
      }
      throw (i instanceof Tr, i);
    }
  }
  get status() {
    return this._status;
  }
  get agents() {
    return this._agents;
  }
  get tasks() {
    return this._tasks;
  }
  on(s, i) {
    return (this._emitter.on(s, i), this);
  }
  off(s, i) {
    return (this._emitter.off(s, i), this);
  }
  once(s, i) {
    return (this._emitter.once(s, i), this);
  }
  async run() {
    if (this._status === Ir.RUNNING) throw new In(this.id, 'Crew is already running');
    (this._setStatus(Ir.RUNNING), this._emit('crew:start', this.id));
    const s = Date.now(),
      i = new Map();
    try {
      this.parallel ? await this._runParallel(i) : await this._runSequential(i);
      const l = { crewId: this.id, taskResults: i, duration: Date.now() - s, success: !0 };
      return (this._setStatus(Ir.COMPLETED), this._emit('crew:complete', this.id, l), l);
    } catch (l) {
      this._setStatus(Ir.ERROR);
      const c = l instanceof Error ? l : new Error(String(l));
      throw (
        this._emit('crew:error', this.id, c),
        l instanceof In ? l : new In(this.id, c.message, void 0, c)
      );
    }
  }
  reset() {
    if (this._status === Ir.RUNNING) throw new In(this.id, 'Cannot reset while running');
    this._setStatus(Ir.IDLE);
  }
  async _executeSingleTask(s, i) {
    const l = this._agents.get(s.agentId);
    if (!l) throw new In(this.id, `Agent "${s.agentId}" not found`, s.id);
    let c;
    (s.discussion && (c = await this._runTaskDiscussion(s, i)),
      this._emit('crew:task:start', this.id, s.id, s.agentId));
    try {
      const u = this._buildTaskInput(s, i, c),
        p = await l.execute(u);
      (i.set(s.id, p), this._emit('crew:task:complete', this.id, s.id, p));
    } catch (u) {
      const p = u instanceof Error ? u : new Error(String(u));
      throw (this._emit('crew:task:error', this.id, s.id, p), new In(this.id, p.message, s.id, p));
    }
  }
  async _runSequential(s) {
    const i = this._topologicalSort();
    for (const l of i) await this._executeSingleTask(l, s);
  }
  async _runParallel(s) {
    var g;
    const i = new Map(),
      l = new Map(),
      c = new Map();
    for (const v of this._tasks) (i.set(v.id, v), l.set(v.id, 0), c.set(v.id, []));
    for (const v of this._tasks)
      if (v.dependencies)
        for (const y of v.dependencies)
          ((g = c.get(y)) == null || g.push(v.id), l.set(v.id, (l.get(v.id) ?? 0) + 1));
    const u = [];
    for (const [v, y] of l) y === 0 && u.push(v);
    let p = 0,
      h = 0;
    const m = this._tasks.length;
    return new Promise((v, y) => {
      let S = !1;
      const C = (b) => {
          S || ((S = !0), b());
        },
        R = (b) => {
          for (const T of c.get(b) ?? []) {
            const z = (l.get(T) ?? 0) - 1;
            (l.set(T, z), z === 0 && u.push(T));
          }
        },
        j = () => {
          if (!S) {
            for (; u.length > 0 && p < this.maxConcurrency && !S; ) {
              const b = u.shift(),
                T = i.get(b);
              T &&
                (p++,
                this._executeSingleTask(T, s)
                  .then(() => {
                    (p--, h++, R(b), j(), h >= m && C(() => v()));
                  })
                  .catch((z) => {
                    C(() => y(z));
                  }));
            }
            p === 0 && u.length === 0 && !S && C(() => v());
          }
        };
      j();
    });
  }
  _buildTaskInput(s, i, l) {
    const c = { ...s.context };
    if (s.dependencies) {
      const p = {};
      for (const h of s.dependencies) {
        const m = i.get(h);
        m && (p[h] = m.output);
      }
      Object.keys(p).length > 0 && (c.dependencyResults = p);
    }
    l &&
      (c.discussionResult = {
        status: l.status,
        finalOutput: l.finalOutput,
        totalMessages: l.totalMessages,
        convergenceRound: l.convergenceRound,
        rounds: l.rounds.map((p) => ({
          roundNumber: p.roundNumber,
          messages: p.messages.map((h) => ({
            from: h.fromAgentId,
            to: h.toAgentId,
            type: h.type,
            content: h.content,
          })),
        })),
      });
    const u = { description: s.description };
    return (
      s.expectedOutput !== void 0 && (u.expectedOutput = s.expectedOutput),
      Object.keys(c).length > 0 && (u.context = c),
      u
    );
  }
  async _runTaskDiscussion(s, i) {
    const l = s.discussion,
      c = `${this.id}-disc-${s.id}`;
    let u = '';
    if (s.dependencies) {
      const h = [];
      for (const m of s.dependencies) {
        const g = i.get(m);
        g && h.push(`[${m}]: ${g.output}`);
      }
      h.length > 0 &&
        (u = `Previous task results:
${h.join(`

`)}`);
    }
    const p = new b0(this._agents);
    return (
      p.on('discussion:start', (h, m) => {
        this._emit('crew:discussion:start', this.id, h, m);
      }),
      p.on('discussion:message', (h, m) => {
        this._emit('crew:discussion:message', this.id, h, m);
      }),
      p.on('discussion:complete', (h, m) => {
        this._emit('crew:discussion:complete', this.id, h, m);
      }),
      p.runDiscussion({
        id: c,
        participantIds: l.participantIds,
        topic: l.topic ?? s.description,
        initialContext: u || void 0,
        maxRounds: l.maxRounds,
        convergenceStrategy: l.convergenceStrategy,
        stabilityThreshold: l.stabilityThreshold,
      })
    );
  }
  _topologicalSort() {
    const s = new Map(),
      i = new Map(),
      l = new Map();
    for (const p of this._tasks) (s.set(p.id, p), i.set(p.id, 0), l.set(p.id, []));
    for (const p of this._tasks)
      if (p.dependencies)
        for (const h of p.dependencies) {
          const m = l.get(h);
          (m && m.push(p.id), i.set(p.id, (i.get(p.id) ?? 0) + 1));
        }
    const c = [];
    for (const [p, h] of i) h === 0 && c.push(p);
    const u = [];
    for (; c.length > 0; ) {
      const p = c.shift();
      if (p === void 0) break;
      const h = s.get(p);
      h && u.push(h);
      const m = l.get(p) ?? [];
      for (const g of m) {
        const v = (i.get(g) ?? 0) - 1;
        (i.set(g, v), v === 0 && c.push(g));
      }
    }
    return u;
  }
  _detectCycles(s, i) {
    var g;
    const l = new Map();
    for (const v of s) l.set(v.id, []);
    for (const v of s)
      if (v.dependencies) for (const y of v.dependencies) (g = l.get(y)) == null || g.push(v.id);
    const c = 0,
      u = 1,
      p = 2,
      h = new Map();
    for (const v of s) h.set(v.id, c);
    const m = (v) => {
      h.set(v, u);
      for (const y of l.get(v) ?? []) {
        const S = h.get(y);
        if (S === u || (S === c && m(y))) return !0;
      }
      return (h.set(v, p), !1);
    };
    for (const v of s)
      if (h.get(v.id) === c && m(v.id))
        throw new Tr('Circular dependency detected in task graph', i);
  }
  _setStatus(s) {
    ((this._status = s), this._emit('crew:status-changed', this.id, s));
  }
  _emit(s, ...i) {
    this._emitter.emit(s, ...i);
  }
}
const C0 = 3,
  S0 = 3e4;
class Gl {
  constructor(s) {
    le(this, 'name');
    le(this, 'modelId');
    le(this, 'maxRetries');
    le(this, 'timeout');
    le(this, '_config');
    if (!s.provider || s.provider.trim().length === 0)
      throw new je(s.provider || 'unknown', 'Provider name must not be empty');
    if (!s.modelId || s.modelId.trim().length === 0)
      throw new je(s.provider, 'Model ID must not be empty');
    ((this._config = s),
      (this.name = s.provider),
      (this.modelId = s.modelId),
      (this.maxRetries = s.maxRetries ?? C0),
      (this.timeout = s.timeout ?? S0));
  }
  async generateText(s, i) {
    this._validateMessages(s);
    const l = this._mergeOptions(i);
    return this._doGenerateText(s, l);
  }
  async generateStream(s, i) {
    this._validateMessages(s);
    const l = this._mergeOptions(i);
    return this._doGenerateStream(s, l);
  }
  _doGenerateStream(s, i) {
    throw new je(
      this.name,
      `Provider "${this.name}" does not support streaming. Override _doGenerateStream() to enable it.`,
    );
  }
  _mergeOptions(s) {
    const i = this._config.defaultOptions;
    if (!i) return s ?? {};
    if (!s) return i;
    const l = {},
      c = s.temperature ?? i.temperature;
    c !== void 0 && (l.temperature = c);
    const u = s.maxTokens ?? i.maxTokens;
    u !== void 0 && (l.maxTokens = u);
    const p = s.stopSequences ?? i.stopSequences;
    p !== void 0 && (l.stopSequences = p);
    const h = s.signal ?? i.signal;
    return (h !== void 0 && (l.signal = h), l);
  }
  _validateMessages(s) {
    if (s.length === 0) throw new je(this.name, 'Messages array must not be empty');
    if (!s.some((l) => l.role === Me.USER || l.role === Me.SYSTEM))
      throw new je(this.name, 'Messages must contain at least one USER or SYSTEM message');
  }
}
class Yl {
  constructor(s, i) {
    le(this, '_provider');
    le(this, '_source');
    le(this, '_consumed', !1);
    ((this._provider = s), (this._source = i));
  }
  [Symbol.asyncIterator]() {
    return (this._assertNotConsumed(), (this._consumed = !0), this._source[Symbol.asyncIterator]());
  }
  async toResponse() {
    (this._assertNotConsumed(), (this._consumed = !0));
    const s = [];
    let i = 'unknown',
      l = { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      c = 0;
    try {
      for await (const u of this._source)
        (s.push(u.content),
          c++,
          u.finishReason !== void 0 && (i = u.finishReason),
          u.tokenUsage !== void 0 && (l = u.tokenUsage));
    } catch (u) {
      const p = u instanceof Error ? u : new Error(String(u));
      throw new Ap(
        this._provider,
        `Stream failed after ${String(c)} chunks: ${p.message}`,
        c,
        s.join(''),
        p,
      );
    }
    return { content: s.join(''), finishReason: i, tokenUsage: l };
  }
  _assertNotConsumed() {
    if (this._consumed)
      throw new Ap(
        this._provider,
        'Stream has already been consumed. LLM streams are single-use.',
        0,
        '',
      );
  }
}
var E0 = {};
const R0 = 'https://api.anthropic.com',
  pt = 'anthropic',
  T0 = '2023-06-01',
  I0 = 4096;
class O0 extends Gl {
  constructor(i) {
    super({ ...i, provider: pt });
    le(this, '_apiKey');
    le(this, '_baseUrl');
    const l = i.apiKey ?? E0.ANTHROPIC_API_KEY;
    if (!l || l.trim().length === 0)
      throw new aa(
        pt,
        'API key is required. Provide it via config.apiKey or the ANTHROPIC_API_KEY environment variable.',
      );
    ((this._apiKey = l), (this._baseUrl = i.baseUrl ?? R0));
  }
  async _doGenerateText(i, l) {
    const c = this._buildRequestBody(i, l, !1),
      p = await (await this._fetch('/v1/messages', c, l.signal)).json(),
      h = p.content.find((g) => g.type === 'text');
    return {
      content: (h == null ? void 0 : h.text) ?? '',
      finishReason: this._mapStopReason(p.stop_reason),
      tokenUsage: {
        promptTokens: p.usage.input_tokens,
        completionTokens: p.usage.output_tokens,
        totalTokens: p.usage.input_tokens + p.usage.output_tokens,
      },
    };
  }
  async _doGenerateStream(i, l) {
    const c = this._buildRequestBody(i, l, !0),
      u = await this._fetch('/v1/messages', c, l.signal),
      p = this._parseSSEStream(u);
    return new Yl(pt, p);
  }
  async _fetch(i, l, c) {
    const u = `${this._baseUrl}${i}`;
    let p;
    try {
      p = await fetch(u, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this._apiKey,
          'anthropic-version': T0,
        },
        body: JSON.stringify(l),
        ...(c !== void 0 && { signal: c }),
      });
    } catch (h) {
      const m = h instanceof Error ? h : new Error(String(h));
      throw m.name === 'AbortError'
        ? new je(pt, 'Request was aborted', void 0, m)
        : new je(pt, `Network error: ${m.message}`, void 0, m);
    }
    return (p.ok || (await this._handleErrorResponse(p)), p);
  }
  async _handleErrorResponse(i) {
    var p, h;
    let l;
    try {
      l = await i.json();
    } catch {}
    const c =
        ((p = l == null ? void 0 : l.error) == null ? void 0 : p.message) ??
        `HTTP ${String(i.status)}: ${i.statusText}`,
      u = ((h = l == null ? void 0 : l.error) == null ? void 0 : h.type) ?? '';
    switch (i.status) {
      case 401:
        throw new aa(pt, `Authentication failed: ${c}`);
      case 429: {
        const m = i.headers.get('retry-after'),
          g = m ? Math.round(parseFloat(m) * 1e3) : void 0;
        throw new Hl(pt, `Rate limit exceeded: ${c}`, g);
      }
      case 400: {
        if (
          u === 'invalid_request_error' &&
          (c.includes('context length') ||
            c.includes('too many tokens') ||
            c.includes('token limit'))
        ) {
          const m = /maximum (?:context length|token limit) is (\d+)/.exec(c),
            g = /you requested (\d+)/.exec(c),
            v = g == null ? void 0 : g[1],
            y = m == null ? void 0 : m[1];
          throw new uf(
            pt,
            `Context length exceeded: ${c}`,
            v !== void 0 ? parseInt(v, 10) : void 0,
            y !== void 0 ? parseInt(y, 10) : void 0,
          );
        }
        throw new je(pt, `Bad request: ${c}`, 400);
      }
      case 403:
        throw new je(pt, `Access denied: ${c}`, 403);
      case 404:
        throw new je(pt, `Model or endpoint not found: ${c}`, 404);
      case 500:
      case 502:
      case 503:
        throw new je(pt, `Anthropic server error: ${c}`, i.status);
      case 529:
        throw new je(pt, `Anthropic API overloaded: ${c}`, 529);
      default:
        throw new je(pt, c, i.status);
    }
  }
  _buildRequestBody(i, l, c) {
    const { systemPrompt: u, conversationMessages: p } = this._extractSystemMessages(i),
      h = {
        model: this.modelId,
        messages: p.map((m) => this._toAnthropicMessage(m)),
        max_tokens: l.maxTokens ?? I0,
      };
    return (
      u && (h.system = u),
      c && (h.stream = !0),
      l.temperature !== void 0 && (h.temperature = l.temperature),
      l.stopSequences !== void 0 &&
        l.stopSequences.length > 0 &&
        (h.stop_sequences = l.stopSequences),
      h
    );
  }
  _extractSystemMessages(i) {
    const l = [],
      c = [];
    for (const u of i) u.role === Me.SYSTEM ? l.push(u.content) : c.push(u);
    return {
      systemPrompt:
        l.length > 0
          ? l.join(`

`)
          : void 0,
      conversationMessages: c,
    };
  }
  _toAnthropicMessage(i) {
    return { role: this._mapRole(i.role), content: i.content };
  }
  _mapRole(i) {
    switch (i) {
      case Me.USER:
        return 'user';
      case Me.ASSISTANT:
        return 'assistant';
      case Me.TOOL:
        return 'user';
      case Me.SYSTEM:
        return 'user';
    }
  }
  _mapStopReason(i) {
    switch (i) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop_sequence';
      case null:
        return 'unknown';
      default:
        return i;
    }
  }
  async *_parseSSEStream(i) {
    const l = i.body;
    if (!l) throw new je(pt, 'Streaming response has no body');
    const c = l.getReader(),
      u = new TextDecoder();
    let p = '',
      h = 0,
      m = 0;
    try {
      for (;;) {
        const g = await c.read();
        if (g.done) break;
        p += u.decode(g.value, { stream: !0 });
        const v = p.split(`
`);
        p = v.pop() ?? '';
        let y = '';
        for (const S of v) {
          const C = S.trim();
          if (!(C === '' || C.startsWith(':'))) {
            if (C.startsWith('event: ')) {
              y = C.slice(7).trim();
              continue;
            }
            if (C.startsWith('data: ')) {
              const R = C.slice(6);
              let j;
              try {
                j = JSON.parse(R);
              } catch {
                continue;
              }
              if (y === 'message_stop') return;
              if (j.type === 'message_start') {
                const b = j;
                b.message.usage && (h = b.message.usage.input_tokens);
                continue;
              }
              if (
                (j.type === 'content_block_delta' && (yield { content: j.delta.text }),
                j.type === 'message_delta')
              ) {
                const b = j;
                (b.usage && (m = b.usage.output_tokens),
                  yield {
                    content: '',
                    finishReason: this._mapStopReason(b.delta.stop_reason),
                    tokenUsage: { promptTokens: h, completionTokens: m, totalTokens: h + m },
                  });
              }
            }
          }
        }
      }
    } finally {
      c.releaseLock();
    }
  }
}
const A0 = 'http://localhost:11434',
  Qt = 'ollama';
class L0 extends Gl {
  constructor(i) {
    super({ ...i, provider: Qt });
    le(this, '_baseUrl');
    le(this, '_apiKey');
    ((this._baseUrl = i.baseUrl ?? A0), (this._apiKey = i.apiKey));
  }
  async _doGenerateText(i, l) {
    const c = this._buildRequestBody(i, l, !1),
      p = await (await this._fetch('/api/chat', c, l.signal)).json();
    return {
      content: p.message.content ?? '',
      finishReason: this._mapDoneReason(p.done_reason),
      tokenUsage: {
        promptTokens: p.prompt_eval_count ?? 0,
        completionTokens: p.eval_count ?? 0,
        totalTokens: (p.prompt_eval_count ?? 0) + (p.eval_count ?? 0),
      },
    };
  }
  async _doGenerateStream(i, l) {
    const c = this._buildRequestBody(i, l, !0),
      u = await this._fetch('/api/chat', c, l.signal),
      p = this._parseNDJSONStream(u);
    return new Yl(Qt, p);
  }
  async _fetch(i, l, c) {
    const u = `${this._baseUrl}${i}`,
      p = { 'Content-Type': 'application/json' };
    this._apiKey && (p.Authorization = `Bearer ${this._apiKey}`);
    let h;
    try {
      h = await fetch(u, {
        method: 'POST',
        headers: p,
        body: JSON.stringify(l),
        ...(c !== void 0 && { signal: c }),
      });
    } catch (m) {
      const g = m instanceof Error ? m : new Error(String(m));
      throw g.name === 'AbortError'
        ? new je(Qt, 'Request was aborted', void 0, g)
        : new je(Qt, `Network error: ${g.message}`, void 0, g);
    }
    return (h.ok || (await this._handleErrorResponse(h)), h);
  }
  async _handleErrorResponse(i) {
    let l;
    try {
      l = await i.json();
    } catch {}
    const c = (l == null ? void 0 : l.error) ?? `HTTP ${String(i.status)}: ${i.statusText}`;
    switch (i.status) {
      case 404:
        throw new je(
          Qt,
          `Model not found: ${c}. Ensure the model is pulled with 'ollama pull ${this.modelId}'.`,
          404,
        );
      case 429: {
        const u = i.headers.get('retry-after'),
          p = u ? Math.round(parseFloat(u) * 1e3) : void 0;
        throw new Hl(Qt, `Rate limit exceeded: ${c}`, p);
      }
      case 400:
        throw new je(Qt, `Bad request: ${c}`, 400);
      case 500:
      case 502:
      case 503:
        throw new je(Qt, `Ollama server error: ${c}`, i.status);
      default:
        throw new je(Qt, c, i.status);
    }
  }
  _buildRequestBody(i, l, c) {
    const u = { model: this.modelId, messages: i.map((h) => this._toOllamaMessage(h)), stream: c },
      p = {};
    return (
      l.temperature !== void 0 && (p.temperature = l.temperature),
      l.maxTokens !== void 0 && (p.num_predict = l.maxTokens),
      l.stopSequences !== void 0 && l.stopSequences.length > 0 && (p.stop = l.stopSequences),
      Object.keys(p).length > 0 && (u.options = p),
      u
    );
  }
  _toOllamaMessage(i) {
    return { role: this._mapRole(i.role), content: i.content };
  }
  _mapRole(i) {
    switch (i) {
      case Me.SYSTEM:
        return 'system';
      case Me.USER:
        return 'user';
      case Me.ASSISTANT:
        return 'assistant';
      case Me.TOOL:
        return 'tool';
    }
  }
  _mapDoneReason(i) {
    switch (i) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'load':
        return 'load';
      case void 0:
        return 'stop';
      default:
        return i;
    }
  }
  async *_parseNDJSONStream(i) {
    const l = i.body;
    if (!l) throw new je(Qt, 'Streaming response has no body');
    const c = l.getReader(),
      u = new TextDecoder();
    let p = '';
    try {
      for (;;) {
        const h = await c.read();
        if (h.done) break;
        p += u.decode(h.value, { stream: !0 });
        const m = p.split(`
`);
        p = m.pop() ?? '';
        for (const g of m) {
          const v = g.trim();
          if (v === '') continue;
          let y;
          try {
            y = JSON.parse(v);
          } catch {
            continue;
          }
          if (y.done) {
            yield {
              content: y.message.content ?? '',
              finishReason: this._mapDoneReason(y.done_reason),
              tokenUsage: {
                promptTokens: y.prompt_eval_count ?? 0,
                completionTokens: y.eval_count ?? 0,
                totalTokens: (y.prompt_eval_count ?? 0) + (y.eval_count ?? 0),
              },
            };
            return;
          }
          yield { content: y.message.content ?? '' };
        }
      }
    } finally {
      c.releaseLock();
    }
  }
}
var M0 = {};
const P0 = 'https://api.openai.com/v1',
  ft = 'openai';
class Mp extends Gl {
  constructor(i) {
    super({ ...i, provider: ft });
    le(this, '_apiKey');
    le(this, '_baseUrl');
    const l = i.apiKey ?? M0.OPENAI_API_KEY;
    if (!l || l.trim().length === 0)
      throw new aa(
        ft,
        'API key is required. Provide it via config.apiKey or the OPENAI_API_KEY environment variable.',
      );
    ((this._apiKey = l), (this._baseUrl = i.baseUrl ?? P0));
  }
  async _doGenerateText(i, l) {
    var m, g, v;
    const c = this._buildRequestBody(i, l, !1),
      p = await (await this._fetch('/chat/completions', c, l.signal)).json(),
      h = p.choices[0];
    if (!h) throw new je(ft, 'OpenAI returned no choices in the response');
    return {
      content: h.message.content ?? '',
      finishReason: h.finish_reason ?? 'unknown',
      tokenUsage: {
        promptTokens: ((m = p.usage) == null ? void 0 : m.prompt_tokens) ?? 0,
        completionTokens: ((g = p.usage) == null ? void 0 : g.completion_tokens) ?? 0,
        totalTokens: ((v = p.usage) == null ? void 0 : v.total_tokens) ?? 0,
      },
    };
  }
  async _doGenerateStream(i, l) {
    const c = this._buildRequestBody(i, l, !0),
      u = await this._fetch('/chat/completions', c, l.signal),
      p = this._parseSSEStream(u);
    return new Yl(ft, p);
  }
  async _fetch(i, l, c) {
    const u = `${this._baseUrl}${i}`;
    let p;
    try {
      p = await fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this._apiKey}` },
        body: JSON.stringify(l),
        ...(c !== void 0 && { signal: c }),
      });
    } catch (h) {
      const m = h instanceof Error ? h : new Error(String(h));
      throw m.name === 'AbortError'
        ? new je(ft, 'Request was aborted', void 0, m)
        : new je(ft, `Network error: ${m.message}`, void 0, m);
    }
    return (p.ok || (await this._handleErrorResponse(p)), p);
  }
  async _handleErrorResponse(i) {
    var p, h;
    let l;
    try {
      l = await i.json();
    } catch {}
    const c =
        ((p = l == null ? void 0 : l.error) == null ? void 0 : p.message) ??
        `HTTP ${String(i.status)}: ${i.statusText}`,
      u = ((h = l == null ? void 0 : l.error) == null ? void 0 : h.type) ?? '';
    switch (i.status) {
      case 401:
        throw new aa(ft, `Authentication failed: ${c}`);
      case 429: {
        const m = i.headers.get('retry-after'),
          g = m ? Math.round(parseFloat(m) * 1e3) : void 0;
        throw new Hl(ft, `Rate limit exceeded: ${c}`, g);
      }
      case 400: {
        if (
          u === 'invalid_request_error' &&
          (c.includes('maximum context length') || c.includes('too many tokens'))
        ) {
          const m = /maximum context length is (\d+)/.exec(c),
            g = /you requested (\d+)/.exec(c),
            v = g == null ? void 0 : g[1],
            y = m == null ? void 0 : m[1];
          throw new uf(
            ft,
            `Context length exceeded: ${c}`,
            v !== void 0 ? parseInt(v, 10) : void 0,
            y !== void 0 ? parseInt(y, 10) : void 0,
          );
        }
        throw new je(ft, `Bad request: ${c}`, 400);
      }
      case 403:
        throw new je(ft, `Access denied: ${c}`, 403);
      case 404:
        throw new je(ft, `Model or endpoint not found: ${c}`, 404);
      case 500:
      case 502:
      case 503:
        throw new je(ft, `OpenAI server error: ${c}`, i.status);
      default:
        throw new je(ft, c, i.status);
    }
  }
  _buildRequestBody(i, l, c) {
    const u = { model: this.modelId, messages: i.map((p) => this._toOpenAIMessage(p)) };
    return (
      c && ((u.stream = !0), (u.stream_options = { include_usage: !0 })),
      l.temperature !== void 0 && (u.temperature = l.temperature),
      l.maxTokens !== void 0 && (u.max_tokens = l.maxTokens),
      l.stopSequences !== void 0 && l.stopSequences.length > 0 && (u.stop = l.stopSequences),
      u
    );
  }
  _toOpenAIMessage(i) {
    return {
      role: this._mapRole(i.role),
      content: i.content,
      ...(i.name !== void 0 && { name: i.name }),
    };
  }
  _mapRole(i) {
    switch (i) {
      case Me.SYSTEM:
        return 'system';
      case Me.USER:
        return 'user';
      case Me.ASSISTANT:
        return 'assistant';
      case Me.TOOL:
        return 'tool';
    }
  }
  async *_parseSSEStream(i) {
    const l = i.body;
    if (!l) throw new je(ft, 'Streaming response has no body');
    const c = l.getReader(),
      u = new TextDecoder();
    let p = '';
    try {
      for (;;) {
        const h = await c.read();
        if (h.done) break;
        p += u.decode(h.value, { stream: !0 });
        const m = p.split(`
`);
        p = m.pop() ?? '';
        for (const g of m) {
          const v = g.trim();
          if (!(v === '' || v.startsWith(':'))) {
            if (v === 'data: [DONE]') return;
            if (v.startsWith('data: ')) {
              const y = v.slice(6);
              let S;
              try {
                S = JSON.parse(y);
              } catch {
                continue;
              }
              const C = S.choices[0],
                R = (C == null ? void 0 : C.delta.content) ?? '',
                j = (C == null ? void 0 : C.finish_reason) ?? void 0;
              yield {
                content: R,
                ...(j !== void 0 && { finishReason: j }),
                ...(S.usage !== void 0 &&
                  S.usage !== null && {
                    tokenUsage: {
                      promptTokens: S.usage.prompt_tokens,
                      completionTokens: S.usage.completion_tokens,
                      totalTokens: S.usage.total_tokens,
                    },
                  }),
              };
            }
          }
        }
      }
    } finally {
      c.releaseLock();
    }
  }
}
const D0 = {},
  Pp = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
function z0(a) {
  const s = typeof window < 'u',
    i = (c) => {
      if (!s) return a.baseUrl;
      switch (c) {
        case 'openai':
          return a.baseUrl ?? '/api/openai/v1';
        case 'anthropic':
          return a.baseUrl ?? '/api/anthropic';
        default:
          return a.baseUrl;
      }
    };
  if (a.provider === 'azure') {
    const c = {
      provider: 'openai',
      modelId: a.modelId || 'gpt-4o-mini',
      apiKey: 'azure-managed',
      baseUrl: '/api/chat/v1',
    };
    return new Mp(c);
  }
  const l = {
    provider: a.provider,
    modelId: a.modelId,
    ...(a.apiKey ? { apiKey: a.apiKey } : {}),
    baseUrl: i(a.provider) ?? void 0,
  };
  switch (a.provider) {
    case 'openai':
      return new Mp(l);
    case 'anthropic':
      return new O0(l);
    case 'ollama':
      return new L0(l);
  }
}
function Rl() {
  if (typeof window < 'u') {
    const s = localStorage.getItem('crewspace:llm-config');
    if (s)
      try {
        return JSON.parse(s);
      } catch {}
  }
  const a = D0.VITE_OPENAI_API_KEY;
  return a
    ? { provider: 'openai', modelId: 'gpt-4o', apiKey: a }
    : { provider: 'azure', modelId: 'gpt-4o-mini' };
}
function $0(a) {
  typeof window < 'u' && localStorage.setItem('crewspace:llm-config', JSON.stringify(a));
}
const ff = Ln.map((a) => `${a.id} (${a.role})`).join(`
`),
  U0 = `You are an AI workflow planner. Output ONLY valid JSON — no prose, no markdown, no comments, no trailing commas.

The user describes a goal. Decompose it into agents and tasks.

You MUST pick agents from this catalog using their exact id:
${ff}

Rules:
- agentIds: pick 2-6 ids from the catalog
- tasks: 3-8 tasks, each with id ("task-*"), description, agentId (from catalog), dependencies (array of task ids), expectedOutput
- Every agent must have ≥1 task. No circular deps.
- discussion field is optional, set to null when not needed

Output exactly:
{"name":"string","agentIds":["id1","id2"],"tasks":[{"id":"task-1","description":"...","agentId":"id1","dependencies":[],"expectedOutput":"...","discussion":null}]}`;
function hf(a, s) {
  return {
    id: a.id,
    role: a.role,
    goal: a.goal,
    backstory: a.backstory,
    tools: [...a.tools],
    status: 'idle',
    color: Pp[s % Pp.length] ?? '#6366f1',
    position: { x: 100 + (s % 4) * 300, y: 80 + Math.floor(s / 4) * 220 },
  };
}
async function W0(a, s) {
  const i = await s.generateText([
      { role: Me.SYSTEM, content: U0 },
      { role: Me.USER, content: `Create a JSON workflow plan for this goal: ${a}` },
    ]),
    l = G0(i.content),
    c = new Map(Ln.map((C) => [C.id, C])),
    u = l;
  let p = l.agentIds ?? [];
  (!p || p.length === 0) && u.agents && (p = u.agents.map((C) => C.id));
  const h = p.filter((C) => c.has(C));
  for (const C of l.tasks)
    C.agentId && c.has(C.agentId) && !h.includes(C.agentId) && h.push(C.agentId);
  if (h.length < 2) {
    for (const C of Ln) if (!h.includes(C.id) && (h.push(C.id), h.length >= 2)) break;
  }
  const m = h.map((C, R) => {
      const j = c.get(C);
      return hf(j, R);
    }),
    g = new Set(m.map((C) => C.id)),
    v = l.tasks.map((C, R) => {
      var b;
      let j = C.agentId ?? '';
      return (
        g.has(j) || (j = ((b = m[R % m.length]) == null ? void 0 : b.id) ?? ''),
        {
          id: C.id ?? `task-${R + 1}`,
          description: C.description ?? 'No description',
          agentId: j,
          dependencies: C.dependencies ?? [],
          expectedOutput: C.expectedOutput ?? '',
          status: 'pending',
          ...(C.discussion
            ? {
                discussion: {
                  participantIds: C.discussion.participantIds,
                  maxRounds: C.discussion.maxRounds,
                  convergenceStrategy: C.discussion.convergenceStrategy,
                  ...(C.discussion.topic ? { topic: C.discussion.topic } : {}),
                },
              }
            : {}),
        }
      );
    }),
    y = new Set(v.map((C) => C.id));
  for (const C of v)
    ((C.dependencies = C.dependencies.filter((R) => y.has(R) && R !== C.id)),
      C.discussion &&
        (C.discussion.participantIds = C.discussion.participantIds.filter((R) => g.has(R))));
  xf(v);
  const S = mf(v);
  return {
    id: `wf-${Date.now()}`,
    name: l.name,
    description: a,
    agents: m,
    tasks: v,
    discussionEdges: S,
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
function mf(a) {
  const s = [];
  for (const i of a) {
    if (!i.discussion) continue;
    const l = i.discussion.participantIds;
    for (let c = 0; c < l.length; c++)
      for (let u = c + 1; u < l.length; u++)
        s.push({
          id: `edge-${i.id}-${l[c]}-${l[u]}`,
          fromAgentId: l[c],
          toAgentId: l[u],
          taskId: i.id,
          status: 'idle',
          messages: [],
        });
  }
  return s;
}
const B0 = `You are an AI assistant helping the user refine their agent workflow.

Agents come from a fixed catalog (only these ids are valid):
${ff}

If the user wants to modify the workflow, respond with JSON (no trailing commas) wrapped in <json>...</json> tags containing {"name","agentIds":[...],"tasks":[...]}.
Otherwise respond in markdown.

Current workflow:
`;
async function F0(a, s, i) {
  const l = s
      ? JSON.stringify(
          {
            name: s.name,
            agents: s.agents.map((h) => ({ id: h.id, role: h.role, goal: h.goal, tools: h.tools })),
            tasks: s.tasks.map((h) => ({
              id: h.id,
              description: h.description,
              agentId: h.agentId,
              dependencies: h.dependencies,
              ...(h.discussion ? { discussion: h.discussion } : {}),
            })),
          },
          null,
          2,
        )
      : 'No workflow yet.',
    u = (
      await i.generateText([
        { role: Me.SYSTEM, content: B0 + l },
        { role: Me.USER, content: a },
      ])
    ).content,
    p = u.match(/<json>([\s\S]*?)<\/json>/);
  if (p != null && p[1] && s)
    try {
      const h = JSON.parse(p[1]),
        m = new Map(Ln.map((T) => [T.id, T])),
        g = h;
      let v = h.agentIds ?? [];
      (!v || v.length === 0) && g.agents && (v = g.agents.map((T) => T.id));
      const y = v.filter((T) => m.has(T));
      for (const T of h.tasks)
        T.agentId && m.has(T.agentId) && !y.includes(T.agentId) && y.push(T.agentId);
      const S = y.map((T, z) => {
          const W = m.get(T);
          return hf(W, z);
        }),
        C = h.tasks.map((T) => ({
          id: T.id,
          description: T.description,
          agentId: T.agentId,
          dependencies: T.dependencies ?? [],
          expectedOutput: T.expectedOutput ?? '',
          status: 'pending',
          ...(T.discussion
            ? {
                discussion: {
                  participantIds: T.discussion.participantIds,
                  maxRounds: T.discussion.maxRounds,
                  convergenceStrategy: T.discussion.convergenceStrategy,
                  ...(T.discussion.topic ? { topic: T.discussion.topic } : {}),
                },
              }
            : {}),
        })),
        R = mf(C),
        j = {
          ...s,
          name: h.name ?? s.name,
          agents: S,
          tasks: C,
          discussionEdges: R,
          updatedAt: Date.now(),
        };
      return {
        text:
          u.replace(/<json>[\s\S]*?<\/json>/, '').trim() ||
          "I've updated the workflow. Here's what changed.",
        updatedWorkflow: j,
      };
    } catch {}
  return { text: u, updatedWorkflow: null };
}
function V0(a) {
  switch (a) {
    case 'unanimous':
      return Bt.UNANIMOUS;
    case 'majority':
      return Bt.MAJORITY;
    case 'llm-judge':
      return Bt.LLM_JUDGE;
    case 'stable-output':
      return Bt.STABLE_OUTPUT;
    default:
      return Bt.UNANIMOUS;
  }
}
async function H0(a, s, i) {
  const l = {
      'web-search': 'You can search the web to find current information, articles, and data.',
      'web-scraper': 'You can extract structured data from web pages.',
      'document-reader': 'You can read and analyze documents, PDFs, and text files.',
      'data-processor': 'You can process, transform, and analyze structured data and datasets.',
      'chart-generator': 'You can create data visualizations, charts, and graphs.',
      'document-writer': 'You can compose well-structured documents, reports, and articles.',
      'code-executor': 'You can write and reason about code to solve computational problems.',
      'api-caller': 'You can interact with external APIs to fetch or send data.',
    },
    c = a.agents.map((g) => {
      const v = (g.tools ?? []).map((S) => l[S]).filter(Boolean),
        y = [g.backstory, ...(v.length > 0 ? [`Capabilities: ${v.join(' ')}`] : [])].filter(Boolean)
          .join(`

`);
      return new w0({
        id: g.id,
        role: g.role,
        goal: g.goal,
        backstory: y,
        llmProvider: s,
        verbose: !0,
      });
    }),
    u = new Set(c.map((g) => g.id)),
    p = new Set(a.tasks.map((g) => g.id)),
    h = a.tasks.map((g, v) => {
      var R;
      let y = g.agentId;
      (!y || !u.has(y)) && (y = ((R = c[v % c.length]) == null ? void 0 : R.id) ?? g.agentId);
      const S = g.dependencies.filter((j) => p.has(j) && j !== g.id),
        C = { id: g.id, description: g.description || 'Execute task', agentId: y };
      return (
        g.expectedOutput && (C.expectedOutput = g.expectedOutput),
        S.length > 0 && (C.dependencies = S),
        g.discussion &&
          (C.discussion = {
            participantIds: g.discussion.participantIds.filter((j) => u.has(j)),
            maxRounds: g.discussion.maxRounds,
            convergenceStrategy: V0(g.discussion.convergenceStrategy),
            ...(g.discussion.topic ? { topic: g.discussion.topic } : {}),
          }),
        C
      );
    });
  xf(h);
  const m = new _0({ id: a.id, name: a.name, agents: c, tasks: h, verbose: !0, parallel: !0 });
  (m.on('crew:task:start', (g, v, y) => {
    i.onTaskStart(v, y);
  }),
    m.on('crew:task:complete', (g, v, y) => {
      i.onTaskComplete(v, y);
    }),
    m.on('crew:task:error', (g, v, y) => {
      i.onTaskError(v, y);
    }),
    m.on('crew:discussion:start', (g, v, y) => {
      var S;
      (S = i.onDiscussionStart) == null || S.call(i, v, y);
    }),
    m.on('crew:discussion:message', (g, v, y) => {
      var S;
      (S = i.onDiscussionMessage) == null || S.call(i, v, y);
    }),
    m.on('crew:discussion:complete', (g, v, y) => {
      var S;
      (S = i.onDiscussionComplete) == null || S.call(i, v, y);
    }));
  try {
    const g = await m.run();
    return (i.onCrewComplete(g), g);
  } catch (g) {
    const v = g instanceof Error ? g : new Error(String(g));
    throw (i.onCrewError(v), v);
  }
}
function G0(a) {
  let s = a.trim();
  s.startsWith('```') && (s = s.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, ''));
  const i = [s],
    l = s.indexOf('{'),
    c = s.lastIndexOf('}');
  l !== -1 && c > l && i.push(s.slice(l, c + 1));
  for (const u of i)
    try {
      return JSON.parse(u);
    } catch {
      try {
        return JSON.parse(Y0(u));
      } catch {}
    }
  throw new Error(`LLM response is not valid JSON:
${s.slice(0, 300)}`);
}
function Y0(a) {
  let s = a;
  return (
    (s = s.replace(/\/\/[^\n]*/g, '')),
    (s = s.replace(/\/\*[\s\S]*?\*\//g, '')),
    (s = s.replace(/,\s*([\]\}])/g, '$1')),
    (s = s.replace(/[\x00-\x1f]/g, (i) =>
      i ===
        `
` ||
      i === '\r' ||
      i === '	'
        ? i
        : '',
    )),
    s
  );
}
function xf(a) {
  const s = new Map(a.map((p) => [p.id, p])),
    i = new Map(),
    l = new Map();
  for (const p of a) (i.set(p.id, 0), l.set(p.id, []));
  for (const p of a)
    for (const h of p.dependencies ?? [])
      s.has(h) && (l.get(h).push(p.id), i.set(p.id, (i.get(p.id) ?? 0) + 1));
  const c = [];
  for (const [p, h] of i) h === 0 && c.push(p);
  const u = new Set();
  for (; c.length > 0; ) {
    const p = c.shift();
    u.add(p);
    for (const h of l.get(p) ?? []) {
      const m = (i.get(h) ?? 1) - 1;
      (i.set(h, m), m === 0 && c.push(h));
    }
  }
  if (u.size < a.length)
    for (const p of a)
      !u.has(p.id) && p.dependencies && (p.dependencies = p.dependencies.filter((h) => u.has(h)));
}
const Dp = [
  {
    value: 'azure',
    label: 'Azure OpenAI',
    placeholder: 'Managed by server',
    models: ['gpt-4o-mini'],
  },
  {
    value: 'openai',
    label: 'OpenAI',
    placeholder: 'sk-…',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    placeholder: 'sk-ant-…',
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-haiku-20240307',
    ],
  },
  {
    value: 'ollama',
    label: 'Ollama (local)',
    placeholder: 'No key needed',
    models: ['llama3', 'mistral', 'codellama', 'mixtral'],
  },
];
function Z0({ open: a, onClose: s, onSaved: i }) {
  var h;
  const [l, c] = N.useState(Rl());
  if (
    (N.useEffect(() => {
      if (a) {
        c(Rl());
        const m = (g) => {
          g.key === 'Escape' && s();
        };
        return (
          document.addEventListener('keydown', m),
          () => document.removeEventListener('keydown', m)
        );
      }
    }, [a, s]),
    !a)
  )
    return null;
  const u = Dp.find((m) => m.value === l.provider),
    p = () => {
      ($0(l), i(), s());
    };
  return n.jsx('div', {
    className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm',
    onClick: s,
    children: n.jsxs('div', {
      className:
        'bg-[var(--cs-surface-panel)] border border-[var(--cs-border-default)] rounded-xl w-full max-w-md p-6 shadow-2xl',
      onClick: (m) => m.stopPropagation(),
      children: [
        n.jsxs('div', {
          className: 'flex items-center justify-between mb-6',
          children: [
            n.jsx('h2', {
              className: 'text-lg font-semibold text-[var(--cs-text-primary)]',
              children: 'LLM Settings',
            }),
            n.jsx('button', {
              onClick: s,
              className:
                'text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors',
              children: n.jsxs('svg', {
                width: '20',
                height: '20',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                children: [
                  n.jsx('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
                  n.jsx('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
                ],
              }),
            }),
          ],
        }),
        n.jsxs('div', {
          className: 'mb-4',
          children: [
            n.jsx('label', {
              className: 'block text-sm text-[var(--cs-text-secondary)] mb-1.5',
              children: 'Provider',
            }),
            n.jsx('div', {
              className: 'flex gap-2',
              children: Dp.map((m) =>
                n.jsx(
                  'button',
                  {
                    onClick: () => {
                      const g = { ...l, provider: m.value, modelId: m.models[0] ?? '' };
                      ((m.value === 'ollama' || m.value === 'azure') && delete g.apiKey, c(g));
                    },
                    className: `flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${l.provider === m.value ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400' : 'border-[var(--cs-border-default)] text-[var(--cs-text-secondary)] hover:border-[var(--cs-border-strong)]'}`,
                    children: m.label,
                  },
                  m.value,
                ),
              ),
            }),
          ],
        }),
        l.provider !== 'ollama' &&
          l.provider !== 'azure' &&
          n.jsxs('div', {
            className: 'mb-4',
            children: [
              n.jsx('label', {
                className: 'block text-sm text-[var(--cs-text-secondary)] mb-1.5',
                children: 'API Key',
              }),
              n.jsx('input', {
                type: 'password',
                value: l.apiKey ?? '',
                onChange: (m) => c({ ...l, apiKey: m.target.value }),
                placeholder: (u == null ? void 0 : u.placeholder) ?? 'Enter API key',
                className:
                  'w-full px-3 py-2 rounded-lg bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-[var(--cs-text-primary)] placeholder-[var(--cs-text-tertiary)] text-sm focus:outline-none focus:border-indigo-600 transition-colors',
              }),
              n.jsx('p', {
                className: 'mt-1 text-xs text-[var(--cs-text-tertiary)]',
                children:
                  l.provider === 'openai'
                    ? 'Get your key at platform.openai.com'
                    : 'Get your key at console.anthropic.com',
              }),
            ],
          }),
        l.provider === 'ollama' &&
          n.jsxs('div', {
            className: 'mb-4',
            children: [
              n.jsx('label', {
                className: 'block text-sm text-[var(--cs-text-secondary)] mb-1.5',
                children: 'Base URL',
              }),
              n.jsx('input', {
                type: 'text',
                value: l.baseUrl ?? 'http://localhost:11434',
                onChange: (m) => c({ ...l, baseUrl: m.target.value }),
                placeholder: 'http://localhost:11434',
                className:
                  'w-full px-3 py-2 rounded-lg bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-[var(--cs-text-primary)] placeholder-[var(--cs-text-tertiary)] text-sm focus:outline-none focus:border-indigo-600 transition-colors',
              }),
            ],
          }),
        n.jsxs('div', {
          className: 'mb-6',
          children: [
            n.jsx('label', {
              className: 'block text-sm text-[var(--cs-text-secondary)] mb-1.5',
              children: 'Model',
            }),
            n.jsx('select', {
              value: l.modelId,
              onChange: (m) => c({ ...l, modelId: m.target.value }),
              className:
                'w-full px-3 py-2 rounded-lg bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-[var(--cs-text-primary)] text-sm focus:outline-none focus:border-indigo-600 transition-colors appearance-none',
              children:
                u == null
                  ? void 0
                  : u.models.map((m) => n.jsx('option', { value: m, children: m }, m)),
            }),
          ],
        }),
        n.jsxs('div', {
          className: 'flex gap-3',
          children: [
            n.jsx('button', {
              onClick: s,
              className:
                'flex-1 px-4 py-2 rounded-lg border border-[var(--cs-border-default)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-card)] transition-colors text-sm',
              children: 'Cancel',
            }),
            n.jsx('button', {
              onClick: p,
              disabled:
                l.provider !== 'ollama' &&
                l.provider !== 'azure' &&
                !((h = l.apiKey) != null && h.trim()),
              className:
                'flex-1 px-4 py-2 rounded-lg bg-indigo-700 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium',
              children: 'Save',
            }),
          ],
        }),
      ],
    }),
  });
}
function K0() {
  const { workflowId: a } = $l(),
    s = Ur(),
    i = Ht(),
    l = s.state,
    c = (l == null ? void 0 : l.prompt) ?? '',
    u = (l == null ? void 0 : l.workflow) ?? null,
    [p, h] = N.useState(null),
    [m, g] = N.useState(!1),
    [v, y] = N.useState([]),
    [S, C] = N.useState(null),
    [R, j] = N.useState('graph'),
    [b] = N.useState(420),
    [T, z] = N.useState(!1),
    [W, G] = N.useState(null),
    [Q, pe] = N.useState(!1),
    [ge, Se] = N.useState(!1),
    { importCrewFromWorkflow: He } = oa(),
    Ge = N.useRef(null),
    Je = N.useCallback(() => {
      if (!Ge.current) {
        const B = Rl();
        Ge.current = z0(B);
      }
      return Ge.current;
    }, []),
    ke = N.useCallback((B, U) => {
      const $ = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: B,
        content: U,
        timestamp: Date.now(),
      };
      y((Y) => [...Y, $]);
    }, []),
    Ie = N.useRef(!1);
  (N.useEffect(() => {
    if (!u || p || Ie.current) return;
    ((Ie.current = !0), h(u));
    const B = u.tasks.filter(($) => $.discussion).length,
      U =
        B > 0
          ? `

**Discussions:** ${B} collaborative task(s).`
          : '';
    ke(
      'assistant',
      `Workflow **${u.name}** is ready with **${u.agents.length} agents** and **${u.tasks.length} tasks**.${U}

**Agents:**
${u.agents.map(($) => `• **${$.role}** — ${$.goal}`).join(`
`)}

**Task pipeline:**
${u.tasks.map(($, Y) => `${Y + 1}. ${$.description}`).join(`
`)}

You can modify agents, reorder tasks, or hit **Run** to execute.`,
    );
  }, []),
    N.useEffect(() => {
      !c ||
        u ||
        p ||
        Ie.current ||
        ((Ie.current = !0),
        ke('system', `Analyzing your request: "${c}"`),
        g(!0),
        G(null),
        (async () => {
          try {
            const B = Je(),
              U = await W0(c, B);
            (h(U), g(!1));
            const $ = U.tasks.filter((q) => q.discussion).length,
              Y =
                $ > 0
                  ? `

**Discussions:** ${$} collaborative task(s) where agents will discuss and iterate until convergence.`
                  : '';
            ke(
              'assistant',
              `I've assembled a team of **${U.agents.length} agents** with **${U.tasks.length} tasks** to execute your initiative.${Y}

**Agents:**
${U.agents.map((q) => `• **${q.role}** — ${q.goal}`).join(`
`)}

**Task pipeline:**
${U.tasks.map((q, oe) => `${oe + 1}. ${q.description}${q.discussion ? ' (collaborative)' : ''}`)
  .join(`
`)}

You can modify agents, reorder tasks, or hit **Run** to execute.`,
            );
          } catch (B) {
            const U = B instanceof Error ? B.message : String(B);
            (g(!1),
              G(U),
              ke(
                'assistant',
                `Failed to generate workflow: ${U}

Please check your API key in Settings (gear icon) and try again.`,
              ));
          }
        })());
    }, []));
  const Ye = N.useCallback(
      async (B) => {
        (ke('user', B), G(null));
        try {
          const U = Je(),
            { text: $, updatedWorkflow: Y } = await F0(B, p, U);
          (Y && h(Y), ke('assistant', $));
        } catch (U) {
          const $ = U instanceof Error ? U.message : String(U);
          (G($), ke('assistant', `Error: ${$}`));
        }
      },
      [p, Je, ke],
    ),
    et = N.useCallback(async () => {
      if (p) {
        (h((B) => (B ? { ...B, status: 'running' } : null)),
          ke('system', 'Starting workflow execution…'),
          G(null));
        try {
          const B = Je();
          await H0(p, B, {
            onTaskStart(U, $) {
              var q;
              h((oe) =>
                oe
                  ? {
                      ...oe,
                      tasks: oe.tasks.map((fe) =>
                        fe.id === U ? { ...fe, status: 'running' } : fe,
                      ),
                      agents: oe.agents.map((fe) =>
                        fe.id === $ ? { ...fe, status: 'working' } : fe,
                      ),
                    }
                  : null,
              );
              const Y = p.agents.find((oe) => oe.id === $);
              ke(
                'system',
                `▶ **${(Y == null ? void 0 : Y.role) ?? $}** is working on: ${((q = p.tasks.find((oe) => oe.id === U)) == null ? void 0 : q.description) ?? U}`,
              );
            },
            onTaskComplete(U, $) {
              h((Y) =>
                Y
                  ? {
                      ...Y,
                      tasks: Y.tasks.map((q) =>
                        q.id === U ? { ...q, status: 'completed', output: $.output } : q,
                      ),
                      agents: Y.agents.map((q) => {
                        const oe = Y.tasks.some(
                          (fe) => fe.agentId === q.id && fe.id !== U && fe.status === 'running',
                        );
                        return q.id === $.agentId && !oe ? { ...q, status: 'idle' } : q;
                      }),
                    }
                  : null,
              );
            },
            onTaskError(U, $) {
              (h((Y) =>
                Y
                  ? {
                      ...Y,
                      tasks: Y.tasks.map((q) => (q.id === U ? { ...q, status: 'failed' } : q)),
                    }
                  : null,
              ),
                ke('assistant', `Task **${U}** failed: ${$.message}`));
            },
            onCrewComplete(U) {
              h((Y) => (Y ? { ...Y, status: 'completed' } : null));
              const $ = Array.from(U.taskResults.entries()).map(
                ([Y, q]) =>
                  `**${Y}**: ${q.output.slice(0, 200)}${q.output.length > 200 ? '…' : ''}`,
              ).join(`

`);
              ke(
                'assistant',
                `All ${U.taskResults.size} tasks completed in ${(U.duration / 1e3).toFixed(1)}s.

${$}`,
              );
            },
            onCrewError(U) {
              (h(($) => ($ ? { ...$, status: 'failed' } : null)),
                ke('assistant', `Workflow failed: ${U.message}`));
            },
            onDiscussionStart(U, $) {
              const Y = U.split('-disc-')[1],
                q = $.map((oe) => {
                  var fe;
                  return (
                    ((fe = p.agents.find((tt) => tt.id === oe)) == null ? void 0 : fe.role) ?? oe
                  );
                }).join(' & ');
              (ke('system', `Discussion started for task **${Y}** — ${q} are collaborating`),
                h((oe) =>
                  oe
                    ? {
                        ...oe,
                        discussionEdges: (oe.discussionEdges ?? []).map((fe) =>
                          fe.taskId === Y ? { ...fe, status: 'active' } : fe,
                        ),
                        agents: oe.agents.map((fe) =>
                          $.includes(fe.id) ? { ...fe, status: 'working' } : fe,
                        ),
                      }
                    : null,
                ));
            },
            onDiscussionMessage(U, $) {
              const Y = U.split('-disc-')[1],
                q = p.agents.find((tt) => tt.id === $.fromAgentId);
              h((tt) =>
                tt
                  ? {
                      ...tt,
                      discussionEdges: (tt.discussionEdges ?? []).map((ue) =>
                        ue.taskId !== Y
                          ? ue
                          : ue.fromAgentId === $.fromAgentId || ue.toAgentId === $.fromAgentId
                            ? {
                                ...ue,
                                messages: [
                                  ...ue.messages,
                                  {
                                    id: $.id,
                                    fromAgentId: $.fromAgentId,
                                    toAgentId: $.toAgentId,
                                    content: $.content,
                                    round: $.round,
                                    type: $.type,
                                    timestamp: $.timestamp,
                                  },
                                ],
                              }
                            : ue,
                      ),
                    }
                  : null,
              );
              const oe =
                  $.type === 'agreement'
                    ? '[agreed]'
                    : $.type === 'disagreement'
                      ? '[disagreed]'
                      : $.type === 'revision'
                        ? '[revised]'
                        : $.type === 'question'
                          ? '[asked]'
                          : '[said]',
                fe = $.content
                  .replace(/^\[(?:AGREE|DISAGREE|REVISE|QUESTION|PROPOSAL)\]\s*/i, '')
                  .slice(0, 100);
              ke(
                'system',
                `**${(q == null ? void 0 : q.role) ?? $.fromAgentId}** ${oe} (round ${$.round}): ${fe}${$.content.length > 100 ? '…' : ''}`,
              );
            },
            onDiscussionComplete(U, $) {
              const Y = U.split('-disc-')[1],
                q =
                  $.status === 'converged'
                    ? `converged at round ${$.convergenceRound}`
                    : `completed after ${$.rounds.length} rounds (${$.status})`;
              (ke('system', `Discussion for **${Y}** ${q} with ${$.totalMessages} messages`),
                h((oe) =>
                  oe
                    ? {
                        ...oe,
                        discussionEdges: (oe.discussionEdges ?? []).map((fe) =>
                          fe.taskId === Y
                            ? {
                                ...fe,
                                status: $.status === 'converged' ? 'converged' : 'max-rounds',
                              }
                            : fe,
                        ),
                      }
                    : null,
                ));
            },
          });
        } catch (B) {
          const U = B instanceof Error ? B.message : String(B);
          (G(U), h(($) => ($ ? { ...$, status: 'failed' } : null)));
        }
      }
    }, [p, Je, ke]),
    ze = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'],
    Ee = N.useCallback((B) => {
      h((U) => {
        if (!U) return null;
        const { id: $, ...Y } = B,
          q = {
            ...Y,
            id: $ ?? `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            status: 'idle',
            color: B.color || ze[U.agents.length % ze.length],
            position: { x: U.agents.length * 200, y: 100 },
          };
        return { ...U, agents: [...U.agents, q], updatedAt: Date.now() };
      });
    }, []),
    M = N.useCallback((B, U) => {
      h(($) =>
        $
          ? {
              ...$,
              agents: $.agents.map((Y) => (Y.id === B ? { ...Y, ...U } : Y)),
              updatedAt: Date.now(),
            }
          : null,
      );
    }, []),
    E = N.useCallback(
      (B) => {
        (h((U) =>
          U
            ? {
                ...U,
                agents: U.agents.filter(($) => $.id !== B),
                tasks: U.tasks.map(($) => ($.agentId === B ? { ...$, agentId: '' } : $)),
                updatedAt: Date.now(),
              }
            : null,
        ),
          S === B && C(null));
      },
      [S],
    ),
    L = N.useCallback((B) => {
      h((U) => {
        if (!U) return null;
        const $ = {
          ...B,
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          status: 'pending',
        };
        return { ...U, tasks: [...U.tasks, $], updatedAt: Date.now() };
      });
    }, []),
    k = N.useCallback((B, U) => {
      h(($) =>
        $
          ? {
              ...$,
              tasks: $.tasks.map((Y) => (Y.id === B ? { ...Y, ...U } : Y)),
              updatedAt: Date.now(),
            }
          : null,
      );
    }, []),
    D = N.useCallback(
      (B) => {
        (h((U) =>
          U ? { ...U, tasks: U.tasks.filter(($) => $.id !== B), updatedAt: Date.now() } : null,
        ),
          S === B && C(null));
      },
      [S],
    ),
    te = N.useCallback(() => {
      if (!p) return;
      const B = He(p.name || 'Untitled Crew', p.description || '', p.agents, p.tasks);
      (h((U) => (U ? { ...U, crewId: B.id } : null)),
        ke(
          'system',
          `Crew "${B.name}" saved with ${B.agents.length} agents and ${B.tasks.length} tasks. You can find it in My Crews.`,
        ));
    }, [p, He, ke]);
  return n.jsxs('div', {
    className: 'h-screen flex flex-col bg-[var(--cs-surface-app)] overflow-hidden',
    children: [
      n.jsx(fg, {
        workflow: p,
        viewMode: R,
        onViewModeChange: j,
        onRun: et,
        onBack: () => i('/'),
        onSettings: () => pe(!0),
        isGenerating: m,
        onToggleCrewBlade: () => Se(!ge),
        isCrewBladeOpen: ge,
        onSaveAsCrew: te,
      }),
      W &&
        n.jsxs('div', {
          className:
            'flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20 animate-fadeInDown',
          children: [
            n.jsxs('svg', {
              width: '14',
              height: '14',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: '#ef4444',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              children: [
                n.jsx('circle', { cx: '12', cy: '12', r: '10' }),
                n.jsx('line', { x1: '15', y1: '9', x2: '9', y2: '15' }),
                n.jsx('line', { x1: '9', y1: '9', x2: '15', y2: '15' }),
              ],
            }),
            n.jsx('span', { className: 'text-xs text-rose-300 flex-1 truncate', children: W }),
            n.jsx('button', {
              onClick: () => G(null),
              className: 'text-xs text-rose-400 hover:text-rose-300 transition-colors focus-ring',
              'aria-label': 'Dismiss error',
              children: 'Dismiss',
            }),
          ],
        }),
      n.jsxs('div', {
        className: 'flex-1 flex overflow-hidden',
        children: [
          !T &&
            n.jsx('div', {
              className:
                'flex-shrink-0 border-r border-[var(--cs-border-subtle)] flex flex-col bg-[var(--cs-surface-panel)] animate-slideInLeft',
              style: { width: b },
              children: n.jsx(Qx, { messages: v, onSendMessage: Ye, isGenerating: m, workflow: p }),
            }),
          n.jsx('button', {
            onClick: () => z(!T),
            className:
              'flex-shrink-0 w-6 flex items-center justify-center bg-[var(--cs-surface-panel)]/50 border-r border-[var(--cs-border-subtle)] hover:bg-indigo-500/10 transition-all group focus-ring',
            'aria-label': T ? 'Expand chat sidebar' : 'Collapse chat sidebar',
            title: T ? 'Expand chat' : 'Collapse chat',
            children: n.jsx('svg', {
              width: '12',
              height: '12',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              className: `text-[var(--cs-text-tertiary)] group-hover:text-indigo-400 transition-all duration-200 ${T ? '' : 'rotate-180'}`,
              children: n.jsx('polyline', { points: '15 18 9 12 15 6' }),
            }),
          }),
          n.jsx('div', {
            className: 'flex-1 min-w-0',
            children: n.jsx(rg, {
              workflow: p,
              viewMode: R,
              selectedNodeId: S,
              onSelectNode: C,
              isGenerating: m,
              onWorkflowChange: h,
            }),
          }),
        ],
      }),
      n.jsx($g, {
        isOpen: ge,
        onClose: () => Se(!1),
        agents: (p == null ? void 0 : p.agents) ?? [],
        tasks: (p == null ? void 0 : p.tasks) ?? [],
        selectedNodeId: S,
        onAgentAdd: Ee,
        onAgentUpdate: M,
        onAgentDelete: E,
        onTaskAdd: L,
        onTaskUpdate: k,
        onTaskDelete: D,
        onNodeSelect: C,
      }),
      n.jsx(Z0, {
        open: Q,
        onClose: () => pe(!1),
        onSaved: () => {
          Ge.current = null;
        },
      }),
    ],
  });
}
const zp = [
    {
      id: 'tpl-market-research',
      name: 'Market Research Crew',
      description:
        'A team of analysts that researches market trends, competitor strategies, and customer needs — delivering a comprehensive report with actionable insights.',
      category: 'Research',
      categoryColor: '#22d3ee',
      agents: [
        {
          role: 'Industry Analyst',
          goal: 'Identify market trends and opportunities',
          color: '#22d3ee',
        },
        {
          role: 'Competitor Researcher',
          goal: 'Analyze competitor strengths and weaknesses',
          color: '#818cf8',
        },
        {
          role: 'Customer Insights Specialist',
          goal: 'Synthesize customer feedback and needs',
          color: '#34d399',
        },
        {
          role: 'Report Writer',
          goal: 'Compile findings into executive summary',
          color: '#fbbf24',
        },
      ],
      tasks: [
        {
          description: 'Research industry trends and market size',
          agentRole: 'Industry Analyst',
          expectedOutput: 'Market trends report with data points',
        },
        {
          description: 'Identify top 5 competitors and their strategies',
          agentRole: 'Competitor Researcher',
          expectedOutput: 'Competitive landscape analysis',
        },
        {
          description: 'Analyze customer surveys and feedback channels',
          agentRole: 'Customer Insights Specialist',
          expectedOutput: 'Customer needs summary',
        },
        {
          description: 'Identify market gaps and opportunities',
          agentRole: 'Industry Analyst',
          expectedOutput: 'Opportunity matrix',
          dependsOn: [0],
        },
        {
          description: 'Cross-team debate on strategic priorities and market positioning',
          agentRole: 'Industry Analyst',
          expectedOutput: 'Agreed strategic priorities document',
          dependsOn: [0, 1, 2, 3],
          discussion: {
            participantRoles: [
              'Industry Analyst',
              'Competitor Researcher',
              'Customer Insights Specialist',
            ],
            maxRounds: 3,
            convergenceStrategy: 'majority',
            topic: 'Which market opportunities should we prioritize?',
          },
        },
        {
          description: 'Synthesize findings into executive report',
          agentRole: 'Report Writer',
          expectedOutput: 'Executive summary with recommendations',
          dependsOn: [4],
        },
        {
          description: 'Create actionable strategy roadmap',
          agentRole: 'Report Writer',
          expectedOutput: 'Strategic roadmap document',
          dependsOn: [5],
        },
      ],
      workflows: [
        {
          name: 'Full Market Analysis',
          description: 'End-to-end market research with competitor and customer analysis',
        },
        {
          name: 'Quick Competitor Scan',
          description: 'Rapid competitive landscape overview for a specific sector',
        },
      ],
      usageCount: 2340,
      featured: !0,
      tags: ['market analysis', 'competitive intelligence', 'strategy'],
    },
    {
      id: 'tpl-content-marketing',
      name: 'Content Marketing Squad',
      description:
        'Plan, write, review, and schedule a full content calendar — from ideation to publish-ready blog posts, social media copy, and email campaigns.',
      category: 'Content',
      categoryColor: '#fbbf24',
      agents: [
        {
          role: 'Content Strategist',
          goal: 'Define content themes and editorial calendar',
          color: '#fbbf24',
        },
        { role: 'Copywriter', goal: 'Draft blog posts and social media content', color: '#f87171' },
        { role: 'SEO Specialist', goal: 'Optimize content for search engines', color: '#34d399' },
        { role: 'Editor', goal: 'Review and polish all written content', color: '#818cf8' },
      ],
      tasks: [
        {
          description: 'Define content themes and editorial calendar',
          agentRole: 'Content Strategist',
          expectedOutput: 'Monthly content calendar',
        },
        {
          description: 'Draft 4 blog posts based on themes',
          agentRole: 'Copywriter',
          expectedOutput: 'Blog post drafts',
          dependsOn: [0],
        },
        {
          description: 'Create social media copy for each post',
          agentRole: 'Copywriter',
          expectedOutput: 'Social media copy pack',
          dependsOn: [0],
        },
        {
          description: 'Perform keyword research and optimize content',
          agentRole: 'SEO Specialist',
          expectedOutput: 'SEO-optimized content',
          dependsOn: [0],
        },
        {
          description: 'Draft email campaign copy',
          agentRole: 'Copywriter',
          expectedOutput: 'Email campaign drafts',
          dependsOn: [0],
        },
        {
          description: 'Editorial review session — align tone, accuracy, and SEO balance',
          agentRole: 'Editor',
          expectedOutput: 'Aligned editorial guidelines',
          dependsOn: [1, 2, 3, 4],
          discussion: {
            participantRoles: ['Editor', 'Copywriter', 'SEO Specialist'],
            maxRounds: 3,
            convergenceStrategy: 'stable-output',
            topic: 'Balance SEO optimization with engaging writing style',
          },
        },
        {
          description: 'Final quality check and approval',
          agentRole: 'Editor',
          expectedOutput: 'Approved content package',
          dependsOn: [5],
        },
      ],
      workflows: [
        {
          name: 'Monthly Blog Pipeline',
          description: 'Plan, write, and publish a full month of blog content',
        },
        {
          name: 'Social Campaign Blitz',
          description: 'Create and schedule a week of social media content',
        },
        {
          name: 'Email Newsletter Flow',
          description: 'Draft and review a weekly email newsletter',
        },
      ],
      usageCount: 1870,
      featured: !0,
      tags: ['blogging', 'social media', 'SEO', 'campaigns'],
    },
    {
      id: 'tpl-code-review',
      name: 'Code Review Pipeline',
      description:
        'Automated multi-pass code review that checks for bugs, security vulnerabilities, performance issues, and style consistency across pull requests.',
      category: 'Engineering',
      categoryColor: '#818cf8',
      agents: [
        {
          role: 'Security Auditor',
          goal: 'Identify security vulnerabilities and injection risks',
          color: '#f87171',
        },
        {
          role: 'Performance Reviewer',
          goal: 'Flag performance bottlenecks and inefficiencies',
          color: '#fbbf24',
        },
        {
          role: 'Style Checker',
          goal: 'Ensure code follows team style guidelines',
          color: '#818cf8',
        },
      ],
      tasks: [
        {
          description: 'Scan for security vulnerabilities (OWASP Top 10)',
          agentRole: 'Security Auditor',
          expectedOutput: 'Security findings report',
        },
        {
          description: 'Profile performance hotspots and bottlenecks',
          agentRole: 'Performance Reviewer',
          expectedOutput: 'Performance analysis',
        },
        {
          description: 'Check style guide compliance',
          agentRole: 'Style Checker',
          expectedOutput: 'Style violations list',
        },
        {
          description: 'Joint severity assessment — debate priority of findings',
          agentRole: 'Security Auditor',
          expectedOutput: 'Prioritized findings with consensus severity ratings',
          dependsOn: [0, 1, 2],
          discussion: {
            participantRoles: ['Security Auditor', 'Performance Reviewer', 'Style Checker'],
            maxRounds: 2,
            convergenceStrategy: 'majority',
            topic: 'Classify each finding as critical, major, or minor',
          },
        },
        {
          description: 'Compile all findings into unified review',
          agentRole: 'Security Auditor',
          expectedOutput: 'Unified code review report',
          dependsOn: [3],
        },
        {
          description: 'Generate fix suggestions for critical issues',
          agentRole: 'Performance Reviewer',
          expectedOutput: 'Suggested fixes',
          dependsOn: [3],
        },
      ],
      workflows: [
        {
          name: 'Full PR Review',
          description: 'Complete multi-pass code review for pull requests',
        },
        { name: 'Security-Only Audit', description: 'Focused security vulnerability scan' },
      ],
      usageCount: 1450,
      featured: !1,
      tags: ['code review', 'security', 'CI/CD', 'quality'],
    },
    {
      id: 'tpl-customer-support',
      name: 'Customer Support Crew',
      description:
        'Triage incoming tickets, generate contextual responses, and escalate complex issues — reducing response time and improving customer satisfaction.',
      category: 'Support',
      categoryColor: '#34d399',
      agents: [
        {
          role: 'Ticket Classifier',
          goal: 'Categorize and prioritize support tickets',
          color: '#22d3ee',
        },
        { role: 'Response Generator', goal: 'Draft helpful, empathetic replies', color: '#34d399' },
        {
          role: 'Escalation Manager',
          goal: 'Route complex issues to human agents',
          color: '#f87171',
        },
      ],
      tasks: [
        {
          description: 'Classify and prioritize incoming tickets',
          agentRole: 'Ticket Classifier',
          expectedOutput: 'Categorized ticket queue',
        },
        {
          description: 'Generate contextual response drafts',
          agentRole: 'Response Generator',
          expectedOutput: 'Response drafts',
          dependsOn: [0],
        },
        {
          description:
            'Escalation triage discussion — decide which tickets need human intervention',
          agentRole: 'Escalation Manager',
          expectedOutput: 'Agreed escalation criteria and routed tickets',
          dependsOn: [0, 1],
          discussion: {
            participantRoles: ['Ticket Classifier', 'Escalation Manager'],
            maxRounds: 2,
            convergenceStrategy: 'unanimous',
            topic: 'Which tickets should be escalated vs auto-resolved?',
          },
        },
        {
          description: 'Route complex issues to human agents',
          agentRole: 'Escalation Manager',
          expectedOutput: 'Escalation queue',
          dependsOn: [2],
        },
        {
          description: 'Track SLA compliance and response times',
          agentRole: 'Escalation Manager',
          expectedOutput: 'SLA dashboard data',
          dependsOn: [1, 3],
        },
      ],
      workflows: [
        {
          name: 'Ticket Triage Pipeline',
          description: 'Classify, respond, and escalate support tickets automatically',
        },
        { name: 'SLA Compliance Monitor', description: 'Track and report on support SLA metrics' },
      ],
      usageCount: 980,
      featured: !0,
      tags: ['helpdesk', 'automation', 'ticketing', 'SLA'],
    },
    {
      id: 'tpl-data-pipeline',
      name: 'Data Analysis Pipeline',
      description:
        'Ingest data from multiple sources, clean and transform it, run statistical analysis, and produce visualization-ready summaries and dashboards.',
      category: 'Data',
      categoryColor: '#f87171',
      agents: [
        {
          role: 'Data Engineer',
          goal: 'Collect and clean data from multiple sources',
          color: '#22d3ee',
        },
        {
          role: 'Data Analyst',
          goal: 'Run statistical analysis and find patterns',
          color: '#f87171',
        },
        {
          role: 'Visualization Specialist',
          goal: 'Create charts and dashboard summaries',
          color: '#fbbf24',
        },
      ],
      tasks: [
        {
          description: 'Ingest and clean data from multiple sources',
          agentRole: 'Data Engineer',
          expectedOutput: 'Clean dataset',
        },
        {
          description: 'Run statistical analysis and find patterns',
          agentRole: 'Data Analyst',
          expectedOutput: 'Statistical findings',
          dependsOn: [0],
        },
        {
          description: 'Data quality review — discuss anomalies and validation rules',
          agentRole: 'Data Engineer',
          expectedOutput: 'Validated data quality rules and resolved anomalies',
          dependsOn: [0, 1],
          discussion: {
            participantRoles: ['Data Engineer', 'Data Analyst'],
            maxRounds: 3,
            convergenceStrategy: 'stable-output',
            topic: 'Are the detected anomalies real issues or expected patterns?',
          },
        },
        {
          description: 'Generate data visualizations and charts',
          agentRole: 'Visualization Specialist',
          expectedOutput: 'Chart package',
          dependsOn: [2],
        },
        {
          description: 'Compile dashboard-ready summaries',
          agentRole: 'Visualization Specialist',
          expectedOutput: 'Dashboard summary',
          dependsOn: [2],
        },
        {
          description: 'Write data insights narrative',
          agentRole: 'Data Analyst',
          expectedOutput: 'Insights report',
          dependsOn: [3, 4],
        },
      ],
      workflows: [
        {
          name: 'End-to-End Analytics',
          description: 'Ingest, analyze, and visualize data from raw sources',
        },
        {
          name: 'Quick Insight Report',
          description: 'Fast statistical analysis on a single dataset',
        },
      ],
      usageCount: 760,
      featured: !1,
      tags: ['analytics', 'ETL', 'dashboards', 'statistics'],
    },
    {
      id: 'tpl-onboarding',
      name: 'Employee Onboarding Crew',
      description:
        'Automate new hire onboarding — generate personalized welcome docs, schedule orientation meetings, assign training modules, and track completion.',
      category: 'Automation',
      categoryColor: '#cbd5e1',
      agents: [
        {
          role: 'Onboarding Coordinator',
          goal: 'Orchestrate the full onboarding checklist',
          color: '#818cf8',
        },
        {
          role: 'Document Generator',
          goal: 'Create personalized welcome materials',
          color: '#34d399',
        },
        {
          role: 'Training Scheduler',
          goal: 'Assign and schedule training modules',
          color: '#fbbf24',
        },
      ],
      tasks: [
        {
          description: 'Generate personalized welcome packet',
          agentRole: 'Document Generator',
          expectedOutput: 'Welcome documents',
        },
        {
          description: 'Schedule first-week orientation meetings',
          agentRole: 'Training Scheduler',
          expectedOutput: 'Orientation calendar',
        },
        {
          description: 'Assign role-specific training modules',
          agentRole: 'Training Scheduler',
          expectedOutput: 'Training plan',
        },
        {
          description: 'Set up accounts and access permissions',
          agentRole: 'Onboarding Coordinator',
          expectedOutput: 'Access provisioning checklist',
        },
        {
          description: 'Send day-1 welcome email sequence',
          agentRole: 'Document Generator',
          expectedOutput: 'Welcome emails',
          dependsOn: [0, 3],
        },
        {
          description: 'Track onboarding completion and follow up',
          agentRole: 'Onboarding Coordinator',
          expectedOutput: 'Completion report',
          dependsOn: [1, 2, 4],
        },
      ],
      workflows: [
        {
          name: 'New Hire Onboarding',
          description: 'End-to-end onboarding checklist for a new team member',
        },
        {
          name: 'Training Assignment Flow',
          description: 'Assign and track role-specific training modules',
        },
      ],
      usageCount: 540,
      featured: !1,
      tags: ['HR', 'onboarding', 'training', 'automation'],
    },
    {
      id: 'tpl-product-launch',
      name: 'Product Launch Team',
      description:
        'Coordinate a product launch across marketing, engineering, and sales — from positioning and messaging to launch-day execution and post-launch analysis.',
      category: 'Content',
      categoryColor: '#fbbf24',
      agents: [
        {
          role: 'Launch Manager',
          goal: 'Coordinate cross-functional launch timeline',
          color: '#f87171',
        },
        {
          role: 'Messaging Strategist',
          goal: 'Craft positioning and key messaging',
          color: '#fbbf24',
        },
        {
          role: 'Channel Coordinator',
          goal: 'Prepare assets for each distribution channel',
          color: '#22d3ee',
        },
        { role: 'Analytics Lead', goal: 'Track launch KPIs and report results', color: '#34d399' },
      ],
      tasks: [
        {
          description: 'Define product positioning and key messages',
          agentRole: 'Messaging Strategist',
          expectedOutput: 'Messaging framework',
        },
        {
          description: 'Build launch timeline with milestones',
          agentRole: 'Launch Manager',
          expectedOutput: 'Launch timeline',
        },
        {
          description: 'Prepare assets for each channel',
          agentRole: 'Channel Coordinator',
          expectedOutput: 'Channel asset kit',
          dependsOn: [0],
        },
        {
          description: 'Draft press release and media kit',
          agentRole: 'Messaging Strategist',
          expectedOutput: 'Press materials',
          dependsOn: [0],
        },
        {
          description: 'Set up tracking and KPI dashboards',
          agentRole: 'Analytics Lead',
          expectedOutput: 'KPI dashboard',
          dependsOn: [1],
        },
        {
          description: 'Go/no-go launch readiness discussion',
          agentRole: 'Launch Manager',
          expectedOutput: 'Launch readiness consensus with risk assessment',
          dependsOn: [1, 2, 3, 4],
          discussion: {
            participantRoles: [
              'Launch Manager',
              'Messaging Strategist',
              'Channel Coordinator',
              'Analytics Lead',
            ],
            maxRounds: 2,
            convergenceStrategy: 'unanimous',
            topic: 'Are all channels, assets, and tracking ready for launch?',
          },
        },
        {
          description: 'Coordinate launch-day execution',
          agentRole: 'Launch Manager',
          expectedOutput: 'Launch-day checklist',
          dependsOn: [5],
        },
        {
          description: 'Monitor launch metrics in real-time',
          agentRole: 'Analytics Lead',
          expectedOutput: 'Launch metrics report',
          dependsOn: [5, 4],
        },
        {
          description: 'Compile post-launch analysis',
          agentRole: 'Launch Manager',
          expectedOutput: 'Post-launch report',
          dependsOn: [6, 7],
        },
      ],
      workflows: [
        {
          name: 'Full Product Launch',
          description: 'End-to-end product launch from positioning to post-launch analysis',
        },
        {
          name: 'Launch Prep Sprint',
          description: 'Prepare all assets and messaging before launch day',
        },
        {
          name: 'Post-Launch Review',
          description: 'Analyze launch performance and compile lessons learned',
        },
      ],
      usageCount: 430,
      featured: !0,
      tags: ['GTM', 'launch', 'marketing', 'cross-functional'],
    },
    {
      id: 'tpl-incident-response',
      name: 'Incident Response Crew',
      description:
        'Detect, triage, and remediate production incidents — with automated root-cause analysis, stakeholder communication, and post-mortem generation.',
      category: 'Engineering',
      categoryColor: '#818cf8',
      agents: [
        {
          role: 'Incident Commander',
          goal: 'Coordinate response and communication',
          color: '#f87171',
        },
        {
          role: 'Root Cause Analyst',
          goal: 'Investigate logs and identify root cause',
          color: '#818cf8',
        },
        {
          role: 'Comms Lead',
          goal: 'Draft status updates and stakeholder notifications',
          color: '#fbbf24',
        },
      ],
      tasks: [
        {
          description: 'Triage incident severity and impact',
          agentRole: 'Incident Commander',
          expectedOutput: 'Severity assessment',
        },
        {
          description: 'Investigate logs and traces for root cause',
          agentRole: 'Root Cause Analyst',
          expectedOutput: 'Root cause findings',
          dependsOn: [0],
        },
        {
          description: 'Draft stakeholder status updates',
          agentRole: 'Comms Lead',
          expectedOutput: 'Status update communications',
          dependsOn: [0],
        },
        {
          description: 'Incident war-room discussion — align on root cause and remediation plan',
          agentRole: 'Incident Commander',
          expectedOutput: 'Agreed root cause and remediation approach',
          dependsOn: [0, 1, 2],
          discussion: {
            participantRoles: ['Incident Commander', 'Root Cause Analyst', 'Comms Lead'],
            maxRounds: 3,
            convergenceStrategy: 'llm-judge',
            topic: 'What is the root cause and what is the fastest remediation path?',
          },
        },
        {
          description: 'Coordinate remediation actions',
          agentRole: 'Incident Commander',
          expectedOutput: 'Remediation plan',
          dependsOn: [3],
        },
        {
          description: 'Generate post-mortem document',
          agentRole: 'Root Cause Analyst',
          expectedOutput: 'Post-mortem report',
          dependsOn: [4],
        },
      ],
      workflows: [
        {
          name: 'Incident Response Flow',
          description: 'Detect, triage, remediate, and document production incidents',
        },
        {
          name: 'Post-Mortem Generator',
          description: 'Analyze an incident and auto-generate a post-mortem document',
        },
      ],
      usageCount: 670,
      featured: !1,
      tags: ['SRE', 'incident management', 'post-mortem', 'ops'],
    },
    {
      id: 'tpl-sales-outreach',
      name: 'Sales Outreach Squad',
      description:
        'Research prospects, personalize outreach sequences, and follow up — driving pipeline with data-driven, multi-touch engagement campaigns.',
      category: 'Automation',
      categoryColor: '#cbd5e1',
      agents: [
        {
          role: 'Prospect Researcher',
          goal: 'Gather intelligence on target accounts',
          color: '#22d3ee',
        },
        { role: 'Outreach Writer', goal: 'Craft personalized email sequences', color: '#34d399' },
        {
          role: 'Follow-up Coordinator',
          goal: 'Schedule and execute follow-up touchpoints',
          color: '#fbbf24',
        },
      ],
      tasks: [
        {
          description: 'Research target accounts and contacts',
          agentRole: 'Prospect Researcher',
          expectedOutput: 'Prospect profiles',
        },
        {
          description: 'Craft personalized email sequences',
          agentRole: 'Outreach Writer',
          expectedOutput: 'Email sequence drafts',
          dependsOn: [0],
        },
        {
          description:
            'Messaging strategy session — align on tone, value props, and personalization level',
          agentRole: 'Prospect Researcher',
          expectedOutput: 'Agreed messaging guidelines and personalization strategy',
          dependsOn: [0, 1],
          discussion: {
            participantRoles: ['Prospect Researcher', 'Outreach Writer', 'Follow-up Coordinator'],
            maxRounds: 2,
            convergenceStrategy: 'majority',
            topic: 'What messaging angle and personalization depth will maximize response rates?',
          },
        },
        {
          description: 'Schedule multi-touch follow-up cadence',
          agentRole: 'Follow-up Coordinator',
          expectedOutput: 'Follow-up schedule',
          dependsOn: [2],
        },
        {
          description: 'Personalize messaging for each account',
          agentRole: 'Outreach Writer',
          expectedOutput: 'Personalized messages',
          dependsOn: [2],
        },
        {
          description: 'Track engagement and adjust cadence',
          agentRole: 'Follow-up Coordinator',
          expectedOutput: 'Engagement report',
          dependsOn: [3, 4],
        },
      ],
      workflows: [
        {
          name: 'Outbound Campaign',
          description: 'Research, write, and execute a multi-touch sales outreach campaign',
        },
        {
          name: 'ABM Target Sprint',
          description: 'Deep-research a set of target accounts and craft personalized outreach',
        },
      ],
      usageCount: 890,
      featured: !1,
      tags: ['sales', 'email', 'outreach', 'prospecting'],
    },
  ],
  q0 = ['All', 'Research', 'Content', 'Engineering', 'Support', 'Data', 'Automation'];
function Q0() {
  const a = Ht(),
    [s, i] = N.useState(''),
    [l, c] = N.useState('All'),
    u = N.useMemo(() => {
      let m = zp;
      if ((l !== 'All' && (m = m.filter((g) => g.category === l)), s.trim())) {
        const g = s.toLowerCase();
        m = m.filter(
          (v) =>
            v.name.toLowerCase().includes(g) ||
            v.description.toLowerCase().includes(g) ||
            v.tags.some((y) => y.includes(g)),
        );
      }
      return m;
    }, [s, l]),
    { createCrew: p } = oa(),
    h = N.useCallback(
      (m) => {
        const g = m.agents.map((C, R) => ({
            id: `agent-${Date.now()}-${R}`,
            role: C.role,
            goal: C.goal,
            backstory: '',
            tools: [],
            status: 'idle',
            color: C.color,
            position: { x: 100 + R * 220, y: 120 },
          })),
          v = m.tasks.map((C, R) => `task-${Date.now()}-${R}`),
          y = m.tasks.map((C, R) => {
            var z;
            const j = g.find((W) => W.role === C.agentRole),
              b = (C.dependsOn ?? []).map((W) => v[W]).filter(Boolean),
              T = {
                id: v[R],
                description: C.description,
                agentId: (j == null ? void 0 : j.id) ?? ((z = g[0]) == null ? void 0 : z.id) ?? '',
                dependencies: b,
                expectedOutput: C.expectedOutput,
                status: 'pending',
              };
            if (C.discussion) {
              const W = C.discussion.participantRoles
                .map((G) => {
                  var Q;
                  return (Q = g.find((pe) => pe.role === G)) == null ? void 0 : Q.id;
                })
                .filter((G) => G != null);
              return {
                ...T,
                discussion: {
                  participantIds: W,
                  maxRounds: C.discussion.maxRounds,
                  convergenceStrategy: C.discussion.convergenceStrategy,
                  ...(C.discussion.topic ? { topic: C.discussion.topic } : {}),
                },
              };
            }
            return T;
          }),
          S = p({
            name: m.name,
            description: m.description,
            agents: g,
            tasks: y,
            workflows: m.workflows,
            color: m.categoryColor,
          });
        a(Ul(S.id));
      },
      [a, p],
    );
  return n.jsxs('div', {
    className: 'min-h-screen bg-[var(--cs-surface-app)] flex flex-col scrollbar-thin',
    'data-testid': 'templates-page',
    children: [
      n.jsx('header', {
        className: 'glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]',
        children: n.jsxs('div', {
          className: 'max-w-6xl mx-auto flex items-center justify-between px-6 py-4',
          children: [
            n.jsx('div', {
              className: 'flex items-center gap-3',
              children: n.jsxs('button', {
                onClick: () => a('/'),
                className: 'flex items-center gap-3 hover:opacity-80 transition-opacity',
                children: [
                  n.jsx('div', {
                    className:
                      'w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center',
                    children: n.jsxs('svg', {
                      width: '18',
                      height: '18',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'white',
                      strokeWidth: '2.5',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      children: [
                        n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                        n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                        n.jsx('path', { d: 'M2 12l10 5 10-5' }),
                      ],
                    }),
                  }),
                  n.jsxs('span', {
                    className: 'text-lg font-semibold text-[var(--cs-text-primary)] tracking-tight',
                    children: [
                      n.jsx('span', { className: 'gradient-text', children: 'Crew' }),
                      'Space',
                    ],
                  }),
                ],
              }),
            }),
            n.jsxs('nav', {
              className: 'hidden md:flex items-center gap-6',
              children: [
                n.jsx('button', {
                  onClick: () => a('/crews'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'My Crews',
                }),
                n.jsx('button', {
                  className: 'text-sm text-indigo-400 font-medium',
                  children: 'Templates',
                }),
                n.jsx('button', {
                  onClick: () => a('/marketplace'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Marketplace',
                }),
              ],
            }),
            n.jsx('button', {
              onClick: () => a('/'),
              className:
                'flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/25 focus-ring',
              children: 'New Crew',
            }),
          ],
        }),
      }),
      n.jsxs('section', {
        className: 'pt-16 pb-10 text-center px-6',
        children: [
          n.jsxs('h1', {
            className:
              'text-3xl md:text-4xl font-extrabold text-[var(--cs-text-primary)] tracking-tight mb-3',
            children: [
              'Crew ',
              n.jsx('span', { className: 'gradient-text', children: 'Templates' }),
            ],
          }),
          n.jsx('p', {
            className: 'text-base text-[var(--cs-text-secondary)] max-w-xl mx-auto leading-relaxed',
            children:
              'Pre-built team configurations with specialized agents and workflows. Pick a template and customize it for your needs.',
          }),
        ],
      }),
      n.jsx('div', {
        className: 'max-w-5xl mx-auto w-full px-6 mb-8',
        children: n.jsxs('div', {
          className: 'flex flex-col sm:flex-row items-stretch sm:items-center gap-4',
          children: [
            n.jsxs('div', {
              className: 'relative flex-1',
              children: [
                n.jsxs('svg', {
                  className:
                    'absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--cs-text-tertiary)] pointer-events-none',
                  width: '16',
                  height: '16',
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: '2',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  children: [
                    n.jsx('circle', { cx: '11', cy: '11', r: '8' }),
                    n.jsx('line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }),
                  ],
                }),
                n.jsx('input', {
                  type: 'text',
                  value: s,
                  onChange: (m) => i(m.target.value),
                  placeholder: 'Search templates...',
                  className:
                    'w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors',
                }),
              ],
            }),
            n.jsx('div', {
              className: 'flex items-center gap-1.5 flex-wrap',
              children: q0.map((m) =>
                n.jsx(
                  'button',
                  {
                    onClick: () => c(m),
                    className: `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${l === m ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] border border-transparent hover:border-[var(--cs-border-subtle)]'}`,
                    children: m,
                  },
                  m,
                ),
              ),
            }),
          ],
        }),
      }),
      l === 'All' &&
        !s.trim() &&
        n.jsxs('section', {
          className: 'max-w-5xl mx-auto w-full px-6 mb-10',
          children: [
            n.jsx('p', {
              className:
                'text-xs uppercase tracking-wider text-[var(--cs-text-tertiary)] mb-4 font-medium',
              children: 'Featured',
            }),
            n.jsx('div', {
              className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
              children: zp
                .filter((m) => m.featured)
                .map((m) => n.jsx(X0, { template: m, onUse: h }, m.id)),
            }),
          ],
        }),
      n.jsxs('section', {
        className: 'max-w-5xl mx-auto w-full px-6 pb-20',
        children: [
          l === 'All' &&
            !s.trim() &&
            n.jsx('p', {
              className:
                'text-xs uppercase tracking-wider text-[var(--cs-text-tertiary)] mb-4 font-medium',
              children: 'All templates',
            }),
          u.length === 0
            ? n.jsx('div', {
                className: 'text-center py-20',
                children: n.jsx('p', {
                  className: 'text-[var(--cs-text-tertiary)] text-sm',
                  children: 'No templates found matching your search.',
                }),
              })
            : n.jsx('div', {
                className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
                children: u.map((m) => n.jsx(J0, { template: m, onUse: h }, m.id)),
              }),
        ],
      }),
      n.jsx('footer', {
        className:
          'mt-auto px-6 py-8 border-t border-[var(--cs-border-subtle)] flex items-center justify-center',
        children: n.jsxs('p', {
          className: 'text-xs text-[var(--cs-text-tertiary)]',
          children: [
            '© ',
            new Date().getFullYear(),
            ' CrewSpace — AI Agent Orchestration Platform',
          ],
        }),
      }),
    ],
  });
}
function X0({ template: a, onUse: s }) {
  return n.jsxs('div', {
    className:
      'group relative rounded-2xl border border-[var(--cs-border-default)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--cs-border-hover)] transition-all duration-200 overflow-hidden',
    children: [
      n.jsx('div', {
        className: 'absolute top-0 left-0 right-0 h-1',
        style: { backgroundColor: a.categoryColor },
      }),
      n.jsxs('div', {
        className: 'p-6',
        children: [
          n.jsxs('div', {
            className: 'flex items-start justify-between gap-3 mb-3',
            children: [
              n.jsxs('div', {
                children: [
                  n.jsx('span', {
                    className:
                      'inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full mb-2',
                    style: { color: a.categoryColor, backgroundColor: `${a.categoryColor}20` },
                    children: a.category,
                  }),
                  n.jsx('h3', {
                    className:
                      'text-base font-semibold text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors',
                    children: a.name,
                  }),
                ],
              }),
              n.jsxs('span', {
                className: 'shrink-0 text-[10px] text-[var(--cs-text-tertiary)] tabular-nums mt-1',
                children: [a.usageCount.toLocaleString(), ' uses'],
              }),
            ],
          }),
          n.jsx('p', {
            className: 'text-sm text-[var(--cs-text-secondary)] leading-relaxed mb-4',
            children: a.description,
          }),
          n.jsxs('div', {
            className: 'flex items-center gap-2 mb-4',
            children: [
              n.jsx('div', {
                className: 'flex -space-x-1.5',
                children: a.agents.map((i, l) =>
                  n.jsx(
                    'div',
                    {
                      className:
                        'w-7 h-7 rounded-full border-2 border-[var(--cs-surface-app)] flex items-center justify-center text-white',
                      style: { backgroundColor: i.color },
                      title: i.role,
                      children: n.jsx(Ft, { id: i.id, size: 14, fallback: i.role }),
                    },
                    l,
                  ),
                ),
              }),
              n.jsxs('span', {
                className: 'text-[11px] text-[var(--cs-text-tertiary)]',
                children: [
                  a.agents.length,
                  ' agents · ',
                  a.tasks.length,
                  ' tasks · ',
                  a.workflows.length,
                  ' workflows',
                ],
              }),
            ],
          }),
          n.jsx('div', {
            className: 'flex flex-wrap gap-1.5 mb-5',
            children: a.agents.map((i, l) =>
              n.jsx(
                'span',
                {
                  className: 'text-[10px] px-2 py-0.5 rounded-full border',
                  style: {
                    color: i.color,
                    borderColor: `${i.color}40`,
                    backgroundColor: `${i.color}10`,
                  },
                  children: i.role,
                },
                l,
              ),
            ),
          }),
          n.jsxs('button', {
            onClick: () => s(a),
            className:
              'flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 focus-ring',
            children: [
              'Use this Crew',
              n.jsxs('svg', {
                width: '14',
                height: '14',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2.5',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                children: [
                  n.jsx('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
                  n.jsx('polyline', { points: '12 5 19 12 12 19' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function J0({ template: a, onUse: s }) {
  return n.jsxs('div', {
    className:
      'group flex flex-col rounded-xl border border-[var(--cs-border-subtle)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--cs-border-default)] transition-all duration-200 overflow-hidden',
    children: [
      n.jsx('div', { className: 'h-0.5', style: { backgroundColor: a.categoryColor } }),
      n.jsxs('div', {
        className: 'flex flex-col flex-1 p-5',
        children: [
          n.jsxs('div', {
            className: 'flex items-center justify-between mb-2',
            children: [
              n.jsx('span', {
                className:
                  'text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full',
                style: { color: a.categoryColor, backgroundColor: `${a.categoryColor}20` },
                children: a.category,
              }),
              n.jsxs('span', {
                className: 'text-[10px] text-[var(--cs-text-tertiary)] tabular-nums',
                children: [a.usageCount.toLocaleString(), ' uses'],
              }),
            ],
          }),
          n.jsx('h3', {
            className:
              'text-sm font-semibold text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors mb-1.5',
            children: a.name,
          }),
          n.jsx('p', {
            className:
              'text-xs text-[var(--cs-text-secondary)] leading-relaxed mb-4 line-clamp-2 flex-1',
            children: a.description,
          }),
          n.jsxs('div', {
            className: 'flex items-center gap-2 mb-3',
            children: [
              n.jsx('div', {
                className: 'flex -space-x-1',
                children: a.agents
                  .slice(0, 4)
                  .map((i, l) =>
                    n.jsx(
                      'div',
                      {
                        className:
                          'w-6 h-6 rounded-full border-2 border-[var(--cs-surface-app)] flex items-center justify-center text-white',
                        style: { backgroundColor: i.color },
                        title: i.role,
                        children: n.jsx(Ft, { id: i.id, size: 12, fallback: i.role }),
                      },
                      l,
                    ),
                  ),
              }),
              n.jsxs('span', {
                className: 'text-[11px] text-[var(--cs-text-tertiary)]',
                children: [
                  a.agents.length,
                  ' agents · ',
                  a.tasks.length,
                  ' tasks · ',
                  a.workflows.length,
                  ' workflows',
                ],
              }),
            ],
          }),
          n.jsx('div', {
            className: 'flex flex-wrap gap-1 mb-4',
            children: a.tags
              .slice(0, 3)
              .map((i) =>
                n.jsx(
                  'span',
                  {
                    className:
                      'text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[var(--cs-text-tertiary)] border border-[var(--cs-border-subtle)]',
                    children: i,
                  },
                  i,
                ),
              ),
          }),
          n.jsxs('button', {
            onClick: () => s(a),
            className:
              'mt-auto w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs font-medium transition-colors focus-ring',
            children: [
              'Use this Crew',
              n.jsxs('svg', {
                width: '12',
                height: '12',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2.5',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                children: [
                  n.jsx('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
                  n.jsx('polyline', { points: '12 5 19 12 12 19' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
const $p = [
  {
    id: 'int-1',
    name: 'OpenAI GPT-4',
    description: 'Connect GPT-4 and GPT-4o models for advanced reasoning and generation.',
    category: 'LLM',
    icon: '🧠',
    status: 'available',
  },
  {
    id: 'int-2',
    name: 'Anthropic Claude',
    description: 'Use Claude 3.5 Sonnet for long-context analysis and safe AI outputs.',
    category: 'LLM',
    icon: '🤖',
    status: 'available',
  },
  {
    id: 'int-3',
    name: 'Web Search',
    description: 'Enable agents to search the web for real-time information.',
    category: 'Tools',
    icon: '🔍',
    status: 'installed',
  },
  {
    id: 'int-4',
    name: 'File System',
    description: 'Read and write files on your local machine or cloud storage.',
    category: 'Tools',
    icon: '📁',
    status: 'installed',
  },
  {
    id: 'int-5',
    name: 'Slack',
    description: 'Send workflow results and notifications to Slack channels.',
    category: 'Communication',
    icon: '💬',
    status: 'available',
  },
  {
    id: 'int-6',
    name: 'GitHub',
    description: 'Create PRs, review code, and manage repos from your workflows.',
    category: 'DevTools',
    icon: '🐙',
    status: 'available',
  },
  {
    id: 'int-7',
    name: 'Notion',
    description: 'Sync workflow outputs to Notion pages and databases.',
    category: 'Productivity',
    icon: '📝',
    status: 'coming-soon',
  },
  {
    id: 'int-8',
    name: 'Google Sheets',
    description: 'Read data from and write results to Google Sheets.',
    category: 'Productivity',
    icon: '📊',
    status: 'coming-soon',
  },
  {
    id: 'int-9',
    name: 'Jira',
    description: 'Create and manage Jira issues from workflow task outputs.',
    category: 'DevTools',
    icon: '📌',
    status: 'coming-soon',
  },
];
function ev() {
  const a = Ht(),
    [s, i] = N.useState(''),
    [l, c] = N.useState('all'),
    u = ['all', ...new Set($p.map((h) => h.category))],
    p = $p.filter(
      (h) =>
        !(
          (l !== 'all' && h.category !== l) ||
          (s && !h.name.toLowerCase().includes(s.toLowerCase()))
        ),
    );
  return n.jsxs('div', {
    className: 'min-h-screen bg-[var(--cs-surface-app)] scrollbar-thin',
    children: [
      n.jsx('header', {
        className: 'glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]',
        children: n.jsxs('div', {
          className: 'max-w-6xl mx-auto flex items-center justify-between px-6 py-4',
          children: [
            n.jsx('div', {
              className: 'flex items-center gap-3',
              children: n.jsxs(Mr, {
                to: '/',
                className: 'flex items-center gap-2 focus-ring rounded-lg',
                children: [
                  n.jsx('div', {
                    className:
                      'w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center',
                    children: n.jsxs('svg', {
                      width: '18',
                      height: '18',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'white',
                      strokeWidth: '2.5',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      children: [
                        n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                        n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                        n.jsx('path', { d: 'M2 12l10 5 10-5' }),
                      ],
                    }),
                  }),
                  n.jsxs('span', {
                    className: 'text-lg font-semibold text-[var(--cs-text-primary)] tracking-tight',
                    children: [
                      n.jsx('span', { className: 'gradient-text', children: 'Crew' }),
                      'Space',
                    ],
                  }),
                ],
              }),
            }),
            n.jsxs('nav', {
              className: 'hidden md:flex items-center gap-6',
              children: [
                n.jsx('button', {
                  onClick: () => a('/dashboard'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Projects',
                }),
                n.jsx('button', {
                  onClick: () => a('/templates'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Templates',
                }),
                n.jsx('span', {
                  className: 'text-sm text-[var(--cs-text-primary)] font-medium',
                  children: 'Marketplace',
                }),
              ],
            }),
            n.jsx('div', {
              className:
                'w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-[var(--cs-text-primary)]',
              children: 'D',
            }),
          ],
        }),
      }),
      n.jsxs('main', {
        'data-testid': 'marketplace-page',
        className: 'max-w-6xl mx-auto px-6 py-8',
        children: [
          n.jsxs('div', {
            className: 'animate-fadeInDown mb-8',
            children: [
              n.jsx('h1', {
                className: 'text-2xl font-bold text-[var(--cs-text-primary)]',
                children: 'Marketplace',
              }),
              n.jsx('p', {
                className: 'text-sm text-[var(--cs-text-tertiary)] mt-1',
                children: 'Discover integrations, tools, and LLM providers for your workflows.',
              }),
            ],
          }),
          n.jsxs('div', {
            className:
              'flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 animate-fadeIn',
            children: [
              n.jsxs('div', {
                className: 'flex-1 relative',
                children: [
                  n.jsxs('svg', {
                    width: '16',
                    height: '16',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    className:
                      'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-text-tertiary)]',
                    children: [
                      n.jsx('circle', { cx: '11', cy: '11', r: '8' }),
                      n.jsx('line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }),
                    ],
                  }),
                  n.jsx('input', {
                    type: 'text',
                    value: s,
                    onChange: (h) => i(h.target.value),
                    placeholder: 'Search integrations...',
                    'aria-label': 'Search integrations',
                    className:
                      'w-full bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] outline-none focus:border-indigo-500/40 focus:shadow-sm focus:shadow-indigo-500/10 transition-all',
                  }),
                ],
              }),
              n.jsx('div', {
                className:
                  'flex items-center bg-[var(--cs-surface-card)]/20 rounded-xl p-1 border border-[var(--cs-border-subtle)] overflow-x-auto',
                children: u.map((h) =>
                  n.jsx(
                    'button',
                    {
                      onClick: () => c(h),
                      className: `px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap focus-ring ${l === h ? 'bg-indigo-600/20 text-indigo-300 shadow-sm' : 'text-[var(--cs-text-tertiary)] hover:text-slate-300'}`,
                      children: h,
                    },
                    h,
                  ),
                ),
              }),
            ],
          }),
          n.jsx('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children',
            children: p.map((h) =>
              n.jsxs(
                'div',
                {
                  className:
                    'card-hover rounded-xl border border-[var(--cs-border-subtle)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--cs-border-default)] transition-all p-5 group',
                  children: [
                    n.jsxs('div', {
                      className: 'flex items-start justify-between mb-3',
                      children: [
                        n.jsx('div', {
                          className:
                            'w-10 h-10 rounded-xl bg-[var(--cs-surface-card)]/20 border border-[var(--cs-border-default)] flex items-center justify-center text-xl',
                          children: h.icon,
                        }),
                        n.jsx(tv, { status: h.status }),
                      ],
                    }),
                    n.jsx('h3', {
                      className:
                        'text-sm font-semibold text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors mb-1.5',
                      children: h.name,
                    }),
                    n.jsx('p', {
                      className: 'text-xs text-[var(--cs-text-tertiary)] mb-3 line-clamp-2',
                      children: h.description,
                    }),
                    n.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        n.jsx('span', {
                          className:
                            'text-[10px] text-[var(--cs-text-tertiary)] uppercase tracking-wider font-medium',
                          children: h.category,
                        }),
                        h.status === 'available' &&
                          n.jsx('button', {
                            className:
                              'px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-[10px] font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-colors focus-ring',
                            children: 'Install',
                          }),
                        h.status === 'installed' &&
                          n.jsx('span', {
                            className:
                              'px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400',
                            children: 'Installed',
                          }),
                      ],
                    }),
                  ],
                },
                h.id,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}
function tv({ status: a }) {
  const s = {
      available: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
      installed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      'coming-soon': 'bg-slate-500/15 text-[var(--cs-text-secondary)] border-slate-500/20',
    },
    i = { available: 'available', installed: 'installed', 'coming-soon': 'coming soon' };
  return n.jsx('span', {
    className: `px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s[a]}`,
    children: i[a],
  });
}
const rv = [
  {
    title: 'Profile',
    description: 'Manage your account preferences, display name, and avatar.',
    icon: n.jsxs('svg', {
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      children: [
        n.jsx('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
        n.jsx('circle', { cx: '12', cy: '7', r: '4' }),
      ],
    }),
  },
  {
    title: 'API Keys',
    description: 'Configure your LLM provider API keys for OpenAI, Anthropic, and others.',
    icon: n.jsx('svg', {
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      children: n.jsx('path', {
        d: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
      }),
    }),
  },
  {
    title: 'Appearance',
    description: 'Customize the theme, colors, and layout of your workspace.',
    icon: n.jsxs('svg', {
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      children: [
        n.jsx('circle', { cx: '12', cy: '12', r: '3' }),
        n.jsx('path', {
          d: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
        }),
      ],
    }),
  },
  {
    title: 'Notifications',
    description: 'Control when and how you receive workflow status updates.',
    icon: n.jsxs('svg', {
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      children: [
        n.jsx('path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }),
        n.jsx('path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' }),
      ],
    }),
  },
];
function nv() {
  const a = Ht();
  return n.jsxs('div', {
    className: 'min-h-screen bg-[var(--cs-surface-app)] scrollbar-thin',
    children: [
      n.jsx('header', {
        className: 'glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]',
        children: n.jsxs('div', {
          className: 'max-w-6xl mx-auto flex items-center justify-between px-6 py-4',
          children: [
            n.jsx('div', {
              className: 'flex items-center gap-3',
              children: n.jsxs(Mr, {
                to: '/',
                className: 'flex items-center gap-2 focus-ring rounded-lg',
                children: [
                  n.jsx('div', {
                    className:
                      'w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center',
                    children: n.jsxs('svg', {
                      width: '18',
                      height: '18',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'white',
                      strokeWidth: '2.5',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      children: [
                        n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                        n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                        n.jsx('path', { d: 'M2 12l10 5 10-5' }),
                      ],
                    }),
                  }),
                  n.jsxs('span', {
                    className: 'text-lg font-semibold text-[var(--cs-text-primary)] tracking-tight',
                    children: [
                      n.jsx('span', { className: 'gradient-text', children: 'Crew' }),
                      'Space',
                    ],
                  }),
                ],
              }),
            }),
            n.jsxs('nav', {
              className: 'hidden md:flex items-center gap-6',
              children: [
                n.jsx('button', {
                  onClick: () => a('/dashboard'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Projects',
                }),
                n.jsx('button', {
                  onClick: () => a('/templates'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Templates',
                }),
                n.jsx('span', {
                  className: 'text-sm text-[var(--cs-text-primary)] font-medium',
                  children: 'Settings',
                }),
              ],
            }),
            n.jsx('div', {
              className:
                'w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-[var(--cs-text-primary)]',
              children: 'D',
            }),
          ],
        }),
      }),
      n.jsxs('main', {
        'data-testid': 'settings-page',
        className: 'max-w-4xl mx-auto px-6 py-8',
        children: [
          n.jsxs('div', {
            className: 'animate-fadeInDown mb-8',
            children: [
              n.jsx('h1', {
                className: 'text-2xl font-bold text-[var(--cs-text-primary)]',
                children: 'Settings',
              }),
              n.jsx('p', {
                className: 'text-sm text-[var(--cs-text-tertiary)] mt-1',
                children: 'Manage your account and workspace preferences',
              }),
            ],
          }),
          n.jsx('div', {
            className: 'flex flex-col gap-4 stagger-children',
            children: rv.map((s) =>
              n.jsx(
                'button',
                {
                  className:
                    'w-full text-left card-hover rounded-xl border border-[var(--cs-border-subtle)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--cs-border-default)] transition-all p-5 group focus-ring',
                  children: n.jsxs('div', {
                    className: 'flex items-start gap-4',
                    children: [
                      n.jsx('div', {
                        className:
                          'w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors',
                        children: s.icon,
                      }),
                      n.jsxs('div', {
                        className: 'flex-1 min-w-0',
                        children: [
                          n.jsx('h2', {
                            className:
                              'text-sm font-semibold text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors',
                            children: s.title,
                          }),
                          n.jsx('p', {
                            className: 'text-xs text-[var(--cs-text-tertiary)] mt-0.5',
                            children: s.description,
                          }),
                        ],
                      }),
                      n.jsx('svg', {
                        width: '16',
                        height: '16',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: '2',
                        className:
                          'text-[var(--cs-text-tertiary)] group-hover:text-[var(--cs-text-secondary)] transition-colors flex-shrink-0 mt-1',
                        children: n.jsx('polyline', { points: '9 18 15 12 9 6' }),
                      }),
                    ],
                  }),
                },
                s.title,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}
function sv() {
  return n.jsx('main', {
    'data-testid': 'not-found-page',
    className:
      'min-h-screen bg-[var(--cs-surface-app)] flex flex-col items-center justify-center p-6 hero-glow',
    children: n.jsxs('div', {
      className: 'animate-fadeInUp text-center',
      children: [
        n.jsx('div', {
          className:
            'w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-float',
          children: n.jsxs('svg', {
            width: '28',
            height: '28',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'rgb(167 139 250)',
            strokeWidth: '1.5',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            children: [
              n.jsx('circle', { cx: '12', cy: '12', r: '10' }),
              n.jsx('path', { d: 'M16 16s-1.5-2-4-2-4 2-4 2' }),
              n.jsx('line', { x1: '9', y1: '9', x2: '9.01', y2: '9' }),
              n.jsx('line', { x1: '15', y1: '9', x2: '15.01', y2: '9' }),
            ],
          }),
        }),
        n.jsx('h1', { className: 'text-6xl font-extrabold gradient-text mb-3', children: '404' }),
        n.jsx('p', {
          className: 'text-lg text-[var(--cs-text-secondary)] mb-2',
          children: 'Page not found',
        }),
        n.jsx('p', {
          className: 'text-sm text-[var(--cs-text-tertiary)] mb-8 max-w-sm mx-auto',
          children: 'The page you’re looking for doesn’t exist or has been moved.',
        }),
        n.jsx(Mr, {
          to: it.HOME,
          className: 'focus-ring rounded-xl',
          children: n.jsx(sf, { variant: 'secondary', children: 'Back to Home' }),
        }),
      ],
    }),
  });
}
function iv(a) {
  const s = Date.now() - a,
    i = Math.floor(s / 1e3),
    l = Math.floor(i / 60),
    c = Math.floor(l / 60),
    u = Math.floor(c / 24),
    p = Math.floor(u / 7);
  return p > 0
    ? `${p}w ago`
    : u > 0
      ? `${u}d ago`
      : c > 0
        ? `${c}h ago`
        : l > 0
          ? `${l}m ago`
          : 'just now';
}
const hl = 4;
function av({ crew: a, onClick: s, onDelete: i }) {
  const l = a.agents.slice(0, hl),
    c = Math.max(0, a.agents.length - hl);
  function u(p) {
    (p.stopPropagation(), i && i(a.id));
  }
  return n.jsxs('button', {
    type: 'button',
    onClick: () => s(a.id),
    className:
      'group relative w-full text-left bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 focus-ring',
    style: { borderTopColor: a.color, borderTopWidth: '3px' },
    children: [
      n.jsx('div', {
        className:
          'pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200',
        style: { boxShadow: `inset 0 0 0 1px ${a.color}44, 0 0 20px ${a.color}11` },
      }),
      n.jsxs('div', {
        className: 'p-5',
        children: [
          n.jsxs('div', {
            className: 'flex items-start justify-between gap-2 mb-2',
            children: [
              n.jsx('h3', {
                className: 'text-sm font-semibold text-[var(--cs-text-primary)] truncate',
                children: a.name,
              }),
              i &&
                n.jsx('button', {
                  type: 'button',
                  onClick: u,
                  className:
                    'shrink-0 p-1 rounded-md text-[var(--cs-text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all',
                  'aria-label': 'Delete crew',
                  children: n.jsxs('svg', {
                    width: '14',
                    height: '14',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    children: [
                      n.jsx('polyline', { points: '3 6 5 6 21 6' }),
                      n.jsx('path', {
                        d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
                      }),
                    ],
                  }),
                }),
            ],
          }),
          n.jsx('p', {
            className: 'text-xs text-[var(--cs-text-secondary)] line-clamp-2 mb-4 min-h-[2.5rem]',
            children: a.description || 'No description',
          }),
          n.jsx('div', {
            className: 'flex items-center mb-4',
            children: n.jsxs('div', {
              className: 'flex -space-x-2',
              children: [
                l.map((p, h) =>
                  n.jsx(
                    'div',
                    {
                      className:
                        'w-7 h-7 rounded-full border-2 border-[var(--cs-surface-card)] flex items-center justify-center text-white',
                      style: { backgroundColor: p.color, zIndex: hl - h },
                      title: p.role,
                      children: n.jsx(Ft, { id: p.id, size: 14, fallback: p.role }),
                    },
                    p.id,
                  ),
                ),
                c > 0 &&
                  n.jsxs('div', {
                    className:
                      'w-7 h-7 rounded-full border-2 border-[var(--cs-surface-card)] bg-[var(--cs-surface-app)] flex items-center justify-center text-[10px] font-medium text-[var(--cs-text-tertiary)]',
                    children: ['+', c],
                  }),
              ],
            }),
          }),
          n.jsxs('div', {
            className:
              'flex items-center justify-between text-[11px] text-[var(--cs-text-tertiary)]',
            children: [
              n.jsxs('span', {
                children: [
                  a.agents.length,
                  ' agent',
                  a.agents.length !== 1 ? 's' : '',
                  ' · ',
                  a.workflowIds.length,
                  ' workflow',
                  a.workflowIds.length !== 1 ? 's' : '',
                ],
              }),
              n.jsx('span', { children: iv(a.updatedAt) }),
            ],
          }),
        ],
      }),
    ],
  });
}
const ov = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Running', value: 'running' },
  { label: 'Completed', value: 'completed' },
];
function lv() {
  const a = Ht(),
    { crews: s, deleteCrew: i } = oa(),
    [l, c] = N.useState(''),
    [u, p] = N.useState('all'),
    h = N.useMemo(() => {
      let v = s;
      if (l.trim()) {
        const y = l.toLowerCase();
        v = v.filter(
          (S) => S.name.toLowerCase().includes(y) || S.description.toLowerCase().includes(y),
        );
      }
      return v;
    }, [s, l, u]);
  function m(v) {
    a(Ul(v));
  }
  function g(v) {
    i(v);
  }
  return n.jsxs('div', {
    className: 'min-h-screen bg-[var(--cs-surface-app)] scrollbar-thin',
    children: [
      n.jsx('header', {
        className: 'glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]',
        children: n.jsxs('div', {
          className: 'max-w-6xl mx-auto flex items-center justify-between px-6 py-4',
          children: [
            n.jsx('div', {
              className: 'flex items-center gap-3',
              children: n.jsxs(Mr, {
                to: '/',
                className: 'flex items-center gap-2 focus-ring rounded-lg',
                children: [
                  n.jsx('div', {
                    className:
                      'w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center',
                    children: n.jsxs('svg', {
                      width: '18',
                      height: '18',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'white',
                      strokeWidth: '2.5',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      children: [
                        n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                        n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                        n.jsx('path', { d: 'M2 12l10 5 10-5' }),
                      ],
                    }),
                  }),
                  n.jsxs('span', {
                    className: 'text-lg font-semibold text-[var(--cs-text-primary)] tracking-tight',
                    children: [
                      n.jsx('span', { className: 'gradient-text', children: 'Crew' }),
                      'Space',
                    ],
                  }),
                ],
              }),
            }),
            n.jsxs('nav', {
              className: 'hidden md:flex items-center gap-6',
              children: [
                n.jsx('button', {
                  onClick: () => a('/'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Home',
                }),
                n.jsx('span', {
                  className: 'text-sm text-[var(--cs-text-primary)] font-medium',
                  children: 'My Crews',
                }),
                n.jsx('button', {
                  onClick: () => a('/templates'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Templates',
                }),
                n.jsx('button', {
                  onClick: () => a('/marketplace'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Marketplace',
                }),
              ],
            }),
            n.jsxs('div', {
              className: 'flex items-center gap-3',
              children: [
                n.jsx('button', {
                  onClick: () => a('/settings'),
                  className:
                    'p-2 rounded-lg text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-[var(--cs-surface-card)]/20 transition-colors focus-ring',
                  'aria-label': 'Settings',
                  children: n.jsxs('svg', {
                    width: '16',
                    height: '16',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    children: [
                      n.jsx('circle', { cx: '12', cy: '12', r: '3' }),
                      n.jsx('path', {
                        d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
                      }),
                    ],
                  }),
                }),
                n.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-[var(--cs-text-primary)]',
                  children: 'U',
                }),
              ],
            }),
          ],
        }),
      }),
      n.jsxs('main', {
        className: 'max-w-6xl mx-auto px-6 py-8',
        children: [
          n.jsxs('div', {
            className: 'flex items-center justify-between mb-8 animate-fadeInDown',
            children: [
              n.jsxs('div', {
                className: 'flex items-center gap-4',
                children: [
                  n.jsx('h1', {
                    className: 'text-2xl font-bold text-[var(--cs-text-primary)]',
                    children: 'My Crews',
                  }),
                  n.jsx('div', {
                    className:
                      'hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--cs-text-tertiary)]',
                    children: n.jsxs('span', {
                      className:
                        'px-2 py-0.5 rounded-md bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] tabular-nums',
                      children: [s.length, ' total'],
                    }),
                  }),
                ],
              }),
              n.jsxs('button', {
                onClick: () => a('/'),
                className:
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 focus-ring',
                children: [
                  n.jsxs('svg', {
                    width: '14',
                    height: '14',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2.5',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    children: [
                      n.jsx('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
                      n.jsx('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
                    ],
                  }),
                  'New Crew',
                ],
              }),
            ],
          }),
          n.jsxs('div', {
            className:
              'flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 animate-fadeIn',
            children: [
              n.jsxs('div', {
                className: 'flex-1 relative',
                children: [
                  n.jsxs('svg', {
                    width: '16',
                    height: '16',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    className:
                      'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-text-tertiary)]',
                    children: [
                      n.jsx('circle', { cx: '11', cy: '11', r: '8' }),
                      n.jsx('line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }),
                    ],
                  }),
                  n.jsx('input', {
                    type: 'text',
                    value: l,
                    onChange: (v) => c(v.target.value),
                    placeholder: 'Search crews...',
                    className:
                      'w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors',
                  }),
                ],
              }),
              n.jsx('div', {
                className: 'flex gap-1.5',
                children: ov.map((v) =>
                  n.jsx(
                    'button',
                    {
                      onClick: () => p(v.value),
                      className: `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${u === v.value ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] border border-transparent hover:border-[var(--cs-border-subtle)]'}`,
                      children: v.label,
                    },
                    v.value,
                  ),
                ),
              }),
            ],
          }),
          h.length > 0
            ? n.jsx('div', {
                className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
                children: h.map((v, y) =>
                  n.jsx(
                    'div',
                    {
                      className: 'animate-fadeIn',
                      style: { animationDelay: `${y * 60}ms` },
                      children: n.jsx(av, { crew: v, onClick: m, onDelete: g }),
                    },
                    v.id,
                  ),
                ),
              })
            : n.jsxs('div', {
                className:
                  'flex flex-col items-center justify-center py-24 text-center animate-fadeIn',
                children: [
                  n.jsx('div', {
                    className:
                      'w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5',
                    children: n.jsxs('svg', {
                      width: '28',
                      height: '28',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: '1.5',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      className: 'text-indigo-400',
                      children: [
                        n.jsx('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
                        n.jsx('circle', { cx: '9', cy: '7', r: '4' }),
                        n.jsx('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
                        n.jsx('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }),
                      ],
                    }),
                  }),
                  n.jsx('h3', {
                    className: 'text-lg font-semibold text-[var(--cs-text-primary)] mb-2',
                    children: 'No crews yet',
                  }),
                  n.jsx('p', {
                    className: 'text-sm text-[var(--cs-text-tertiary)] max-w-sm mb-6',
                    children:
                      'Describe your first initiative on the home page and CrewSpace will assemble a crew for you.',
                  }),
                  n.jsx('button', {
                    onClick: () => a('/'),
                    className:
                      'px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 focus-ring',
                    children: 'Get Started',
                  }),
                ],
              }),
        ],
      }),
    ],
  });
}
const Up = ['#6366f1', '#2563eb', '#059669', '#d97706', '#dc2626', '#ec4899', '#06b6d4', '#6366f1'];
function Wp(a) {
  const s = Date.now() - a,
    i = Math.floor(s / 1e3),
    l = Math.floor(i / 60),
    c = Math.floor(l / 60),
    u = Math.floor(c / 24),
    p = Math.floor(u / 7);
  return p > 0
    ? `${p}w ago`
    : u > 0
      ? `${u}d ago`
      : c > 0
        ? `${c}h ago`
        : l > 0
          ? `${l}m ago`
          : 'just now';
}
function cv() {
  const { crewId: a } = $l(),
    s = Ht(),
    {
      getCrewById: i,
      updateCrew: l,
      deleteCrew: c,
      addAgentToCrew: u,
      removeAgentFromCrew: p,
    } = oa(),
    h = a ? i(a) : void 0,
    [m, g] = N.useState(!1),
    [v, y] = N.useState((h == null ? void 0 : h.name) ?? ''),
    [S, C] = N.useState(!1),
    [R, j] = N.useState((h == null ? void 0 : h.description) ?? ''),
    [b, T] = N.useState(!1),
    [z, W] = N.useState(!1),
    [G, Q] = N.useState(null),
    [pe, ge] = N.useState('all'),
    [Se, He] = N.useState('');
  if (!h)
    return n.jsx('div', {
      className: 'min-h-screen bg-[var(--cs-surface-app)] flex items-center justify-center',
      children: n.jsxs('div', {
        className: 'text-center animate-fadeIn',
        children: [
          n.jsx('h2', {
            className: 'text-lg font-semibold text-[var(--cs-text-primary)] mb-2',
            children: 'Crew not found',
          }),
          n.jsx('p', {
            className: 'text-sm text-[var(--cs-text-tertiary)] mb-4',
            children: "The crew you're looking for doesn't exist.",
          }),
          n.jsx(Mr, {
            to: it.CREWS,
            className:
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors focus-ring',
            children: 'Back to Crews',
          }),
        ],
      }),
    });
  function Ge() {
    (v.trim() && v !== h.name ? l(h.id, { name: v.trim() }) : y(h.name), g(!1));
  }
  function Je() {
    (R !== h.description ? l(h.id, { description: R }) : j(h.description), C(!1));
  }
  function ke() {
    (c(h.id), s(it.CREWS));
  }
  const Ie = (h == null ? void 0 : h.agents.map((M) => M.id)) ?? [],
    Ye = (() => {
      let M;
      switch (pe) {
        case 'business-product':
          M = Wl;
          break;
        case 'research-analysis':
          M = Bl;
          break;
        default:
          M = Ln;
      }
      if (Se.trim()) {
        const E = Se.toLowerCase();
        M = M.filter(
          (L) =>
            L.role.toLowerCase().includes(E) ||
            L.subtitle.toLowerCase().includes(E) ||
            L.goal.toLowerCase().includes(E),
        );
      }
      return M;
    })();
  function et(M) {
    h &&
      (u(h.id, {
        id: M.id,
        role: M.role,
        goal: M.goal,
        backstory: M.backstory,
        tools: [...M.tools],
        color: Up[h.agents.length % Up.length] ?? '#6366f1',
      }),
      W(!1),
      He(''),
      ge('all'));
  }
  function ze(M) {
    return (h == null ? void 0 : h.tasks.filter((E) => E.agentId === M)) ?? [];
  }
  function Ee() {
    !h || !G || (p(h.id, G), Q(null));
  }
  return n.jsxs('div', {
    className: 'min-h-screen bg-[var(--cs-surface-app)] scrollbar-thin',
    children: [
      n.jsx('header', {
        className: 'glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]',
        children: n.jsxs('div', {
          className: 'max-w-6xl mx-auto flex items-center justify-between px-6 py-4',
          children: [
            n.jsx('div', {
              className: 'flex items-center gap-3',
              children: n.jsxs(Mr, {
                to: '/',
                className: 'flex items-center gap-2 focus-ring rounded-lg',
                children: [
                  n.jsx('div', {
                    className:
                      'w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center',
                    children: n.jsxs('svg', {
                      width: '18',
                      height: '18',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'white',
                      strokeWidth: '2.5',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      children: [
                        n.jsx('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
                        n.jsx('path', { d: 'M2 17l10 5 10-5' }),
                        n.jsx('path', { d: 'M2 12l10 5 10-5' }),
                      ],
                    }),
                  }),
                  n.jsxs('span', {
                    className: 'text-lg font-semibold text-[var(--cs-text-primary)] tracking-tight',
                    children: [
                      n.jsx('span', { className: 'gradient-text', children: 'Crew' }),
                      'Space',
                    ],
                  }),
                ],
              }),
            }),
            n.jsxs('nav', {
              className: 'hidden md:flex items-center gap-6',
              children: [
                n.jsx('button', {
                  onClick: () => s('/'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Home',
                }),
                n.jsx('button', {
                  onClick: () => s('/crews'),
                  className: 'text-sm text-[var(--cs-text-primary)] font-medium focus-ring',
                  children: 'My Crews',
                }),
                n.jsx('button', {
                  onClick: () => s('/templates'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Templates',
                }),
                n.jsx('button', {
                  onClick: () => s('/marketplace'),
                  className:
                    'text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring',
                  children: 'Marketplace',
                }),
              ],
            }),
            n.jsxs('div', {
              className: 'flex items-center gap-3',
              children: [
                n.jsx('button', {
                  onClick: () => s('/settings'),
                  className:
                    'p-2 rounded-lg text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-[var(--cs-surface-card)]/20 transition-colors focus-ring',
                  'aria-label': 'Settings',
                  children: n.jsxs('svg', {
                    width: '16',
                    height: '16',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    children: [
                      n.jsx('circle', { cx: '12', cy: '12', r: '3' }),
                      n.jsx('path', {
                        d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
                      }),
                    ],
                  }),
                }),
                n.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-[var(--cs-text-primary)]',
                  children: 'U',
                }),
              ],
            }),
          ],
        }),
      }),
      n.jsxs('main', {
        className: 'max-w-5xl mx-auto px-6 py-8',
        children: [
          n.jsxs(Mr, {
            to: it.CREWS,
            className:
              'inline-flex items-center gap-1.5 text-sm text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-primary)] transition-colors mb-6',
            children: [
              n.jsxs('svg', {
                width: '16',
                height: '16',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                children: [
                  n.jsx('line', { x1: '19', y1: '12', x2: '5', y2: '12' }),
                  n.jsx('polyline', { points: '12 19 5 12 12 5' }),
                ],
              }),
              'Back to Crews',
            ],
          }),
          n.jsxs('div', {
            className: 'mb-10 animate-fadeInDown',
            children: [
              n.jsxs('div', {
                className: 'flex items-center gap-3 mb-2',
                children: [
                  n.jsx('div', {
                    className: 'w-4 h-4 rounded-full shrink-0',
                    style: { backgroundColor: h.color },
                  }),
                  m
                    ? n.jsx('input', {
                        autoFocus: !0,
                        value: v,
                        onChange: (M) => y(M.target.value),
                        onBlur: Ge,
                        onKeyDown: (M) => {
                          (M.key === 'Enter' && Ge(), M.key === 'Escape' && (y(h.name), g(!1)));
                        },
                        className:
                          'text-2xl font-bold bg-transparent text-[var(--cs-text-primary)] border-b-2 border-indigo-500 outline-none w-full',
                      })
                    : n.jsx('h1', {
                        onClick: () => {
                          (y(h.name), g(!0));
                        },
                        className:
                          'text-2xl font-bold text-[var(--cs-text-primary)] cursor-text hover:text-indigo-300 transition-colors',
                        title: 'Click to edit',
                        children: h.name,
                      }),
                ],
              }),
              S
                ? n.jsx('textarea', {
                    autoFocus: !0,
                    value: R,
                    onChange: (M) => j(M.target.value),
                    onBlur: Je,
                    onKeyDown: (M) => {
                      M.key === 'Escape' && (j(h.description), C(!1));
                    },
                    rows: 2,
                    className:
                      'w-full text-sm bg-transparent text-[var(--cs-text-secondary)] border-b border-indigo-500/50 outline-none resize-none mt-1',
                  })
                : n.jsx('p', {
                    onClick: () => {
                      (j(h.description), C(!0));
                    },
                    className:
                      'text-sm text-[var(--cs-text-secondary)] cursor-text hover:text-[var(--cs-text-primary)] transition-colors mt-1',
                    title: 'Click to edit',
                    children: h.description || 'Add a description…',
                  }),
              n.jsxs('p', {
                className: 'text-xs text-[var(--cs-text-tertiary)] mt-2',
                children: ['Created ', Wp(h.createdAt), ' · Updated ', Wp(h.updatedAt)],
              }),
            ],
          }),
          n.jsxs('section', {
            className: 'mb-10 animate-fadeIn',
            children: [
              n.jsxs('div', {
                className: 'flex items-center justify-between mb-4',
                children: [
                  n.jsxs('h2', {
                    className:
                      'text-sm font-semibold text-[var(--cs-text-primary)] uppercase tracking-wider',
                    children: [
                      'Agents ',
                      n.jsxs('span', {
                        className: 'ml-2 text-xs font-normal text-[var(--cs-text-tertiary)]',
                        children: ['(', h.agents.length, ')'],
                      }),
                    ],
                  }),
                  n.jsxs('button', {
                    onClick: () => W(!z),
                    className:
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors focus-ring',
                    children: [
                      n.jsxs('svg', {
                        width: '14',
                        height: '14',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: '2',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        children: [
                          n.jsx('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
                          n.jsx('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
                        ],
                      }),
                      'Add Agent',
                    ],
                  }),
                ],
              }),
              z &&
                n.jsxs('div', {
                  className:
                    'mb-4 bg-[var(--cs-surface-card)] border border-indigo-500/30 rounded-xl p-4 space-y-3 animate-fadeIn',
                  children: [
                    n.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        n.jsx('h3', {
                          className: 'text-sm font-semibold text-[var(--cs-text-primary)]',
                          children: 'Select Agent',
                        }),
                        n.jsx('button', {
                          onClick: () => {
                            (W(!1), He(''), ge('all'));
                          },
                          className:
                            'text-xs text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] transition-colors',
                          children: 'Cancel',
                        }),
                      ],
                    }),
                    n.jsx('input', {
                      type: 'text',
                      value: Se,
                      onChange: (M) => He(M.target.value),
                      placeholder: 'Search agents...',
                      className:
                        'w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors',
                    }),
                    n.jsx('div', {
                      className: 'flex gap-1.5',
                      children: ['all', 'business-product', 'research-analysis'].map((M) =>
                        n.jsx(
                          'button',
                          {
                            onClick: () => ge(M),
                            className: `px-2.5 py-1 text-xs rounded-md border transition-colors ${pe === M ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-[var(--cs-surface-app)] border-[var(--cs-border-subtle)] text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)]'}`,
                            children:
                              M === 'all'
                                ? 'All'
                                : M === 'business-product'
                                  ? 'Business & Product'
                                  : 'Research & Analysis',
                          },
                          M,
                        ),
                      ),
                    }),
                    n.jsxs('div', {
                      className: 'max-h-64 overflow-y-auto space-y-1.5 scrollbar-thin',
                      children: [
                        Ye.map((M) => {
                          const E = Ie.includes(M.id);
                          return n.jsx(
                            'button',
                            {
                              onClick: () => !E && et(M),
                              disabled: E,
                              className: `w-full text-left p-3 rounded-lg border transition-all ${E ? 'opacity-40 cursor-not-allowed border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/30' : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/50 hover:bg-white/5 hover:border-indigo-500/30'}`,
                              children: n.jsxs('div', {
                                className: 'flex items-start gap-2',
                                children: [
                                  n.jsx(Ft, {
                                    id: M.id,
                                    size: 18,
                                    className: 'shrink-0 mt-0.5 text-[var(--cs-text-secondary)]',
                                  }),
                                  n.jsxs('div', {
                                    className: 'flex-1 min-w-0',
                                    children: [
                                      n.jsxs('div', {
                                        className: 'flex items-center gap-2',
                                        children: [
                                          n.jsx('span', {
                                            className:
                                              'text-sm font-medium text-[var(--cs-text-primary)]',
                                            children: M.role,
                                          }),
                                          E &&
                                            n.jsx('span', {
                                              className:
                                                'text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[var(--cs-text-tertiary)]',
                                              children: 'Added',
                                            }),
                                        ],
                                      }),
                                      n.jsx('p', {
                                        className: 'text-xs text-[var(--cs-text-tertiary)] mt-0.5',
                                        children: M.subtitle,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            },
                            M.id,
                          );
                        }),
                        Ye.length === 0 &&
                          n.jsx('p', {
                            className: 'text-xs text-[var(--cs-text-tertiary)] text-center py-4',
                            children: 'No agents match your search.',
                          }),
                      ],
                    }),
                  ],
                }),
              G &&
                (() => {
                  var L;
                  const M = ze(G),
                    E =
                      ((L = h.agents.find((k) => k.id === G)) == null ? void 0 : L.role) ??
                      'this agent';
                  return n.jsxs('div', {
                    className:
                      'mb-4 bg-[var(--cs-surface-card)] border border-red-500/30 rounded-xl p-4 space-y-3 animate-fadeIn',
                    children: [
                      n.jsxs('p', {
                        className: 'text-sm text-[var(--cs-text-primary)]',
                        children: ['Remove ', n.jsx('strong', { children: E }), '?'],
                      }),
                      M.length > 0 &&
                        n.jsxs('div', {
                          className: 'text-xs text-red-400 space-y-1',
                          children: [
                            n.jsxs('p', {
                              className: 'font-medium',
                              children: [
                                'This agent is assigned to ',
                                M.length,
                                ' task',
                                M.length > 1 ? 's' : '',
                                ' that will lose their assignment:',
                              ],
                            }),
                            n.jsx('ul', {
                              className:
                                'list-disc list-inside pl-1 text-[var(--cs-text-tertiary)]',
                              children: M.map((k) =>
                                n.jsx(
                                  'li',
                                  { className: 'truncate', children: k.description || k.id },
                                  k.id,
                                ),
                              ),
                            }),
                          ],
                        }),
                      n.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          n.jsx('button', {
                            onClick: Ee,
                            className:
                              'px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors focus-ring',
                            children: M.length > 0 ? 'Remove anyway' : 'Yes, remove',
                          }),
                          n.jsx('button', {
                            onClick: () => Q(null),
                            className:
                              'px-3 py-1.5 rounded-lg bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-secondary)] text-xs font-medium transition-colors hover:text-[var(--cs-text-primary)] focus-ring',
                            children: 'Cancel',
                          }),
                        ],
                      }),
                    ],
                  });
                })(),
              h.agents.length > 0
                ? n.jsx('div', {
                    className: 'flex gap-3 overflow-x-auto pb-2 -mx-1 px-1',
                    children: h.agents.map((M) =>
                      n.jsxs(
                        'div',
                        {
                          className:
                            'shrink-0 w-44 bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] rounded-xl p-4 relative group',
                          children: [
                            n.jsx('button', {
                              onClick: () => Q(M.id),
                              className:
                                'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[var(--cs-text-tertiary)] hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all focus-ring',
                              'aria-label': `Remove ${M.role}`,
                              title: 'Remove agent',
                              children: n.jsxs('svg', {
                                width: '12',
                                height: '12',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: 'currentColor',
                                strokeWidth: '2.5',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                children: [
                                  n.jsx('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
                                  n.jsx('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
                                ],
                              }),
                            }),
                            n.jsx('div', {
                              className:
                                'w-9 h-9 rounded-lg flex items-center justify-center text-white mb-3',
                              style: { backgroundColor: M.color },
                              children: n.jsx(Ft, { id: M.id, size: 20, fallback: M.role }),
                            }),
                            n.jsx('p', {
                              className:
                                'text-sm font-medium text-[var(--cs-text-primary)] truncate mb-1',
                              children: M.role,
                            }),
                            M.tools.length > 0 &&
                              n.jsxs('div', {
                                className: 'flex flex-wrap gap-1 mt-2',
                                children: [
                                  M.tools
                                    .slice(0, 3)
                                    .map((E) =>
                                      n.jsx(
                                        'span',
                                        {
                                          className:
                                            'px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-[var(--cs-text-tertiary)] border border-[var(--cs-border-subtle)]',
                                          children: E,
                                        },
                                        E,
                                      ),
                                    ),
                                  M.tools.length > 3 &&
                                    n.jsxs('span', {
                                      className:
                                        'px-1.5 py-0.5 rounded text-[10px] text-[var(--cs-text-tertiary)]',
                                      children: ['+', M.tools.length - 3],
                                    }),
                                ],
                              }),
                          ],
                        },
                        M.id,
                      ),
                    ),
                  })
                : n.jsx('p', {
                    className: 'text-sm text-[var(--cs-text-tertiary)]',
                    children: 'No agents in this crew yet.',
                  }),
            ],
          }),
          n.jsxs('section', {
            className: 'mb-10 animate-fadeIn',
            children: [
              n.jsxs('div', {
                className: 'flex items-center justify-between mb-4',
                children: [
                  n.jsxs('h2', {
                    className:
                      'text-sm font-semibold text-[var(--cs-text-primary)] uppercase tracking-wider',
                    children: [
                      'Workflows ',
                      n.jsxs('span', {
                        className: 'ml-2 text-xs font-normal text-[var(--cs-text-tertiary)]',
                        children: ['(', (h.workflows ?? []).length || h.workflowIds.length, ')'],
                      }),
                    ],
                  }),
                  n.jsxs('button', {
                    onClick: () => s('/', { state: { crewId: h.id } }),
                    className:
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors focus-ring',
                    children: [
                      n.jsxs('svg', {
                        width: '14',
                        height: '14',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: '2',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        children: [
                          n.jsx('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
                          n.jsx('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
                        ],
                      }),
                      'New Workflow',
                    ],
                  }),
                ],
              }),
              (h.workflows ?? []).length > 0
                ? n.jsx('div', {
                    className: 'space-y-3',
                    children: (h.workflows ?? []).map((M) =>
                      n.jsxs(
                        'div',
                        {
                          className:
                            'group bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] rounded-xl px-5 py-4 flex items-center justify-between transition-all hover:border-indigo-500/40 hover:-translate-y-0.5',
                          children: [
                            n.jsxs('div', {
                              className: 'min-w-0 flex-1',
                              children: [
                                n.jsx('p', {
                                  className:
                                    'text-sm font-medium text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors truncate',
                                  children: M.name,
                                }),
                                M.description &&
                                  n.jsx('p', {
                                    className:
                                      'text-xs text-[var(--cs-text-tertiary)] mt-0.5 truncate',
                                    children: M.description,
                                  }),
                                n.jsxs('p', {
                                  className: 'text-[10px] text-[var(--cs-text-tertiary)] mt-1',
                                  children: [
                                    h.tasks.length,
                                    ' task',
                                    h.tasks.length !== 1 ? 's' : '',
                                    ' · ',
                                    h.agents.length,
                                    ' agent',
                                    h.agents.length !== 1 ? 's' : '',
                                  ],
                                }),
                              ],
                            }),
                            n.jsxs('div', {
                              className: 'flex items-center gap-2 shrink-0 ml-4',
                              children: [
                                n.jsxs('button', {
                                  onClick: () => {
                                    const E = Date.now(),
                                      L = {
                                        id: M.id,
                                        name: M.name,
                                        description: M.description,
                                        crewId: h.id,
                                        agents: h.agents.map((k) => ({ ...k, status: 'idle' })),
                                        tasks: h.tasks.map((k) => ({ ...k, status: 'pending' })),
                                        discussionEdges: [],
                                        status: 'draft',
                                        createdAt: E,
                                        updatedAt: E,
                                      };
                                    s(Qi(M.id), { state: { workflow: L } });
                                  },
                                  className:
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs font-medium transition-colors focus-ring',
                                  children: [
                                    n.jsxs('svg', {
                                      width: '12',
                                      height: '12',
                                      viewBox: '0 0 24 24',
                                      fill: 'none',
                                      stroke: 'currentColor',
                                      strokeWidth: '2',
                                      strokeLinecap: 'round',
                                      strokeLinejoin: 'round',
                                      children: [
                                        n.jsx('rect', {
                                          x: '9',
                                          y: '9',
                                          width: '13',
                                          height: '13',
                                          rx: '2',
                                          ry: '2',
                                        }),
                                        n.jsx('path', {
                                          d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
                                        }),
                                      ],
                                    }),
                                    'Clone & Run',
                                  ],
                                }),
                                n.jsx('svg', {
                                  width: '16',
                                  height: '16',
                                  viewBox: '0 0 24 24',
                                  fill: 'none',
                                  stroke: 'currentColor',
                                  strokeWidth: '2',
                                  strokeLinecap: 'round',
                                  strokeLinejoin: 'round',
                                  className:
                                    'text-[var(--cs-text-tertiary)] group-hover:text-[var(--cs-text-primary)] transition-colors',
                                  children: n.jsx('polyline', { points: '9 18 15 12 9 6' }),
                                }),
                              ],
                            }),
                          ],
                        },
                        M.id,
                      ),
                    ),
                  })
                : h.workflowIds.length > 0
                  ? n.jsx('div', {
                      className: 'space-y-3',
                      children: h.workflowIds.map((M) =>
                        n.jsxs(
                          'button',
                          {
                            type: 'button',
                            onClick: () => s(Qi(M)),
                            className:
                              'group w-full text-left bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] rounded-xl px-5 py-4 flex items-center justify-between transition-all hover:border-indigo-500/40 hover:-translate-y-0.5 focus-ring',
                            children: [
                              n.jsxs('div', {
                                children: [
                                  n.jsxs('p', {
                                    className:
                                      'text-sm font-medium text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors',
                                    children: ['Workflow ', M.slice(0, 8)],
                                  }),
                                  n.jsxs('p', {
                                    className: 'text-xs text-[var(--cs-text-tertiary)] mt-0.5',
                                    children: [
                                      h.tasks.length,
                                      ' task',
                                      h.tasks.length !== 1 ? 's' : '',
                                    ],
                                  }),
                                ],
                              }),
                              n.jsx('svg', {
                                width: '16',
                                height: '16',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: 'currentColor',
                                strokeWidth: '2',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                className:
                                  'text-[var(--cs-text-tertiary)] group-hover:text-[var(--cs-text-primary)] transition-colors',
                                children: n.jsx('polyline', { points: '9 18 15 12 9 6' }),
                              }),
                            ],
                          },
                          M,
                        ),
                      ),
                    })
                  : n.jsx('p', {
                      className: 'text-sm text-[var(--cs-text-tertiary)]',
                      children: 'No workflows yet. Create one to get started.',
                    }),
            ],
          }),
          n.jsx('section', {
            className: 'pt-8 border-t border-[var(--cs-border-subtle)] animate-fadeIn',
            children: b
              ? n.jsxs('div', {
                  className: 'flex items-center gap-3',
                  children: [
                    n.jsx('p', {
                      className: 'text-sm text-red-400',
                      children: 'Are you sure? This cannot be undone.',
                    }),
                    n.jsx('button', {
                      onClick: ke,
                      className:
                        'px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors focus-ring',
                      children: 'Yes, delete',
                    }),
                    n.jsx('button', {
                      onClick: () => T(!1),
                      className:
                        'px-3 py-1.5 rounded-lg bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-secondary)] text-xs font-medium transition-colors hover:text-[var(--cs-text-primary)] focus-ring',
                      children: 'Cancel',
                    }),
                  ],
                })
              : n.jsxs('button', {
                  onClick: () => T(!0),
                  className:
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors focus-ring',
                  children: [
                    n.jsxs('svg', {
                      width: '16',
                      height: '16',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: '2',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      children: [
                        n.jsx('polyline', { points: '3 6 5 6 21 6' }),
                        n.jsx('path', {
                          d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
                        }),
                      ],
                    }),
                    'Delete Crew',
                  ],
                }),
          }),
        ],
      }),
    ],
  });
}
function Ki({ children: a }) {
  return ve.createElement($x, null, a);
}
function dv({ children: a }) {
  return ve.createElement(
    Mx,
    null,
    a,
    ve.createElement(
      Ex,
      null,
      ve.createElement(At, { path: it.HOME, element: ve.createElement(Bx) }),
      ve.createElement(At, { path: it.LOGIN, element: ve.createElement(Vx) }),
      ve.createElement(At, { path: it.WORKFLOW, element: ve.createElement(K0) }),
      ve.createElement(At, { path: it.DASHBOARD, element: ve.createElement(Gx) }),
      ve.createElement(At, { path: it.CREWS, element: ve.createElement(lv) }),
      ve.createElement(At, { path: it.CREW_DETAIL, element: ve.createElement(cv) }),
      ve.createElement(At, {
        path: it.CANVAS,
        element: ve.createElement(Ki, null, ve.createElement(qx)),
      }),
      ve.createElement(At, {
        path: it.TEMPLATES,
        element: ve.createElement(Ki, null, ve.createElement(Q0)),
      }),
      ve.createElement(At, {
        path: it.MARKETPLACE,
        element: ve.createElement(Ki, null, ve.createElement(ev)),
      }),
      ve.createElement(At, {
        path: it.SETTINGS,
        element: ve.createElement(Ki, null, ve.createElement(nv)),
      }),
      ve.createElement(At, { path: '*', element: ve.createElement(sv) }),
    ),
  );
}
function uv({ authAdapter: a, initialAppState: s, children: i }) {
  return n.jsx(Sm, {
    adapter: a,
    children: n.jsx(Im, {
      ...(s !== void 0 ? { initialState: s } : {}),
      children: n.jsx(Mm, { children: n.jsx(dv, { children: i }) }),
    }),
  });
}
const ml = { id: 'dev-user-1', email: 'dev@crewspace.local', name: 'Dev User', role: 'owner' },
  pv = {
    async login(a) {
      return ml;
    },
    async loginWithOAuth(a) {
      return (await new Promise((s) => setTimeout(s, 800)), { ...ml, name: 'Dev User (OAuth)' });
    },
    async logout() {},
    async refreshSession() {
      return ml;
    },
  },
  gf = document.getElementById('root');
if (!gf) throw new Error('Missing #root element in index.html');
jm.createRoot(gf).render(
  ve.createElement(ve.StrictMode, null, ve.createElement(uv, { authAdapter: pv })),
);

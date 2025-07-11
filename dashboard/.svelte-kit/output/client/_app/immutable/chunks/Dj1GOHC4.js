import {
  c as F,
  b as G,
  d as w,
  h as x,
  g as J,
  f as K,
  j as D,
  k as U,
  r as X,
  H as P,
  l as H,
  m as M,
  n as I,
  C as Q,
  o as W,
  p as q,
  q as B,
  u as Z,
  I as b,
  v as L,
  w as R,
  x as $,
  y as j,
  z as O,
  i as ee,
  E as ae,
  A as re,
  B as ne,
  D as le,
  F as fe,
  G as se,
  J as ie,
  K as te,
} from "./B_egDBur.js";
function he(s, e) {
  return e;
}
function ue(s, e, a, u) {
  for (var d = [], v = e.length, t = 0; t < v; t++) re(e[t].e, d, !0);
  var E = v > 0 && d.length === 0 && a !== null;
  if (E) {
    var c = a.parentNode;
    (ne(c), c.append(a), u.clear(), y(s, e[0].prev, e[v - 1].next));
  }
  le(d, () => {
    for (var _ = 0; _ < v; _++) {
      var r = e[_];
      (E || (u.delete(r.k), y(s, r.prev, r.next)), fe(r.e, !E));
    }
  });
}
function ce(s, e, a, u, d, v = null) {
  var t = s,
    E = { flags: e, items: new Map(), first: null };
  {
    var c = s;
    t = x ? w(J(c)) : c.appendChild(F());
  }
  x && K();
  var _ = null,
    r = !1,
    o = U(() => {
      var n = a();
      return ee(n) ? n : n == null ? [] : L(n);
    });
  (G(() => {
    var n = D(o),
      i = n.length;
    if (r && i === 0) return;
    r = i === 0;
    let l = !1;
    if (x) {
      var A = X(t) === P;
      A !== (i === 0) && ((t = H()), w(t), M(!1), (l = !0));
    }
    if (x) {
      for (var p = null, f, h = 0; h < i; h++) {
        if (I.nodeType === Q && I.data === W) {
          ((t = I), (l = !0), M(!1));
          break;
        }
        var C = n[h],
          T = u(C, h);
        ((f = V(I, E, p, null, C, T, h, d, e, a)), E.items.set(T, f), (p = f));
      }
      i > 0 && w(H());
    }
    (x || ve(n, E, t, d, e, u, a),
      v !== null &&
        (i === 0
          ? _
            ? q(_)
            : (_ = B(() => v(t)))
          : _ !== null &&
            Z(_, () => {
              _ = null;
            })),
      l && M(!0),
      D(o));
  }),
    x && (t = I));
}
function ve(s, e, a, u, d, v, t) {
  var E = s.length,
    c = e.items,
    _ = e.first,
    r = _,
    o,
    n = null,
    i = [],
    l = [],
    A,
    p,
    f,
    h;
  for (h = 0; h < E; h += 1) {
    if (((A = s[h]), (p = v(A, h)), (f = c.get(p)), f === void 0)) {
      var C = r ? r.e.nodes_start : a;
      ((n = V(C, e, n, n === null ? e.first : n.next, A, p, h, u, d, t)),
        c.set(p, n),
        (i = []),
        (l = []),
        (r = n.next));
      continue;
    }
    if ((de(f, A, h), (f.e.f & b) !== 0 && q(f.e), f !== r)) {
      if (o !== void 0 && o.has(f)) {
        if (i.length < l.length) {
          var T = l[0],
            g;
          n = T.prev;
          var k = i[0],
            N = i[i.length - 1];
          for (g = 0; g < i.length; g += 1) S(i[g], T, a);
          for (g = 0; g < l.length; g += 1) o.delete(l[g]);
          (y(e, k.prev, N.next),
            y(e, n, k),
            y(e, N, T),
            (r = T),
            (n = N),
            (h -= 1),
            (i = []),
            (l = []));
        } else
          (o.delete(f),
            S(f, r, a),
            y(e, f.prev, f.next),
            y(e, f, n === null ? e.first : n.next),
            y(e, n, f),
            (n = f));
        continue;
      }
      for (i = [], l = []; r !== null && r.k !== p; )
        ((r.e.f & b) === 0 && (o ?? (o = new Set())).add(r),
          l.push(r),
          (r = r.next));
      if (r === null) continue;
      f = r;
    }
    (i.push(f), (n = f), (r = f.next));
  }
  if (r !== null || o !== void 0) {
    for (var m = o === void 0 ? [] : L(o); r !== null; )
      ((r.e.f & b) === 0 && m.push(r), (r = r.next));
    var Y = m.length;
    if (Y > 0) {
      var z = E === 0 ? a : null;
      ue(e, m, z, c);
    }
  }
  ((R.first = e.first && e.first.e), (R.last = n && n.e));
}
function de(s, e, a, u) {
  ($(s.v, e), (s.i = a));
}
function V(s, e, a, u, d, v, t, E, c, _) {
  var r = (c & se) !== 0,
    o = (c & ie) === 0,
    n = r ? (o ? j(d, !1, !1) : O(d)) : d,
    i = (c & ae) === 0 ? t : O(t),
    l = { i, v: n, k: v, a: null, e: null, prev: a, next: u };
  try {
    return (
      (l.e = B(() => E(s, n, i, _), x)),
      (l.e.prev = a && a.e),
      (l.e.next = u && u.e),
      a === null ? (e.first = l) : ((a.next = l), (a.e.next = l.e)),
      u !== null && ((u.prev = l), (u.e.prev = l.e)),
      l
    );
  } finally {
  }
}
function S(s, e, a) {
  for (
    var u = s.next ? s.next.e.nodes_start : a,
      d = e ? e.e.nodes_start : a,
      v = s.e.nodes_start;
    v !== u;

  ) {
    var t = te(v);
    (d.before(v), (v = t));
  }
}
function y(s, e, a) {
  (e === null ? (s.first = a) : ((e.next = a), (e.e.next = a && a.e)),
    a !== null && ((a.prev = e), (a.e.prev = e && e.e)));
}
export { ce as e, he as i };

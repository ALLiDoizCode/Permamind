import { h as c } from "./B_egDBur.js";
const a = [
  ...` 	
\r\f \v\uFEFF`,
];
function e(r, g, u) {
  var i = r == null ? "" : "" + r;
  if ((g && (i = i ? i + " " + g : g), u)) {
    for (var f in u)
      if (u[f]) i = i ? i + " " + f : f;
      else if (i.length)
        for (var l = f.length, t = 0; (t = i.indexOf(f, t)) >= 0; ) {
          var n = t + l;
          (t === 0 || a.includes(i[t - 1])) &&
          (n === i.length || a.includes(i[n]))
            ? (i = (t === 0 ? "" : i.substring(0, t)) + i.substring(n + 1))
            : (t = n);
        }
  }
  return i === "" ? null : i;
}
function v(r, g) {
  return r == null ? null : String(r);
}
function N(r, g, u, i, f, l) {
  var t = r.__className;
  if (c || t !== u || t === void 0) {
    var n = e(u, i, l);
    ((!c || n !== r.getAttribute("class")) &&
      (n == null ? r.removeAttribute("class") : (r.className = n)),
      (r.__className = u));
  } else if (l && f !== l)
    for (var s in l) {
      var o = !!l[s];
      (f == null || o !== !!f[s]) && r.classList.toggle(s, o);
    }
  return l;
}
export { N as s, v as t };

// Everyday attic objects, drawn from code in the same outlined cartoon style as art.js.
import { OUT, circle, ellipse, lg, rg, rrect, star, shine, face, sparkle } from './art.js';

function fi(g, fill, w) { g.fillStyle = fill; g.fill(); g.strokeStyle = OUT; g.lineWidth = w; g.stroke(); }
function st(g, w, col = OUT) { g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
function heart(g, x, y, r) {
  g.beginPath(); g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35);
  g.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9); g.closePath();
}
const GOLD = (g, s, y0 = 0.2, y1 = 0.8) => lg(g, 0, s * y0, 0, s * y1, [[0, '#fff3a6'], [0.5, '#ffd23f'], [1, '#d8901c']]);
const glow = (g, s, x, y, r, col, a = 0.5) => { g.save(); g.globalAlpha = a; g.fillStyle = rg(g, x, y, 1, r, [[0, col], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, s, s); g.restore(); };

const D = {
  key(g, s, w) {
    g.translate(s / 2, s / 2); g.rotate(-0.7);
    const gold = lg(g, 0, -s * 0.2, 0, s * 0.2, [[0, '#fff1a0'], [1, '#e0a020']]);
    g.beginPath(); g.rect(s * 0.25, s * 0.02, s * 0.07, s * 0.12); g.rect(s * 0.14, s * 0.02, s * 0.06, s * 0.08); fi(g, gold, w);
    rrect(g, -s * 0.04, -s * 0.045, s * 0.42, s * 0.09, s * 0.03); fi(g, gold, w);
    circle(g, -s * 0.17, 0, s * 0.18); fi(g, gold, w);
    circle(g, -s * 0.17, 0, s * 0.075); fi(g, '#6b3fa0', w * 0.8);
    shine(g, -s * 0.24, -s * 0.08, s * 0.04, s * 0.025);
  },
  feather(g, s, w) {
    g.translate(s / 2, s / 2); g.rotate(0.6);
    g.beginPath(); g.moveTo(0, -s * 0.44);
    g.bezierCurveTo(s * 0.22, -s * 0.26, s * 0.17, s * 0.14, 0, s * 0.3);
    g.bezierCurveTo(-s * 0.17, s * 0.14, -s * 0.22, -s * 0.26, 0, -s * 0.44);
    fi(g, lg(g, 0, -s * 0.4, 0, s * 0.3, [[0, '#b4fff0'], [1, '#26a89a']]), w);
    g.beginPath();
    for (let k = 0; k < 4; k++) { const y = -s * 0.25 + k * s * 0.12; g.moveTo(0, y); g.lineTo(s * 0.12, y - s * 0.07); g.moveTo(0, y + s * 0.03); g.lineTo(-s * 0.12, y - s * 0.04); }
    st(g, w * 0.6, '#16716a');
    g.beginPath(); g.moveTo(0, -s * 0.36); g.lineTo(0, s * 0.46); st(g, w);
  },
  candle(g, s, w) {
    glow(g, s, s * 0.5, s * 0.2, s * 0.26, '#fff3a0', 0.6);
    ellipse(g, s * 0.5, s * 0.88, s * 0.26, s * 0.065); fi(g, '#c9a6ff', w);
    rrect(g, s * 0.36, s * 0.38, s * 0.28, s * 0.5, s * 0.05); fi(g, lg(g, 0, s * 0.4, 0, s * 0.9, [[0, '#fffaf0'], [1, '#f0cfa0']]), w);
    g.beginPath(); g.moveTo(s * 0.36, s * 0.44); g.quadraticCurveTo(s * 0.42, s * 0.56, s * 0.46, s * 0.46); g.quadraticCurveTo(s * 0.52, s * 0.6, s * 0.58, s * 0.46); g.lineTo(s * 0.64, s * 0.44);
    st(g, w * 0.6, '#e0b88a');
    g.beginPath(); g.moveTo(s * 0.5, s * 0.38); g.lineTo(s * 0.5, s * 0.31); st(g, w * 0.8);
    g.beginPath(); g.moveTo(s * 0.5, s * 0.05);
    g.bezierCurveTo(s * 0.63, s * 0.19, s * 0.61, s * 0.32, s * 0.5, s * 0.32);
    g.bezierCurveTo(s * 0.39, s * 0.32, s * 0.37, s * 0.19, s * 0.5, s * 0.05);
    fi(g, lg(g, 0, s * 0.05, 0, s * 0.32, [[0, '#fff7a0'], [1, '#ff8a2a']]), w * 0.7);
  },
  book(g, s, w) {
    rrect(g, s * 0.24, s * 0.21, s * 0.58, s * 0.64, s * 0.05); fi(g, '#fff6e2', w);
    g.beginPath(); for (let k = 1; k < 4; k++) { g.moveTo(s * 0.78 + k * 0.008 * s, s * 0.26); g.lineTo(s * 0.78 + k * 0.008 * s, s * 0.8); } st(g, w * 0.4, '#d8c4a0');
    rrect(g, s * 0.18, s * 0.15, s * 0.58, s * 0.66, s * 0.06); fi(g, lg(g, 0, s * 0.15, 0, s * 0.8, [[0, '#ff8a8a'], [1, '#c43a4a']]), w);
    rrect(g, s * 0.18, s * 0.15, s * 0.11, s * 0.66, s * 0.05); fi(g, '#9a2436', w);
    star(g, s * 0.52, s * 0.42, s * 0.11); fi(g, '#ffe36b', w * 0.8);
    rrect(g, s * 0.38, s * 0.6, s * 0.28, s * 0.05, s * 0.02); fi(g, '#ffe36b', w * 0.6);
  },
  teacup(g, s, w) {
    ellipse(g, s * 0.5, s * 0.8, s * 0.38, s * 0.085); fi(g, '#bfe8ff', w);
    g.beginPath(); g.arc(s * 0.75, s * 0.56, s * 0.1, -1.4, 1.6); st(g, w * 3.2); st(g, w * 1.4, '#ffe0ee');
    g.beginPath(); g.moveTo(s * 0.22, s * 0.42); g.lineTo(s * 0.78, s * 0.42);
    g.bezierCurveTo(s * 0.78, s * 0.7, s * 0.65, s * 0.79, s * 0.5, s * 0.79);
    g.bezierCurveTo(s * 0.35, s * 0.79, s * 0.22, s * 0.7, s * 0.22, s * 0.42);
    fi(g, lg(g, 0, s * 0.42, 0, s * 0.8, [[0, '#ffffff'], [1, '#ffc6de']]), w);
    ellipse(g, s * 0.5, s * 0.42, s * 0.28, s * 0.055); fi(g, '#a0582a', w);
    face(g, s * 0.5, s * 0.6, s * 0.035);
    g.save(); g.globalAlpha = 0.7; g.beginPath();
    [0.4, 0.56].forEach(x => { g.moveTo(s * x, s * 0.34); g.bezierCurveTo(s * (x - 0.05), s * 0.27, s * (x + 0.05), s * 0.22, s * x, s * 0.14); });
    st(g, w * 0.9, '#ffffff'); g.restore();
  },
  watch(g, s, w) {
    circle(g, s * 0.5, s * 0.17, s * 0.075); st(g, w * 2.6); st(g, w * 1.2, '#ffd23f');
    rrect(g, s * 0.45, s * 0.21, s * 0.1, s * 0.08, s * 0.02); fi(g, GOLD(g, s), w * 0.8);
    circle(g, s * 0.5, s * 0.58, s * 0.32); fi(g, GOLD(g, s, 0.26, 0.9), w);
    circle(g, s * 0.5, s * 0.58, s * 0.245); fi(g, '#fffdf2', w * 0.8);
    g.fillStyle = OUT;
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; circle(g, s * 0.5 + Math.cos(a) * s * 0.2, s * 0.58 + Math.sin(a) * s * 0.2, s * (k % 3 ? 0.009 : 0.016)); g.fill(); }
    g.beginPath(); g.moveTo(s * 0.5, s * 0.58); g.lineTo(s * 0.5, s * 0.43); g.moveTo(s * 0.5, s * 0.58); g.lineTo(s * 0.61, s * 0.63); st(g, w);
    circle(g, s * 0.5, s * 0.58, s * 0.025); g.fillStyle = '#e04a5a'; g.fill();
  },
  scroll(g, s, w) {
    rrect(g, s * 0.22, s * 0.22, s * 0.56, s * 0.56, s * 0.02); fi(g, lg(g, 0, 0, s, 0, [[0, '#f2d79c'], [0.5, '#fff0c8'], [1, '#f2d79c']]), w);
    g.beginPath(); for (let k = 0; k < 4; k++) { const y = s * (0.34 + k * 0.1); g.moveTo(s * 0.3, y); g.lineTo(s * (k === 3 ? 0.52 : 0.7), y); } st(g, w * 0.6, '#b89a6a');
    rrect(g, s * 0.15, s * 0.14, s * 0.7, s * 0.12, s * 0.06); fi(g, lg(g, 0, s * 0.14, 0, s * 0.26, [[0, '#f0cc84'], [1, '#b8863e']]), w);
    rrect(g, s * 0.15, s * 0.74, s * 0.7, s * 0.12, s * 0.06); fi(g, lg(g, 0, s * 0.74, 0, s * 0.86, [[0, '#f0cc84'], [1, '#b8863e']]), w);
    circle(g, s * 0.66, s * 0.66, s * 0.06); fi(g, '#d8283c', w * 0.7);
  },
  ring(g, s, w) {
    ellipse(g, s * 0.5, s * 0.62, s * 0.26, s * 0.22); st(g, w * 4.2); st(g, w * 2.4, '#ffd23f');
    g.save(); g.globalAlpha = 0.6; g.beginPath(); g.ellipse(s * 0.5, s * 0.62, s * 0.26, s * 0.22, 0, 2.3, 3.6); st(g, w * 0.8, '#fff8c0'); g.restore();
    glow(g, s, s * 0.5, s * 0.3, s * 0.2, '#bff0ff', 0.6);
    g.beginPath(); g.moveTo(s * 0.5, s * 0.45); g.lineTo(s * 0.34, s * 0.3); g.lineTo(s * 0.41, s * 0.2); g.lineTo(s * 0.59, s * 0.2); g.lineTo(s * 0.66, s * 0.3); g.closePath();
    fi(g, lg(g, 0, s * 0.2, 0, s * 0.45, [[0, '#e0fbff'], [1, '#3a9ae8']]), w);
    g.beginPath(); g.moveTo(s * 0.34, s * 0.3); g.lineTo(s * 0.66, s * 0.3); g.moveTo(s * 0.44, s * 0.3); g.lineTo(s * 0.5, s * 0.45); g.lineTo(s * 0.56, s * 0.3); st(g, w * 0.5);
    sparkle(g, s * 0.68, s * 0.16, s * 0.06);
  },
  hat(g, s, w) {
    ellipse(g, s * 0.5, s * 0.78, s * 0.44, s * 0.11); fi(g, lg(g, 0, s * 0.68, 0, s * 0.9, [[0, '#6a40c0'], [1, '#3a1f78']]), w);
    g.beginPath(); g.moveTo(s * 0.27, s * 0.78); g.quadraticCurveTo(s * 0.38, s * 0.4, s * 0.62, s * 0.1);
    g.quadraticCurveTo(s * 0.58, s * 0.42, s * 0.73, s * 0.78); g.closePath();
    fi(g, lg(g, 0, s * 0.1, 0, s * 0.8, [[0, '#8c5ce8'], [1, '#3a1f78']]), w);
    g.beginPath(); g.moveTo(s * 0.31, s * 0.64); g.quadraticCurveTo(s * 0.5, s * 0.6, s * 0.7, s * 0.64); g.lineTo(s * 0.72, s * 0.74); g.quadraticCurveTo(s * 0.5, s * 0.7, s * 0.29, s * 0.74); g.closePath();
    fi(g, '#ffcf3a', w * 0.8);
    rrect(g, s * 0.45, s * 0.62, s * 0.1, s * 0.11, s * 0.02); fi(g, '#ffe98a', w * 0.6);
    star(g, s * 0.5, s * 0.42, s * 0.06); fi(g, '#ffe36b', w * 0.6);
  },
  broom(g, s, w) {
    g.translate(s / 2, s / 2); g.rotate(0.55);
    rrect(g, -s * 0.03, -s * 0.47, s * 0.06, s * 0.6, s * 0.03); fi(g, lg(g, -s * 0.03, 0, s * 0.03, 0, [[0, '#d89a5a'], [1, '#8a5428']]), w);
    g.beginPath(); g.moveTo(-s * 0.07, s * 0.1); g.lineTo(s * 0.07, s * 0.1); g.lineTo(s * 0.21, s * 0.44); g.quadraticCurveTo(0, s * 0.5, -s * 0.21, s * 0.44); g.closePath();
    fi(g, lg(g, 0, s * 0.1, 0, s * 0.48, [[0, '#ffe08a'], [1, '#d8a040']]), w);
    g.beginPath(); for (let k = -2; k <= 2; k++) { g.moveTo(k * s * 0.02, s * 0.16); g.lineTo(k * s * 0.07, s * 0.44); } st(g, w * 0.5, '#b07a28');
    rrect(g, -s * 0.085, s * 0.08, s * 0.17, s * 0.065, s * 0.03); fi(g, '#c44a6a', w * 0.8);
  },
  lantern(g, s, w) {
    glow(g, s, s * 0.5, s * 0.5, s * 0.42, '#ffe680', 0.55);
    g.beginPath(); g.arc(s * 0.5, s * 0.16, s * 0.08, Math.PI, 0); st(g, w * 1.2);
    g.beginPath(); g.moveTo(s * 0.3, s * 0.3); g.lineTo(s * 0.7, s * 0.3); g.lineTo(s * 0.6, s * 0.17); g.lineTo(s * 0.4, s * 0.17); g.closePath(); fi(g, '#3a5a7a', w);
    rrect(g, s * 0.32, s * 0.3, s * 0.36, s * 0.42, s * 0.06); fi(g, rg(g, s * 0.5, s * 0.52, 2, s * 0.24, [[0, '#fffbd0'], [1, '#ffaa3a']]), w);
    g.beginPath(); g.moveTo(s * 0.44, s * 0.3); g.lineTo(s * 0.44, s * 0.72); g.moveTo(s * 0.56, s * 0.3); g.lineTo(s * 0.56, s * 0.72); st(g, w * 0.7);
    rrect(g, s * 0.27, s * 0.71, s * 0.46, s * 0.1, s * 0.04); fi(g, '#3a5a7a', w);
    g.beginPath(); g.moveTo(s * 0.5, s * 0.44); g.quadraticCurveTo(s * 0.56, s * 0.53, s * 0.5, s * 0.6); g.quadraticCurveTo(s * 0.44, s * 0.53, s * 0.5, s * 0.44); g.fillStyle = '#ff7a2a'; g.fill();
  },
  apple(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.5, s * 0.32);
    g.bezierCurveTo(s * 0.7, s * 0.18, s * 0.9, s * 0.36, s * 0.84, s * 0.58);
    g.bezierCurveTo(s * 0.78, s * 0.84, s * 0.6, s * 0.9, s * 0.5, s * 0.82);
    g.bezierCurveTo(s * 0.4, s * 0.9, s * 0.22, s * 0.84, s * 0.16, s * 0.58);
    g.bezierCurveTo(s * 0.1, s * 0.36, s * 0.3, s * 0.18, s * 0.5, s * 0.32);
    fi(g, lg(g, 0, s * 0.25, 0, s * 0.88, [[0, '#ff8a8a'], [1, '#d8283c']]), w);
    g.beginPath(); g.moveTo(s * 0.5, s * 0.33); g.quadraticCurveTo(s * 0.5, s * 0.2, s * 0.56, s * 0.12); st(g, w * 1.2, '#6a3a1a');
    ellipse(g, s * 0.66, s * 0.2, s * 0.1, s * 0.05, -0.4); fi(g, '#5fd068', w * 0.8);
    shine(g, s * 0.3, s * 0.45, s * 0.05, s * 0.08);
    face(g, s * 0.5, s * 0.6, s * 0.04);
  },
  cheese(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.12, s * 0.52); g.lineTo(s * 0.88, s * 0.4); g.lineTo(s * 0.88, s * 0.76); g.lineTo(s * 0.12, s * 0.82); g.closePath();
    fi(g, lg(g, 0, s * 0.4, 0, s * 0.82, [[0, '#ffd84a'], [1, '#f0a820']]), w);
    g.beginPath(); g.moveTo(s * 0.12, s * 0.52); g.lineTo(s * 0.6, s * 0.24); g.lineTo(s * 0.88, s * 0.4); g.closePath(); fi(g, '#fff09a', w);
    g.fillStyle = '#e09a1a';
    [[0.74, 0.5, 0.05], [0.28, 0.74, 0.04], [0.8, 0.68, 0.03]].forEach(([x, y, r]) => { circle(g, s * x, s * y, s * r); g.fill(); });
    ellipse(g, s * 0.56, s * 0.33, s * 0.05, s * 0.022); g.fill();
    face(g, s * 0.48, s * 0.63, s * 0.035);
  },
  bell(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.5, s * 0.2);
    g.bezierCurveTo(s * 0.71, s * 0.2, s * 0.72, s * 0.4, s * 0.72, s * 0.52);
    g.lineTo(s * 0.83, s * 0.72); g.lineTo(s * 0.17, s * 0.72); g.lineTo(s * 0.28, s * 0.52);
    g.bezierCurveTo(s * 0.28, s * 0.4, s * 0.29, s * 0.2, s * 0.5, s * 0.2);
    fi(g, GOLD(g, s, 0.2, 0.75), w);
    circle(g, s * 0.5, s * 0.79, s * 0.07); fi(g, '#ffd23f', w);
    rrect(g, s * 0.2, s * 0.64, s * 0.6, s * 0.08, s * 0.03); fi(g, '#e8a020', w * 0.7);
    ellipse(g, s * 0.37, s * 0.17, s * 0.11, s * 0.065, 0.3); fi(g, '#e8384c', w * 0.8);
    ellipse(g, s * 0.63, s * 0.17, s * 0.11, s * 0.065, -0.3); fi(g, '#e8384c', w * 0.8);
    circle(g, s * 0.5, s * 0.18, s * 0.05); fi(g, '#ff6a7a', w * 0.8);
    shine(g, s * 0.38, s * 0.4, s * 0.035, s * 0.09, 0.6);
  },
  dice(g, s, w) {
    g.translate(s / 2, s / 2); g.rotate(0.22);
    rrect(g, -s * 0.31, -s * 0.31, s * 0.62, s * 0.62, s * 0.12); fi(g, lg(g, 0, -s * 0.3, 0, s * 0.3, [[0, '#ff8a96'], [1, '#d8283c']]), w);
    g.fillStyle = '#fff';
    [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]].forEach(([a, b]) => { circle(g, a * s * 0.15, b * s * 0.15, s * 0.055); g.fill(); });
    shine(g, -s * 0.17, -s * 0.22, s * 0.08, s * 0.03, 0.45);
  },
  umbrella(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.5, s * 0.42); g.lineTo(s * 0.5, s * 0.8); g.arc(s * 0.42, s * 0.8, s * 0.08, 0, Math.PI); st(g, w * 2.4); st(g, w * 1.1, '#9a6a3a');
    g.beginPath(); g.arc(s * 0.5, s * 0.47, s * 0.38, Math.PI, 0);
    const n = 4, r = 0.76 / n / 2;
    for (let i = 0; i < n; i++) { const cx = 0.88 - r - i * r * 2; g.arc(s * cx, s * 0.47, s * r, 0, Math.PI, true); }
    g.closePath(); fi(g, lg(g, 0, s * 0.1, 0, s * 0.5, [[0, '#ff9ad0'], [1, '#d8388a']]), w);
    g.beginPath(); g.moveTo(s * 0.5, s * 0.09); g.quadraticCurveTo(s * 0.4, s * 0.3, s * 0.4, s * 0.47); g.moveTo(s * 0.5, s * 0.09); g.quadraticCurveTo(s * 0.6, s * 0.3, s * 0.6, s * 0.47);
    st(g, w * 0.7);
    g.beginPath(); g.moveTo(s * 0.5, s * 0.09); g.lineTo(s * 0.5, s * 0.04); st(g, w * 1.2);
  },
  sock(g, s, w) {
    const path = () => {
      g.beginPath(); g.moveTo(s * 0.34, s * 0.14); g.lineTo(s * 0.62, s * 0.14); g.lineTo(s * 0.62, s * 0.55);
      g.quadraticCurveTo(s * 0.62, s * 0.64, s * 0.72, s * 0.68); g.quadraticCurveTo(s * 0.88, s * 0.74, s * 0.84, s * 0.86);
      g.quadraticCurveTo(s * 0.79, s * 0.93, s * 0.6, s * 0.89); g.lineTo(s * 0.42, s * 0.83);
      g.quadraticCurveTo(s * 0.33, s * 0.79, s * 0.34, s * 0.66); g.closePath();
    };
    path(); g.fillStyle = '#7ad0ff'; g.fill();
    g.save(); path(); g.clip(); g.fillStyle = '#ff6fae';
    [0.24, 0.38, 0.52].forEach(y => g.fillRect(0, s * y, s, s * 0.065));
    ellipse(g, s * 0.78, s * 0.84, s * 0.12, s * 0.1); g.fill(); g.restore();
    path(); st(g, w);
    rrect(g, s * 0.31, s * 0.09, s * 0.34, s * 0.1, s * 0.04); fi(g, '#ffffff', w);
  },
  glasses(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.14, s * 0.48); g.lineTo(s * 0.06, s * 0.38); g.moveTo(s * 0.86, s * 0.48); g.lineTo(s * 0.94, s * 0.38); st(g, w * 1.4);
    [0.3, 0.7].forEach(x => {
      circle(g, s * x, s * 0.54, s * 0.16); g.fillStyle = 'rgba(190,235,255,0.75)'; g.fill(); st(g, w * 2.6); st(g, w * 1.2, '#e8584a');
      shine(g, s * (x - 0.06), s * 0.49, s * 0.045, s * 0.025, 0.8);
    });
    g.beginPath(); g.arc(s * 0.5, s * 0.54, s * 0.06, Math.PI * 1.15, Math.PI * 1.85); st(g, w * 2.2); st(g, w, '#e8584a');
  },
  spoon(g, s, w) {
    g.translate(s / 2, s / 2); g.rotate(0.6);
    const sil = lg(g, -s * 0.12, 0, s * 0.12, 0, [[0, '#ffffff'], [1, '#a8b4c8']]);
    rrect(g, -s * 0.035, -s * 0.08, s * 0.07, s * 0.5, s * 0.035); fi(g, sil, w);
    ellipse(g, 0, -s * 0.25, s * 0.14, s * 0.19); fi(g, sil, w);
    shine(g, -s * 0.05, -s * 0.3, s * 0.035, s * 0.07, 0.8);
    heart(g, 0, s * 0.36, s * 0.05); fi(g, '#ff6fae', w * 0.6);
  },
  shell(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.5, s * 0.82); g.lineTo(s * 0.15, s * 0.44);
    g.quadraticCurveTo(s * 0.5, s * 0.0, s * 0.85, s * 0.44); g.closePath();
    fi(g, lg(g, 0, s * 0.15, 0, s * 0.82, [[0, '#ffe2ea'], [1, '#ff8aa8']]), w);
    g.beginPath(); for (let k = 1; k < 6; k++) { const a = Math.PI + k * Math.PI / 6; g.moveTo(s * 0.5, s * 0.8); g.lineTo(s * 0.5 + Math.cos(a) * s * 0.33, s * 0.5 + Math.sin(a) * s * 0.3); } st(g, w * 0.6, '#d8607e');
    rrect(g, s * 0.4, s * 0.76, s * 0.2, s * 0.1, s * 0.04); fi(g, '#ffb4c6', w * 0.8);
  },
  acorn(g, s, w) {
    ellipse(g, s * 0.5, s * 0.6, s * 0.2, s * 0.25); fi(g, lg(g, 0, s * 0.4, 0, s * 0.85, [[0, '#f0b070'], [1, '#a8602c']]), w);
    face(g, s * 0.5, s * 0.64, s * 0.035);
    g.beginPath(); g.ellipse(s * 0.5, s * 0.42, s * 0.26, s * 0.15, 0, Math.PI * 0.95, Math.PI * 2.05); g.closePath(); fi(g, '#7a4a24', w);
    g.save(); g.beginPath(); g.ellipse(s * 0.5, s * 0.42, s * 0.25, s * 0.14, 0, Math.PI, 0); g.clip();
    g.beginPath(); for (let k = -3; k <= 3; k++) { g.moveTo(s * (0.5 + k * 0.07), s * 0.26); g.lineTo(s * (0.5 + k * 0.07 + 0.1), s * 0.44); } st(g, w * 0.5, '#4a2a10'); g.restore();
    g.beginPath(); g.moveTo(s * 0.5, s * 0.29); g.quadraticCurveTo(s * 0.52, s * 0.19, s * 0.6, s * 0.16); st(g, w * 1.3, '#4a2a10');
  },
  letter(g, s, w) {
    g.translate(s / 2, s / 2); g.rotate(-0.15); g.translate(-s / 2, -s / 2);
    rrect(g, s * 0.13, s * 0.27, s * 0.74, s * 0.5, s * 0.05); fi(g, '#fff8ea', w);
    g.beginPath(); g.moveTo(s * 0.13, s * 0.77); g.lineTo(s * 0.42, s * 0.52); g.moveTo(s * 0.87, s * 0.77); g.lineTo(s * 0.58, s * 0.52); st(g, w * 0.6, '#c8b490');
    g.beginPath(); g.moveTo(s * 0.15, s * 0.3); g.lineTo(s * 0.5, s * 0.57); g.lineTo(s * 0.85, s * 0.3); g.fillStyle = '#f2e4c6'; g.fill(); st(g, w);
    heart(g, s * 0.5, s * 0.55, s * 0.075); fi(g, '#e8384c', w * 0.8);
  },
  yarn(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.66, s * 0.78); g.bezierCurveTo(s * 0.8, s * 0.95, s * 0.9, s * 0.75, s * 0.94, s * 0.88); st(g, w * 1.2, '#d8509a');
    circle(g, s * 0.46, s * 0.52, s * 0.32); fi(g, lg(g, 0, s * 0.2, 0, s * 0.84, [[0, '#ffaad8'], [1, '#e0509a']]), w);
    g.save(); circle(g, s * 0.46, s * 0.52, s * 0.31); g.clip();
    g.beginPath();
    for (let k = -2; k <= 2; k++) { g.moveTo(s * (0.1 + k * 0.1), s * 0.2); g.quadraticCurveTo(s * (0.5 + k * 0.1), s * 0.5, s * (0.3 + k * 0.1), s * 0.9); }
    for (let k = -1; k <= 2; k++) { g.moveTo(s * 0.1, s * (0.45 + k * 0.12)); g.quadraticCurveTo(s * 0.46, s * (0.3 + k * 0.12), s * 0.85, s * (0.5 + k * 0.12)); }
    st(g, w * 0.6, '#b83a7a'); g.restore();
  },
  crown(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.16, s * 0.72); g.lineTo(s * 0.14, s * 0.34); g.lineTo(s * 0.32, s * 0.52); g.lineTo(s * 0.5, s * 0.24);
    g.lineTo(s * 0.68, s * 0.52); g.lineTo(s * 0.86, s * 0.34); g.lineTo(s * 0.84, s * 0.72); g.closePath(); fi(g, GOLD(g, s, 0.24, 0.75), w);
    rrect(g, s * 0.14, s * 0.64, s * 0.72, s * 0.14, s * 0.04); fi(g, lg(g, 0, s * 0.64, 0, s * 0.78, [[0, '#ffd23f'], [1, '#d8901c']]), w);
    [[0.3, '#e8384c'], [0.5, '#3a9ae8'], [0.7, '#4cc35a']].forEach(([x, c]) => { circle(g, s * x, s * 0.71, s * 0.04); fi(g, c, w * 0.6); });
    [[0.14, 0.32], [0.5, 0.21], [0.86, 0.32]].forEach(([x, y]) => { circle(g, s * x, s * y, s * 0.045); fi(g, '#fff3a6', w * 0.7); });
  },
  cookie(g, s, w) {
    circle(g, s * 0.5, s * 0.52, s * 0.34); fi(g, rg(g, s * 0.5, s * 0.5, s * 0.1, s * 0.36, [[0, '#f6c888'], [1, '#d0904a']]), w);
    g.fillStyle = '#5a2e14';
    [[0.32, 0.38], [0.66, 0.36], [0.72, 0.6], [0.3, 0.66], [0.52, 0.78], [0.42, 0.3]].forEach(([x, y]) => { ellipse(g, s * x, s * y, s * 0.04, s * 0.032, x); g.fill(); });
    face(g, s * 0.5, s * 0.54, s * 0.04);
  },
  lollipop(g, s, w) {
    rrect(g, s * 0.47, s * 0.5, s * 0.06, s * 0.42, s * 0.03); fi(g, '#ffffff', w);
    circle(g, s * 0.5, s * 0.36, s * 0.27); fi(g, '#ff7ac0', w);
    g.save(); circle(g, s * 0.5, s * 0.36, s * 0.26); g.clip(); g.beginPath();
    for (let a = 0; a < Math.PI * 6; a += 0.15) { const r = s * 0.02 + a * s * 0.013; g.lineTo(s * 0.5 + Math.cos(a) * r, s * 0.36 + Math.sin(a) * r); }
    st(g, s * 0.045, '#fff'); g.restore();
    circle(g, s * 0.5, s * 0.36, s * 0.27); st(g, w);
    rrect(g, s * 0.4, s * 0.58, s * 0.2, s * 0.07, s * 0.03); fi(g, '#5ad0ff', w * 0.7);
  },
  fish(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.68, s * 0.5); g.lineTo(s * 0.92, s * 0.3); g.quadraticCurveTo(s * 0.84, s * 0.5, s * 0.92, s * 0.7); g.closePath(); fi(g, '#ff8a2a', w);
    g.beginPath(); g.moveTo(s * 0.4, s * 0.32); g.quadraticCurveTo(s * 0.52, s * 0.18, s * 0.62, s * 0.34); fi(g, '#ffb84a', w);
    ellipse(g, s * 0.44, s * 0.5, s * 0.3, s * 0.2); fi(g, lg(g, 0, s * 0.3, 0, s * 0.7, [[0, '#ffd86a'], [1, '#ff8a2a']]), w);
    g.beginPath(); g.moveTo(s * 0.56, s * 0.38); g.quadraticCurveTo(s * 0.62, s * 0.5, s * 0.56, s * 0.62); st(g, w * 0.7, '#d86a1a');
    circle(g, s * 0.28, s * 0.46, s * 0.045); g.fillStyle = OUT; g.fill();
    circle(g, s * 0.29, s * 0.445, s * 0.015); g.fillStyle = '#fff'; g.fill();
    g.beginPath(); g.arc(s * 0.22, s * 0.56, s * 0.04, 0.2, 1.8); st(g, w * 0.7);
  },
  cupcake(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.25, s * 0.56); g.lineTo(s * 0.75, s * 0.56); g.lineTo(s * 0.66, s * 0.88); g.lineTo(s * 0.34, s * 0.88); g.closePath();
    fi(g, lg(g, 0, 0, s, 0, [[0, '#5ab0f0'], [0.5, '#9ad8ff'], [1, '#5ab0f0']]), w);
    g.beginPath(); [0.38, 0.5, 0.62].forEach(x => { g.moveTo(s * x, s * 0.58); g.lineTo(s * (x + (x - 0.5) * 0.3), s * 0.86); }); st(g, w * 0.6, '#3a80c0');
    const fr = lg(g, 0, s * 0.25, 0, s * 0.6, [[0, '#fff0f8'], [1, '#ffa6d0']]);
    g.beginPath(); g.arc(s * 0.33, s * 0.52, s * 0.11, Math.PI * 0.5, Math.PI * 1.6); g.arc(s * 0.5, s * 0.38, s * 0.15, Math.PI * 1.05, Math.PI * 1.95); g.arc(s * 0.67, s * 0.52, s * 0.11, Math.PI * 1.4, Math.PI * 0.5);
    g.closePath(); fi(g, fr, w);
    circle(g, s * 0.5, s * 0.21, s * 0.065); fi(g, '#e8283c', w * 0.8);
    shine(g, s * 0.48, s * 0.19, s * 0.02, s * 0.015, 0.8);
    face(g, s * 0.5, s * 0.47, s * 0.035);
  },
  boot(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.32, s * 0.12); g.lineTo(s * 0.6, s * 0.12); g.lineTo(s * 0.6, s * 0.55);
    g.quadraticCurveTo(s * 0.84, s * 0.58, s * 0.88, s * 0.74); g.lineTo(s * 0.88, s * 0.86); g.lineTo(s * 0.3, s * 0.86); g.closePath();
    fi(g, lg(g, 0, s * 0.12, 0, s * 0.86, [[0, '#d08a4a'], [1, '#7a4420']]), w);
    rrect(g, s * 0.28, s * 0.8, s * 0.62, s * 0.08, s * 0.03); fi(g, '#4a2a14', w);
    rrect(g, s * 0.29, s * 0.1, s * 0.34, s * 0.1, s * 0.03); fi(g, '#f0d0a0', w * 0.8);
    g.beginPath(); for (let k = 0; k < 3; k++) { const y = s * (0.3 + k * 0.1); g.moveTo(s * 0.4, y); g.lineTo(s * 0.54, y + s * 0.05); g.moveTo(s * 0.54, y); g.lineTo(s * 0.4, y + s * 0.05); } st(g, w * 0.6, '#ffe0a0');
  },
  carrot(g, s, w) {
    g.translate(s / 2, s / 2); g.rotate(-0.45); g.translate(-s / 2, -s / 2);
    [[-0.5, 0.42], [0, 0.5], [0.5, 0.42]].forEach(([a, x]) => { ellipse(g, s * (x + a * 0.08 + 0.04), s * 0.16, s * 0.05, s * 0.13, a * 0.6); fi(g, '#4cc35a', w * 0.8); });
    g.beginPath(); g.moveTo(s * 0.33, s * 0.3); g.quadraticCurveTo(s * 0.5, s * 0.22, s * 0.67, s * 0.3); g.lineTo(s * 0.53, s * 0.88); g.quadraticCurveTo(s * 0.5, s * 0.93, s * 0.47, s * 0.88); g.closePath();
    fi(g, lg(g, s * 0.3, 0, s * 0.7, 0, [[0, '#ffb04a'], [1, '#f07a1a']]), w);
    g.beginPath(); [[0.42, 0.45], [0.57, 0.58], [0.45, 0.7]].forEach(([x, y]) => { g.moveTo(s * x, s * y); g.lineTo(s * (x + 0.06), s * (y + 0.01)); }); st(g, w * 0.6, '#c0581a');
  },
  pumpkin(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.5, s * 0.32); g.quadraticCurveTo(s * 0.5, s * 0.2, s * 0.6, s * 0.14); st(g, w * 2.4); st(g, w, '#5a8a2a');
    const fill = lg(g, 0, s * 0.3, 0, s * 0.86, [[0, '#ffb04a'], [1, '#e86a1a']]);
    ellipse(g, s * 0.3, s * 0.58, s * 0.18, s * 0.26); fi(g, fill, w);
    ellipse(g, s * 0.7, s * 0.58, s * 0.18, s * 0.26); fi(g, fill, w);
    ellipse(g, s * 0.5, s * 0.58, s * 0.2, s * 0.28); fi(g, fill, w);
    face(g, s * 0.5, s * 0.6, s * 0.045);
  },
  duck(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.2, s * 0.62);
    g.quadraticCurveTo(s * 0.2, s * 0.86, s * 0.52, s * 0.86); g.quadraticCurveTo(s * 0.84, s * 0.86, s * 0.86, s * 0.6);
    g.lineTo(s * 0.92, s * 0.44); g.quadraticCurveTo(s * 0.8, s * 0.5, s * 0.7, s * 0.52); g.lineTo(s * 0.3, s * 0.54); g.closePath();
    fi(g, lg(g, 0, s * 0.45, 0, s * 0.86, [[0, '#fff06a'], [1, '#f0c020']]), w);
    circle(g, s * 0.38, s * 0.38, s * 0.17); fi(g, lg(g, 0, s * 0.2, 0, s * 0.55, [[0, '#fff27a'], [1, '#f6c826']]), w);
    ellipse(g, s * 0.2, s * 0.43, s * 0.1, s * 0.055); fi(g, '#ff8a2a', w * 0.8);
    circle(g, s * 0.36, s * 0.34, s * 0.035); g.fillStyle = OUT; g.fill();
    circle(g, s * 0.37, s * 0.33, s * 0.012); g.fillStyle = '#fff'; g.fill();
    g.beginPath(); g.moveTo(s * 0.5, s * 0.66); g.quadraticCurveTo(s * 0.62, s * 0.78, s * 0.74, s * 0.64); st(g, w * 0.8, '#d0a018');
    g.fillStyle = 'rgba(255,110,140,0.5)'; ellipse(g, s * 0.44, s * 0.45, s * 0.04, s * 0.025); g.fill();
  },
  brush(g, s, w) {
    g.translate(s / 2, s / 2); g.rotate(-0.75);
    rrect(g, -s * 0.045, -s * 0.06, s * 0.09, s * 0.52, s * 0.045); fi(g, lg(g, -s * 0.05, 0, s * 0.05, 0, [[0, '#7ab4ff'], [1, '#2a6ad8']]), w);
    rrect(g, -s * 0.065, -s * 0.19, s * 0.13, s * 0.15, s * 0.02); fi(g, lg(g, -s * 0.07, 0, s * 0.07, 0, [[0, '#ffffff'], [1, '#a8b4c8']]), w);
    g.beginPath(); g.moveTo(-s * 0.065, -s * 0.19); g.quadraticCurveTo(-s * 0.08, -s * 0.36, 0, -s * 0.47); g.quadraticCurveTo(s * 0.08, -s * 0.36, s * 0.065, -s * 0.19); g.closePath();
    fi(g, lg(g, 0, -s * 0.47, 0, -s * 0.19, [[0, '#ff4d7a'], [0.55, '#ff4d7a'], [0.56, '#c89a5a'], [1, '#c89a5a']]), w);
  },
  balloon(g, s, w) {
    g.beginPath(); g.moveTo(s * 0.5, s * 0.66); g.bezierCurveTo(s * 0.42, s * 0.76, s * 0.6, s * 0.84, s * 0.5, s * 0.96); st(g, w * 0.8);
    g.beginPath(); g.moveTo(s * 0.5, s * 0.64); g.lineTo(s * 0.45, s * 0.7); g.lineTo(s * 0.55, s * 0.7); g.closePath(); fi(g, '#3a9ae8', w * 0.7);
    ellipse(g, s * 0.5, s * 0.38, s * 0.25, s * 0.28); fi(g, rg(g, s * 0.42, s * 0.28, s * 0.03, s * 0.32, [[0, '#a8e8ff'], [1, '#2a8ae0']]), w);
    shine(g, s * 0.4, s * 0.27, s * 0.05, s * 0.08, 0.7);
  },
  butterfly(g, s, w) {
    const A = lg(g, 0, s * 0.15, 0, s * 0.85, [[0, '#ffb0e0'], [1, '#a86cff']]);
    ellipse(g, s * 0.3, s * 0.36, s * 0.2, s * 0.17, -0.5); fi(g, A, w);
    ellipse(g, s * 0.7, s * 0.36, s * 0.2, s * 0.17, 0.5); fi(g, A, w);
    ellipse(g, s * 0.33, s * 0.66, s * 0.14, s * 0.12, 0.5); fi(g, A, w);
    ellipse(g, s * 0.67, s * 0.66, s * 0.14, s * 0.12, -0.5); fi(g, A, w);
    g.fillStyle = '#fff6a0'; [[0.28, 0.34], [0.72, 0.34], [0.34, 0.66], [0.66, 0.66]].forEach(([x, y]) => { circle(g, s * x, s * y, s * 0.045); g.fill(); });
    ellipse(g, s * 0.5, s * 0.52, s * 0.05, s * 0.24); fi(g, '#5a3a8a', w);
    g.beginPath(); g.moveTo(s * 0.48, s * 0.3); g.quadraticCurveTo(s * 0.42, s * 0.16, s * 0.36, s * 0.14); g.moveTo(s * 0.52, s * 0.3); g.quadraticCurveTo(s * 0.58, s * 0.16, s * 0.64, s * 0.14); st(g, w * 0.7);
  },
  bow(g, s, w) {
    const R = lg(g, 0, s * 0.25, 0, s * 0.75, [[0, '#ff8aa8'], [1, '#e0305a']]);
    g.beginPath(); g.moveTo(s * 0.45, s * 0.54); g.lineTo(s * 0.3, s * 0.88); g.lineTo(s * 0.38, s * 0.84); g.lineTo(s * 0.42, s * 0.92); g.lineTo(s * 0.52, s * 0.56); fi(g, R, w * 0.8);
    g.beginPath(); g.moveTo(s * 0.55, s * 0.54); g.lineTo(s * 0.7, s * 0.88); g.lineTo(s * 0.62, s * 0.84); g.lineTo(s * 0.58, s * 0.92); g.lineTo(s * 0.48, s * 0.56); fi(g, R, w * 0.8);
    g.beginPath(); g.moveTo(s * 0.5, s * 0.48); g.bezierCurveTo(s * 0.3, s * 0.2, s * 0.06, s * 0.3, s * 0.12, s * 0.5); g.bezierCurveTo(s * 0.16, s * 0.7, s * 0.36, s * 0.62, s * 0.5, s * 0.52); fi(g, R, w);
    g.beginPath(); g.moveTo(s * 0.5, s * 0.48); g.bezierCurveTo(s * 0.7, s * 0.2, s * 0.94, s * 0.3, s * 0.88, s * 0.5); g.bezierCurveTo(s * 0.84, s * 0.7, s * 0.64, s * 0.62, s * 0.5, s * 0.52); fi(g, R, w);
    rrect(g, s * 0.43, s * 0.42, s * 0.14, s * 0.15, s * 0.05); fi(g, '#ff6a8a', w);
  },
  mouse(g, s, w) {   // the golden mouse: one hides in every room
    glow(g, s, s * 0.5, s * 0.55, s * 0.45, '#fff3a0', 0.7);
    g.beginPath(); g.moveTo(s * 0.78, s * 0.66); g.bezierCurveTo(s * 0.98, s * 0.6, s * 0.94, s * 0.3, s * 0.8, s * 0.36); st(g, w * 1.4, '#d8901c');
    g.beginPath(); g.moveTo(s * 0.14, s * 0.62);
    g.bezierCurveTo(s * 0.2, s * 0.38, s * 0.5, s * 0.32, s * 0.7, s * 0.46);
    g.bezierCurveTo(s * 0.86, s * 0.58, s * 0.82, s * 0.76, s * 0.6, s * 0.76);
    g.lineTo(s * 0.26, s * 0.74); g.quadraticCurveTo(s * 0.12, s * 0.72, s * 0.14, s * 0.62);
    fi(g, GOLD(g, s, 0.35, 0.78), w);
    circle(g, s * 0.36, s * 0.38, s * 0.1); fi(g, GOLD(g, s, 0.28, 0.48), w);
    circle(g, s * 0.36, s * 0.38, s * 0.05); g.fillStyle = '#ffb0c0'; g.fill();
    circle(g, s * 0.26, s * 0.56, s * 0.03); g.fillStyle = OUT; g.fill();
    circle(g, s * 0.13, s * 0.64, s * 0.03); g.fillStyle = '#ff7a9a'; g.fill();
    sparkle(g, s * 0.62, s * 0.4, s * 0.07); sparkle(g, s * 0.8, s * 0.8, s * 0.05);
  },
};

export const OBJECT_NAMES = {
  key: 'Golden Key', feather: 'Feather', candle: 'Candle', book: 'Spell Book', teacup: 'Teacup', watch: 'Pocket Watch',
  scroll: 'Scroll', ring: 'Diamond Ring', hat: 'Witch Hat', broom: 'Broom', lantern: 'Lantern', apple: 'Apple',
  cheese: 'Cheese', bell: 'Bell', dice: 'Dice', umbrella: 'Umbrella', sock: 'Sock', glasses: 'Glasses', spoon: 'Spoon',
  shell: 'Seashell', acorn: 'Acorn', letter: 'Love Letter', yarn: 'Yarn Ball', crown: 'Crown', cookie: 'Cookie',
  lollipop: 'Lollipop', fish: 'Fish', cupcake: 'Cupcake', boot: 'Boot', carrot: 'Carrot', pumpkin: 'Pumpkin',
  duck: 'Rubber Duck', brush: 'Paintbrush', balloon: 'Balloon', butterfly: 'Butterfly', bow: 'Ribbon Bow', mouse: 'Golden Mouse',
};

export function drawObject(g, s, name) {
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  D[name](g, s, s * 0.045);
  g.restore();
}

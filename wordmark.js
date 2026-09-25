// Dessine chaque élément « .wordmark » en gros pixels (police 5 x 7 faite ici : aucun fichier de police, aucune requête).
// Sans script, le titre reste un texte ordinaire.
(function () {
  'use strict';

  // Chaque lettre : des lignes de 5 colonnes, « X » = un bloc. `top` = première ligne dessinée (les minuscules commencent à la ligne 2).
  var FONT = {
    M: { top: 0, rows: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'] },
    B: { top: 0, rows: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X...X', 'X...X', 'XXXX.'] },
    b: { top: 0, rows: ['X....', 'X....', 'XXXX.', 'X...X', 'X...X', 'X...X', 'XXXX.'] },
    '4': { top: 0, rows: ['...X.', '..XX.', '.X.X.', 'X..X.', 'XXXXX', '...X.', '...X.'] },
    a: { top: 2, rows: ['.XXX.', '....X', '.XXXX', 'X...X', '.XXXX'] },
    n: { top: 2, rows: ['X.XX.', 'XX..X', 'X...X', 'X...X', 'X...X'] },
    o: { top: 2, rows: ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'] },
    v: { top: 2, rows: ['X...X', 'X...X', 'X...X', '.X.X.', '..X..'] },
    x: { top: 2, rows: ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X'] },
    y: { top: 2, rows: ['X...X', 'X...X', 'X...X', '.XXXX', '....X', '....X', '.XXX.'] }
  };
  var NS = 'http://www.w3.org/2000/svg';
  var HEIGHT = 9; // lignes 0 à 8 (le « y » descend)

  function block(layer, cls, x, y) {
    var el = document.createElementNS(NS, 'rect');
    el.setAttribute('class', cls + ' b');
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('width', 1.04); // un peu plus large : pas de fine ligne entre deux blocs voisins
    el.setAttribute('height', 1.04);
    // Les colonnes se posent de gauche à droite, avec un léger décalage entre les lignes.
    el.style.setProperty('--d', (0.15 + x * 0.035 + (y % 3) * 0.02).toFixed(3) + 's');
    layer.appendChild(el);
  }

  function render(title) {
    var text = title.textContent.trim();
    var known = text.length > 0 && text.split('').every(function (c) { return FONT[c]; });
    if (!known) return; // une lettre non dessinée : on garde le texte

    var blocks = [];
    var x0 = 0;
    text.split('').forEach(function (c) {
      var glyph = FONT[c];
      glyph.rows.forEach(function (row, r) {
        row.split('').forEach(function (cell, col) {
          if (cell === 'X') blocks.push({ x: x0 + col, y: glyph.top + r });
        });
      });
      x0 += 6; // 5 colonnes + 1 d'espace
    });

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + x0 + ' ' + (HEIGHT + 1));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('shape-rendering', 'crispEdges');
    var shades = document.createElementNS(NS, 'g');
    var fronts = document.createElementNS(NS, 'g');
    blocks.forEach(function (b) { block(shades, 'shade', b.x + 0.5, b.y + 0.5); }); // l'ombre, décalée d'un demi-bloc
    blocks.forEach(function (b) { block(fronts, 'front', b.x, b.y); });
    svg.appendChild(shades);
    svg.appendChild(fronts);

    title.textContent = '';
    if (title.getAttribute('aria-hidden') !== 'true') {
      var label = document.createElement('span');
      label.className = 'sr';
      label.textContent = text;
      title.appendChild(label);
    }
    title.appendChild(svg);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.wordmark'), render);
})();

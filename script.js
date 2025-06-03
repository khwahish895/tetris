$(() => {
    const canvas = $('#tetris')[0];
    const ctx = canvas.getContext('2d');
    ctx.scale(20, 20);
  
    const colors = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];
    const arena = Array.from({ length: 20 }, () => Array(12).fill(0));
    const pieces = {
      T: [[0,0,0],[1,1,1],[0,1,0]],
      O: [[2,2],[2,2]],
      L: [[0,3,0],[0,3,0],[0,3,3]],
      J: [[0,4,0],[0,4,0],[4,4,0]],
      I: [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]],
      S: [[0,6,6],[6,6,0],[0,0,0]],
      Z: [[7,7,0],[0,7,7],[0,0,0]]
    };
  
    let player = {pos: {x:0, y:0}, matrix: null, score: 0};
    let highScore = +localStorage.getItem('highScore') || 0;
    $('#highscore').text(highScore);
  
    function updateScore() {
      $('#score').text(player.score);
      if (player.score > highScore) {
        highScore = player.score;
        $('#highscore').text(highScore);
        localStorage.setItem('highScore', highScore);
      }
    }
  
    function drawMatrix(matrix, offset) {
      matrix.forEach((row, y) => row.forEach((val, x) => {
        if (val) {
          ctx.fillStyle = colors[val];
          ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        }
      }));
    }
  
    function draw() {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawMatrix(arena, {x:0, y:0});
      drawMatrix(player.matrix, player.pos);
    }
  
    function merge(ar, pl) {
      pl.matrix.forEach((row, y) => row.forEach((val, x) => {
        if (val) ar[y + pl.pos.y][x + pl.pos.x] = val;
      }));
    }
  
    function collide(ar, pl) {
      for (let y = 0; y < pl.matrix.length; y++) {
        for (let x = 0; x < pl.matrix[y].length; x++) {
          if (pl.matrix[y][x] && (ar[y + pl.pos.y] && ar[y + pl.pos.y][x + pl.pos.x]) !== 0) {
            return true;
          }
        }
      }
      return false;
    }
  
    function rotate(m, d) {
      for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < y; x++) [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
      }
      d > 0 ? m.forEach(row => row.reverse()) : m.reverse();
    }
  
    function playerRotate(d) {
      const pos = player.pos.x;
      let offset = 1;
      rotate(player.matrix, d);
      while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
          rotate(player.matrix, -d);
          player.pos.x = pos;
          return;
        }
      }
    }
  
    function playerReset() {
      const keys = Object.keys(pieces);
      player.matrix = pieces[keys[Math.random() * keys.length | 0]];
      player.pos.y = 0;
      player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
      if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
      }
    }
  
    function playerDrop() {
      player.pos.y++;
      if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        sweepArena();
        updateScore();
      }
      dropCounter = 0;
    }
  
    function playerMove(dir) {
      player.pos.x += dir;
      if (collide(arena, player)) player.pos.x -= dir;
    }
  
    function sweepArena() {
      let rowCount = 1;
      for (let y = arena.length - 1; y >= 0; y--) {
        if (arena[y].every(val => val !== 0)) {
          arena.splice(y, 1);
          arena.unshift(Array(12).fill(0));
          player.score += rowCount * 10;
          rowCount *= 2;
        }
      }
    }
  
    let dropCounter = 0, dropInterval = 1000, lastTime = 0;
    function update(time = 0) {
      const dt = time - lastTime;
      lastTime = time;
      dropCounter += dt;
      if (dropCounter > dropInterval) playerDrop();
      draw();
      requestAnimationFrame(update);
    }
  
    $(document).on('keydown', e => {
      if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
  
      switch (e.key) {
        case 'ArrowLeft':
          playerMove(-1);
          break;
        case 'ArrowRight':
          playerMove(1);
          break;
        case 'ArrowDown':
          playerDrop();
          break;
        case 'ArrowUp':
        case ' ':
        case 'w':
          playerRotate(1);
          break;
        case 'q':
          playerRotate(-1);
          break;
      }
    });
  
    $('#left').on('click', () => playerMove(-1));
    $('#right').on('click', () => playerMove(1));
    $('#down').on('click', () => playerDrop());
    $('#rotate').on('click', () => playerRotate(1));
    $('#reset').on('click', function () {
      arena.forEach(row => row.fill(0));
      player.score = 0;
      updateScore();
      playerReset();
      this.blur(); // Prevent space key from refocusing on this button
    });
  
    playerReset();
    updateScore();
    update();
  });
  
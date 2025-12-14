// 게임 설정
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// 테트리스 블록 모양
const SHAPES = [
    [],
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]], // Z
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]], // J
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]]  // L
];

// 블록 색상
const COLORS = [
    '#000000',
    '#00f0f0', // I - 청록색
    '#f0f000', // O - 노란색
    '#a000f0', // T - 보라색
    '#00f000', // S - 초록색
    '#f00000', // Z - 빨간색
    '#0000f0', // J - 파란색
    '#f0a000'  // L - 주황색
];

class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.isPaused = true; // 초기에는 일시정지 상태
        this.isGameOver = false;
        this.clearingLines = []; // 클리어 중인 라인들
        this.clearAnimationTime = 0; // 애니메이션 시간
        
        this.init();
    }
    
    init() {
        // 보드 초기화
        for (let y = 0; y < ROWS; y++) {
            this.board[y] = [];
            for (let x = 0; x < COLS; x++) {
                this.board[y][x] = 0;
            }
        }
        
        // 첫 블록 생성
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        
        // 이벤트 리스너
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        
        this.updateDisplay();
    }
    
    createPiece() {
        const type = Math.floor(Math.random() * 7) + 1;
        const shape = SHAPES[type];
        return {
            type: type,
            shape: shape,
            x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
            y: 0
        };
    }
    
    drawBlock(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        // 하이라이트 효과
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 10, BLOCK_SIZE - 10);
    }
    
    drawBoard() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 그리드 그리기
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
        
        // 보드의 블록 그리기
        for (let y = 0; y < ROWS; y++) {
            const isClearing = this.clearingLines.includes(y);
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    if (isClearing) {
                        // 클리어 애니메이션: 깜빡이는 효과
                        const alpha = Math.abs(Math.sin(this.clearAnimationTime * 0.05));
                        this.ctx.save();
                        this.ctx.globalAlpha = alpha;
                        this.drawBlock(this.ctx, x, y, '#ffffff');
                        this.ctx.restore();
                    } else {
                        this.drawBlock(this.ctx, x, y, COLORS[this.board[y][x]]);
                    }
                }
            }
        }
        
        // 현재 블록 그리기 (클리어 애니메이션 중이 아닐 때만)
        if (this.currentPiece && this.clearingLines.length === 0) {
            const shape = this.currentPiece.shape;
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        this.drawBlock(
                            this.ctx,
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            COLORS[this.currentPiece.type]
                        );
                    }
                }
            }
        }
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const shape = this.nextPiece.shape;
            const offsetX = (this.nextCanvas.width / BLOCK_SIZE - shape[0].length) / 2;
            const offsetY = (this.nextCanvas.height / BLOCK_SIZE - shape.length) / 2;
            
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        this.drawBlock(
                            this.nextCtx,
                            offsetX + x,
                            offsetY + y,
                            COLORS[this.nextPiece.type]
                        );
                    }
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    isValidMove(piece, dx, dy, newShape = null) {
        const shape = newShape || piece.shape;
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                        return false;
                    }
                    
                    if (boardY >= 0 && this.board[boardY][boardX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    rotatePiece() {
        const shape = this.currentPiece.shape;
        const rotated = [];
        const size = shape.length;
        
        for (let y = 0; y < size; y++) {
            rotated[y] = [];
            for (let x = 0; x < size; x++) {
                rotated[y][x] = shape[size - 1 - x][y];
            }
        }
        
        if (this.isValidMove(this.currentPiece, 0, 0, rotated)) {
            this.currentPiece.shape = rotated;
        }
    }
    
    placePiece() {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.type;
                    }
                }
            }
        }
    }
    
    clearLines(callback) {
        // 클리어할 라인 찾기
        const linesToClear = [];
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
            }
        }
        
        if (linesToClear.length > 0) {
            // 애니메이션 시작
            this.clearingLines = linesToClear;
            this.clearAnimationTime = 0;
            
            // 애니메이션 후 실제로 라인 제거
            setTimeout(() => {
                // 라인 제거
                for (let i = linesToClear.length - 1; i >= 0; i--) {
                    const y = linesToClear[i];
                    this.board.splice(y, 1);
                    this.board.unshift(new Array(COLS).fill(0));
                }
                
                // 점수 계산
                const linesCleared = linesToClear.length;
                this.lines += linesCleared;
                const points = [0, 100, 300, 500, 800];
                this.score += points[linesCleared] * this.level;
                
                // 레벨 업 (10줄마다)
                this.level = Math.floor(this.lines / 10) + 1;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
                
                // 애니메이션 종료
                this.clearingLines = [];
                this.updateDisplay();
                
                // 콜백 실행 (새 블록 생성 등)
                if (callback) {
                    callback();
                }
            }, 500); // 0.5초 애니메이션
        } else {
            // 클리어할 라인이 없으면 즉시 콜백 실행
            if (callback) {
                callback();
            }
        }
    }
    
    movePiece(dx, dy) {
        if (this.isValidMove(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        }
        return false;
    }
    
    dropPiece() {
        // 클리어 애니메이션 중에는 블록이 떨어지지 않음
        if (this.clearingLines.length > 0) {
            return;
        }
        
        if (!this.movePiece(0, 1)) {
            this.placePiece();
            this.clearLines(() => {
                // 애니메이션 완료 후 새 블록 생성
                this.currentPiece = this.nextPiece;
                this.nextPiece = this.createPiece();
                
                // 게임 오버 체크
                if (!this.isValidMove(this.currentPiece, 0, 0)) {
                    this.gameOver();
                }
            });
        }
    }
    
    hardDrop() {
        // 클리어 애니메이션 중에는 하드 드롭 불가
        if (this.clearingLines.length > 0) {
            return;
        }
        
        // 하드 드롭 점수 계산 (떨어뜨린 거리만큼 점수 추가)
        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        
        // 하드 드롭 점수 추가 (떨어진 거리 * 2점)
        this.score += dropDistance * 2;
        
        this.placePiece();
        this.clearLines(() => {
            // 애니메이션 완료 후 새 블록 생성
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.createPiece();
            
            // 게임 오버 체크
            if (!this.isValidMove(this.currentPiece, 0, 0)) {
                this.gameOver();
            }
        });
    }
    
    handleKeyPress(e) {
        // Enter 키는 항상 처리 (일시정지/재개)
        if (e.code === 'Enter') {
            e.preventDefault();
            if (this.isGameOver) {
                this.reset();
            } else {
                this.togglePause();
            }
            return;
        }
        
        // 게임 오버이거나 일시정지 상태면 다른 키 입력 무시
        if (this.isGameOver || this.isPaused) {
            return;
        }
        
        // 클리어 애니메이션 중에는 블록 조작 불가
        if (this.clearingLines.length > 0) {
            return;
        }
        
        e.preventDefault();
        
        switch (e.code) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                this.drawBoard();
                this.drawNextPiece();
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                this.drawBoard();
                this.drawNextPiece();
                break;
            case 'ArrowDown':
                if (this.movePiece(0, 1)) {
                    this.score += 1;
                    this.updateDisplay();
                }
                this.drawBoard();
                this.drawNextPiece();
                break;
            case 'ArrowUp':
                this.rotatePiece();
                this.drawBoard();
                this.drawNextPiece();
                break;
            case 'Space':
                // Space 키로 하드 드롭 (바로 내려가기)
                this.hardDrop();
                this.drawBoard();
                this.drawNextPiece();
                this.updateDisplay();
                break;
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const button = document.getElementById('startButton');
        
        if (this.isPaused) {
            overlay.classList.remove('hidden');
            title.textContent = '일시정지';
            message.textContent = 'Enter 키를 눌러 계속하세요';
            button.textContent = '계속';
        } else {
            overlay.classList.add('hidden');
            this.lastTime = 0; // 재개 시 시간 초기화
        }
    }
    
    gameOver() {
        this.isGameOver = true;
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const button = document.getElementById('startButton');
        
        overlay.classList.remove('hidden');
        title.textContent = '게임 오버';
        message.textContent = `최종 점수: ${this.score}`;
        button.textContent = '다시 시작';
        
        button.onclick = () => this.reset();
    }
    
    reset() {
        this.board = [];
        for (let y = 0; y < ROWS; y++) {
            this.board[y] = new Array(COLS).fill(0);
        }
        
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.clearingLines = [];
        this.clearAnimationTime = 0;
        
        document.getElementById('gameOverlay').classList.add('hidden');
        this.updateDisplay();
    }
    
    startGame() {
        if (this.isGameOver) {
            this.reset();
        } else {
            this.isPaused = false;
            this.lastTime = 0; // 다음 update에서 초기화됨
            const overlay = document.getElementById('gameOverlay');
            overlay.classList.add('hidden');
        }
    }
    
    update(time = 0) {
        // 클리어 애니메이션 업데이트
        if (this.clearingLines.length > 0) {
            this.clearAnimationTime += 16; // 약 60fps 기준
        }
        
        // 일시정지 상태가 아니고 게임 오버가 아니고 애니메이션 중이 아닐 때만 블록을 떨어뜨림
        if (!this.isPaused && !this.isGameOver && this.clearingLines.length === 0) {
            if (this.lastTime === 0) {
                this.lastTime = time;
            }
            const deltaTime = time - this.lastTime;
            this.lastTime = time;
            this.dropCounter += deltaTime;
            
            if (this.dropCounter > this.dropInterval) {
                this.dropPiece();
                this.dropCounter = 0;
            }
        }
        
        // 항상 화면을 그림
        this.drawBoard();
        this.drawNextPiece();
        this.updateDisplay();
        
        // 게임 루프 계속 진행
        requestAnimationFrame((t) => this.update(t));
    }
}

// 게임 시작
const game = new Tetris();
game.update();


var mineSweeper = function () {

    this.canvas = null;
    this.grid = null;
    this.canvasContext = null;
    this.dificultySelected = null;
    this.gameState = null;
    this.mouseTimer = '';
    this.isMouseTimerExec = false;

    const minesweeperConfig = Object.freeze({
        bombChar: "o",
        alertChar: "!",
        canvasName: "mineSweeperCanvas",
        font: "Arial Black",
        //font: "Verdana"
        isVisibleStart: false,
        setAlertTimerDelay: 400,
    });

    const minesweeperEnums = Object.freeze({

        gameState: Object.freeze({
            ongoing: 1,
            victory: 2,
            failure: 3,
        }),

        fontColors: Object.freeze({
            empty1: "#0000FD",
            empty2: "#017E00",
            empty3: "#FB0101",
            empty4: "#010081",
            empty5: "#810102",
            empty6: "#038081",
            empty7: "#000000",
            empty8: "#808080",
            alert: "#606060",
        }),

        bgColors: Object.freeze({
            hidden: "#999999",
            visible: "#EEEEEE",
            victory: "#6666EE",
            failure: "#EE6666",
        }),
    });

    const dificulties = Object.freeze({
            veryEasy: 0.1,
            easy: 0.15,
            medium: 0.2,
            hard: 0.3,
            veryHard: 0.4,
    });

    minesweeperObjects = function () {

        function cell(posX = 0, posY = 0, isVisible = minesweeperConfig.isVisibleStart, isBomb = false) {
            this.posX = posX;
            this.posY = posY;
            this.isVisible = isVisible;
            this.isAlert = false;
            this.isBomb = isBomb;
        }

        function gamegrid(
            rows = 10,
            columns = 10,
            cellSize = 20,
            dificulty = dificulties.easy) {

            this.cellSize = cellSize;
            this.rows = rows;
            this.columns = columns;
            this.area = fillPlayArea();

            this.countSpaces = rows * columns;
            this.countBomb = Math.floor(rows * columns * dificulty);
            this.countVisible = 0;

            populateBombs(this.area, this.countBomb);

            function fillPlayArea() {
                var _area = new Array(columns);
                for (var i = 0; i < columns; i++) {
                    _area[i] = new Array(rows);
                    for (var j = 0; j < rows; j++) {
                        _area[i][j] = new cell(i, j);
                    }
                }
                return _area;
            }

            function countBombs(area) {
                var _countBomb = 0
                for (var i = 0; i < columns; i++) {
                    for (var j = 0; j < rows; j++) {
                        _countBomb = area[i][j].isBomb ? _countBomb+1 : _countBomb;
                    }
                }
                return _countBomb;
            }

            function populateBombs(area, bombs) {
                while(bombs > 0){
                    let randX = Math.floor(Math.random() * columns);
                    let randY = Math.floor(Math.random() * rows);
                    
                    if(!area[randX][randY].isBomb){
                        area[randX][randY].isBomb = true;
                        bombs--;
                    }
                }
            }
        }

        return {
            cell: cell,
            gamegrid: gamegrid,
        }
    }();

    function init(rows = 10, columns = 10, cellSize = 30, dificulty = dificulties.veryEasy){
        dificultySelected = dificulty;
        canvas = document.getElementById(minesweeperConfig.canvasName);
        canvas.width = cellSize * columns;
        canvas.height = cellSize * rows;
        canvas.posX = 0;
        canvas.posY = 0;
        grid = new minesweeperObjects.gamegrid(rows, columns, cellSize, dificultySelected);
        canvasContext = canvas.getContext("2d");
        canvas.onmouseup = canvasMouseClickUp;
        canvas.onmousedown = canvasMouseClickDown;
        gameState = minesweeperEnums.gameState.ongoing;
        drawGrid();
    }

    function drawGrid(gameState = minesweeperEnums.gameState.ongoing) {
        for (var i = 0; i < grid.columns; i++) {
            for (var j = 0; j < grid.rows; j++) {
                if (gameState == minesweeperEnums.gameState.failure
                    || gameState == minesweeperEnums.gameState.victory) {
                        setCellVisible(grid.area[i][j]);
                }
                drawCell(grid.area[i][j], gameState);
            }
        }
    }

    function drawCell(cell, gameState = minesweeperEnums.gameState.ongoing) {

        currentColor = minesweeperEnums.bgColors.hidden;
        if (cell.isVisible) {
            switch (gameState) {
                case minesweeperEnums.gameState.ongoing:
                    currentColor = minesweeperEnums.bgColors.visible;
                    break;
                case minesweeperEnums.gameState.failure:
                    currentColor = minesweeperEnums.bgColors.failure;
                    break;
                case minesweeperEnums.gameState.victory:
                    currentColor = minesweeperEnums.bgColors.victory;
                    break;
            }
        }

        canvasContext.beginPath();
        canvasContext.fillStyle = currentColor;
        canvasContext.fillRect(
            cell.posX * grid.cellSize,
            cell.posY * grid.cellSize,
            grid.cellSize,
            grid.cellSize);
        canvasContext.stroke();

        canvasContext.beginPath();
        canvasContext.strokeStyle = "black";
        canvasContext.rect(
            cell.posX * grid.cellSize,
            cell.posY * grid.cellSize,
            grid.cellSize,
            grid.cellSize);
        canvasContext.stroke();

        if (cell.isVisible) {

            canvasContext.beginPath();
            canvasContext.textAlign = "center"
            canvasContext.font = "" + (grid.cellSize) + "px " + minesweeperConfig.font;
            canvasContext.fillStyle = "black";

            var bombCount = getCellBombCountNearby(cell);

            textContent = cell.isBomb ?
                minesweeperConfig.bombChar
                : bombCount == 0 ? "" : bombCount;

            if (!cell.isBomb) {
                canvasContext.fillStyle = getNearbyBombCountStyle(bombCount);
            }

            canvasContext.fillText(
                textContent,
                cell.posX * grid.cellSize + grid.cellSize / 2,
                cell.posY * grid.cellSize + grid.cellSize - 2);

            canvasContext.stroke();

            if (bombCount == 0) {
                unhideNearbyEmptyCells(cell);
            }
        }
        else
        {
            if (cell.isAlert) {

                canvasContext.beginPath();
                canvasContext.textAlign = "center"
                canvasContext.font = "" + (grid.cellSize) + "px " + minesweeperConfig.font;
                canvasContext.fillStyle = minesweeperEnums.fontColors.alert;

                textContent = minesweeperConfig.alertChar;

                canvasContext.fillText(
                    textContent,
                    cell.posX * grid.cellSize + grid.cellSize / 2,
                    cell.posY * grid.cellSize + grid.cellSize - 2);

                canvasContext.stroke();
            }
        }
    }

    function setCellVisible(cell){
        if(!cell.isVisible){
            grid.countVisible += 1;
            cell.isVisible = true;
        }
    }

    function getCellBombCountNearby(cell) {
        var count = 0;
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                if ((cell.posX + i) >= 0
                    && (cell.posX + i) < grid.columns
                    && (cell.posY + j) >= 0
                    && (cell.posY + j) < grid.rows) {
                    if (grid.area[cell.posX + i][cell.posY + j].isBomb) {
                        count += 1;
                    }
                }
            }
        }
        return count;
    }

    function getCellByGridPosition(posX, posY) {
        i = Math.floor(posX / grid.cellSize);
        j = Math.floor(posY / grid.cellSize);
        return grid.area[i][j];
    }

    function unhideNearbyEmptyCells(cell) {
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                if ((cell.posX + i) >= 0
                    && (cell.posX + i) < grid.columns
                    && (cell.posY + j) >= 0
                    && (cell.posY + j) < grid.rows) {

                    nearby = grid.area[cell.posX + i][cell.posY + j];

                    if (!nearby.isBomb && !nearby.isVisible) {
                        setCellVisible(nearby);
                        drawCell(nearby);
                    }
                }
            }
        }
    }

    function getNearbyBombCountStyle(count) {
        switch (count) {
            case 0:
            case 1:
            default:
                return minesweeperEnums.fontColors.empty1
            case 2:
                return minesweeperEnums.fontColors.empty2;
            case 3:
                return minesweeperEnums.fontColors.empty3;
            case 4:
                return minesweeperEnums.fontColors.empty4;
            case 5:
                return minesweeperEnums.fontColors.empty5;
            case 6:
                return minesweeperEnums.fontColors.empty6;
            case 7:
                return minesweeperEnums.fontColors.empty7;
            case 8:
                return minesweeperEnums.fontColors.empty8;
        }
    }

    function isVictory(){
        if ((grid.countSpaces - grid.countBomb) == grid.countVisible)
            return true
        else
            return false;
    }

    function stepOnCell(cell) {
        if (gameState == minesweeperEnums.gameState.ongoing){
            if (cell.isBomb) {
                gameState = minesweeperEnums.gameState.failure;
                drawGrid(gameState);
            }
            else {
                setCellVisible(cell);
                drawCell(cell);
                if(isVictory()){
                    gameState = minesweeperEnums.gameState.victory;
                    drawGrid(gameState);
                }
            }
        }
    }

    function setCellToAlert(cell) {
        if (gameState == minesweeperEnums.gameState.ongoing){
            cell.isAlert = !cell.isAlert;
            drawCell(cell);
        }
    }

    function canvasMouseClickUp(e) {
        clearTimeout(mouseTimer);
        if (!isMouseTimerExec) {
            stepOnCell(getCellByGridPosition(e.offsetX, e.offsetY));
        }
    }

    function canvasMouseClickDown(e) {
        isMouseTimerExec = false;
        mouseTimer = setTimeout(function(){
            isMouseTimerExec = true;
            setCellToAlert(getCellByGridPosition(e.offsetX, e.offsetY));
        }, minesweeperConfig.setAlertTimerDelay);
    }

    return {
        init: init,
        dificulties: dificulties,
    }
}();






















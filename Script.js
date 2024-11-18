function Gameboard() {
    const board = Array.from({ length: 3 }, () => Array(3).fill(null));

    this.board = board;
    this.state = () => board.map(row => row.slice());
};

function Player(name, marker, ai=false) {
    this.name = name;
    this.marker = marker;
    this.ai = ai;
    this.makeMove = (gameboard, action) => gameboard.board[action[0]][action[1]] = marker;
};

function Gameflow() {
    function evaluateBoard(state) {
        const stateTranspose = state[0].map((_, i) => state.map(row => row[i]));
        const stateBackDiagonal = state.map((_, i) => state[i][i]);
        const stateForwardDiagonal = state.map((_, i) => state[state.length - 1 - i][i]);
    
        const decisionSet = [...state, ...stateTranspose, stateBackDiagonal, stateForwardDiagonal];
        const nullCounter = state.reduce((total, row) => total + row.filter(position => position === null).length, 0);

        if (decisionSet.some(row => row.every(position => position === 'X'))) {
            return [true, 1];
        } else if (decisionSet.some(row => row.every(position => position === 'O'))) {
            return [true, -1];
        } else if (nullCounter === 0) {
            return [true, 0];
        } else {
            return [false, null];
        };
    };

    this.actions = (state) => {
        actions = [];

        for (let i = 0; i < state.length; i++) {
            for (let j = 0; j < state.length; j++) {
                if (state[i][j] === null) {
                    actions.push([i, j]);
                };
            };
        };

        return actions;
    };

    this.turn = (state) => {
        let counterX = 0;
        let counterO = 0;
        
        if (state.filter(row => row.includes(null)).length === 0) {
            return null;
        };
    
        state.forEach((row) => {
            counterX += row.filter(position => position === 'X').length;
            counterO += row.filter(position => position === 'O').length;
        });
    
        if (counterX === counterO) {
            return 'X';
        } else {
            return 'O';
        };
    };

    this.result = (state, action) => {
        const newState = state.map(row => [...row]);
        newState[action[0]][action[1]] = this.turn(newState);
        return newState;
    };

    this.terminal = (state) => evaluateBoard(state)[0];
    this.utility = (state) => evaluateBoard(state)[1];
};

function AIplayer(gameflow, marker) {
    function minimax(state) {
        if (gameflow.terminal(state)) {
            return gameflow.utility(state);
        };
    
        playerTurn = gameflow.turn(state);
        score = playerTurn === 'X' ? -Infinity : Infinity;
    
        if (playerTurn === 'X') {
            gameflow.actions(state).forEach((action) => {
                score = Math.max(score, minimax(gameflow.result(state, action)));
            });
        } else {
            gameflow.actions(state).forEach((action) => {
                score = Math.min(score, minimax(gameflow.result(state, action)));
            });
        };
    
        return score;
    };

    this.marker = marker;

    this.optimalPosition = (state) => {
        const allActions = gameflow.actions(state);
        const scores = [];
    
        if (allActions.length === 0) {
            return null;
        };
    
        allActions.forEach((action) => {
            const score = minimax(gameflow.result(state, action));
            scores.push(score);
        });
    
        if (this.marker === 'X') {
            const bestIndices = scores.map((score, index) => {
                if (score === Math.max(...scores)) {
                    return [score, index];
                } else {
                    return [score, null];
                };
            }).filter(scoreIndexPair => scoreIndexPair[1] !== null).map(pair => pair[1]);
            const randomIndex = Math.floor(Math.random() * bestIndices.length);
            return allActions[bestIndices[randomIndex]];
        } else {
            const bestIndices = scores.map((score, index) => {
                if (score === Math.min(...scores)) {
                    return [score, index];
                } else {
                    return [score, null];
                };
            }).filter(scoreIndexPair => scoreIndexPair[1] !== null).map(pair => pair[1]);
            const randomIndex = Math.floor(Math.random() * bestIndices.length);
            return allActions[bestIndices[randomIndex]];    
        };
    };
};

// ----------------------------------------- //
// ----------------------------------------- //
// ----------------------------------------- //
// ----------------------------------------- //
// ----------------------------------------- //

const players = document.querySelector(".players");
const singleplayer = document.querySelector(".singleplayer");
const singleplayerInformation = document.querySelector(".singleplayer-information");
const multiplayer = document.querySelector(".multiplayer");
const multiplayerInformation = document.querySelector(".multiplayer-information");
const inputsSingeplayer = document.querySelectorAll(".singleplayer-information input");
const inputsMultiplayer = document.querySelectorAll(".multiplayer-information input");
const board = document.querySelector(".board");
const playerXContainer = document.querySelector(".player-container:first-child");
const playerOContainer = document.querySelector(".player-container:last-child");
const results = document.querySelector(".results");
const restart = document.querySelector(".restart");
const result = document.querySelector(".result");
const reset = document.querySelector(".reset");
const singleplayerSubmit = document.querySelector(".singleplayer-information button");
const multiplayerSubmit = document.querySelector(".multiplayer-information button");
const playerName = document.querySelector("#player-name");
const playerNameX = document.querySelector("#player-name-X");
const playerNameY = document.querySelector("#player-name-O");
const xCheck = document.querySelector("#symbol-X");
const oCheck = document.querySelector("#symbol-O");

let xoButtons;
let game;
let playerX;
let playerO;
let gameflow;
let playerAI;
let opposingPlayer;

// ----------------------------------------- //
// ----------------------------------------- //
// ----------------------------------------- //
// ----------------------------------------- //
// ----------------------------------------- //


singleplayer.addEventListener("click", () => {
    singleplayerInformation.style.display = 'flex';
    multiplayerInformation.style.display = 'none';

    inputsMultiplayer.forEach((input) => {
        if (input.type === "text") {
            input.value = '';
        } else if (input.type === "radio") {
            input.checked = false;
        };
    });
});

multiplayer.addEventListener("click", () => {
    multiplayerInformation.style.display = 'flex';
    singleplayerInformation.style.display = 'none';

    inputsSingeplayer.forEach((input) => {
        if (input.type === "text") {
            input.value = '';
        } else if (input.type === "radio") {
            input.checked = false;
        };
    });
});

singleplayerSubmit.addEventListener("click", () => {
    if (playerName.value.length > 0 && (xCheck.checked || oCheck.checked)) {
        playerXContainer.textContent = playerName.value;
        playerOContainer.textContent = "Computer (Max Level)";

        game = new Gameboard();
        gameflow = new Gameflow();
        playerX = new Player(xCheck.checked ? playerName.value : 'Computer', 'X', xCheck.checked ? false : true);
        playerO = new Player(oCheck.checked ? playerName.value : 'Computer', 'O', oCheck.checked ? false : true);
        playerAI = new AIplayer(gameflow, xCheck.checked ? 'O' : 'X');
    };
});

multiplayerSubmit.addEventListener("click", () => {
    if (playerNameX.value.length > 0 && playerNameY.value.length > 0) {
        playerXContainer.textContent = playerNameX.value;
        playerOContainer.textContent = playerNameY.value;

        game = new Gameboard();
        gameflow = new Gameflow();
        playerX = new Player(playerNameX.value, 'X', ai=false);
        playerO = new Player(playerNameY.value, 'O', ai=false);
    };
});

[singleplayerSubmit, multiplayerSubmit].forEach((submit) => {
    submit.addEventListener("click", () => {
        if ((playerNameX.value.length > 0 && playerNameY.value.length > 0) || 
        (playerName.value.length > 0 && (xCheck.checked || oCheck.checked))) {
            players.style.display = 'none';
            singleplayerInformation.style.display = 'none';
            multiplayerInformation.style.display = 'none';
            board.style.display = 'flex';
            results.style.display = 'flex';
    
            xoButtons = document.querySelectorAll(".grid > button");
            let opposingPlayer = playerX.ai === true ? playerX : playerO;
    
            xoButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    if (gameflow.turn(game.state()) === 'X' && playerX.ai === false) {
                        button.textContent = playerX.marker;
                        playerX.makeMove(game, button.className.split('').map(i => parseInt(i)));
                        opposingPlayer = playerO;
                        button.disabled = true;
                    } else if (gameflow.turn(game.state()) === 'O' && playerO.ai === false) {
                        button.textContent = playerO.marker;
                        playerO.makeMove(game, button.className.split('').map(i => parseInt(i)));
                        opposingPlayer = playerX;
                        button.disabled = true;
                    };

                    if (opposingPlayer.ai === true) {
                        let aiPosition = playerAI.optimalPosition(game.state());
                        if (aiPosition !== null) {
                            opposingPlayer.makeMove(game, aiPosition);
                            let buttonPosition = game.state().length*aiPosition[0] + aiPosition[1] + 1;
                            let opposingButton = document.querySelector(`.grid > button:nth-child(${buttonPosition})`);
                            opposingButton.textContent = opposingPlayer.marker;
                            opposingButton.disabled = true;
                        };
                    };
            
                    if (gameflow.utility(game.state()) === 1) {
                        result.textContent = `Game! ${playerX.name} wins.`;
                        xoButtons.forEach((button) => {
                            button.disabled = true;
                            button.style.color = 'gray';
                        });
                    } else if (gameflow.utility(game.state()) === -1) {
                        result.textContent = `Game! ${playerO.name} wins.`;
                        xoButtons.forEach((button) => {
                            button.disabled = true;
                            button.style.color = 'gray';
                        });
                    } else if (gameflow.utility(game.state()) === 0) {
                        result.textContent = `Game! It's a draw.`;
                        xoButtons.forEach((button) => {
                            button.disabled = true;
                            button.style.color = 'gray';
                        });
                    };
                });
            });
        };
    });
});

singleplayerSubmit.addEventListener("click", () => {
    if ((playerNameX.value.length > 0 && playerNameY.value.length > 0) || 
    (playerName.value.length > 0 && (xCheck.checked || oCheck.checked))) {
        if (playerX.ai === true) {
            let startPosition = playerAI.optimalPosition(game.state());
            let buttonPosition = game.state().length*startPosition[0] + startPosition[1] + 1;
            opposingPlayer = playerX;
            document.querySelector(`.grid > button:nth-child(${buttonPosition})`).dispatchEvent(new Event("click"));
        };
    };
});

restart.addEventListener("click", () => {
    location.reload();
});
import React, { useState } from 'react';
import './index.css';

const BOARD_SIZE = 11;
const EMPTY = 0;
const DEFENDER = 1;
const ATTACKER = 2;
const KING = 3;

// Componentes de iconos simples
const Crown = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 6l4 6 5-4-2 10H5L3 8l5 4 4-6z"/>
  </svg>
);

const Shield = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
  </svg>
);

const Swords = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6.92 5L12 10.07 17.08 5 19 6.93 13.93 12 19 17.07 17.08 19 12 13.93 6.92 19 5 17.07 10.07 12 5 6.93 6.92 5z"/>
  </svg>
);

// Posiciones iniciales del tablero
const createInitialBoard = () => {
  const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));

  // Centro del tablero
  const center = Math.floor(BOARD_SIZE / 2);

  // Colocar el rey en el centro
  board[center][center] = KING;

  // Colocar defensores alrededor del rey
  const defenderPositions = [
    [center-1, center], [center+1, center], [center, center-1], [center, center+1],
    [center-2, center], [center+2, center], [center, center-2], [center, center+2],
    [center-1, center-1], [center-1, center+1], [center+1, center-1], [center+1, center+1]
  ];

  defenderPositions.forEach(([row, col]) => {
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      board[row][col] = DEFENDER;
    }
  });

  // Colocar atacantes en los bordes
  // Lado superior
  for (let i = 3; i <= 7; i++) {
    board[0][i] = ATTACKER;
    board[1][center] = ATTACKER;
  }

  // Lado inferior
  for (let i = 3; i <= 7; i++) {
    board[BOARD_SIZE-1][i] = ATTACKER;
    board[BOARD_SIZE-2][center] = ATTACKER;
  }

  // Lado izquierdo
  for (let i = 3; i <= 7; i++) {
    board[i][0] = ATTACKER;
    board[center][1] = ATTACKER;
  }

  // Lado derecho
  for (let i = 3; i <= 7; i++) {
    board[i][BOARD_SIZE-1] = ATTACKER;
    board[center][BOARD_SIZE-2] = ATTACKER;
  }

  return board;
};

const Hnefatafl = () => {
  const [board, setBoard] = useState(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState(DEFENDER);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [winner, setWinner] = useState(null);

  const isCorner = (row, col) => {
    return (row === 0 && col === 0) || (row === 0 && col === BOARD_SIZE-1) ||
           (row === BOARD_SIZE-1 && col === 0) || (row === BOARD_SIZE-1 && col === BOARD_SIZE-1);
  };

  const isThrone = (row, col) => {
    const center = Math.floor(BOARD_SIZE / 2);
    return row === center && col === center;
  };

  const isValidMove = (fromRow, fromCol, toRow, toCol) => {
    if (toRow < 0 || toRow >= BOARD_SIZE || toCol < 0 || toCol >= BOARD_SIZE) return false;
    if (board[toRow][toCol] !== EMPTY) return false;

    // Solo el rey puede ocupar las esquinas
    if (isCorner(toRow, toCol) && board[fromRow][fromCol] !== KING) return false;

    // Nadie excepto el rey puede ocupar el trono
    if (isThrone(toRow, toCol) && board[fromRow][fromCol] !== KING) return false;

    // Movimiento en línea recta (horizontal o vertical)
    if (fromRow !== toRow && fromCol !== toCol) return false;

    // Verificar que el camino esté libre
    const rowDir = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colDir = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

    let currentRow = fromRow + rowDir;
    let currentCol = fromCol + colDir;

    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol] !== EMPTY) return false;
      currentRow += rowDir;
      currentCol += colDir;
    }

    return true;
  };

  const getValidMoves = (row, col) => {
    const moves = [];
    const piece = board[row][col];

    if (piece === EMPTY) return moves;

    // Verificar todas las direcciones
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    directions.forEach(([dRow, dCol]) => {
      for (let i = 1; i < BOARD_SIZE; i++) {
        const newRow = row + dRow * i;
        const newCol = col + dCol * i;

        if (isValidMove(row, col, newRow, newCol)) {
          moves.push([newRow, newCol]);
        } else {
          break;
        }
      }
    });

    return moves;
  };

  const checkCapture = (row, col, newBoard) => {
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let captures = [];

    directions.forEach(([dRow, dCol]) => {
      const adjacentRow = row + dRow;
      const adjacentCol = col + dCol;
      const oppositeRow = row + dRow * 2;
      const oppositeCol = col + dCol * 2;

      if (adjacentRow >= 0 && adjacentRow < BOARD_SIZE &&
          adjacentCol >= 0 && adjacentCol < BOARD_SIZE &&
          oppositeRow >= 0 && oppositeRow < BOARD_SIZE &&
          oppositeCol >= 0 && oppositeCol < BOARD_SIZE) {

        const adjacentPiece = newBoard[adjacentRow][adjacentCol];
        const oppositePiece = newBoard[oppositeRow][oppositeCol];
        const currentPiece = newBoard[row][col];

        // Captura básica: pieza enemiga entre dos piezas aliadas
        if (adjacentPiece !== EMPTY && adjacentPiece !== KING &&
            ((currentPiece === ATTACKER && adjacentPiece === DEFENDER && oppositePiece === ATTACKER) ||
             (currentPiece === DEFENDER && adjacentPiece === ATTACKER && oppositePiece === DEFENDER) ||
             (currentPiece === KING && adjacentPiece === ATTACKER && oppositePiece === DEFENDER))) {
          captures.push([adjacentRow, adjacentCol]);
        }

        // Captura especial contra el trono o esquinas
        if (adjacentPiece !== EMPTY && adjacentPiece !== KING &&
            (isThrone(oppositeRow, oppositeCol) || isCorner(oppositeRow, oppositeCol))) {
          if ((currentPiece === ATTACKER && adjacentPiece === DEFENDER) ||
              (currentPiece === DEFENDER && adjacentPiece === ATTACKER)) {
            captures.push([adjacentRow, adjacentCol]);
          }
        }
      }
    });

    return captures;
  };

  const checkKingCapture = (newBoard) => {
    // Encontrar la posición del rey
    let kingRow = -1, kingCol = -1;
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (newBoard[i][j] === KING) {
          kingRow = i;
          kingCol = j;
          break;
        }
      }
      if (kingRow !== -1) break;
    }

    if (kingRow === -1) return false; // Rey no encontrado

    // El rey debe estar rodeado por atacantes en las 4 direcciones
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let surroundedCount = 0;

    directions.forEach(([dRow, dCol]) => {
      const adjRow = kingRow + dRow;
      const adjCol = kingCol + dCol;

      if (adjRow < 0 || adjRow >= BOARD_SIZE || adjCol < 0 || adjCol >= BOARD_SIZE) {
        // Borde del tablero cuenta como "rodeado" si no es esquina
        if (!isCorner(kingRow, kingCol)) {
          surroundedCount++;
        }
      } else if (newBoard[adjRow][adjCol] === ATTACKER) {
        surroundedCount++;
      } else if (isThrone(adjRow, adjCol) && newBoard[adjRow][adjCol] === EMPTY) {
        // El trono vacío puede ayudar a capturar al rey
        surroundedCount++;
      }
    });

    return surroundedCount >= 4;
  };

  const checkWinConditions = (newBoard) => {
    // Victoria del rey: llegar a una esquina
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (newBoard[i][j] === KING && isCorner(i, j)) {
          return { winner: 'defender', reason: 'El Rey ha escapado a una esquina!' };
        }
      }
    }

    // Victoria de los atacantes: capturar al rey
    if (checkKingCapture(newBoard)) {
      return { winner: 'attacker', reason: 'El Rey ha sido capturado!' };
    }

    return null;
  };

  const handleCellClick = (row, col) => {
    if (gameStatus !== 'playing') return;

    const piece = board[row][col];

    if (selectedPiece) {
      // Intentar mover
      if (validMoves.some(([r, c]) => r === row && c === col)) {
        const newBoard = board.map(row => [...row]);
        const [fromRow, fromCol] = selectedPiece;

        // Realizar el movimiento
        newBoard[row][col] = newBoard[fromRow][fromCol];
        newBoard[fromRow][fromCol] = EMPTY;

        // Verificar capturas
        const captures = checkCapture(row, col, newBoard);
        captures.forEach(([captureRow, captureCol]) => {
          newBoard[captureRow][captureCol] = EMPTY;
        });

        // Verificar condiciones de victoria
        const winResult = checkWinConditions(newBoard);
        if (winResult) {
          setGameStatus('finished');
          setWinner(winResult);
        }

        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === DEFENDER ? ATTACKER : DEFENDER);
        setSelectedPiece(null);
        setValidMoves([]);
      } else {
        // Seleccionar nueva pieza
        if ((currentPlayer === DEFENDER && (piece === DEFENDER || piece === KING)) ||
            (currentPlayer === ATTACKER && piece === ATTACKER)) {
          setSelectedPiece([row, col]);
          setValidMoves(getValidMoves(row, col));
        } else {
          setSelectedPiece(null);
          setValidMoves([]);
        }
      }
    } else {
      // Seleccionar pieza
      if ((currentPlayer === DEFENDER && (piece === DEFENDER || piece === KING)) ||
          (currentPlayer === ATTACKER && piece === ATTACKER)) {
        setSelectedPiece([row, col]);
        setValidMoves(getValidMoves(row, col));
      }
    }
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setCurrentPlayer(DEFENDER);
    setSelectedPiece(null);
    setValidMoves([]);
    setGameStatus('playing');
    setWinner(null);
  };

  const getPieceIcon = (piece) => {
    switch (piece) {
      case KING: return <Crown className="king-icon" style={{color: '#ffd700', fontSize: '28px'}} />;
      case DEFENDER: return <Shield className="defender-icon" style={{color: '#22c55e', fontSize: '24px'}} />;
      case ATTACKER: return <Swords className="attacker-icon" style={{color: '#8b5cf6', fontSize: '24px'}} />;
      default: return null;
    }
  };

  const getCellClass = (row, col) => {
    let classes = ['cell'];

    // Color de fondo base
    if (isThrone(row, col)) {
      classes.push('cell-throne');
    } else if (isCorner(row, col)) {
      classes.push('cell-corner');
    } else {
      classes.push((row + col) % 2 === 0 ? 'cell-normal-light' : 'cell-normal-dark');
    }

    // Highlighting
    if (selectedPiece && selectedPiece[0] === row && selectedPiece[1] === col) {
      classes.push('cell-selected');
    }

    if (validMoves.some(([r, c]) => r === row && c === col)) {
      classes.push('cell-valid-move');
    }

    return classes.join(' ');
  };

  return (
    <div className="game-container">
      <div className="game-title">
        <h1>🛡️ HNEFATAFL 🗡️</h1>
        <p>El Juego de Mesa Vikingo</p>
      </div>

      <div className="game-layout">
        {/* Tablero */}
        <div className="board-container">
          <div className="board">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellClass(rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {getPieceIcon(cell)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel de información */}
        <div className="info-panel">
          <h2>Estado del Juego</h2>

          {gameStatus === 'playing' && (
            <div className="current-player">
              Turno actual:
              <span className={currentPlayer === DEFENDER ? 'player-defender' : 'player-attacker'}>
                {currentPlayer === DEFENDER ? '🛡️ Defensores' : '⚔️ Atacantes'}
              </span>
            </div>
          )}

          {gameStatus === 'finished' && winner && (
            <div className="victory-message">
              <h3>¡Juego Terminado!</h3>
              <p>
                Victoria de los {winner.winner === 'defender' ? 'Defensores' : 'Atacantes'}!
              </p>
              <p className="victory-reason">{winner.reason}</p>
            </div>
          )}

          <div className="rules-section">
            <h3>Reglas Básicas:</h3>
            <ul className="rules-list">
              <li>🛡️ <strong>Defensores:</strong> Protege al rey y llévalo a una esquina</li>
              <li>⚔️ <strong>Atacantes:</strong> Rodea y captura al rey</li>
              <li>📏 Las piezas se mueven como la torre en ajedrez</li>
              <li>🎯 Captura rodeando una pieza enemiga</li>
              <li>👑 Solo el rey puede ocupar esquinas y el trono</li>
              <li>🏆 El rey gana llegando a una esquina</li>
            </ul>
          </div>

          <div className="piece-legend">
            <div className="legend-item">
              <Crown className="legend-icon" style={{color: '#ffd700'}} />
              <span>Rey (Defensores)</span>
            </div>
            <div className="legend-item">
              <Shield className="legend-icon" style={{color: '#0047ab'}} />
              <span>Defensor</span>
            </div>
            <div className="legend-item">
              <Swords className="legend-icon" style={{color: '#cc0000'}} />
              <span>Atacante</span>
            </div>
          </div>

          <button onClick={resetGame} className="reset-button">
            🔄 Nueva Partida
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hnefatafl;

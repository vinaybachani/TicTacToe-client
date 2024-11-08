import React, { useEffect, useState } from 'react'
import './App.css'
import Square from './Square/Square';
import { io } from 'socket.io-client'
import Swal from 'sweetalert2';
import { data } from 'autoprefixer';

const renderFrom = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]
const App = () => {
  const [gameState, setGameState] = useState(renderFrom);
  const [currentPlayer, setCurrentPlayer] = useState('circle');
  const [finishedState, setFinishedState] = useState(false);
  const [finishedArrayState, setFinishedArrayState] = useState([]);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [playingAs, setPlayingAs] = useState(null);

  const checkOnWinner = () => {
    //row dynamic if any of all the row matches
    for (let row = 0; row < gameState.length; row++) {
      if (gameState[row][0] === gameState[row][1] && gameState[row][1] === gameState[row][2]) {
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2])
        return gameState[row][0]
      }
    }
    //column dynamic if any of all the column matches
    for (let col = 0; col < gameState.length; col++) {
      if (gameState[0][col] === gameState[1][col] && gameState[1][col] === gameState[2][col]) {
        setFinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col])
        return gameState[0][col]
      }
    }

    //left diagonal
    if (gameState[0][0] === gameState[1][1] && gameState[1][1] === gameState[2][2]) {
      setFinishedArrayState([0, 4, 8]);
      return gameState[0][0];
    }

    //right diagonal
    if (gameState[0][2] === gameState[1][1] && gameState[1][1] === gameState[2][0]) {
      setFinishedArrayState([2, 4, 6]);
      return gameState[0][2];
    }

    const isMatchDraw = gameState.flat().every((e) => {
      if (e === 'circle' || e === 'cross') {
        return true;
      }
    })

    if (isMatchDraw) return 'draw';

    return null;
  }

  useEffect(() => {
    let winner = checkOnWinner();
    if (winner) {
      setFinishedState(winner);
    }
  }, [gameState]);

  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter your name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "Name can't be empty"
        }
      }
    })
    return result;
  }

  socket?.on('opponentLeftMatch', () => {
    setFinishedState('opponentLeftMatch');
  })

  socket?.on('playerMoveFromServer', (data) => {
    const id = data.state.id;
    setGameState((prevState) => {
      let newState = [...prevState];
      const rowIndex = Math.floor(id / 3);
      const colIndex = id % 3;
      newState[rowIndex][colIndex] = data.state.sign;
      return newState;
    });
    setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
  })

  socket?.on('connect', () => {
    setPlayOnline(true);
  });

  socket?.on('OpponentNotFound', () => {
    setOpponentName(false);
  });

  socket?.on('OpponentFound', (data) => {
    setPlayingAs(data.playingAs);
    setOpponentName(data.opponentName);
  });

  const playOnlineClick = async () => {

    const result = await takePlayerName();
    if (!result.isConfirmed) return;

    const userName = result.value;
    setPlayerName(userName);
    const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
      autoConnect: true
    });
    newSocket?.emit("request_to_play", {
      playerName: userName
    })
    setSocket(newSocket);
  }

  if (!playOnline) {
    return <div className='flex justify-center items-center h-[90vh] flex-col gap-2 text-gray-300 font-sans'>
      <button className='bg-[#E4CA56] text-[60px] rounded-lg outline-none cursor-pointer text-black px-[10px] py-[6px] border-0 font-bold font-sans' onClick={playOnlineClick}>Play Online</button>
      <span>Note: To play with friends, paste the above URL in different tab and wait to be matched</span>
    </div>
  }

  if (playOnline && !opponentName) {
    return (
      <div className='flex items-center justify-center w-full h-[90vh] text-[44px]'>
        <p>Waiting for opponent...</p>
      </div>
    )
  }
  return (
    <div className='flex items-center justify-center flex-col h-screen'>
      <div>
        {/* section for player names */}
        <div className='flex items-center justify-between'>
          <div className={`left ${currentPlayer === playingAs ? 'current-move-' + currentPlayer : ''} h-[30px] w-[120px] bg-primary rounded-bl-[50px] rounded-tr-[50px] text-center font-sans text-xl pb-[7px]`}>{playerName}</div>
          <div className={`right ${currentPlayer !== playingAs ? 'current-move-' + currentPlayer : ''} h-[30px] w-[120px] bg-primary rounded-bl-[50px] rounded-tr-[50px] text-center font-sans text-xl pb-[7px]`}>{opponentName}</div>
        </div>
        <h1 className='bg-primary px-[20px] py-[5px] rounded-md text-3xl text-center font-bold mt-4'>Tic Tac Toe</h1>
        {/* section for squares */}
        <div className='mt-4 grid grid-cols-3 gap-[10px]'>
          {
            gameState.map((arr, rowIndex) => (
              arr.map((e, colIndex) => (
                <Square key={rowIndex * 3 + colIndex} id={rowIndex * 3 + colIndex} setGameState={setGameState} currentPlayer={currentPlayer} setCurrentPlayer={setCurrentPlayer} finishedState={finishedState} finishedArrayState={finishedArrayState} socket={socket} gameState={gameState} currentElement={e} playingAs={playingAs} />
              ))
            ))
          }
        </div>
      </div>
      {
        finishedState && finishedState !== 'opponentLeftMatch' && finishedState !== 'draw' &&
        <h3 className='text-center font-sans text-2xl mt-5'>{finishedState === playingAs ? "You" : finishedState} won the game</h3>
      }
      {
        finishedState && finishedState !== 'opponentLeftMatch' && finishedState === 'draw' &&
        <h3 className='text-center font-sans text-2xl mt-5'>Match is Draw</h3>
      }
      {
        !finishedState && opponentName && (
          <h3 className='text-center font-sans text-2xl mt-5'>You are playing against {opponentName}</h3>
        )
      }
      {
        finishedState && finishedState === 'opponentLeftMatch' && (
          <h3 className='text-center font-sans text-2xl mt-5'>You won the match, Opponent has left</h3>
        )
      }
    </div>
  )
}

export default App

document.addEventListener('DOMContentLoaded', () => {
  const userGrid = document.querySelector('.grid-user')
  const computerGrid = document.querySelector('.grid-computer')
  const displayGrid = document.querySelector('.grid-display')
  const ships = document.querySelectorAll('.ship')
  const destroyer = document.querySelector('.destroyer-container')
  const submarine = document.querySelector('.submarine-container')
  const cruiser = document.querySelector('.cruiser-container')
  const battleship = document.querySelector('.battleship-container')
  const carrier = document.querySelector('.carrier-container')
  const startButton = document.querySelector('#start')
  const rotateButton = document.querySelector('#rotate')
  const turnDisplay = document.querySelector('#whose-go')
  const infoDisplay = document.querySelector('#info')
  const setupButtons = document.getElementById('setup-buttons')
  const userSquares = []
  const computerSquares = []
  let isHorizontal = true
  let isGameOver = false
  let currentPlayer = 'user'
  const width = 10
  let playerNum = 0
  let ready = false
  let enemyReady = false
  let allShipsPlaced = false
  let shotFired = -1

  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('username') || 'Player';

  //Ships
  const shipArray = [
    {
      name: 'destroyer',
      directions: [
        [0, 1],
        [0, width]
      ]
    },
    {
      name: 'submarine',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'cruiser',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'battleship',
      directions: [
        [0, 1, 2, 3],
        [0, width, width * 2, width * 3]
      ]
    },
    {
      name: 'carrier',
      directions: [
        [0, 1, 2, 3, 4],
        [0, width, width * 2, width * 3, width * 4]
      ]
    },
  ]

  createBoard(userGrid, userSquares)
  createBoard(computerGrid, computerSquares)

  // Multiplayer Mode Only
  startMultiPlayer()

  // Multiplayer
  function startMultiPlayer() {
    const socket = io({
        query: { username: username }
    });

    // Update the player's own name in the HTML
    socket.on('player-number', ({ index, username: playerUsername }) => {
        if (index === -1) {
            infoDisplay.innerHTML = "Sorry, the server is full"
        } else {
            playerNum = parseInt(index)
            if (playerNum === 1) currentPlayer = "enemy"

            console.log(`Assigned as Player ${playerNum + 1}: ${playerUsername}`)

            // Set own username
            if (playerNum === 0) {
                document.getElementById('player1-name').textContent = playerUsername
            } else if (playerNum === 1) {
                document.getElementById('player2-name').textContent = playerUsername
            }

            // Get other player status
            socket.emit('check-players')
        }
    })

    // Another player has connected or disconnected
    socket.on('player-connection', ({ index, username: otherUsername }) => {
        console.log(`Player ${index + 1} (${otherUsername}) has connected or disconnected`)
        updatePlayerName(index, otherUsername)
        toggleConnectionStatus(index)
    })

    // On enemy ready
    socket.on('enemy-ready', ({ index, username: enemyUsername }) => {
        enemyReady = true
        playerReady(index)
        if (ready) {
            playGameMulti(socket)
            setupButtons.style.display = 'none'
        }
    })

    // Check player status
    socket.on('check-players', players => {
        players.forEach((p, i) => {
            if (p.connected) {
                updatePlayerName(i, p.username)
                playerConnectedOrDisconnected(i)
            }
            if (p.ready) {
                playerReady(i)
                if (i !== playerNum) enemyReady = true
            }
        })
    })

    // On Timeout
    socket.on('timeout', () => {
        infoDisplay.innerHTML = 'You have reached the 10 minute limit'
    })

    // Ready button click
    startButton.addEventListener('click', () => {
        if (allShipsPlaced) playGameMulti(socket)
        else turnDisplay.innerHTML = "Please place all ships"
    })

    // Setup event listeners for firing
    computerSquares.forEach(square => {
        square.addEventListener('click', () => {
            if (square.classList.contains('boom') || square.classList.contains('miss')) {
                if (turnDisplay.innerHTML != "Enemy's Go")
                    turnDisplay.innerHTML = "You've already shot here! Try a different square.";
                return;
            }

            if (currentPlayer === 'user' && ready && enemyReady) {
                shotFired = square.dataset.id;
                socket.emit('fire', shotFired);
            }
        });
    });

    // On Fire Received
    socket.on('fire', ({ id, attacker }) => {
        enemyGo(id)
        const square = userSquares[id]
        socket.emit('fire-reply', square.classList)
        playGameMulti(socket)
    })

    // On Fire Reply Received
    socket.on('fire-reply', classList => {
        revealSquare(classList)
        playGameMulti(socket)
    })

    function updatePlayerName(index, name) {
        if (index === 0) {
            document.getElementById('player1-name').textContent = name
        } else if (index === 1) {
            document.getElementById('player2-name').textContent = name
        }
    }

    function toggleConnectionStatus(index) {
        let player = `.p${parseInt(index) + 1}`
        document.querySelector(`${player} .connected`).classList.toggle('active')
        if (parseInt(index) === playerNum) {
            document.querySelector(player).style.fontWeight = 'bold'
        }
    }

    function playerConnectedOrDisconnected(num) {
        toggleConnectionStatus(num)
    }
}

  // Single Player
  /*function startSinglePlayer() {
    generate(shipArray[0])
    generate(shipArray[1])
    generate(shipArray[2])
    generate(shipArray[3])
    generate(shipArray[4])

    startButton.addEventListener('click', () => {
      setupButtons.style.display = 'none'
      playGameSingle()
    })
  }*/

  //Create Board
  function createBoard(grid, squares) {
    for (let i = 0; i < width * width; i++) {
      const square = document.createElement('div')
      square.dataset.id = i
      grid.appendChild(square)
      squares.push(square)
    }
  }

  //Draw the computers ships in random locations
  /*function generate(ship) {
    let randomDirection = Math.floor(Math.random() * ship.directions.length)
    let current = ship.directions[randomDirection]
    if (randomDirection === 0) direction = 1
    if (randomDirection === 1) direction = 10
    let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction)))

    const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'))
    const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1)
    const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0)

    if (!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name))

    else generate(ship)
  }*/
  

  //Rotate the ships
  function rotate() {
    if (isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = false
      // console.log(isHorizontal)
      return
    }
    if (!isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = true
      // console.log(isHorizontal)
      return
    }
  }
  rotateButton.addEventListener('click', rotate)

  //move around user ship
  ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
  userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
  userSquares.forEach(square => square.addEventListener('dragover', dragOver))
  userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
  userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
  userSquares.forEach(square => square.addEventListener('drop', dragDrop))
  userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

  let selectedShipNameWithIndex
  let draggedShip
  let draggedShipLength

  ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
    selectedShipNameWithIndex = e.target.id
    // console.log(selectedShipNameWithIndex)
  }))

  function dragStart() {
    draggedShip = this
    draggedShipLength = this.childNodes.length
    // console.log(draggedShip)
  }

  function dragOver(e) {
    e.preventDefault()
  }

  function dragEnter(e) {
    e.preventDefault()
  }

  function dragLeave() {
    // console.log('drag leave')
  }
  function dragDrop() {
    let shipNameWithLastId = draggedShip.lastChild.id;
    let shipClass = shipNameWithLastId.slice(0, -2);
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
    let shipLastId = lastShipIndex + parseInt(this.dataset.id);
  
    const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93];
    const notAllowedVertical = [103,102,101,100,99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60];
  
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex);
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex);
  
    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));
    shipLastId = shipLastId - selectedShipIndex;
  
    // Check if the ship placement is valid
    const targetSquares = [];
    for (let i = 0; i < draggedShipLength; i++) {
      if (isHorizontal) {
        targetSquares.push(userSquares[parseInt(this.dataset.id) - selectedShipIndex + i]);
      } else {
        targetSquares.push(userSquares[parseInt(this.dataset.id) - selectedShipIndex + width * i]);
      }
    }
  
    const isTaken = targetSquares.some(square => square.classList.contains('taken'));
  
    if (isTaken) {
      turnDisplay.innerHTML = 'Invalid move: The ship overlaps another!';
      return;
    }
  
    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
      for (let i = 0; i < draggedShipLength; i++) {
        let directionClass;
        if (i === 0) directionClass = 'start';
        if (i === draggedShipLength - 1) directionClass = 'end';
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add(
          'taken',
          'horizontal',
          directionClass,
          shipClass
        );
      }
    } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
      for (let i = 0; i < draggedShipLength; i++) {
        let directionClass;
        if (i === 0) directionClass = 'start';
        if (i === draggedShipLength - 1) directionClass = 'end';
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + width * i].classList.add(
          'taken',
          'vertical',
          directionClass,
          shipClass
        );
      }
    } else {
      turnDisplay.innerHTML = 'Invalid move: Ship out of bounds!';
      return;
    }
  
    displayGrid.removeChild(draggedShip);
    if (!displayGrid.querySelector('.ship')) allShipsPlaced = true;
  }
  

  function dragEnd() {
    // console.log('dragend')
  }

  function playGameMulti(socket) {
    setupButtons.style.display = 'none'
    if (isGameOver) return
    if (!ready) {
        socket.emit('player-ready')
        ready = true
        playerReady(playerNum)
    }

    if (enemyReady) {
        if (currentPlayer === 'user') {
            turnDisplay.innerHTML = 'Your Go'
        }
        if (currentPlayer === 'enemy') {
            turnDisplay.innerHTML = "Enemy's Go"
        }
    }
}

function playerReady(num) {
  let player = `.p${parseInt(num) + 1}`
  document.querySelector(`${player} .ready`).classList.toggle('active')
}

  // Game Logic for Single Player
  /*function playGameSingle() {
    if (isGameOver) return;
  
    if (currentPlayer === 'user') {
      turnDisplay.innerHTML = 'Your Go';
      computerSquares.forEach(square =>
        square.addEventListener('click', function handleShot(e) {
          if (square.classList.contains('boom') || square.classList.contains('miss')) {
            // Notify the player to shoot somewhere else
            if (turnDisplay.innerHTML != "Computer's Go") {
              turnDisplay.innerHTML = "You've already shot here! Try a different square.";
            }

            return;
          }
          
          shotFired = square.dataset.id;
          revealSquare(square.classList);
        })
      );
    }
  
    if (currentPlayer === 'enemy') {
      turnDisplay.innerHTML = "Computer's Go";
      setTimeout(enemyGo, 1000);
    }
  }*/
  

  let destroyerCount = 0
  let submarineCount = 0
  let cruiserCount = 0
  let battleshipCount = 0
  let carrierCount = 0

  function revealSquare(classList) {
    const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
    const obj = Object.values(classList)
    if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
      if (obj.includes('destroyer')) destroyerCount++
      if (obj.includes('submarine')) submarineCount++
      if (obj.includes('cruiser')) cruiserCount++
      if (obj.includes('battleship')) battleshipCount++
      if (obj.includes('carrier')) carrierCount++
    }

    if (obj.includes('taken')) {
      enemySquare.classList.add('boom');
      // Stay on user's turn if they hit
      checkForWins();
      if (!isGameOver) {
        turnDisplay.innerHTML = "Nice shot! Go again.";
        return;
      }
    } else {
      enemySquare.classList.add('miss');
      // Switch to enemy turn only if the shot is a miss
      currentPlayer = 'enemy';
      //if (gameMode === 'singlePlayer') playGameSingle();
    }
    /*
    if (obj.includes('taken')) {
      enemySquare.classList.add('boom')
    } else {
      enemySquare.classList.add('miss')
    }
    checkForWins()
    currentPlayer = 'enemy'
    if(gameMode === 'singlePlayer') playGameSingle()*/
  }

  let cpuDestroyerCount = 0
  let cpuSubmarineCount = 0
  let cpuCruiserCount = 0
  let cpuBattleshipCount = 0
  let cpuCarrierCount = 0


  function enemyGo(square) {
    if (gameMode === 'singlePlayer') square = Math.floor(Math.random() * userSquares.length)
    if (!userSquares[square].classList.contains('boom')) {
      const hit = userSquares[square].classList.contains('taken')
      userSquares[square].classList.add(hit ? 'boom' : 'miss')
      if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++
      if (userSquares[square].classList.contains('submarine')) cpuSubmarineCount++
      if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++
      if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++
      if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++
      checkForWins()
    } else if (gameMode === 'singlePlayer') enemyGo()
    currentPlayer = 'user'
    turnDisplay.innerHTML = 'Your Go'
  }


  function checkForWins() {
    let enemy = 'computer'
    if(gameMode === 'multiPlayer') enemy = 'enemy'
  // Player ship status updates
  if (destroyerCount === 2) {
    document.getElementById('enemy-destroyer-status').checked = true;
    destroyerCount = 10; // Mark as processed
    infoDisplay.innerHTML = `You sunk the ${enemy}'s destroyer`;
  }
  if (submarineCount === 3) {
    document.getElementById('enemy-submarine-status').checked = true;
    submarineCount = 10;
    infoDisplay.innerHTML = `You sunk the ${enemy}'s submarine`;
  }
  if (cruiserCount === 3) {
    document.getElementById('enemy-cruiser-status').checked = true;
    cruiserCount = 10;
    infoDisplay.innerHTML = `You sunk the ${enemy}'s cruiser`;
  }
  if (battleshipCount === 4) {
    document.getElementById('enemy-battleship-status').checked = true;
    battleshipCount = 10;
    infoDisplay.innerHTML = `You sunk the ${enemy}'s battleship`;
  }
  if (carrierCount === 5) {
    document.getElementById('enemy-carrier-status').checked = true;
    carrierCount = 10;
    infoDisplay.innerHTML = `You sunk the ${enemy}'s carrier`;
  }

  // Enemy ship status updates
  if (cpuDestroyerCount === 2) {
    document.getElementById('destroyer-status').checked = true;
    cpuDestroyerCount = 10;
    infoDisplay.innerHTML = `${enemy} sunk your destroyer`;
  }
  if (cpuSubmarineCount === 3) {
    document.getElementById('submarine-status').checked = true;
    cpuSubmarineCount = 10;
    infoDisplay.innerHTML = `${enemy} sunk your submarine`;
  }
  if (cpuCruiserCount === 3) {
    document.getElementById('cruiser-status').checked = true;
    cpuCruiserCount = 10;
    infoDisplay.innerHTML = `${enemy} sunk your cruiser`;
  }
  if (cpuBattleshipCount === 4) {
    document.getElementById('battleship-status').checked = true;
    cpuBattleshipCount = 10;
    infoDisplay.innerHTML = `${enemy} sunk your battleship`;
  }
  if (cpuCarrierCount === 5) {
    document.getElementById('carrier-status').checked = true;
    cpuCarrierCount = 10;
    infoDisplay.innerHTML = `${enemy} sunk your carrier`;
  }

  if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
    infoDisplay.innerHTML = "YOU WIN";
    gameOver();
    return; // Stop further processing
}
if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 50) {
    infoDisplay.innerHTML = `${enemy.toUpperCase()} WINS`;
    gameOver();
    return; // Stop further processing
}
  }

  function gameOver() {
    isGameOver = true;

    // Remove firing event listeners
    computerSquares.forEach(square => {
        square.replaceWith(square.cloneNode(true)); // Clone to remove all events
    });

    // Disable drag and drop for ships
    ships.forEach(ship => {
        ship.removeEventListener('dragstart', dragStart);
        ship.removeEventListener('dragend', dragEnd);
    });

    userSquares.forEach(square => {
        square.replaceWith(square.cloneNode(true)); // Clone to remove all events
    });

    startButton.removeEventListener('click', playGameSingle);
    rotateButton.removeEventListener('click', rotate);

    // Display final message
    infoDisplay.innerHTML += ' Game Over!';
  }
})

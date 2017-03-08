pragma solidity ^0.4.6;

contract TicTacToePonzi {

    address owner;

    struct Player {
        address addr;
        uint position;       // 0 for Payee, 1 for Challenger, and 2 for Queue
        uint value;          // Amount of money in pot from winnings. Becomes 0 after witdrawal
        uint deposit;        // If doesn't meet threshold, money is stored in deposit
        uint totalOwned;     // Value + Deposit + msg.value (investment) . How much money owned in the contract
        bool canWithdraw;       // True if someone after you has paid.
        bool playing;           // Currently in a game
    }

    Player[] players;           // List of players waiting to pay
    Player[2] currentPlayers;    // Current Players
    Player[] queue;             // Queue of players waiting to play

    bool inGame;                // Is there a game going on?
    uint lastMoveTime;           // when the last move was performed
    Player playerTurn;
    Player lastPlayer;          // who the last move was performed by

    //Maybe variable for board state?
    uint[] board = new uint[](9);
    uint numTurns = 0;
    //maybe game status struct

    uint buyInThreshold = 1; // Amount needed to buy in. Defaulted to .1 ether. ***Can also change to owner choosing***
    uint potBalance;         // Amount of money from deposits and payments


    function join() payable {
        uint pos;
        if (players.length == 0 || players.length == 1) {
            pos = players.length;
        }
        else if (players.length > 1) {
            pos = 2;
        }

        players.push(Player(msg.sender, pos, 0, 0, msg.value, false, false));

        if (pos == 0 || pos == 1) {
            currentPlayers[pos] = players[getPlayerIndex(msg.sender)];          
        }
        else {
            queue.push(players[getPlayerIndex(msg.sender)]);               
        }

    }

    /*
     * Returns the queue position for the querier.
     */
    function getQueuePos() public returns (int) {
        Player temp = players[getPlayerIndex(msg.sender)];
        uint i = 0;

        for (i = 0; i < queue.length; i++) {
            if (msg.sender == players[i].addr) {
               return (int) (i + 1);
            }
        }

        return -1;      // if the queue is empty
    }


    /*
     * Attempt to end the game: will end if more than an hour has passed since the last move.
     */
    function checkTimeLimit() public returns (string) {
        if (block.timestamp > lastMoveTime + 3600) {       // if the current block is an hour past the lastMove
            // refund the player who played last

            if (currentPlayer() == 1){
                challengerWins();
            }
            else if(currentPlayer() == 2){
                payeeWinsOrDraws();
            }

            return "It's been over an hour since you made a move. You have won.";
        }
        return "It hasn't been an hour";
    }

    /*
     * Move everyone up in the queue.
     */
    function updateQueue(Player[] arr, uint loc) private {
        if (arr.length <= 0 || loc >=  arr.length) {
            return;
        }
        for (uint i = loc; i < arr.length -1; i++) {
            arr[i] = arr[i+1];
        }
        delete arr[i+1];
    }

    /*
     * Returns the index of the given player.
     */
    function getPlayerIndex(address addr) private returns (uint) {
        for (uint i = 0; i < players.length; i++) {
            if (players[i].addr == addr) {
                return i;
            }
        }
    }

    /*
     * Returns the minimum amount needed to buy in to the game.
     */
    function getBuyInThreshold() public returns (uint) {
        return buyInThreshold;
    }

    /*
     * Start the game.
     */
    function startGame(uint money) public {

        // Insufficient funds

        //check if 2 players are in gameStatus and both are not in a game already and no other game is going on
        if(inGame || currentPlayers.length != 2 || currentPlayers[0].addr == currentPlayers[1].addr || currentPlayers[0].playing || currentPlayers[1].playing) {
            throw;        
        }

        Player player = players[getPlayerIndex(msg.sender)];
        if(player.position != 1) {
            throw;      
        }

        if(player.totalOwned < money) {
            player.deposit += player.totalOwned;
            player.totalOwned = 0;
        }

        if(money * 10 / 11 < buyInThreshold) {
            player.deposit += money;
            return;
        }

        else if(money * 10 / 11 >= buyInThreshold) {  //Challenger commits 1.1x buyIn by default. 

            // Start the game.
            inGame = true;
            lastMoveTime = block.timestamp;     
            player.totalOwned -= money;

            currentPlayers[0].playing = true;
            currentPlayers[1].playing = true;

            potBalance += money;
            buyInThreshold = money;

            playerTurn = currentPlayers[1];

            

        }

        // Game ends: Queue updated, game statuses updated, current players updated. All called in win functions

    }

    function isThereAGame() public returns (bool){
        return inGame;
    }

    function currentPlayerTurn() public returns (string){
        if(playerTurn.addr == currentPlayers[0].addr){
            return "Payee's turn";
        }
        else{
            return "Challengers turn";
        }
    }

    /*
     * Allows player to withdraw the money associated with their account (original input & winnings).
     */
    function withdrawFunds() public {
        Player player = players[getPlayerIndex(msg.sender)];
        if(player.addr == msg.sender) {
            player.totalOwned += player.deposit;
            player.totalOwned += player.value;
            player.deposit = 0;
            player.value = 0;
            player.canWithdraw = false;

        }
    }

    /*
     * Allows you to leave the game only if player is not in a game and there is not a payee.
     */
    function leaveGame() public {

        Player player = players[getPlayerIndex(msg.sender)];
        if(player.playing) {
            return;
        }

        if(player.position == 0 && currentPlayers[0].addr == player.addr) {  //payees cant leave
            return;
        }
        else if(player.position == 1 && currentPlayers[1].addr == player.addr) {

            if(queue.length == 0) {
                delete currentPlayers[1];
            }
            else{
                currentPlayers[1] = queue[0];
                updateQueue(queue, 0);
            }

        }
        else if (player.position == 2) {
            int temp = getQueuePos();
            updateQueue(queue, (uint) (temp));
        }

        //Send all funds back to wallet somehow
        if(player.canWithdraw){
            if(!msg.sender.send(player.totalOwned)){
                throw;
            }
        }

    }

    /*
     * The case where the payee wins the pot, or there is a draw.
     * The challenger becomes the payee, with the wager equal to how much they paid.
     */
    function payeeWinsOrDraws() private {
        currentPlayers[0].value = buyInThreshold;
        currentPlayers[1].value = buyInThreshold;

        inGame = false;
        numTurns = 0;

        currentPlayers[0].playing = false;
        currentPlayers[1].playing = false;

        currentPlayers[0].position = 2;
        currentPlayers[1].position = 0;

        currentPlayers[0].canWithdraw = true;
        currentPlayers[0] = currentPlayers[1];

        if (queue.length == 0) {
            delete currentPlayers[1];
        }
        else {
            currentPlayers[1] = queue[0];
            currentPlayers[1].position = 1;
            updateQueue(queue, 0);
        }
        clearBoard();

    }

    /*
     * The case where the challenger wins the pot.
     * Payee values remain the same.
     */
    function challengerWins() private {
        currentPlayers[1].value = buyInThreshold;

        inGame = false;
        numTurns = 0;

        currentPlayers[0].playing = false;
        currentPlayers[1].playing = false;

        currentPlayers[0].position = 2;
        currentPlayers[1].position = 0;

        currentPlayers[0].canWithdraw = true;
        currentPlayers[0] = currentPlayers[1];

        if (queue.length == 0) {
            delete currentPlayers[1];
        }
        else {
            currentPlayers[1] = queue[0];
            currentPlayers[1].position = 1;
            updateQueue(queue, 0);
        }

        clearBoard();
    }


    function makeMove(uint row, uint col) returns (string, string, string) {
        //if (!inGame) throw; //no game going on

        if (!inGame) throw; //no game going on
        uint place = getTile(row,col);
        uint curr = currentPlayer();
        if (curr == 0 ||  players[getPlayerIndex(msg.sender)].addr != currentPlayers[curr].addr) throw; //not payee or challenger
        if (players[getPlayerIndex(msg.sender)].addr != playerTurn.addr) throw; //not the right player

        //if (players[getPlayerIndex(msg.sender)].addr != currentPlayers[curr].addr) throw; //not payee or challenger
        
        if (block.timestamp > lastMoveTime + 3600) {       // if the current block is an hour past the lastMove
            // refund the player who played last

            if (currentPlayer() == 1){
                challengerWins();
            }
            else if(currentPlayer() == 2){
                payeeWinsOrDraws();
            }
        }


        if(board[place] == 0) {
            board[place] = curr;
        } else throw; //tile already occupied
        if(curr == 1){
            playerTurn = currentPlayers[1];
        }
        else{
            playerTurn = currentPlayers[0];
        }
        numTurns++;
        lastMoveTime = block.timestamp;  


        return getCurrentState();  
    }

    function currentPlayer() private returns (uint) {
        if (playerTurn.addr == currentPlayers[0].addr) return 1;
        if (playerTurn.addr == currentPlayers[1].addr) return 2;
        else return 0;
    }

    function getTile(uint row, uint col) private returns (uint) {
        if (row == 1 && col == 1) return 0;
        if (row == 1 && col == 2) return 1;
        if (row == 1 && col == 3) return 2;
        if (row == 2 && col == 1) return 3;
        if (row == 2 && col == 2) return 4;
        if (row == 2 && col == 3) return 5;
        if (row == 3 && col == 1) return 6;
        if (row == 3 && col == 2) return 7;
        if (row == 3 && col == 3) return 8;
        else throw; //not on the board
    }
    
    uint[][]  tests = [[0,1,2],[3,4,5],[6,7,8], [0,3,6],[1,4,7],[2,5,8], [0,4,8],[2,4,6]  ];
    function checkWinner() constant returns (uint) {
        for (uint i = 0; i < 8; i++) {
            uint[] memory b = tests[i];
            if(board[b[0]] != 0 && board[b[0]] == board[b[1]] && board[b[0]] == board[b[2]]) return board[b[0]];
        }
        return 0;
    }

    function getCurrentState() constant returns(string, string, string) {
        string memory text = "No winner yet";
        string memory whoseTurn;
        uint winner = checkWinner();
        if(numTurns == 9){
            text = "Game ended in a draw";
            payeeWinsOrDraws();
        }
        if (winner == 1) {
            text = "Winner is Payee (O)";
            payeeWinsOrDraws();
        }
        if (winner == 2) {
            text = "Winner is Challenger (X)";
            challengerWins();
        } 

        bytes memory out = new bytes(11);
        byte[] memory signs = new byte[](3);
        signs[0] = "-";
        signs[1] = "O";
        signs[2] = "X";
        bytes(out)[3] = "|";
        bytes(out)[7] = "|";
        
        for(uint i = 0; i < 9; i++) {
            bytes(out)[i + i/3] = signs[board[i]];  
        }

        if (currentPlayer() == 1) {
            whoseTurn = "Payee's turn";
        }
        if (currentPlayer() == 2) {
            whoseTurn = "Challenger's turn";
        }

        return (text, string(out), whoseTurn);
    }

    function clearBoard() private returns (string) {
        board = new uint[](9);
        return "Board cleared.";
    }

}

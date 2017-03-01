pragma solidity ^0.4.6;

contract TicTacToePonzi {

    //TODO: Implement Challenger choosing amount after win, Time checks, Turns using deployment.
    //Think about how we could get around people getting up after a queue and not starting a game. If we call them out should they lose money?

    address owner;

    struct Player {
        address addr;
        uint256 position;       // 0 for Payee, 1 for Challenger, and 2 for Queue
        uint256 value;          // Amount of money in pot from winnings. Becomes 0 after witdrawal
        uint256 deposit;        // If doesn't meet threshold, money is stored in deposit
        uint256 totalOwned;     // Value + Deposit + msg.value (investment) . How much money owned in the contract
        bool canWithdraw;       // True if someone after you has paid.
        bool playing;           // Currently in a game
    }

    Player[] players;           // List of players waiting to pay
    Player[] currentPlayers;    // Current Players
    Player[] queue;             // Queue of players waiting to play

    bool inGame;                // Is there a game going on?
    uint256 lastMove;           // when the last move was performed
    Player lastPlayer;         // who the last move was performed by

    //Maybe variable for board state?

    //maybe game status struct

    uint256 buyInThreshold = 1; // Amount needed to buy in. Defaulted to .1 ether. ***Can also change to owner choosing***
    uint256 potBalance;         // Amount of money from deposits and payments


    function join() payable {

        uint256 pos;
        if (players.length == 0 || players.length == 1) {
            pos = players.length;
        }
        else if (players.length > 1) {
            pos = 2;
        }

        players.push(Player(msg.sender, pos, 0, 0, msg.value, false, false));

        if (pos == 0 || pos == 1) {
            currentPlayers[pos] = players[getPlayerIndex(msg.sender)];           // TODO what? This is an address, not an array index?
        }
        else {
            queue.push(players[getPlayerIndex(msg.sender)]);                     // TODO same as above comment
        }

    }

    /*
     * Returns the queue position for the querier.
     */
    function getQueuePos() public returns (int) {
        Player temp = players[getPlayerIndex(msg.sender)];
        uint256 i = 0;

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
    function endGame() public returns (bool) {
        if (block.timestamp > lastMove + 3600) {       // if the current block is an hour past the lastMove
            // refund the player who played last
            success = lastPlayer.addr.send(lastPlayer.totalOwned);
            if (success) {
                lastPlayer.totalOwned = 0;
                resetGame();        // TODO implement this
            }
            return success;
        }
    }

    /*
     * Move everyone up in the queue.
     */
    function updateQueue(Player[] arr, uint256 loc) private {
        if (arr.length <= 0 || loc >=  arr.length) {
            return;
        }
        for (uint256 i = loc; i < arr.length -1; i++) {
            arr[i] = arr[i+1];
        }
        delete arr[i+1];
    }

    /*
     * Returns the index of the given player.
     */
    function getPlayerIndex(address addr) private returns (uint256) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i].addr == addr) {
                return i;
            }
        }
    }

    /*
     * Returns the minimum amount needed to buy in to the game.
     */
    function getBuyInThreshold() public returns (uint256) {
        return buyInThreshold;
    }

    /*
     * Start the game.
     */
    function playGame(uint256 money) public payable {

        // Insufficient funds
        if(player.totalOwned < money) {
            player.deposit += player.totalOwned;
            player.totalOwned = 0;
        }

        //check if 2 players are in gameStatus and both are not in a game already and no other game is going on
        if(inGame || currentPlayers.length != 2 || currentPlayers[0].addr == currentPlayers[1].addr || currentPlayers[0].playing || currentPlayers[1].playing) {
            throw;        // TODO remove this
        }

        Player player = players[getPlayerIndex(msg.sender)];
        if(player.position != 1) {
            throw;       // TODO remove this
        }


        if(money * 10 / 11 < buyInThreshold) {
            player.deposit += money;
            // TODO move player from the queue; if not, stop the game.
            return;
        }

        else if(money * 10 / 11 >= buyInThreshold) {  //Challenger commits 1.1x buyIn by default. Refunded later if he wins and chooses not to increase
            //then do stuff

            // Start the game.
            inGame = true;
            lastMove = block.timestamp;     // TODO is this right? Maybe we should wait for a move to be done?
            player.totalOwned -= money;

            currentPlayers[0].playing = true;
            currentPlayers[1].playing = true;

            potBalance += money;
            buyInThreshold = money;

            TicTacToe game = TicTacToe();
            game.start();
            while (!game.has_ended()) {
                game.play();        // TODO forward inputs to TicTacToe game contract
            }

            // challenger chooses how much money to input (minimum 1.1 if he loses, 1.0 if he wins), gets refund if msg.value > chosen value

        }

        // Game ends: Queue updated, game statuses updated, current players updated. All called in win functions

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

            //
            // WHAT HAPPENS IF PLAYER GOES BACK INTO GAME A SECOND TIME AND IS ABLE TO WITHDRAW AGAIN BEFORE OTHER PERSON PAYS?
            //our mechanics might prevent because challenger pays
            // if (!(player.addr.deposit.value(accountBalance)())) {
            //         throw;
            //     }
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
            updateQueue(queue, (uint256) (temp));
        }

        //Send all funds back to wallet somehow

    }

    /*
     * The case where the payee wins the pot, or there is a draw.
     * The challenger becomes the payee, with the wager equal to how much they paid.
     */
    function payeeWinsOrDraws() payable {
        // TODO change player.totalOwned of payee
        currentPlayers[0].value = buyInThreshold;
        currentPlayers[1].value = buyInThreshold;

        inGame = false;

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

    }

    /*
     * The case where the challenger wins the pot.
     * Payee values remain the same.
     */
    function challengerWins() payable {
        // TODO How to account for the challenger being able to choose? We can give the win lower bounds?
        currentPlayers[1].value = buyInThreshold;

        inGame = false;

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
    }


}

}

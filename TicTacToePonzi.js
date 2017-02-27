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

    Player[] players;           // TODO what's the point of this if we have current players and queue?
    Player[] currentPlayers;    // Current Players
    Player[] queue;             // Queue of players waiting to play

    bool inGame;                // Is there a game going on?
    uint256 lastMove;           // when the last move was performed
    uint256 lastPlayer;         // who the last move was performed by

    //Maybe variable for board state?

    //maybe game status struct

    uint256 buyInThreshold = 1; // Amount needed to buy in. Defaulted to .1 ether. ***Can also change to owner choosing***
    uint256 potBalance;         // Amount of money from deposits and payments


    function TicTacToePonzi() payable {

        uint256 pos;
        if (players.length == 0 || players.length == 1) {
            pos = players.length;
        }
        else if (players.length > 1) {
            pos = 2;
        }

        players.push(Player(msg.sender, pos, 0, 0, msg.value, false, false));

        if (pos == 0 || pos == 1) {
            currentPlayers[pos] = players[getPlayerAddr(msg.sender)];           // TODO what? This is an address, not an array index?
        }
        else {
            queue.push(players[getPlayerAddr(msg.sender)]);                     // TODO same as above comment
        }

    }

    function getQueuePos() public returns (int) {
        Player temp = players[getPlayerAddr(msg.sender)];
        uint256 i = 0;
        if(queue.length == 0){
            //System.out.println("You are not in the queue or there is no queue");
            return -1;
        }
        for (i = 0; i < queue.length; i++){
            if (msg.sender == players[i].addr) {
               return (int) (i + 1);
            }
        }
        // System.out.println("You are not in the queue");
        return -1;
    }



    function getTime() public {


        //calls win if blocks or time past an hour
        //make local variable with blocktime of start. then call most recent block to see if move is within 1 hr

        //Put call out functions:
        //Can call out opponent being too late, lose when you try to play after 1 hr
    }

    /* If more than an hour has passed, call this function to end the game.
     */
    function endGame() public returns (bool) {
        if (block.timestamp > lastMove + 3600) {       // if the current block is an hour past the lastMove 
            if (lastPlayer == 0) {
                // refund player 1
            }
            else if (lastPlayer == 1) {
                // refund player 2
            }
            else {
                return false;
            }

            return true;
        }
    }

    function updateQueue(Player[] arr, uint256 loc) private {
        if(arr.length <= 0 || loc >=  arr.length){
            return;
        }
        for(uint256 i = loc; i < arr.length -1; i++){
            arr[i] = arr[i+1];
        }
        delete arr[i+1];
    }


    function getPlayerAddr(address addr) private returns (uint256){
        for(uint256 i = 0; i < players.length; i++) {
            if(players[i].addr == addr) {
                return i;
            }
        }
    }

    function getBuyInThreshold() returns (uint256){
        return buyInThreshold;
    }


    function playGame(uint256 money) public payable {

        if(player.totalOwned < money){
            player.deposit += player.totalOwned;
            player.totalOwned = 0;
            // System.out.println("You don't have that much money");
        }

        //check if 2 players are in gameStatus and both are not in a game already and no other game is going on
        if(inGame || currentPlayers.length != 2 || currentPlayers[0].addr == currentPlayers[1].addr || currentPlayers[0].playing || currentPlayers[1].playing){
            // System.out.println("Someone is in a game");
            throw;          // TODO remove this
        }

        Player player = players[getPlayerAddr(msg.sender)];
        if(player.position != 1){
            throw; // TODO remove this
        }


        if(money * 10 / 11 < buyInThreshold){
            // System.out.println("You don't have enough money. You money has been sent to your account deposit");
            player.deposit += money;
            // TODO move player from the queue; if not, stop the game.
            return;
        }

        else if(money * 10 / 11 >= buyInThreshold){  //Challenger commits 1.1x buyIn by default. Refunded later if he wins and chooses not to increase
            //then do stuff

            // Start the game.
            inGame = true;
            lastMove = block.timestamp;     // TODO is this right? Maybe we should wait for a move to be done?
            player.totalOwned -= money;

            currentPlayers[0].playing = true;
            currentPlayers[1].playing = true;

            potBalance += money;
            buyInThreshold = money;

                //PLAY GAME HERE
                //create new contract within contract (reference contract address)



                //challenger chooses how much money to input (minimum 1.1 if he loses, 1.0 if he wins), gets refund if msg.value > chosen value




        }

        //Game ends: Queue updated, game statuses updated, current players updated. All called in win functions

    }

    function withdrawFunds() public {
        Player player = players[getPlayerAddr(msg.sender)];
        if(player.addr == msg.sender){
            player.totalOwned += player.deposit;
            player.totalOwned += player.value;
            player.deposit = 0;
            player.value = 0;
            player.canWithdraw = false;

            //WHAT HAPPENS IF PLAYER GOES BACK INTO GAME A SECOND TIME AND IS ABLE TO WITHDRAW AGAIN BEFORE OTHER PERSON PAYS?
            //our mechanics might prevent because challenger pays

            // if (!(player.addr.deposit.value(accountBalance)())) {
            //         throw;
            //     }
        }
    }

    function leaveGame() public {
        //Allows you to leave the game only if player is not in a game and is not a payee.

        Player player = players[getPlayerAddr(msg.sender)];
        if(player.playing){
            return;
        }

        if(player.position == 0 && currentPlayers[0].addr == player.addr){  //payees cant leave
            return;
        }
        else if(player.position == 1 && currentPlayers[1].addr == player.addr){

            if(queue.length == 0){
                delete currentPlayers[1];
            }
            else{
                currentPlayers[1] = queue[0];
                updateQueue(queue, 0);
            }

        }
        else if(player.position == 2){
            int temp = getQueuePos();
            updateQueue(queue, (uint256) (temp));
        }

        //Send all funds back to wallet somehow

    }


    function payeeWinsOrDraws() payable {

        //change player.value and player.totalOwned of payee

        //Challenger becommes new payee with value of however much he paid


        currentPlayers[0].value = buyInThreshold;
        currentPlayers[1].value = buyInThreshold;



        inGame = false;

        currentPlayers[0].playing = false;
        currentPlayers[1].playing = false;

        currentPlayers[0].position = 2;
        currentPlayers[1].position = 0;

        currentPlayers[0].canWithdraw = true;
        currentPlayers[0] = currentPlayers[1];


        if(queue.length == 0){
            delete currentPlayers[1];
        }
        else{
            currentPlayers[1] = queue[0];
            currentPlayers[1].position = 1;
            updateQueue(queue, 0);
        }

    }

    function challengerWins() payable {

        //Payee values stay same
        //Challenger becomes payee with value of however much he decides to pay


        //How to account for the challenger being able to choose? We can give the win lower bounds?

        currentPlayers[1].value = buyInThreshold;





        inGame = false;

        currentPlayers[0].playing = false;
        currentPlayers[1].playing = false;

        currentPlayers[0].position = 2;
        currentPlayers[1].position = 0;

        currentPlayers[0].canWithdraw = true;
        currentPlayers[0] = currentPlayers[1];


        if(queue.length == 0){
            delete currentPlayers[1];
        }
        else{
            currentPlayers[1] = queue[0];
            currentPlayers[1].position = 1;
            updateQueue(queue, 0);
        }


    }


}

//http://ether.fund/contract/1068e/tictactoe
contract TicTacToe
{
    modifier has_value { if(msg.value > 0) _; }

    struct Game
    {
        uint balance;
        uint turn;
        address opposition;
        uint time_limit;
        mapping(uint => mapping(uint => uint)) board;
    }

    mapping (address => Game) games;

    function start() payable has_value
    {
        Game g = games[msg.sender];
        if(g.balance == 0)
        {
            clear(msg.sender);
            g.balance += msg.value;
        }
    }

    function join(address host) payable has_value
    {
        Game g = games[host];
        if(g.opposition == 0
        && msg.sender != host)
        {
            g.balance += msg.value;
            g.opposition = msg.sender;
        }
    }

    function play(address host, uint row, uint column)
    {
        Game g = games[host];

        uint8 player = 2;
        if(msg.sender == host)
            player = 1;

        if(g.balance > 0 && g.opposition != 0
        && row >= 0 && row < 3 && column >= 0 && column < 3
        && g.board[row][column] == 0
        && (g.time_limit == 0 || block.timestamp <= g.time_limit)
        && g.turn != player)
        {
            g.board[row][column] = player;

            if(is_full(host))
            {
                bool x = host.send(g.balance/2);
                bool y = g.opposition.send(g.balance/2);
                g.balance = 0;
                clear(host);
                return;
            }

            if(is_winner(host, player))
            {
                if(player == 1)
                    x = host.send(g.balance);
                else
                    y = g.opposition.send(g.balance);

                g.balance = 0;
                clear(host);
                return;
            }

            g.turn = player;
            g.time_limit = block.timestamp + (60);
        }
    }

    function claim_reward(address host) returns (bool retVal)
    {
        Game g = games[host];

        if(g.opposition != 0
        && g.balance > 0
        && block.timestamp > g.time_limit)
        {
            if(g.turn == 2) {
                bool x = host.send(g.balance);
            }
            else {
                bool y = g.opposition.send(g.balance);
            }
            
            g.balance = 0;
            clear(host);
        }
    }

    function check(address host, uint player, uint r1, uint r2, uint r3,
    uint c1, uint c2, uint c3) returns (bool retVal)
    {
        Game g = games[host];
        if(g.board[r1][c1] == player && g.board[r2][c2] == player
        && g.board[r3][c3] == player)
            return true;
    }

    function is_winner(address host, uint player) returns (bool winner)
    {
        Game g = games[host];
        if(check(host, player, 0, 1, 2, 0, 1, 2)
        || check(host, player, 0, 1, 2, 2, 1, 0))
            return true;

        for(uint r; r < 3; r++)
            if(check(host, player, r, r, r, 0, 1, 2)
            || check(host, player, 0, 1, 2, r, r, r))
                return true;
    }

    function is_full(address host) returns (bool retVal)
    {
        Game g = games[host];
        uint count = 0;
        for(uint r; r < 3; r++)
            for(uint c; c < 3; c++)
                if(g.board[r][c] > 0)
                    count++;
        if(count >= 9)
            return true;
    }

    function clear(address host)
    {
        Game g = games[host];
        if(g.balance == 0)
        {
            g.turn = 1;
            g.opposition = 0;
            g.time_limit = 0;

            for(uint r; r < 3; r++)
                for(uint c; c < 3; c++)
                    g.board[r][c] = 0;

            // For Later
            //delete games[host];
        }
    }

    function get_state(address host) returns (uint o_balance, address o_opposition,
    uint o_timelimit, uint o_turn, uint o_row1, uint o_row2, uint o_row3)
    {
        Game g = games[host];
        o_balance = g.balance;
        o_opposition = g.opposition;
        o_timelimit = g.time_limit;
        o_turn = g.turn;
        o_row1 = (100 * (g.board[0][0] + 1))
        + (10 * (g.board[0][1] + 1)) + (g.board[0][2] + 1);
        o_row2 = (100 * (g.board[1][0] + 1))
        + (10 * (g.board[1][1] + 1)) + (g.board[1][2] + 1);
        o_row3 = (100 * (g.board[2][0] + 1))
        + (10 * (g.board[2][1] + 1)) + (g.board[2][2] + 1);
    }
}

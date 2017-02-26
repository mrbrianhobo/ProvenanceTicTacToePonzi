pragma solidity ^0.4.6;

contract TicTacToePonzi {

    address owner;

     struct Player {
        address addr;

        uint256 position; 
        //1 for Challenger and 0 for Payee. 2 for queue 
        
        uint256 value; //Amount of money in pot from winnings. Becomes 0 after witdrawal
        uint256 deposit; //If doesn't meet threshold

        uint256 totalOwned; //Value + Deposit + investment. How much money owned in the contract

        bool canWithdraw;

        bool playing; //Currently in a game


    }

    struct GameStatus{
        bool inGame; //Is there a game going on?

        Player[] currentPlayers; //Current Players

        Player[] queue;

        //Maybe variable for board state?

    }

    //maybe game status struct

    uint256 buyInThreshold; //Amount needed to buy in
    uint256 potBalance;  //Ammount of money from deposits and payments
    Player[] players;


    function TicTacToePonzi(uint256 investment) {
        uint256 pos ;
        if(players.length == 0 || players.length == 1){  //Owner of the contract (person who deployed)
            pos = players.length;
        }    
        else if( players.length > 1){
            pos = 2;
        }
        
        Player temp = Player(msg.sender, pos,  0, 0, investment, false, false);

        players.push(temp);


        if(pos == 0 || pos == 1){
            pl[pos] = temp;
        }
        else{
            queue.push(temp);
        }

        //DEPOSIT THE MONEY INTO POT, TAKE MONEY FROM WALLET (how do we do this?)

    }

    function getQueuePos() public returns (int) {
        Player temp = Player[getPlayerAddr(msg.sender)];
        int i = 0;
        if(queue.length == 0){
            return 0;
        }
        for(; i < queue.length; i++){
            if(temp == players[i]){
                return i + 1;
            }
        }
        return -1;
    }

    function getTime() public {

        //calls win if blocks or time past an hour
    }

    function updateQueue(Player[] arr, int loc) private {
        if(arr.length <= 0 || loc >= arr.length){
            return;
        }
        for(int i = loc; i < arr.length-1; i++){
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

    function playGame() public payable {

        //check if 2 players are in gameStatus and both are not in a game already and no other game is going on 
        if(inGame || currentPlayers.length != 2 || currentPlayers[0] == currentPlayers[1] || currentPlayers[0].playing || currentPlayers[1].playing){
            throw;
        }
        

        ingame = true;
        currentPlayers[0].playing = false;
        currentPlayers[1].playing = false;

        potBalance += msg.value;
         
        Player player = players[getPlayerAddr(msg.sender)];
        if(msg.value * 10 / 11 >= buyInThreshold){  //Challenger commits 1.1x buyIn by default. Refunded later if he wins and chooses not to increase
            //then do stuff
            
            
 
                //PLAY GAME HERE
                //create new contract within contract (reference contract address)



                //challenger chooses how much money to input (minimum 1.1 if he loses, 1.0 if he wins), gets refund if msg.value > chosen value

            


        }
        else{
            //player.deposit += msg.value;
        }

        //player.totalOwned = player.deposit + player.value;




        //Game ends: Queue updated, game statuses updated, current players updated.
        currentPlayers[0].playing = false;
        currentPlayers[1].playing = false;
        currentPlayers[0].canWithdraw = true;
        inGame = false;
        currentPlayers[0] = currentPlayers[1];
        if(queue.length == 0){
            delete currentPlayers[1];
        }
        else{
            currentPlayers[1] == queue[0];
            updateQueue(queue, 0);
        }


    }

    function withdrawFunds() public {
        Player player = players[getPlayerAddr(msg.sender)];
        if(player.addr == msg.sender){
            player.totalOwned += player.deposit;
            player.totalOwned += player.value;
            player.deposit = 0;
            player.value = 0;
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

        if(player.pos == 0 && pl[0] == player){  //payees cant leave 
            return;
        }
        else if(player.pos == 1 && pl[1] == player){

            if(queue.length == 0){
                delete currentPlayers[1];
            }
            else{
                currentPlayers[1] == queue[0];
                updateQueue(queue, 0);
            }

        }
        else if(player.pos == 2){
            updateQueue(queue, player.getQueuePos());
        }

        //Send all funds back to wallet somehow

    }


    function payeeWinsOrDraws() payable {

        //change player.value and player.totalOwned of payee
        //change player.canWithdraw to true for payee
        //Challenger becommes new payee with value of however much he paid

    }

    function challengerWins() payable {

        //Payee values stay same, but canWithdraw becomes true.
        //Challenger becomes payee with value of however much he decides to pay


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
    
    function start() has_value
    {
        Game g = games[msg.sender];
        if(g.balance == 0)
        {
            clear(msg.sender);
            g.balance += msg.value;
        }
    }
    
    function join(address host) has_value
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
            if(g.turn == 2)
                bool x = host.send(g.balance);
            else
                bool y = g.opposition.send(g.balance);
                
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
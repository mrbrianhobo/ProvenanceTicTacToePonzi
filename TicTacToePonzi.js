pragma solidity ^0.4.9;

contract TicTacToePonzi {

	adress owner;

	 struct Player {
        address addr;

        uint256 position; 
        //1 for Payee and 0 for Challenger. -1 for not in game, 2 for in queue
        
        uint256 value; //Amount of money in pot from winnings. Becomes 0 after witdrawl
        uint256 deposit; //If doesn't meet threshold

        uint256 totalOwned; //Value + Deposit. How much money owned in the contract

        boolean canWithdraw = false;
        uint256 gameNum = 0;
    }

    uint256 buyInThreshold; //Amount needed to buy in
    uint256 potBalance;  //Ammount of money from deposits and payments
    Player players[];


    function TicTacToePonzi() {
    	potBalance = 0;
    	owner = msg.sender;

    }

    function getPlayer(address addr) private {
    	for(int i = 0; i < players.length; i++) {
            if(players[i].addr == addr) {
                return players[i];
            }
        }
        return null;
    }

    function getBuyInThreshold() returns (uint256){
    	return buyInThreshold;
    }

    function joinGame() payable {
    	potBalance += msg.value;
    	players.push(Player(msg.sender, msg.value, 0)); //not sure what this does
    	Player player = getPlayer(msg.origin);
    	if(msg.value > buyInThreshold){
    		//then do stuff
    		if(players.length == 1){
    			player.position = 1;
    		}
    		else{
    			player.position = 0;
    		

    			//PLAY GAME HERE

    			gameNum++;
    		}


    	}
    	else{
    		player.deposit += msg.value;
    	}

    	player.totalOwned = player.deposit + player.value;

    }

    function withdrawFunds() public {
    	Player player = getPlayer(msg.origin);
    	if(player.addr == msg.origin){
    		uint256 accountBalance = player.totalOwned;
    		player.deposit = 0;
    		player.value = 0;
    		player.totalOwned = 0;
    		if (!(player.addr.deposit.value(accountBalance)())) {
            	    throw;
            	}
		}
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
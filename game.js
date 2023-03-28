class Game{
	constructor(p1,p2){
		this.players = [p1,p2]
		this.gameStop = false
		if(!this.gameStop){
			this.players.forEach((player, idx) => {
				var indexp = idx+1
				player.emit("player", indexp)
				player.on("disconnect", () => {
					this.gameStop = true
					if(this.players.includes(player)){
						this.players.splice(this.players.indexOf(player), 1)
						// console.log(this.players.length)
						if(this.players.length > 0){
							this.players[0].emit("error-opp-left")
						}
					}
				})
			})
		}
		this.p1_sel = null				// player1 selection because only player1 can choose the toss
		this.tossSelOver = false		// to check if toss selection is over by player 1
		this.tossCount = 0  			// Useless.. I know. Comments too..
		this.tossOver = false  			// to check if toss is completed or not
		this.tossBalls = [null, null] 	// Toss balls
		this.tossTimes = [0,0]			// So-that toss won't be run twice or more
		this.chooseOpt = [null,null] 	// Bat or bowl
		this.tossLoser = null			// Who lost the toss? 
		this.statSel = false;			// to check if it is already decided the status of a player
		this.ballCount = 0				// ball count so-that scores will be calculated after both players chooses something
		this.numBalls = 0				// To count number of balls over
		this.balls = [null,null]		// The balls of both players in a array with their index (temp)
		this.ballSel = [false,false]	// Something which i used so-that a player cant choose twice. 
		this.gameBalls = []				// Every f**king ball's info is stored in this.
		this.round = 1;					// Round no. so-that it doesnt exceeed everytime
		this.scores = [0,0]				// Normal scores. no need to explain.
		this.previousScore = 0   		// To store the score of initial player
		
		if(!this.gameStop){
			this.players[0].on('toss-sel', type => {
				if(!this.tossSelOver && !this.gameStop){
					if(type == 'odd' || type == 'even'){
						this.p1_sel = type
						this.players[0].emit('msg-toss-me', this.p1_sel)
						this.players[1].emit('msg-toss-u', this.p1_sel)
						this.tossSelOver = true
					}
					else{
						this.players[0].emit('invalid-input')
					}
				}
			})
			this.players[1].on('toss-sel', type => {
				if(this.players[1] != null){
					this.players[1].emit("no-choose-2")
				}
			})
			
			this.players.forEach((player,idx) => {
				player.on("message-to-player", msg => {
					if(idx == 0 && !this.gameStop){
						this.players[1].emit("message-from-player", msg)
					}
					else if(idx == 1 && !this.gameStop){
						this.players[0].emit("message-from-player", msg)
					}
				})
			})

			this.players.forEach((player,idx) => {
				player.on("game-ball", ball => {
					if(typeof ball == "number" && ball <= 6 && ball >= 1){
						if(this.tossTimes[idx] == 0 && this.tossCount < 2 && !this.tossOver && this.tossSelOver && !this.gameStop){
							this.tossBalls[idx] = ball
							this.toss()
							this.tossCount++
							this.tossTimes[idx]++
						}
						else if(this.tossCount < 2 && !this.tossOver && !this.tossSelOver && !this.gameStop){
							player.emit("tnov-nochose")
						}
					}
					else{
						player.emit('invalid-input')
					}
				})
				player.on("choose-opt", chose => {
					if(chose == "bat" || chose == "bowl"){
						if(!this.statSel && !this.gameStop && this.tossOver && this.tossLoser != idx+1){
							this.chooseOpt[idx] = chose
							if(chose == "bat"){
								this.chooseOpt = ["bat","bat"]
								this.chooseOpt[this.tossLoser-1] = "bowl"
							}
							else if(chose == "bowl"){
								this.chooseOpt = ["bowl","bowl"]
								this.chooseOpt[this.tossLoser-1] = "bat"
							}
							this.statSel = true
							this.players[this.tossLoser-1].emit("chose-pot", this.chooseOpt[this.tossLoser-1], this.chooseOpt[idx])
							this.players[idx].emit("chose-pot", this.chooseOpt[idx], this.chooseOpt[this.tossLoser-1])
						}	
						else{
							player.emit("no-choose-lose-toss")
						}
					}
					else{
						player.emit("invalid-input")
					}
				})
				player.on("game-ball", ball => {
					if(typeof ball == "number" && ball <= 6 && ball >= 1){
						if(this.ballCount < 2 && !this.gameStop && this.statSel && !this.ballSel[idx]){
							this.balls[idx] = ball
							this.ballSel[idx] = true
							this.ballCount++
							// this.ballSel[idx] = true
							this.gameBall(this.balls)
						}
						else if(this.ballCount == 2 && !this.gameStop && this.statSel){
							this.balls = [null, null]
							this.ballSel = [false, false]
							this.ballCount = 0
							this.balls[idx] = ball
							this.ballSel[idx] = true
							this.ballCount++
							this.gameBall(this.balls)
						}
					}
					else{
						player.emit('invalid-input')
					}
				})
			})
		}
	} 
	gameBall(x){
		if(!x.includes(null) && !this.gameStop && this.statSel){
			this.numBalls++
			this.ballSel = [false,false]
			var out = false
			if(x[0] == x[1] && this.round < 2){
				this.players.forEach((player,idx) => {
					var outIndx = this.chooseOpt.indexOf("bat")
					if(idx == outIndx){
						this.previousScore = this.scores[idx]
						player.emit("you-out", this.scores[idx], this.chooseOpt[idx], this.numBalls)
					}
					else{
						player.emit("opp-out", this.scores[outIndx], this.chooseOpt[idx], this.numBalls)
					} 
				})
				this.chooseOpt = [this.chooseOpt[1], this.chooseOpt[0]]
				this.round++
				out = true
				// console.log("A player is out")
			}
			else if(this.round == 2)
			{
				var winner = null
				var indx = this.chooseOpt.indexOf('bat')
				if(x[0] != x[1]){
					this.scores[indx] += x[indx]
					// console.log(this.scores)
					if(this.scores[indx] > this.previousScore){
						winner = indx+1
					}
				}
				else{
					if(this.scores[indx] == this.previousScore){
						winner = 0
					}
					else{
						winner = this.chooseOpt.indexOf("bowl")+1
					}
					
				}

				if(winner != null){
					this.players.forEach((player,idx) => {
						if(idx == winner-1){
							player.emit("game-over", "win")
						}
						else if(winner != 0){
							player.emit("game-over", "lose")
						}
						else{
							player.emit("game-over", "draw")
						}
					})
					// console.log("Game Over")
					out = true
					this.gameStop = true
				}
			}
			else if(x[0] != x[1]){
				var indx = this.chooseOpt.indexOf('bat')
				this.scores[indx] += x[indx]
				// console.log(this.scores)
			}

			var ball = {
				ball: this.numBalls,
				batsman: this.chooseOpt.indexOf("bat")+1,
				bowler: this.chooseOpt.indexOf("bowl")+1,
				p1_ball: x[0],
				p2_ball: x[1],
				out: out
			}
			this.players.forEach((player,idx) => {
				if(idx == 0){
					player.emit("both-choose-ok", x[0], x[1], this.numBalls, this.scores[0], this.scores[1])
				}
				else if(idx == 1){
					player.emit("both-choose-ok", x[1], x[0], this.numBalls, this.scores[1], this.scores[0])
				}
			})
			this.gameBalls.push(ball)
			// console.log(this.gameBalls)
		}
		else if(!this.gameStop && this.statSel){
			var indx = x.indexOf(null)
			this.players.forEach((player,idx)=> {
				if(indx != idx){
					player.emit("wait-for-opp", this.balls[idx], this.numBalls+1)
				}
			})
		}
	}
 
	toss(){
		if(this.tossBalls[0] != null && this.tossBalls[1] != null && !this.gameStop){
			this.players.forEach((player,idx) => {
				if(idx == 0){
					player.emit("both-choose-ok", this.tossBalls[0], this.tossBalls[1], 'no')
				}
				else if(idx == 1){
					player.emit("both-choose-ok", this.tossBalls[1], this.tossBalls[0], 'no')
				}
			})
			var sum = this.tossBalls[0] + this.tossBalls[1]
			var result = null
			if(sum % 2 == 0){
				result = "even"
			}
			else{
				result = "odd"
			}
			if(this.p1_sel == result){
				this.emitToPlayersIndv("toss-won","toss-lose")
				this.tossLoser = 2 
			}
			else{
				this.emitToPlayersIndv("toss-lose","toss-won")
				this.tossLoser = 1
			}
			this.tossOver = true
			this.players.forEach(player => player.emit('toss-com'))
		}
		else if(!this.gameStop){
			var indx = this.tossBalls.indexOf(null)
			this.players.forEach((player,idx)=> {
				if(indx != idx){
					player.emit("wait-for-opp", this.tossBalls[idx], "no-display-ball")
				}
				if(indx == idx){
					player.emit("choose-fast")
				}
			})
		}
	}

	emitToPlayersIndv(x,y){
		this.players[0].emit(x)
		this.players[1].emit(y)
	}
}

module.exports = Game;
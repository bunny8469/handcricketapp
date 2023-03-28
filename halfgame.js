const memit = require("./memitter").memit

class HalfGame{
	constructor(set, roomID, teamScore){
		this.rodi = roomID
		this.players = [set.batsman, set.bowler];
		this.ballCount = 0;
		this.score = 0;
		this.gameBalls = [];
		this.numBalls = 0;
		this.ballSel = [false,false];
		this.balls =[null,null];
		this.gameStop = false;
		this.players.forEach(plr => {
			if(!this.gameStop){
				plr.soc.emit("game-starts")
			}
		})
		this.players.forEach((player, idx) => {
			player.soc.on("disconnect", () => {
				if(!this.gameStop){
					this.gameStop = true
					if(this.players.includes(player)){
						this.players.splice(this.players.indexOf(player), 1)
						if(this.players.length > 0){
							this.players[0].soc.emit("error-opp-left-team")
							memit.emit("player-out-team", this.players[0], this.score, this.rodi, "left")
						}
					}
				}	
			})
		})
		
		this.players.forEach((plr,idx) => {
			plr.soc.on("comp-mode", () => {
				if(idx == 0 && !this.gameStop){
					this.players[1].soc.emit("opp-comp")
				}
				else if(idx == 1 && !this.gameStop){
					this.players[0].soc.emit("opp-comp")
				}
			})
			plr.soc.on("back-to-plr", () => {
				if(idx == 0 && !this.gameStop){
					this.players[1].soc.emit("opp-bk-plr")
				}
				else if(idx == 1 && !this.gameStop){
					this.players[0].soc.emit("opp-bk-plr")
				}
			})
			plr.soc.on("message-to-player-team", msg => {
					if(idx == 0 && !this.gameStop){
						this.players[1].soc.emit("message-from-player-team", msg)
					}
					else if(idx == 1 && !this.gameStop){
						this.players[0].soc.emit("message-from-player-team", msg)
					}
			})
			plr.soc.on("game-ball-team", ball => {
				if(typeof ball == "number" && ball <= 6 && ball >= 1){
					if(this.ballCount < 2 && !this.gameStop && !this.ballSel[idx]){
						this.balls[idx] = ball
						this.ballSel[idx] = true
						this.ballCount++
						this.gameBall(this.balls)
					}
					else if(this.ballCount == 2 && !this.gameStop && !this.ballSel[idx]){
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
					plr.soc.emit('invalid-input')
				}
			})
		})
	}

	gameBall(x){
		if(!x.includes(null) && !this.gameStop){
			this.numBalls++
			this.ballSel = [false,false]
			var out = false
			if(x[0] == x[1]){
				memit.emit("player-out-team", this.players[0], this.score, this.rodi, "out")
				this.players[0].soc.emit("you-bats-out", this.score)
				this.players[1].soc.emit("opp-bats-out", this.score, this.players[0].username)
				out = true
				this.gameStop = true
			}
			else if(x[0] != x[1]){
				this.score += x[0]
			}

			var ball = {
				ball: this.numBalls,
				batsman: 0,
				bowler: 1,
				p1_ball: x[0],
				p2_ball: x[1],
				out: out
			}
			this.players.forEach((player,idx) => {
				if(idx == 0){
					player.soc.emit("both-choose-ok-team", x[0], x[1], this.numBalls, this.score)
				}
				else if(idx == 1){
					player.soc.emit("both-choose-ok-team", x[1], x[0], this.numBalls, this.score, "no")
				}
			})
			this.gameBalls.push(ball)
		}
		else if(!this.gameStop && x.includes(null)){
			var indx = x.indexOf(null)
			this.players.forEach((player,idx)=> {
				if(indx != idx){
					player.soc.emit("wait-for-opp", this.balls[idx], this.numBalls+1)
				}
			})
		}
	}
}

module.exports = HalfGame;
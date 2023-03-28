const path = require("path")
const express = require("express")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server, {pingTimeout: 50000})
const bcrypt = require("bcryptjs")
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")
const url = require("url")

const game = require("./game")
const halfGame = require("./halfgame")
const memit = require("./memitter").memit

var namesInUse = []
var onlineMatches = []
var onlineTeams = []
var presentIn = "home"
const idsNoUse = ['7360']
 
function createMatch(id, pwd){
	var match = {
		roomId: id,
		players: ['null'],
		status: 'online',
		passcode: pwd
	}
	onlineMatches.push(match)
	console.log(`${match.roomId} is open now.`)
}
function createTeam(id, pwd){
	var team = {
		roomId: id,
		players: [],
		status: 'online',
		creator: "bunny",
		captains:[null,null],
		bothCaptains: false,
		currentStats: [null, null],
		gameStarted: false,
		teamA: [],
		totalScores: [0,0],
		teamB: [],
		round: 1,
		matchEnded: false,
		results: [],
		fstInings: [],
		scdInings: [],
		teamAtaken: [],
		teamBtaken: [],
		tossWinner: null,
		tossChoser: null,
		captainCho: "A",
		inningsNo: 1,
		detRes: [[], []],
		waitingPlayers: [],
		closed:false,
		passcode: pwd
	}
	onlineTeams.push(team)
	console.log(`${team.creator} has created a team ${team.roomId}`)
}
function randomNumber(min, max) {  
    return Math.random() * (max - min) + min; 
}
function createArray(len, itm) {
    var arr1 = [itm],
        arr2 = [];
    while (len > 0) {
        if (len & 1) arr2 = arr2.concat(arr1);
        arr1 = arr1.concat(arr1);
        len >>>= 1;
    }
    return arr2;
}
function getOccurrence(array, value) {
    var count = 0;
    array.forEach((v) => (v === value && count++));
    return count;
}

memit.on("player-out-team", (plr, score, id, st) => {
	onlineTeams.forEach(tm => {
		if(tm.roomId == id){
			if(tm.round == 1){
				var fdd = false
				tm.fstInings.forEach((inin,i) => {
					if(inin.includes(plr)){
						if(st == "left" && tm.fstInings[i][tm.currentStats.indexOf('bat')] == plr){
							tm.fstInings[i][tm.currentStats.indexOf('bat')].score = score
							tm.teamA.includes(plr)? fdd = 1: fdd = 2
						}
						else if(st != "left"){
							tm.fstInings[i][tm.currentStats.indexOf('bat')].score = score
							tm.teamA.includes(plr)? fdd = 1: fdd = 2
						}
						tm.totalScores[tm.currentStats.indexOf('bat')] += score
						if(st == "left"){
							tm.results[i] = "fail"
						}
						else if(st == "out"){
							tm.results[i] = "success"
						}
					}
				})
				if(fdd){
					tm.detRes[fdd-1].push([plr.username, score])
					// console.log(tm.detRes)
				}
			}
			else if(tm.round == 2){
				var fdd = false
				tm.scdInings.forEach((inin,i) => {
					if(inin.includes(plr)){
						if(st == "left" && tm.scdInings[i][tm.currentStats.indexOf('bat')] == plr){
							tm.scdInings[i][tm.currentStats.indexOf('bat')].score = score
							tm.teamA.includes(plr)? fdd = 1: fdd = 2
						}
						else if(st != "left"){
							tm.scdInings[i][tm.currentStats.indexOf('bat')].score = score
							tm.teamA.includes(plr)? fdd = 1: fdd = 2
						}
						tm.totalScores[tm.currentStats.indexOf('bat')] += score
						if(st == "left"){
							tm.results[i] = "fail"
						}
						else if(st == "out"){
							tm.results[i] = "success"
						}
					}
				})
				if(fdd){
					tm.detRes[fdd-1].push([plr.username, score])
					// console.log(tm.detRes)
				}
			}
		}
	})
})

app.use(express.static(path.join(__dirname, "public")))
app.set('view engine', 'ejs')
app.use(bodyParser.json({extended: true}))
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())


app.get('/', (req, res) => {
  	res.redirect(301,'/home');
});


/* Login Register Section starts */
/*app.get("/login", (req,res) => {
	res.sendFile(path.join(__dirname,"public","Login-register_page","login.html"))
})
app.post("/login", (req,res) => {
	var userExist = false
	users.forEach(user => {
		if (user.name == req.body.name){
			userExist = true
			bcrypt.compare(req.body.password, user.password, function (err, result) {
        		if (result == true) {
            		res.send('Successfully logged in! ');
            		console.log(`${user.name} has logged in.`)
        		} 
        		else {
         			res.send('Incorrect username or password');
         			console.log(`Somebody tried to login of username ${user.name}`)
        		}
      		});
		}
	})
	if (!userExist){
		res.status(400).send(`User not found`)
		console.log(`${req.body.name} is not found.`)
	}
})*/

app.get("/save-name", (req,res) => {
	res.render(path.join(__dirname, 'public', 'register-name.ejs'))
})
app.post('/save-name', (req,res) => {
	if(!namesInUse.includes(req.body.name)){
		res.cookie("name", req.body.name, 
		{
			httpOnly: true,
	   		secure: /*process.env.NODE_ENV === 'production'? */ true //: false
	   	})
		res.send("Successfully saved your name.. "+req.body.name+"<br><a href='/home'>Go to Homepage</a>")	
		res.end()
	}
	else{
		res.end("The name you chosen is currently in use. Change <a href='/save-name'>here</a>")
	}
})
app.get('/my-name', (req,res) => {
	res.send("Your name: <b>"+req.cookies["name"]+"</b> <br>You can always change <a href='/save-name'>here</a>")
	res.end()
})


app.get("/match/:num", (req,res) => {
	if(idsNoUse.includes(req.params.num)){
		res.sendFile(path.join(__dirname, "public", "rickroll", "index.html"))
	}
	else{
		var name = null;
		if(typeof req.cookies["name"] !== 'undefined' && req.cookies["name"] != null){
			name = req.cookies["name"];
		}
		const queryObject = url.parse(req.url, true).query;
		if(queryObject.pwd){
			res.render(path.join(__dirname,"public","Match","match.ejs"), {id: req.params.num, pwd: queryObject.pwd, nm: name})
		}
		else{
			res.render(path.join(__dirname,"public","Match","match.ejs"), {id: req.params.num, pwd: null, nm: name})
		}
	}
		
	// presentIn = "match-"+req.params.num
})
app.get('/teams-new', (req,res) => {
	var err = true
	var num;
	while(err){
		num = Math.floor(randomNumber(1000, 9999))
		var fo = false
		onlineTeams.forEach(team => {
			if(team.roomId == num){
				fo = true
			}
		})
		if(!fo){
			err = false
		}
	}
	res.render(path.join(__dirname, "public", "create-new", "team-create.ejs"), {id: num})
})
app.post("/teams-new", (req,res) => {
	var room = req.body.room
	var passcode = req.body.password
	var fo = false
	onlineTeams.forEach(team => {
		if(team.roomId == room){
			fo = true
		}
	})
	if(fo){
		res.send("A room with this id has already been created. \nRefresh the page. \nNote: We request you to not change the frontend code for better Experience :)<br><a href='/home'>Go to Homepage</a>")
		res.end()
	}
	else if(room && passcode){
		createTeam(room, passcode)
		res.redirect(301, "/teams/"+room+"?pwd="+passcode)
	}
	res.end()
})


app.get("/home", (req,res) => {
	var nme = null;
	if(typeof req.cookies["name"] !== 'undefined' && req.cookies["name"] != null){
		nme = req.cookies["name"];
	}
	res.render(path.join(__dirname, "public", "Routes", "homepage.ejs"), {nm: nme})
})

app.get('/match-new', (req,res) => {
	var err = true
	var num;
	while(err){
		num = Math.floor(randomNumber(1000, 9999))
		while(idsNoUse.includes(num.toString())){
			num = Math.floor(randomNumber(1000, 9999))
		}
		var fo = false
		onlineMatches.forEach(match => {
			if(match.roomId == num){
				fo = true
			}
		})
		if(!fo){
			err = false
		}
	}
	res.render(path.join(__dirname, "public", "create-new", "match-create.ejs"), {id: num})
})
app.post("/match-new", (req,res) => {
	var room = req.body.room
	var passcode = req.body.password
	var fo = false
	onlineMatches.forEach(match => {
		if(match.roomId == room){
			fo = true
		}
	})
	if(fo){
		res.send("A room with this id has already been created. \nRefresh the page. \nNote: We request you to not change the frontend code for better Experience :) <br><a href='/home'>Go to Homepage</a>")
		res.end()
	}
	else if(room && passcode){
		createMatch(room, passcode)
		res.redirect(301, "/match/"+room+"?pwd="+passcode)
	}
})

app.get("/chat/:num", (req,res) => {
	var name = null;
	if(typeof req.cookies["name"] !== 'undefined' && req.cookies["name"] != null){
		name = req.cookies["name"];
	}
	res.render(path.join(__dirname,"public","Chat","chat.ejs"), {id: req.params.num, nm: name})
	// presentIn = "chat-"+req.params.num
})
app.get("/join-match", (req,res) => {
	var matches = []
	onlineMatches.forEach(match => {
		if(match.players.length == 1 && !match.players.includes("null")){
			matches.push({room: match.roomId, len: match.players.length, creator: 'Unknown'})
		}
	})
	res.render(path.join(__dirname, "public","join-room","join-match","join-match.ejs"), {data: matches})
})
app.get("/join-team", (req,res) => {
	var teams = []
	onlineTeams.forEach(team => {
		if(team.players.length >= 1 && team.players.length <= 10){
			teams.push({room: team.roomId, len: team.players.length, creator: 'Unknown'})
		}
	})
	res.render(path.join(__dirname, "public","join-room","join-team","join-team.ejs"), {data: teams})
})
app.get("/teams/:num", (req,res) => {
	var name = null;
	if(typeof req.cookies["name"] !== 'undefined' && req.cookies["name"] != null){
		name = req.cookies["name"];
	}
	const queryObject = url.parse(req.url, true).query;
	if(queryObject.pwd){
		res.render(path.join(__dirname,"public","Teams","team.ejs"), {id: req.params.num, pwd: queryObject.pwd, nm: name})
	}
	else{
		res.render(path.join(__dirname,"public","Teams","team.ejs"), {id: req.params.num, pwd: null, nm: name})
	}
	// res.render(path.join(__dirname,"public","Teams","team.ejs"), {id:req.params.num})
	// presentIn = "teams-"+req.params.num
})


/* Socket connection*/
io.on("connection", (socket) => {
	var times = 0;
	var ttimes = 0;
	var roomId;
	var troomId;
	var loc;
	var defUsername = "bunny"
	// if(presentIn == "chat"){
	socket.on("message", (msg,name) => {
		io.to(roomId+'-chat').emit("addMsg", msg, name)
	})
	socket.on("room-id", id => {
		roomId = id
		socket.join(roomId+'-chat')
	})
	socket.on("username", name => {
		defUsername = name
	})
	// }

	socket.on("location", location => {
		loc = location
	})

	// if(presentIn == "teams"){
	socket.on("joined-team", (nam, id, passwd) => {
		if(loc != null && loc.includes("/teams/")){
			var href = loc.split("/teams/")[1].substring(0, 4)
		}else{ var href = "none" }


		if(id && href == id && nam && passwd){
			troomId = id
			var roomFound = false
			var tossTime = false
			var presentTeam;
			var allow = false
			var allow2 = false
			var socs = []
			var newName = nam
			// var selectedPlayers = []
			onlineTeams.forEach(team => {
				if(team.roomId == troomId){
					presentTeam = team
					roomFound = true
				}
			})
			if(namesInUse.includes(nam)){
				newName = nam+(Math.floor(randomNumber(100, 999)))
				while(namesInUse.includes(newName)){
					newName = nam+(Math.floor(randomNumber(100, 999)))
				}
				socket.emit("name-in-use", newName)
			}

			if(roomFound){
				if(presentTeam.closed || presentTeam.players.length >= 10){
					allow2 = false
					socket.emit("room-filled")
				}
				else{
					allow2 = true
				}
				presentTeam.players.forEach(p => {
					socs.push(p.soc)
				})
				if(!socs.includes(socket)){
					allow = true
				}
			}
			else{
				socket.emit("room-404")
			}
			
			if(roomFound && allow && allow2){
				if(presentTeam.passcode == passwd && !presentTeam.matchEnded){
					socket.emit("success-pass", passwd)
					socket.join(troomId+"-team")
					const player = {
						soc: socket,
						username: newName
					}
					if(presentTeam.teamA.length < 1){
						presentTeam.captains[0] = player
						presentTeam.teamA.push(player)		
						socket.emit("player-captain")
						// presentTeam.selected.push(player.username)
					}
					else if(presentTeam.teamB.length < 1){
						presentTeam.captains[1] = player
						presentTeam.teamB.push(player)
						socket.emit("player-captain")
					}
					else{
						presentTeam.waitingPlayers.push(player)
					}
					if(!presentTeam.captains.includes(null)){
						presentTeam.bothCaptains = true
					}

					namesInUse.push(newName)

					socket.on("message-to-team", (msg,name) => {
						var allow4 = false
						name = name.replace(/\</g,"&lt;") 
						name = name.replace(/\>/g,"&gt;")
						msg = msg.replace(/\</g,"&lt;")
						msg = msg.replace(/\>/g,"&gt;")
						presentTeam.players.forEach(plr => {
							if(plr.soc == socket){
								allow4 = true
							}
						})
						if(allow4){
							io.to(troomId+"-team").emit("message-from", msg, name)
						}
						
					})
					presentTeam.players.push(player)
					var teamAp = [];
					var teamBp = [];
					var waitingp = [];
					presentTeam.teamA.forEach(pl => {
						teamAp.push(pl.username)
					})
					presentTeam.teamB.forEach(pl => {
						teamBp.push(pl.username)
					})
					presentTeam.waitingPlayers.forEach(pl => {
						waitingp.push(pl.username)
					})

					socket.emit("you-joined-team", waitingp, teamAp, teamBp, player.username)
					// nameS.push(player.username)
					socket.to(troomId+"-team").broadcast.emit("player-joined-team", waitingp, teamAp, teamBp, player.username) 
					// socket.to(troomId+"-team").broadcast.emit("selected-players", nameS, selectedPlayers)
					onlineTeams.forEach(team => {
						if(team.roomId == troomId){
							team = presentTeam
							team.status = "online"
						}
					})
					socket.on('new-cap?', (aorb, nm) => {
						if(aorb == "A"){
							if(presentTeam.captains[0] == null){
								var socp = null
								presentTeam.players.forEach(plr => {
									if(plr.username == nm){
										socp = plr.soc
									}
								})
								if(socp != null){
									socp.emit("player-captain")
									//console.log("New cap")
									var pl = {
										soc: socp,
										username: nm
									}
									presentTeam.captains[0] = pl
									if(!presentTeam.captains.includes(null)){
										presentTeam.bothCaptains = true
									}
								}
								else{
									socket.emit('bad-req')
								}
							}
						}
						else if(aorb == "B"){
							if(presentTeam.captains[1] == null){
								var socp = null
								presentTeam.players.forEach(plr => {
									if(plr.username == nm){
										socp = plr.soc
									}
								})
								if(socp != null){
									socp.emit("player-captain")
									var pl = {
										soc: socp,
										username: nm
									}
									presentTeam.captains[1] = pl
									if(!presentTeam.captains.includes(null)){
										presentTeam.bothCaptains = true
									}
								}
								else{
									socket.emit("bad-req")
								}	
							}
						}
					})
					socket.on("toss-chosen", side => {
						var sFoun = false;
						var cap = null;
						var idx = null;
						presentTeam.captains.forEach((cp,id) => {
							if(cp.soc == socket){
								sFoun = true
								cap = cp
								idx = id
							}
						})
						if(sFoun){
							var coin = ["heads", "tails"]
							if(presentTeam.tossChoser == idx && coin.includes(side) && presentTeam.tossWinner == null){
								io.to(troomId+"-team").emit("cap-chose", cap.username, side)
								var randomRes = coin[Math.floor(Math.random()*coin.length)];
								if(randomRes == side){
									presentTeam.tossWinner = idx
									//console.log("perfect")
								}
								else{
									if(idx == 0){
										presentTeam.tossWinner = 1
									}
									else if(idx == 1){	
										presentTeam.tossWinner = 0
									}
								}
								io.to(troomId+"-team").emit("this-won-toss", presentTeam.captains[presentTeam.tossWinner].username, side, randomRes)
							}
							else{
								socket.emit("bad-req")
							}
						}
					})
					socket.on('get-avail-players', (x,y) => {
						var sFoun = false;
						var cap = null;
						var idx = null;
						presentTeam.captains.forEach((cp,id) => {
							if(cp.soc == socket){
								sFoun = true
								cap = cp
								idx = id
							}
						})
						if(sFoun){
							var listOf = []
							var ptsf;
							if(presentTeam.round == 1){
								ptsf = presentTeam.fstInings
							}
							else if(presentTeam.round == 2){
								ptsf = presentTeam.scdInings
							}
							if(idx == 0 && x == 1 && ptsf[y-1][x-1] == null){
								presentTeam.teamA.forEach(plr => {
									if(!presentTeam.teamAtaken.includes(plr)){
										listOf.push(plr.username)
									}
								})
								socket.emit("list-of-avail-plrs", listOf, x, y)
							}
							else if(idx == 1 && x == 2 && ptsf[y-1][x-1] == null){
								presentTeam.teamB.forEach(plr => {
									if(!presentTeam.teamBtaken.includes(plr)){
										listOf.push(plr.username)
									}
								})
								socket.emit("list-of-avail-plrs", listOf, x, y)
							}
						}
						else{ socket.emit("bad-req") }
					})
					socket.on("select-this-for-match", (nm,x,y) => {
						var sFoun = false;
						var cap = null;
						var idx = null;
						presentTeam.captains.forEach((cp,id) => {
							if(cp.soc == socket){
								sFoun = true
								cap = cp
								idx = id
							}
						})
						if(sFoun){
							if (idx == 0){
								if(presentTeam.round == 1){
									var founddd = "false"
									presentTeam.teamA.forEach(plr => {
										if(plr.username == nm){
											founddd = "true"
											if(presentTeam.fstInings[y-1][0] == null){
												presentTeam.fstInings[y-1][0] = plr
											}
											else{
												founddd = "no"
											}
											presentTeam.teamAtaken.push(plr)
										}
									})
									if(founddd == "true"){
										io.to(troomId+'-team').emit('put-him-there', nm, idx+1, y)
									}
									else if(founddd == "false"){ socket.emit("bad-req") }
								}
								else if(presentTeam.round == 2){
									var founddd = "false"
									presentTeam.teamA.forEach(plr => {
										if(plr.username == nm){
											founddd = "true"
											if(presentTeam.scdInings[y-1][0] == null){
												presentTeam.scdInings[y-1][0] = plr
											}
											else{
												founddd = "no"
											}
											presentTeam.teamAtaken.push(plr)
										}
									})
									if(founddd == "true"){
										io.to(troomId+'-team').emit('put-him-there', nm, idx+1, y)
									}
									else if(founddd == "false"){ socket.emit("bad-req") }
								}
							}
							else if(idx == 1){
								if(presentTeam.round == 1){
									var founddd = "false"
									presentTeam.teamB.forEach(plr => {
										if(plr.username == nm){
											founddd = "true"
											if(presentTeam.fstInings[y-1][1] == null){
												presentTeam.fstInings[y-1][1] = plr
											}
											else{
												founddd = "no"
											}
											presentTeam.teamBtaken.push(plr)
										}
									})
									if(founddd == "true"){
										io.to(troomId+'-team').emit('put-him-there', nm, idx+1, y)
									}
									else if(founddd == "false"){ socket.emit("bad-req") }
								}
								else if(presentTeam.round == 2){
									var founddd = "false"
									presentTeam.teamB.forEach(plr => {
										if(plr.username == nm){
											founddd = "true"
											if(presentTeam.scdInings[y-1][1] == null){
												presentTeam.scdInings[y-1][1] = plr
											}
											else{
												founddd = "no"
											}
											presentTeam.teamBtaken.push(plr)
										}
									})
									if(founddd == "true"){
										io.to(troomId+'-team').emit('put-him-there', nm, idx+1, y)
									}
									else if(founddd == "false"){ socket.emit("bad-req") }
								}
							}
						}
						else{ socket.emit("bad-req") }
					})
					socket.on('chose-this', st => {
						var sFoun = false;
						var cap = null;
						var idx = null;
						presentTeam.captains.forEach((cp,id) => {
							if(cp.soc == socket){
								sFoun = true
								cap = cp
								idx = id
							}
						})
						if(sFoun){
							var options = ['bat', 'bowl']
							if(presentTeam.bothCaptains && presentTeam.tossWinner == idx && presentTeam.currentStats[idx] == null && options.includes(st)){
								st == 'bat'? presentTeam.currentStats = ['bowl','bowl']: presentTeam.currentStats = ['bat', 'bat'] 
								presentTeam.currentStats[idx] = st
								var teamn = null;
								idx == 0 ? teamn = "WarBringers": teamn = "Howlers"
								io.to(troomId+"-team").emit("they-chose-this", st, teamn)
								var nor = 0;
								presentTeam.teamA.length < presentTeam.teamB.length? nor = presentTeam.teamA.length: nor = presentTeam.teamB.length
								var i = 1;
								while(i <= nor){
									presentTeam.fstInings.push([null, null])
									i++
								}
							}
							else if(!presentTeam.bothCaptains){ socket.emit("no-cap-opp") }
							else{ socket.emit('bad-req') }
						}
						else{ socket.emit('bad-req') }
					})
					socket.on("toss-time-team", () => {
						var sFoun = false;
						var cap = null;
						var idx = null;
						presentTeam.captains.forEach((cp,id) => {
							if(cp.soc == socket){
								sFoun = true
								cap = cp
								idx = id
							}
						})
						if(sFoun){
							if(presentTeam.bothCaptains && presentTeam.tossChoser == null && presentTeam.teamA.length == presentTeam.teamB.length){
								tossTime = true
								presentTeam.closed = true
								presentTeam.tossChoser = idx
								if(idx == 0){
									presentTeam.captains[1].soc.emit('oth-cap-con')
									presentTeam.captains[0].soc.emit("toss-ht")
									presentTeam.captains[1].soc.emit("other-choose-toss")
								}
								else if(idx == 1){
									presentTeam.captains[0].soc.emit('oth-cap-con')	
									presentTeam.captains[1].soc.emit("toss-ht")
									presentTeam.captains[0].soc.emit("other-choose-toss")
								}
								presentTeam.teamA.forEach(plr => {
									if(!presentTeam.captains.includes(plr)){
										plr.soc.emit("toss-hap")
									}
								})
								presentTeam.teamB.forEach(plr => {
									if(!presentTeam.captains.includes(plr)){
										plr.soc.emit("toss-hap")
									}
								})
								presentTeam.waitingPlayers.forEach(plr => {
									plr.soc.emit("you-go-out")
									plr.soc.leave(troomId+"-team")
									presentTeam.waitingPlayers.splice(presentTeam.waitingPlayers.indexOf(plr), 1)
									presentTeam.players.splice(presentTeam.players.indexOf(plr), 1)
								})
							}
							else if(!presentTeam.bothCaptains && tossChoser == null){ socket.emit("no-cap-opp") }
							else if(presentTeam.teamA.length != presentTeam.teamB.length && tossChoser == null){ socket.emit('notif', "Teams are unequal.") }
							else{ socket.emit("bad-req") }
						}
					})
					socket.on('check-preq-game', () => {
						var sFoun = false;
						var cap = null;
						var idx = null;
						presentTeam.captains.forEach((cp,id) => {
							if(cp.soc == socket){
								sFoun = true
								cap = cp
								idx = id
							}
						})
						if(sFoun){
							if(presentTeam.bothCaptains && !presentTeam.gameStarted){
								var tot = presentTeam.fstInings.length
								var nullMatches = 0;
								var nullCount = 0;
								if(presentTeam.round == 1){
									presentTeam.fstInings.forEach(inin => {
										if(inin.includes(null)){
											if((inin[0] == null && inin[1] != null) || (inin[0] != null && inin[1] == null)){
												nullCount++ 
											}
											else if(inin[0] == null && inin[1] == null){
												nullMatches++
											}
										}
									})
								}
								else if(presentTeam.round == 2){
									presentTeam.scdInings.forEach(inin => {
										if(inin.includes(null)){
											if((inin[0] == null && inin[1] != null) || (inin[0] != null && inin[1] == null)){
												nullCount++ 
											}
											else if(inin[0] == null && inin[1] == null){
												nullMatches++
											}
										}
									})
								}
								if(tot == 0){
									cap.soc.emit('bad-req')
								}
								else if(nullMatches == tot){
									cap.soc.emit("notif", "Select players for the below matches.")
								}
								else if(nullCount != 0){
									cap.soc.emit("notif", `${nullCount} players have no opponents..`)
								}
								else if(nullCount == 0 && nullMatches != 0){
									cap.soc.emit("nu-mat-pre-ok?", nullMatches)
								} 
								else{ 
									if(presentTeam.round == 1){
										// console.log("before 1: ")
										// console.log(presentTeam.fstInings)
										presentTeam.results = []
										presentTeam.gameStarted = true
										presentTeam.fstInings.forEach((inin,id) => {
											if(inin[0] != null && inin[1] != null){
												presentTeam.fstInings[id][presentTeam.currentStats.indexOf('bat')].score = 0
												presentTeam.fstInings[id][presentTeam.currentStats.indexOf('bowl')].score = null
												presentTeam.results.push("going-on")
												inin[0].soc.emit("game-starting", inin[1].username, presentTeam.currentStats[0])
												inin[1].soc.emit("game-starting", inin[0].username, presentTeam.currentStats[1])
												var gamish = {
													batsman: inin[presentTeam.currentStats.indexOf('bat')],
													bowler: inin[presentTeam.currentStats.indexOf('bowl')]
												}
												new halfGame(gamish, troomId, presentTeam.totalScores[presentTeam.currentStats.indexOf('bat')]);
											}
										})
										// console.log("after 1: ")
										// console.log(presentTeam.fstInings)
									}
									else if(presentTeam.round == 2){
										// console.log("before 2: ")
										// console.log(presentTeam.scdInings)
										presentTeam.results = []
										presentTeam.gameStarted = true
										presentTeam.scdInings.forEach((inin,id) => {
											if(inin[0] != null && inin[1] != null){
												presentTeam.scdInings[id][presentTeam.currentStats.indexOf('bat')].score = 0
												presentTeam.scdInings[id][presentTeam.currentStats.indexOf('bowl')].score = null
												presentTeam.results.push("going-on")
												inin[0].soc.emit("game-starting", inin[1].username, presentTeam.currentStats[0])
												inin[1].soc.emit("game-starting", inin[0].username, presentTeam.currentStats[1])
												var gamish = {
													batsman: inin[presentTeam.currentStats.indexOf('bat')],
													bowler: inin[presentTeam.currentStats.indexOf('bowl')]
												}
												new halfGame(gamish, troomId, presentTeam.totalScores[presentTeam.currentStats.indexOf('bat')]);
											}
										})
										// console.log('after 2')
										// console.log(presentTeam.scdInings)
									}
								}
							}
							else if(!presentTeam.bothCaptains && !presentTeam.gameStarted){ socket.emit("no-cap-opp") }
							else{ socket.emit("bad-req") }
						}
					})
					socket.on("start-the-game", () => {
						var sFoun = false;
						var cap = null;
						var idx = null;
						presentTeam.captains.forEach((cp,id) => {
							if(cp.soc == socket){
								sFoun = true
								cap = cp
								idx = id
							}
						})
						if(sFoun){
							if(presentTeam.bothCaptains && !presentTeam.gameStarted){
								var tot = presentTeam.fstInings.length
								var nullMatches = 0;
								var nullCount = 0;
								if(presentTeam.round == 1){
									presentTeam.fstInings.forEach(inin => {
										if(inin.includes(null)){
											if((inin[0] == null && inin[1] != null) || (inin[0] != null && inin[1] == null)){
												nullCount++ 
											}
											else if(inin[0] == null && inin[1] == null){
												nullMatches++
											}
										}
									})
								}
								else if(presentTeam.round == 2){
									presentTeam.scdInings.forEach(inin => {
										if(inin.includes(null)){
											if((inin[0] == null && inin[1] != null) || (inin[0] != null && inin[1] == null)){
												nullCount++ 
											}
											else if(inin[0] == null && inin[1] == null){
												nullMatches++
											}
										}
									})
								}
								if(tot == 0){
									cap.soc.emit('bad-req')
								}
								else if(nullMatches == tot){
									cap.soc.emit("all-null-matches")
								}
								else if(nullCount != 0){
									cap.soc.emit("some-no-opp", nullCount)
								}
								else{
									if(presentTeam.round == 1){
										presentTeam.results = []
										presentTeam.gameStarted = true
										presentTeam.fstInings.forEach((inin,ixd) => {
											if(inin[0] != null && inin[1] != null){
												presentTeam.fstInings[ixd][presentTeam.currentStats.indexOf('bat')].score = 0
												presentTeam.fstInings[ixd][presentTeam.currentStats.indexOf('bowl')].score = null
												presentTeam.results.push("going-on")
												inin[0].soc.emit("game-starting", inin[1].username, presentTeam.currentStats[0])
												inin[1].soc.emit("game-starting", inin[0].username, presentTeam.currentStats[1])
												var gamish = {
													batsman: inin[presentTeam.currentStats.indexOf('bat')],
													bowler: inin[presentTeam.currentStats.indexOf('bowl')]
												}
												new halfGame(gamish, troomId, presentTeam.totalScores[presentTeam.currentStats.indexOf('bat')]);
											}
										}) 
									}
									else if(presentTeam.round == 2){
										presentTeam.results = []
										presentTeam.gameStarted = true
										presentTeam.scdInings.forEach((inin,id) => {
											if(inin[0] != null && inin[1] != null){
												presentTeam.scdInings[id][presentTeam.currentStats.indexOf('bat')].score = 0
												presentTeam.scdInings[id][presentTeam.currentStats.indexOf('bowl')].score = null
												presentTeam.results.push("going-on")
												inin[0].soc.emit("game-starting", inin[1].username, presentTeam.currentStats[0])
												inin[1].soc.emit("game-starting", inin[0].username, presentTeam.currentStats[1])
												var gamish = {
													batsman: inin[presentTeam.currentStats.indexOf('bat')],
													bowler: inin[presentTeam.currentStats.indexOf('bowl')]
												}
												new halfGame(gamish, troomId, presentTeam.totalScores[presentTeam.currentStats.indexOf('bat')]);
											}
										})
									}
								}
							}
							else if(!presentTeam.bothCaptains && !presentTeam.gameStarted){ socket.emit("no-cap-opp") }
							else if(presentTeam.gameStarted){ socket.emit("notif", "Game has already started.") }	
							else{ socket.emit("bad-req") }
						}
					})
					socket.on("agame-over-team", () => {
						var sucRes = []
						var goRes = []
						var flRes = []
						var fstScores = []
						var scdScores = []
						var teamAsco;
						var teamBsco;
						presentTeam.results.forEach((res,i) => {
							if(res == "success"){
								sucRes.push(i)
								if(presentTeam.round == 1){
									fstScores[i] = presentTeam.fstInings[i][presentTeam.currentStats.indexOf("bat")].score
								}
								else if(presentTeam.round == 2){
									scdScores[i] = presentTeam.scdInings[i][presentTeam.currentStats.indexOf('bat')].score
									fstScores[i] = presentTeam.fstInings[i][presentTeam.currentStats.indexOf('bowl')].score
								}
							}
							else if(res == "fail"){
								flRes.push(i)
							}
							else{
								goRes.push(i)
							}
						})
						if(presentTeam.round == 1){
							if(presentTeam.currentStats.indexOf('bat') == 0){
								teamAsco = fstScores
								teamBsco = []
							}
							else{
								teamAsco = []
								teamBsco = fstScores
							}
						}
						else if(presentTeam.round == 2){
							if(presentTeam.currentStats.indexOf('bat') == 0){
								teamAsco = scdScores
								teamBsco = fstScores
							}
							else{
								teamBsco = scdScores
								teamAsco = fstScores
							}
						}
						io.to(troomId+"-team").emit("res-refresh", sucRes, flRes, goRes, teamAsco, teamBsco, presentTeam.totalScores)
						if(!presentTeam.results.includes("going-on") && presentTeam.round == 1){
							io.to(troomId+"-team").emit("fst-inin-comp")
							presentTeam.gameStarted = false
						}
						else if(!presentTeam.results.includes("going-on") && presentTeam.round == 2){
							var teamWin;
							if(presentTeam.totalScores[0] > presentTeam.totalScores[1]){
								teamWin = "A"
							}
							else if(presentTeam.totalScores[0] < presentTeam.totalScores[1]){
								teamWin = "B"
							}
							else{
								teamWin = "draw"
							}
							io.to(troomId+"-team").emit("scd-inin-comp", teamWin, presentTeam.detRes)
							presentTeam.gameStarted = false
							presentTeam.matchEnded = true
						}
					})
					socket.on("scd-inin-srt", () => {
						var sFoun = false;
						var cap = null;
						var idx = null;
						presentTeam.captains.forEach((cp,id) => {
							if(cp.soc == socket){
								sFoun = true
								cap = cp
								idx = id
							}
						})
						if(sFoun){
							if(presentTeam.bothCaptains && !presentTeam.gameStarted){
								presentTeam.round = 2
								presentTeam.gameStarted = false
								presentTeam.currentStats = [presentTeam.currentStats[1], presentTeam.currentStats[0]]
								presentTeam.teamAtaken = []
								presentTeam.teamBtaken = []
								var nor = 0;
								presentTeam.teamA.length < presentTeam.teamB.length? nor = presentTeam.teamA.length: nor = presentTeam.teamB.length
								var j = 1;
								while(j <= nor){
									presentTeam.scdInings.push([null, null])
									j++
								}
								io.to(troomId+"-team").emit("round2-red", presentTeam.currentStats)
							}
							else if(!presentTeam.bothCaptains){ socket.emit("no-cap-opp") }
						}
					})
					socket.on("chose-them-team", name => {
						var sFoun = false;
						var cap = null;
						var idx = null;
						presentTeam.captains.forEach(cp => {
							if(cp.soc == socket){
								sFoun = true
								cap = cp
								idx = presentTeam.captains.indexOf(cp)
							}
						})
						// console.log(presentTeam.captains)
						if(sFoun){
							// console.log('Hello')
							if(presentTeam.bothCaptains){
								if((presentTeam.captainCho == "A" && idx == 0) || (presentTeam.captainCho == "B" && idx == 1)){
									//console.log(captainCho)
									//console.log(idx)
									var waitip = []
									presentTeam.waitingPlayers.forEach(plr => {
										waitip.push(plr.username)
									})
									if(waitip.includes(name)){
										// console.log('[gfjdfgj')
										var playr = null;
										presentTeam.waitingPlayers.forEach(pl => {
											if(pl.username == name){
												playr = pl
											}
										})
										if(presentTeam.captainCho == "A" && playr != null){
											presentTeam.teamA.push(playr)
										}
										else if(presentTeam.captainCho == "B" && playr != null){
											presentTeam.teamB.push(playr)
										}
										else{
											// console.log("problem")
										}
										if(presentTeam.teamA.length > presentTeam.teamB.length){
											presentTeam.captainCho = "B"
										} 
										else if(presentTeam.teamA.length < presentTeam.teamB.length){
											presentTeam.captainCho = "A"
										}
										else if(presentTeam.teamA.length == presentTeam.teamB.length){
											presentTeam.captainCho == "A"? presentTeam.captainCho = "B": presentTeam.captainCho = "A"
										}
										presentTeam.waitingPlayers.splice(presentTeam.waitingPlayers.indexOf(playr), 1)
										var ap = [];
										var bp = [];
										var waitp = [];
										presentTeam.teamA.forEach(plr => {
											ap.push(plr.username)
										})
										presentTeam.teamB.forEach(plr => {
											bp.push(plr.username)
										})
										presentTeam.waitingPlayers.forEach(plr => {
											waitp.push(plr.username)
										})
										// socket.emit("refresh-users", ap, bp, waitp)
										io.to(troomId+"-team").emit("refresh-users", ap, bp, waitp)  
										// console.log("END")
									}
									else{ cap.soc.emit("bad-req") }
								}
								else{ cap.soc.emit("opp-cap-turn") }
							}
							else{
								cap.soc.emit("wait-opp-cap")
							}
						}
					})
					
					presentTeam.players.forEach(player => {
						// player.on()
					})
				}
				else{
					socket.emit("no-allow")
				}
			}
			else if(id && allow){
				socket.emit("team-404")
			}
			else{
				socket.emit("bad-req")
			}
		}
		else if(id){
			socket.emit("redirecting", ("/teams/"+id)) 
			// console.log("redirect")
		}
		else{
			socket.emit("bad-req")
		}
	})
	// }

	/* For Multiplayer Matches */

	// if(presentIn.includes("match")){
	socket.on("joined-match", (name, id, passwd) => {
		if(loc != null && loc.includes("/match/")){
			var href = loc.split("/match/")[1].substring(0, 4)
		}else{ var href = "none" }
		
		if(times < 1 && href == id && name && id && passwd){
			roomId = id
			var matchedPlayers;
			var password = 0;
			var auth = false
			var roomFound = false
			onlineMatches.forEach(match => {
				if(match.roomId == roomId){
					matchedPlayers = match.players
					roomFound = true
					password = match.passcode
				}
			})
			if(roomFound){
				if(passwd == password){
					auth = true
					socket.emit("success-pass", passwd)
					times++
				}
				else{
					socket.emit("no-allow")
				}

				if(matchedPlayers && matchedPlayers.includes('null') && auth){
					matchedPlayers.splice(matchedPlayers.indexOf('null'),1)
				}

				if(matchedPlayers && matchedPlayers.length < 2 && !matchedPlayers.includes(socket) && auth){
					matchedPlayers.push(socket)
					onlineMatches.forEach(match => {
						if(match.roomId == roomId){ 
							match.players = matchedPlayers
							match.status = 'online'
						}
			 		}) 
					socket.emit("match-join-s")
					socket.join(roomId)
					// console.log(matchedPlayers.length)
					// console.log("A player joined match "+roomId)
					if(matchedPlayers.length == 1){
						io.to(roomId).emit("wait-opp")
					}
					else if(matchedPlayers.length == 2){
						matchedPlayers.forEach(player => { player.emit("found-opp") })
						new game(matchedPlayers[0], matchedPlayers[1]);
						// console.log("Match maken.")
					}
				}
				else if(auth){
					// console.log(auth)
					socket.emit("waiting-out")  
					// console.log("A Player in waiting room "+roomId)
				}
			}  
			else{ 
				socket.emit('room-404')
				// console.log(`${roomId} is not created.`)
			}
		}
		else if(id){
			socket.emit("redirecting", ("/match/"+id))
		}
		else{
			socket.emit("bad-req")
		}
	})

	socket.on("disconnect", () => {
		var matchedPlayers;
		var teamReal;
		var mroomFound = false
		var troomFound = false
		var name;
		socket.emit("disconnected")

		onlineTeams.forEach(team => {
			if(team.players.length < 1){
				team.status = "offline"
				team.captains = [null,null]
			}
			if(team.roomId == troomId){
				teamReal = team
				troomFound = true
			}
		})
		if(troomFound){
			var waitp=[];
			var teampa=[];
			var teampb=[];

			teamReal.teamA.forEach(pl => {
				if(pl.soc == socket){
					teamReal.captainCho = "A"
					teamReal.teamA.splice(teamReal.teamA.indexOf(pl), 1)
				}
			})
			teamReal.teamA.forEach(pl => {
				teampa.push(pl.username)
			})
			teamReal.teamB.forEach(pl => {
				if(pl.soc == socket){
					teamReal.captainCho = "B"
					teamReal.teamB.splice(teamReal.teamB.indexOf(pl), 1)
				}
			})
			teamReal.teamB.forEach(pl => {
				teampb.push(pl.username)
			})
			teamReal.waitingPlayers.forEach(pl => {
				if(pl.soc == socket){
					teamReal.waitingPlayers.splice(teamReal.waitingPlayers.indexOf(pl), 1)
				}
			})
			teamReal.captains.forEach((pl,idx) => {
				if(pl != null && pl.soc == socket){
					io.to(troomId+"-team").emit("captain-left", pl.username)
					teamReal.captains[idx] = null
					teamReal.bothCaptains = false
				}
			})
			teamReal.waitingPlayers.forEach(pl => {
				waitp.push(pl.username)
			})

			teamReal.players.forEach(player => {
				if(player.soc == socket){
					name = player.username
					teamReal.fstInings.forEach((inin,ix) => {
						if(inin[0] == player){
							teamReal.fstInings[ix][0] = null
						}
						else if(inin[1] == player){
							teamReal.fstInings[ix][1] = null
						}
					})
					var leftIndex = null;
					var leftTeam = null;
					teamReal.teamAtaken.forEach((plr,ix) => {
						if(plr == player){
							leftIndex = ix
							leftTeam = "A"
							teamReal.teamAtaken.splice(teamReal.teamAtaken.indexOf(player), 1)
						}
					})
					teamReal.teamBtaken.forEach((plr,ix) => {
						if(plr == player){
							leftIndex = ix
							leftTeam = "B"
							teamReal.teamBtaken.splice(teamReal.teamBtaken.indexOf(player), 1)
						}
					})
					
					var faa = [];
					var fab = [];
					teamReal.fstInings.forEach((inin,ix) => {
						if(inin[0] == null){
							faa[ix] = "null"
						}
						else{
							faa[ix] = inin[0].username	
						}
					})
					teamReal.fstInings.forEach((inin,ix) => {
						if(inin[1] == null){
							fab[ix] = "null"
						}
						else{
							fab[ix] = inin[1].username	
						}
					})
					io.to(troomId+"-team").emit("splayer-left", name, faa, fab)
					// console.log(`${player.username} has left team ${troomId}`)
					teamReal.players.splice(teamReal.players.indexOf(player), 1)
				}
			})
			socket.to(troomId+"-team").broadcast.emit('player-left-team', waitp, teampa, teampb, name)
		}
		onlineTeams.forEach(team => {
			if(team.roomId == troomId){
				team = teamReal
				/*if(team.players.length < 1){
					onlineTeams.splice(onlineTeams.indexOf(team), 1)
				}*/
			}
		})

		onlineMatches.forEach(match => {
			if(match.roomId == roomId){
				matchedPlayers = match.players 
				mroomFound = true
			}  
		}) 
		if(mroomFound){
			if(matchedPlayers.includes(socket)){
				matchedPlayers.splice(matchedPlayers.indexOf(socket), 1)
				// console.log(matchedPlayers.length)
				// console.log("A player left "+roomId)
				io.to(roomId).emit("opp-left")
				socket.leave(roomId)
			} 
		}  
		onlineMatches.forEach(match => {
			if(match.roomId == troomId){
				match.players = matchedPlayers
				/*if(matchedPlayers < 1){
					onlineMatches.splice(onlineMatches.indexOf(match), 1)
				}*/
			}
		})
	})
})


const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

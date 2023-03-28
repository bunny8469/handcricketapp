const socket = io({transports: ['websocket'], upgrade: false});

if(name == "null"){
	name = prompt("Name: ");
}

var notifCreated = false;
var notifs = "enabled";
var msgContainerOpened = false;
var waitChoose = false;
var innings = null;
var captain = false;
var yourTeam = null;
var gameOver = false;
var nor = 0;
var mode = "player"
var timer;

/* Basic Configuration */
socket.emit('location', window.location.href)
function id(x){
	return document.getElementById(x)
}
function randomNumber(min, max){  
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function q(x){
	return document.querySelector(x)
}
function ripple(n){
	var ripple = document.createElement('span')
	ripple.className = 'ripple'
	q('.btn'+n).appendChild(ripple)
	gsap.to('.ripple', {duration:0.35, transform: 'scale(15)', opacity: '0.4', ease:'sine.out'})
	setTimeout(function(){
		for(var el of q('.btn'+n).children){
			if(el.className == 'ripple'){
				q('.btn'+n).removeChild(el)
			}
		}
	},500)
}
socket.on('connect_failed', function() {
   document.write("Sorry, there seems to be an issue with the connection!");
})
/* Basic Configuration ends */

document.querySelectorAll('.small-msg').forEach(el => {
	el.addEventListener("click", sendMessage)
})
function sendMessage(){
	var msg = event.target.innerText
	socket.emit("message-to-player-team", msg)
}
socket.on("message-from-player-team", msg => {
	sendNotif("Opp says: "+msg)
})
if(pwd != null){
	join()
}
if(pwd == null){
	id('passwd').focus()
	gsap.to(".password-box", {xPercent:-50, yPercent:-50, duration:0.3, top:'50%', left:'50%', transform:'scaleY(1)', ease:'sine.out'})
}


const checkEnter = () => {
	if(event.keyCode == 13){
		join()
	}
}
id('passwd').addEventListener('keydown', checkEnter)

function join(){
	if(pwd == null){
		socket.emit("joined-team", name, roomId, id("passwd").value)
	}
	else{
		socket.emit("joined-team", name, roomId, pwd)
	}
	q('.passwd-sbmt').innerHTML = "<i class='fa fa-circle-o-notch fa-spin'></i>Loading"
}

socket.on("success-pass", (psd) => {
	sendNotif('Entered Team #'+roomId)
	id('passwd').removeEventListener('keydown', checkEnter)
	q('.passwd-sbmt').innerHTML = "<i class = 'far fa-check-circle'></i>Joined"
	gsap.to('.password-box', 0.5,
	{
		top:'0',
		opacity:'0',
		ease:'sine.out'
	})
	gsap.to('.password-box',{delay: 0.5, display: 'none'})
	q('.whatsapp-link').style.display = 'block'
	var portnum = "";
	if(window.location.port != "" || window.location.port != null){
		portnum = ":"+window.location.port
	}
	var link = window.location.protocol+"//"+window.location.hostname+"/teams/"+roomId+"?pwd="+psd
	var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
	if(isMobile){
		q('.whatsapp-link').href = 'whatsapp://send?text='+encodeURIComponent("*Room Invite:*\n\n Come join me, let\'s play _Hand Cricket_ online. "+link)
		q('.whatsapp-link').target = '_blank'
		q('.share-btn').style.display='flex'
		q('.share-btn').addEventListener('click', async () => {
			try {
	   			await navigator.share({title:'Hand-Cricket', text:'*Room Invite:*\n\n Come join me, let\'s play *Hand Cricket* online. ', url:link})
	    		console.log('MDN shared successfully')
	  		} catch(err) {
	    		console.log("Share Error: "+err)
	  		}
		})
	}
	else{
		q('.whatsapp-link').href = 'https://web.whatsapp.com/send?text='+encodeURIComponent("*Room Invite:*\n\n Come join me, let's play *Hand Cricket* online. "+link)
		q('.whatsapp-link').target = '_blank'
	}
})
socket.on("name-in-use", (nnm) => {
	sendNotif("The name you chose is in use. Your name would be "+nnm)
})
socket.on("no-allow", () => {
	id('passwd').focus()
	gsap.to(".password-box", 
	{
		xPercent:-50, 
		yPercent:-50,
		duration:0.3,
		top:'50%',
		left:'50%',
		transform:'scaleY(1)',
		ease:'sine.out',
	})
	sendNotif("The password is invalid")
	q('#passwd').value = ""
	q('.passwd-sbmt').innerHTML = "Join"
	pwd = null
})
function sendNotif(info, utime){
	if(notifs == "enabled"){
		if(notifCreated){
			id('main').removeChild(q(".notif"))	
		}
		var notif = document.createElement("div")
		notif.className = "notif"
		notif.innerText = info
		id('main').appendChild(notif)
		gsap.to(".notif", {delay:0.2, duration: 0.3, top:'12%'})
		notifCreated = true
		if(utime != "forever"){
			setTimeout(function(){
				if(id('main').contains(notif)){
					id('main').removeChild(notif)
					notifCreated = false
				}
			}, 2500)
		}
	}	
}
function ballr(x){
	socket.emit("game-ball-team", x)
	clearTimeout(timer)
	if(mode == "comp"){
		socket.emit("back-to-plr")
	}
	mode = "player"
	q('.you-num').style.color = '#000'
	q('.you-comp').style.display = 'none'
	ripple(x)
}
socket.on("opp-bk-plr", () => {
	q('.other-num').style.color = '#000'
	q('.other-comp').style.display = 'none'
})
socket.on("team-404", () => {
	sendNotif("We couldn't find any team with id "+roomId, "forever")
	q('#passwd').value = ""
	q('.passwd-sbmt').innerHTML = "Join"
})
socket.on("redirecting", destination => {
	console.log("redirect")
	window.location.href = destination;
})
socket.on("you-bats-out", score => {
	sendNotif("Game Over!")
	clearTimeout(timer)
	socket.emit("agame-over-team")
	gsap.to(".balls-div", {duration: 0.4, delay: 0.8, bottom: "-91%", ease:'sine.out', opacity: 0.4})
	q(".game-over-screen").innerHTML = 
	`
		<div style = "font-family:'Press Start 2P';margin-bottom:20px;">Game Over</div>
		<div>You scored ${score}</div>
	`
	q('.game-over-screen').style.display = "flex"
	gsap.to(".game-over-screen", {delay:1.22, duration: 0.4, bottom:'0%', ease: 'sine.out'})
	gsap.to(".game-over-screen", {delay:6, duration: 0.4, bottom:'-91%', ease: 'sine.out'})
	setTimeout(function(){
		q('.game-over-screen').style.display = 'none'
		q('.balls-div').style.display = 'none'
	}, 5500)
})
socket.on("res-refresh", (s,f,g,as,bs,ts) => {
	s.forEach(i => {
		q(".alter-sym"+(i+1)).innerHTML = "<i class='fas fa-check-circle alt-check-circle'></i>"
	})
	f.forEach(i => {
		q(".alter-sym"+(i+1)).innerHTML = "<i class='fas fa-times-circle alt-times-circle'></i>"
	})
	g.forEach(i => {
		q('.alter-sym'+(i+1)).innerHTML = '<img class = "vs-sym" src="../Teams/images/versus-sym.png">'
	})
	as.forEach((x,i) => {
		if(x){
			q(".plrsc1"+(i+1)).innerText = x
		}
	})
	bs.forEach((x,i) => {
		if(x){
			q(".plrsc2"+(i+1)).innerText = x
		}
	})
	q(".score-WarBringers").innerText = ts[0]
	q('.score-Howlers').innerText = ts[1]
})
socket.on("error-opp-left-team", () => {
	socket.emit("agame-over-team")
	sendNotif("Opponent has left..")
	gsap.to(".balls-div", {duration: 0.4, delay: 0.8, bottom: "-91%", ease:'sine.out'})
	q(".game-over-screen").innerHTML = 
	`
		<div style = "font-family:'Press Start 2P'">Game Over</div>
		<div>Opponent ${nm} scored ${score} in your bowling.</div>
	`
	gsap.to(".game-over-screen", {delay:1.22, duration: 0.4, bottom:'0%', ease:'sine.out'})
	gsap.to(".game-over-screen", {delay:6, duration: 0.4, bottom:'-91%', ease: 'sine.out'})
	setTimeout(function(){
		q('.game-over-screen').style.display = 'none'
		q('.balls-div').style.display = 'none'
	}, 5500)
})
socket.on("fst-inin-comp", () => {
	sendNotif("First Innings are Over!")
	q(".inin-head").innerText = "Inin | #1 Over"
	q(".continue-btn").innerHTML = "2nd Innings &#8594;"
	q('.continue-btn').style.letterSpacing = 'normal'
	q('.continue-btn').setAttribute('onclick', 'socket.emit("scd-inin-srt")')
})
socket.on("round2-red", (cs) => {
	shiftTransition()
	q(".inin-table").innerHTML = ""
	refreshRows()
	q('.continue-btn').style.letterSpacing = 'normal'
	q('.continue-btn').innerText = "START-2"
	q('.continue-btn').setAttribute('onclick', 'checkPreq()')
	q('.inin-head').innerText = "Innings #2"
	sendNotif('Innings #2')
	q('.stat-WarBringers').innerText = cs[0]+"ing"
	q('.stat-Howlers').innerText = cs[1]+"ing"
})
socket.on("opp-bats-out", (score,nm) => {
	sendNotif("Game Over!")
	clearTimeout(timer)
	gsap.to(".balls-div", {duration: 0.4, delay: 0.8, bottom: "-91%", ease:'sine.out'})
	q(".game-over-screen").innerHTML = 
	`
		<div style = "font-family:'Press Start 2P'">Game Over</div>
		<div>Opponent ${nm} scored ${score} in your bowling.</div>
	`
	gsap.to(".game-over-screen", {delay:1.22, duration: 0.4, bottom:'0%', ease:'sine.out'})
	gsap.to(".game-over-screen", {delay:6, duration: 0.4, bottom:'-91%', ease: 'sine.out'})
	setTimeout(function(){
		q('.game-over-screen').style.display = 'none'
		q('.balls-div').style.display = 'none'
	}, 5500)
})
socket.on("player-captain", () => {
	captain = true
	sendNotif(`You are the Captain.`)
	refreshUsers(waitinP, teamingA, teamingB)
	q('.continue-btn').setAttribute("onclick", "confirmCon()")
	q('.continue-btn').style.backgroundColor = "#ff4d90"
})
socket.on("disconnected", () => {
	sendNotif("Something went wrong.", "forever")
})
socket.on("no-auth", () => {
	sendNotif("We could not Authorize you", "forever")
})
var yourName;
socket.on("you-joined-team", (waip, ap, bp, youName) => {
	yourName = youName
	refreshUsers(waip,ap,bp)
	sendNotif(`You joined the teams`)
})
socket.on("player-joined-team", (waip, ap, bp, name) => {
	refreshUsers(waip, ap, bp)
	sendNotif(`${name} has joined the teams`)
})
socket.on("player-left-team", (waitp, pa, pb, nam) => {
	refreshUsers(waitp, pa, pb)
	if(nam != null){
		sendNotif(`${nam} has left the teams.`)
	}
})
socket.on("captain-left", (name) => {
	sendNotif(`Captain ${name} has left`)
})
socket.on("wait-opp-cap", () => {
	sendNotif("Waiting for Opp Captain..")
})
socket.on("opp-cap-turn", () => {
	sendNotif("The Opp Captain's turn!!")
})
socket.on("refresh-users", (ap,bp,waip) => {
	refreshUsers(waip,ap,bp)
})
var waitinP = []
var teamingA = []
var teamingB = []
function refreshUsers(waip, ap, bp){
	// console.log("Waiting:"+waip)
	// console.log("Team A:"+ap)
	// console.log("Team B:"+bp)
	waitinP = []
	teamingA = []
	teamingB = []
	var ul = q(".waiting-list")
	ul.innerHTML = ''
	waip.forEach(nm => {
		var li = document.createElement('li')
		li.innerText = nm
		li.name = nm
		li.className = "wting-playr"
		li.setAttribute("onclick", `chooseThem("${nm.toString()}")`)
		if(nm == yourName){
			li.id = "you-team-player"
		}
		waitinP.push(nm)
		ul.appendChild(li)
		// console.log(waip)
	})
	q('.teamA').innerHTML = '<p class = "team-name">WarBringers</p>'
	q('.teamB').innerHTML = '<p class = "team-name">Howlers</p>'
	ap.forEach((nm,idx) => {
		var p = document.createElement('p')
		p.innerText = nm
		p.className = "elrow"
		if(nm == yourName){
			p.id = "you-team-player"
			yourTeam = "WarBringers"
		}
		if(idx == 0){
			socket.emit('new-cap?', "A", nm)
			p.innerHTML += "<i class='fas fa-copyright'></i>"
		}
		teamingA.push(nm)
		q(".teamA").appendChild(p)
		// console.log(ap)
	})
	bp.forEach((nm,idx) => {
		var p = document.createElement('p')
		p.innerText = nm
		p.className = "elrow"
		if(nm == yourName){
			p.id = "you-team-player"
			yourTeam = "Howlers"
		}
		// console.log(bp)
		if(idx == 0){
			socket.emit('new-cap?', "B", nm)
			p.innerHTML += "<i class='fas fa-copyright'></i>"
		}
		teamingB.push(nm)
		q(".teamB").appendChild(p)
	})
}
function chooseThem(nm){
	socket.emit("chose-them-team", nm)
}
function confirmCon(){
	q(".alert-box").innerHTML = `
		<i class="fas fa-info-circle"></i>
		<p>After continuing, No more players are allowed. Waiting players are kicked out. Continue?</p>
		<button class = "alert-btn" onclick="continueG()">Yep</button>
		<button class = "alert-btn" onclick="closePopup()">Nope</button>
	`
	q('.alert-box').style.display = "flex"
	q('.alert-box').style.opacity = '1'
	gsap.to(".alert-box", {xPercent:-50, yPercent:-50, duration:0.3, top:'50%', left:'50%', transform:'scaleY(1)', ease:'sine.out'})
}
function closePopup(){
	gsap.to('.alert-box', 0.5, {top:'0', opacity:'0', ease:'sine.out'})
	setTimeout(function(){q(".alert-box").style.display = "none"}, 550)
}
function continueG(){
	closePopup()
	if(teamingA.length >= 1 && teamingB.length >= 1){
		if(teamingA.length == teamingB.length){
			socket.emit("toss-time-team")
			q('.waiting-list').innerText = ''
			q('.waiting-list').style.display = 'none'
		}
		else{
			sendNotif("Teams are unequal..")
		}
	}
	else{
		sendNotif('No captain for Opp team')
	}
}
socket.on("no-cap-opp", () => {
	sendNotif("No Captain for Opp team.")
})
socket.on('oth-cap-con', () => {
	sendNotif("The Other Captain continued to toss")
	closePopup()
	shiftTransition()
	q('.waiting-list').innerText = ''
	q('.waiting-list').style.display = 'none'
	setTimeout(function(){q(".toss-screen").style.display = "block"}, 3500)
	q('.whatsapp-link').style.display = 'none'
	q('.share-btn').style.display = 'none'
})
socket.on("toss-hap", () => {
	sendNotif("Captains are tossing..", "forever")
	q('.waiting-list').innerText = ''
	q('.waiting-list').style.display = 'none'
	q('.whatsapp-link').style.display = 'none'
	q('.share-btn').style.display = 'none'
})
socket.on("you-go-out", () => {
	sendNotif("Captains did not choose in a team. ", "forever")
	document.write("Sorry but Captains did not choose you in a team.<br><a href='/home'>Go to Homepage</a>")
})
function tossEL(side){
	socket.emit("toss-chosen", side)
	q('.res-span').innerHTML = "<i class='fas fa-cog fa-spin'></i>"
}
socket.on("game-starts", () => {
	q(".you-comp").style.display = 'none'
	q('.other-comp').style.display = 'none'
	mode = "player"
	q('.balls-div').style.display = "block"
	q('.balls-div').style.opacity = '1'
	gsap.to('.balls-div', { duration: 0.5, delay: 1.5, bottom:'0'})
	setTimeout(function(){ 
		q('.balls-div').style.bottom = '0'
		q('.balls-div').style.opacity = '1'
	}, 3000)
	setTimeout(function(){ 
		q('.balls-div').style.bottom = '0'
		q('.balls-div').style.opacity = '1'
	}, 3500)
	timer = setTimeout(compMode, 20000)
})
function compMode(){
	mode = "comp"
	sendNotif("Entered Computer mode")
	q('.you-comp').style.display = 'block'
	socket.emit("comp-mode")
	q('.you-num').style.color = '#8300ff'
	var num = randomNumber(1,6)
	setTimeout(function(){
		socket.emit("game-ball-team", num)
		ripple(num)
	}, 800)
}
socket.on("opp-comp", () => {
	q('.other-comp').style.display = 'block'
	q('.other-num').style.color = '#8300ff'
})
socket.on("cap-chose", (name,side) => {
	sendNotif(`Captain ${name} chose ${side}`, 'forever')
})
socket.on("toss-ht", () => {
	shiftTransition()
	setTimeout(function(){q(".toss-screen").style.display = "block"}, 2700)
	q('.whatsapp-link').style.display = 'none'
	q('.share-btn').style.display = 'none'
})
socket.on('other-choose-toss', () => {
	q('.norm-para').innerHTML = `The Opp Captain is choosing heads or tails.
Wait for the result`
	q('.norm-para').style.top = "50%"
	q(".norm-para").style.left = "50%"
	q(".norm-para").style.fontSize = "120%"
	q(".tails-toss").style.display = "none"
	q(".heads-toss").style.display = "none"
	q(".name-heads").style.display = "none"
	q(".name-tails").style.display = "none"
})
/* 
	socket.on("toss-won", (name,side) => {
		setTimeout(function(){
			q('.res-span').innerText = side
		},500)
		setTimeout(function(){
			sendNotif("You won the toss")
			q('.toss-screen').style.display = "none"
			shiftTransition()
		},1800)
		
	})
*/
socket.on("this-won-toss", (name,sd,rs) => {
	setTimeout(function(){
		q('.res-span').innerText = rs
	},850)
	setTimeout(function(){
		q('.toss-screen').style.display = "none"
		sendNotif(`Captain ${name} won the toss`)
		shiftTransition()
	},1600)	
	if(name == yourName){
		setTimeout(function(){
			q('.batorbol').style.display = "block"
			gsap.to(".batorbol", {duration:0.3, bottom:'0', ease: 'sine.out'})
		}, 1300)
	}
	if(captain){
		q('.continue-btn').setAttribute("onclick", "checkPreq()")
	}
	q('.continue-btn').innerText = "START"
	
})
function startGame(){
	socket.emit("start-the-game")
}
function checkPreq(){
	socket.emit("check-preq-game")
}
socket.on('notif', ms => {
	sendNotif(ms)
})
socket.on("both-choose-ok-team", (yb, ob, nb, score, con) => {
	waitChoose = false
	q('.you-num').innerHTML = yb
	q('.other-num').innerHTML = ob
	if(nb != 'no' && con){
		id('player-score').innerText = 0
		id('opponent-score').innerText = score
		q('#heading-all').innerText = "Ball #"+nb
	}
	else if(nb != 'no' && !con){
		id('player-score').innerText = score
		id('opponent-score').innerText = 0
		q('#heading-all').innerText = "Ball #"+nb
	}
	if(mode != "comp"){
		timer = setTimeout(compMode, 20000)
	}
	if(mode == "comp"){
		var num = randomNumber(1,6)
		setTimeout(function(){
			socket.emit("game-ball-team", num)
			ripple(num)
		}, 800)
	}
	setTimeout(function(){
		if(!waitChoose && nb != 'no' && !gameOver){
			q('.you-num').innerHTML = '<i class = "fas fa-cog fa-spin"></i>'
			q('.other-num').innerHTML = '<i class = "fas fa-cog fa-spin"></i>'
			q('#heading-all').innerText = "Ball #"+(nb+1)
		}
	}, 3000)
})
socket.on("wait-for-opp", (x, y) => {
	// alert("Waiting for opponent to choose.")
	waitChoose = true
	q('.you-num').innerHTML = x
	q('.other-num').innerHTML = "<i class = 'fas fa-cog fa-spin'></i>"
	if(y != "no-display-ball"){
		q('#heading-all').innerText = 'Ball #'+y
	}
})
socket.on('game-starting', (nm,st) => {
	sendNotif(`You have a match with ${nm}`)
	q(".you-name-blo").innerText = yourName
	q(".opp-name-blo").innerText = nm
	q(".you-stat").innerText = st
	q('#player-score').innerText = 0
	q('#opponent-score').innerText = 0
	st == "bat"? q(".other-stat").innerText = "bowl": q(".other-stat").innerText = "bat" 
})
socket.on("nu-mat-pre-ok?", n => {
	// console.log("nu-mat")
	q(".alert-box").innerHTML = `
		<i class="fas fa-info-circle"></i>
		<p>${n} matches are not filled. Only matches scheduled will be played. Continue?</p>
		<button class = "alert-btn" onclick="startGame()">Yep</button>
		<button class = "alert-btn" onclick="closePopup()">Nope</button>
	`
	q('.alert-box').style.display = "flex"
	q('.alert-box').style.opacity = '1'
	gsap.to(".alert-box", {xPercent:-50, yPercent:-50, duration:0.3, top:'50%', left:'50%', transform:'scaleY(1)', ease:'sine.out'})
})
function choseStat(stat){
	socket.emit('chose-this', stat)
}
socket.on("they-chose-this", (st,teasm) => {
	q('.stat-WarBringers').style.display = 'flex'
	q('.stat-Howlers').style.display = 'flex'
	sendNotif(`${teasm} chose to ${st} first`)
	gsap.to('.batorbol', {duration:0.4, delay: 0.5, bottom:'-91%', ease:'sine.out'})
	q('.inin-table').style.display = 'flex'
	innings = 1
	st == 'bat'? q('.stat-'+teasm).innerText = 'Batting': q('.stat-'+teasm).innerText = 'Bowling'
	if(teasm == "WarBringers"){
		st == 'bowl'? q('.stat-'+'Howlers').innerText = 'Batting': q('.stat-'+'Howlers').innerText = 'Bowling'
	}
	else if(teasm == "Howlers"){
		st == 'bowl'? q('.stat-'+'WarBringers').innerText = 'Batting': q('.stat-'+'WarBringers').innerText = 'Bowling'
	}
	q('.stat-'+yourTeam).style.backgroundColor = "#74ffd9"
	q('.stat-'+yourTeam).style.color = "black"
	q(".score-WarBringers").style.display = 'flex'
	q(".score-Howlers").style.display = 'flex'
	q('.score-'+yourTeam).style.backgroundColor = '#74ffd9'
	q('.score-'+yourTeam).style.color = "black"
	q('.inin-head').innerText = "Innings #"+1
	refreshRows()
})
function refreshRows(){
	nor = 0
	/*if(teamingA.length > teamingB.length){
		if(teamingA.includes())
		nor = teamingA.length
	}*/
	teamingA.length > teamingB.length? nor = teamingB.length : nor = teamingA.length
	var i = 1;
	while(i <= nor){
		/*
			<tr>
				<td>#1 </td>
				<td><p class = "inin-block"></p></td>
				<td class = "alter-sym"><img class = "vs-sym" src="../Teams/images/versus-sym.png"></td>
				<td><p class = "inin-block"></p></td>
			</tr>
		*/
		var tr = document.createElement('tr')
		tr.innerHTML = `
			<td>#${i} </td>
			<td><p class = "inin-block" id="cord1${i}" onclick = 'selectBro(1,${i})'></p></td>
			<td class = "alter-sym${i}"><img class = "vs-sym" src="../Teams/images/versus-sym.png"></td>
			<td><p class = "inin-block" id="cord2${i}" onclick = 'selectBro(2,${i})'></p></td>
		`
		q(".inin-table").appendChild(tr)
		i++
	}
	// store the before selected players in a variable (maybe from backend would be nice..)
	// complete new match innings if the left player was selected before :) 
	// Love and regards from the past Praneeth (yesterday XD.. duh!!) <3 
}

// #74ffd9 | #ff7c8c
var flossOpen;
function selectBro(x, y){
	socket.emit('get-avail-players', x, y)
}
socket.on('list-of-avail-plrs', (list,x,y) => {
	// console.log("recieved.")
	q(".chose-vro").innerHTML = `
		<i class = 'fas fa-times' onclick = "closecvro()"></i>
		<span>Select Player</span>
	`
	for(var nm of list){
		var p = document.createElement("p")
		p.className = 'vro'
		p.innerText = nm
		p.setAttribute("onclick", `selectThisPlr(${x},${y})`)
		q(".chose-vro").appendChild(p)
		/*	<p class = "vro">Bunny</p>	*/
	}
	q('.floss-glass').style.display = 'block'
	q('.chose-vro').style.display = 'flex'
	flossOpen = true
})
socket.on('put-him-there', (n,x,y) => {
	q('#cord'+x+y).innerText = n
	if(x == 1){
		q('#cord1'+y).innerHTML += `<span class = "score-indv plrsc1${y}"></span></p>`
	}
	else if(x == 2){
		q('#cord2'+y).innerHTML += `<span class = "score-indv plrsc2${y}"></span></p>`
	}
	closecvro()
})
socket.on("scd-inin-comp", (tm, detres) => {
	sendNotif('Innings #2 completed.')
	setTimeout(function(){
		if(tm == "A"){
			sendNotif("WarBringers won this match..")
		}
		else if(tm == "B"){
			sendNotif("Howlers won the match..")
		}
		else{
			sendNotif("It was a tough fight which ended as TIE.")
		}
	}, 2000)
	q('.continue-btn').style.letterSpacing = 'normal'
	q('.continue-btn').style.backgroundColor = "#ff4d90"
	q('.continue-btn').setAttribute("onclick", 'showResults()')
	q('.continue-btn').innerHTML = "Detailed Scorecard &#8594;"
	detres[0].forEach(el => {
		var tr = document.createElement("tr")
		tr.innerHTML =
		`
			<td>${el[0]}</td>
			<td>${el[1]}</td>
		`
		q('.drt-wbs').appendChild(tr)
	})
	detres[1].forEach(el => {
		var tr = document.createElement("tr")
		tr.innerHTML =
		`
			<td>${el[0]}</td>
			<td>${el[1]}</td>
		`
		q('.drt-hwl').appendChild(tr)
	})

})
function showResults(){
	q(".det-res-div").style.display = "block"
	gsap.to('.det-res-div', {duration: 0.3, delay: 0.2, bottom: '0%', ease: 'sine.out'})
}
socket.on("splayer-left", (nm, faa, fab) => {
	sendNotif(`${nm} has left the teams.`)
	// console.log("faa: "+faa)
	// console.log("fab: "+fab)
	for(var i = 1; i <= nor; i++){
		if(faa[i-1] != "null" && q('#cord1'+i)){
			q('#cord1'+i).innerText = faa[i-1]
		}
		else if(faa[i-1] == "null" && q('#cord1'+i)){
			q('#cord1'+i).innerText = ""
		}
	}
	for(var j = 1; j <= nor; j++){
		if(fab[j-1] != "null" && q('#cord2'+j)){
			q('#cord2'+j).innerText = fab[j-1]
		}
		else if(fab[j-1] == "null" && q('#cord2'+j)){
			q('#cord2'+j).innerText = ""
		}
	}
})
function selectThisPlr(x,y){
	socket.emit('select-this-for-match', event.target.innerText, x, y)
}
function closecvro(){
	q('.floss-glass').style.display = 'none'
	q('.chose-vro').style.display = 'none'
	flossOpen = false
}

function changeMsgCont(z){
	if(msgContainerOpened){
		gsap.to('.msg-cont', {delay:0.1, opacity:'0.3', duration:0.3, bottom:'-71%', ease:'sine.out'})
		setTimeout(function(){
			if(!flossOpen){
				q(".floss-glass").style.display = 'none'
			}
			q(".msg-cont").style.display = "none"
			q(".msg-cont").style.opacity = '1'
		}, 500)
		msgContainerOpened = false
	}
	else if(z != 'floss'){
		q(".floss-glass").style.display = 'block'
		q(".msg-cont").style.display = "block"
		q(".msg-cont").style.opacity = '0.3'
		gsap.to('.msg-cont', {delay:0.1, opacity:'1', duration:0.3, bottom:'0', ease:'sine.out'})
		msgContainerOpened = true
	}
}

document.getElementById("message-field").value = ""
function enter(){
	if(event.keyCode == 13){
		sendMsg()
	}
}
function shiftTransition(){
	q('.rect1').style.display = 'block'
	q('.rect2').style.display = 'block'
	q('.rect3').style.display = 'block'
	gsap.to(".rect1", {transform: 'scaleY(1)', duration: 0.8, delay: 1.2, ease:'sine.out'})
	gsap.to(".rect2", {transform: 'scaleY(1)', duration: 0.8, delay: 1.5, ease:'sine.out'})
	gsap.to(".rect3", {transform: 'scaleY(1)', duration: 0.8, delay: 1.8, ease:'sine.out'})
	gsap.to('.three-rect', {opacity:'0', delay:2.6, duration:0.6, ease:'sine.out'})
	setTimeout(function(){
		q(".rect1").style.transform = "scaleY(0)"
		q(".rect2").style.transform = "scaleY(0)"
		q(".rect3").style.transform = "scaleY(0)"
		q('.rect1').style.display = 'none'
		q('.rect2').style.display = 'none'
		q('.rect3').style.display = 'none'
		q('.three-rect').style.opacity = '1'
	}, 3500)
}
function sendMsg(){
	var msg = document.getElementById("message-field").value
	socket.emit("message-to-team", msg, yourName)
	q('.message-field').value = ""
}
socket.on("message-from", (msg,nm) => {
	nm = nm.replace(/\</g,"&lt;") 
	nm = nm.replace(/\>/g,"&gt;")
	msg = msg.replace(/\</g,"&lt;")
	msg = msg.replace(/\>/g,"&gt;")
	var p = document.createElement('p')
	p.className = 'msg'
	var span = document.createElement('span')
	span.innerText = nm
	span.className = "sender-name"
	p.appendChild(span)
	p.innerHTML += msg
	q('.all-msgs').appendChild(p)
	q(".all-msgs").scrollTop = q(".all-msgs").scrollHeight;
})
socket.on('room-404', () => {
	sendNotif("We can't find any room with id"+roomId, "forever")
})
socket.on('room-filled', () => {
	q(".alert-box").innerHTML = `
		<i class="fas fa-info-circle"></i>
		<p>OOPS! This room is currently not allowing new members.</p>
	`
	q('.alert-box').style.display = "flex"
	q('.alert-box').style.opacity = '1'
	gsap.to(".alert-box", {xPercent:-50, yPercent:-50, duration:0.3, top:'50%', left:'50%', transform:'scaleY(1)', ease:'sine.out'})
	sendNotif("Room Closed!!")
})
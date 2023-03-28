const socket = io({transports: ['websocket'], upgrade: false});

// var name = prompt("Enter your name: ")
if(name == null){
	name = "Bunny";
}

var tossWin;
var status = null;
var playerType = 0;
var waitChoose = false;
var gameOver = false;
var notifCreated = false;
var notifs = "enabled"

function id(x){
	return document.getElementById(x)
}
function q(x){
	return document.querySelector(x)
}
socket.emit('location', window.location.href)

if(pwd != null){
	join()
}
function ripple(x,y,n){
	var ripple = document.createElement('span')
	ripple.style.left = q('.btn'+n).offsetWidth/2+"px"
	ripple.style.top = q('.btn'+n).offsetHeight/2+"px"
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
function initialState(){
	gsap.to('.balls-div', { delay:0.8, duration:0.5, bottom: "-90%", ease:'sine.out'})
	setTimeout(function(){
		q('.balls-div').style.display = "none"
		q('.balls-div').style.opacity = '1'
	}, 1300)
	q('.three-rect').style.display = 'block'
	q('.rect1').style.transform = 'scaleY(0)'
	q('.rect2').style.transform = 'scaleY(0)'
	q('.rect3').style.transform = 'scaleY(0)'
	q('.three-rect').style.opacity = '1'
	gsap.to('.t1', {top: '-50px', duration:0.4, delay:0.1, ease:'sine.out'})
	gsap.to('.t2', {bottom: '-50px', duration:0.4, delay:0.1, ease:'sine.out'})
	gsap.to('.c1', {top: '-50px', duration:0.4, delay:0.1, ease:'sine.out'})
	gsap.to('.c2', {bottom: '-50px', duration:0.4, delay:0.1, ease:'sine.out'})
	gsap.to('.toss-btn', {delay:0.5, duration:0.3, display:'none'})
	gsap.to('.choose-btn', {delay:0.5, duration:0.3, display:'none'})
}

// Message Emiting
document.querySelectorAll('.small-msg').forEach(el => {
	el.addEventListener("click", sendMessage)
})
function sendMessage(){
	var msg = event.target.innerText
	socket.emit("message-to-player", msg)
}
socket.on("message-from-player", msg => {
	sendNotif("Opp says: "+msg)
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


socket.on("player", (num) => {
	playerType = num
	tossTime()
})
const checkEnter = () => {
	if(event.keyCode == 13){
		join()
	}
}
if(pwd == null){
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
}
id('passwd').addEventListener('keydown', checkEnter)

function join(){
	if(pwd == null){
		socket.emit("joined-match", name, roomId, id("passwd").value)
	}
	else{
		socket.emit("joined-match", name, roomId, pwd)
	}
	q('.passwd-sbmt').innerHTML = "<i class='fa fa-circle-o-notch fa-spin'></i>Loading"
}

function tossSEL(type){  
	socket.emit("toss-sel", type)
} 
  
function tossTime(){
	initialState()
	id("heading-all").innerText = "Toss"
	q('.you-stat').innerText = "Toss"
	q('.other-stat').innerText = "Toss"
	if(playerType == 1){
		gsap.to('.t1', {delay:1.6, display:'flex', duration: 1, ease:'sine.out', top:'37.5%', transform:'skew(20deg) translateX(-50%) translateY(-50%)'}) 
		setTimeout(function(){
			q('.t1').setAttribute('onclick', "tossSEL('odd')")
			q('.t2').setAttribute('onclick', "tossSEL('even')")
		},3200)
		gsap.to('.t2', {delay:1.6, display:'flex', duration: 1, ease:'sine.out', bottom:'32.5%', transform:'skew(20deg) translateX(-50%) translateY(-50%)'})
		gsap.to(".rect1", {transform: 'scaleY(1)', duration: 0.8, delay: 1.2, ease:'sine.out'})
		gsap.to(".rect2", {transform: 'scaleY(1)', duration: 0.8, delay: 1.5, ease:'sine.out'})
		gsap.to(".rect3", {transform: 'scaleY(1)', duration: 0.8, delay: 1.8, ease:'sine.out'})
		gsap.to('.three-rect', {opacity:'0', delay:2.6, duration:0.6, ease:'sine.out'})
		gsap.to('.three-rect', {display:'none', delay:3.4})
		setTimeout(function(){
			q('.main-sheet').innerHTML = ""
			q('.main-sheet').style.display = 'none'
		},1200)
	}
	else if(playerType == 2){
		q(".main-sheet").display = "flex"
		q(".main-sheet").innerHTML = `The Opponent is choosing Odd or Even. <i class = "fa fa-circle-o-notch fa-spin" id = "wait-load"></i>`
	}
}

function chooseOpt(chose){
	socket.emit("choose-opt", chose)
}

socket.on("no-choose-2", () => {
	alert("You cant choose.\nOnly the Player-1 can")
	sendNotif("You cant choose. Only the Player-1 can")
})

/*
socket.on('2ball-success', () => {
	setTimeout(function(){
		q('.you-num').innerHTML = "<i class = 'fas fa-cog fa-spin'></i>"
		q('.you-num').innerHTML = "<i class = 'fas fa-cog fa-spin'></i>"
	},1000)
})
*/

socket.on("no-choose-lose-toss", () => {
	// alert("You can't choose because you lost the toss.")
	sendNotif("You can't choose because you lost the toss.")
})

function ball(x){
	socket.emit("game-ball", x)
	ripple(event.clientX, event.clientY, x)
}

socket.on('toss-com', () => {
	// toss = false
})

socket.on('tnov-nochose', () => {
	// toss = true
	alert("Toss first.")
	sendNotif("Toss first. It is recommended to not change the code")
})

socket.on("game-over", wl => {
	gameOver = true
	setTimeout(initialState(), 2000)
	q('.main-sheet').style.display = 'flex'
	q('#heading-all').innerHTML = "Game Over"
	if(wl == "win"){
		// alert("")
		// sendNotif("Game Over. \nYou won the match")
		q('.main-sheet').innerHTML = 
		`
			<span class='game-over'>Game Over</span><br><br>
			You won the match
			<a href='/home'><button class='ghome-btn'>Go to Home</button></a>
		`
	}
	else if(wl == "lose"){
		// alert("Game Over. \nYou lost this match.. \nDon't worry, You can do well, next time.")
		// sendNotif('Game Over. \nYou lost this match.')
		q('.main-sheet').innerHTML = 
		`
			<span class='game-over'>Game Over</span> <br><br>You lost this match..
			<a href='/home'><button class='ghome-btn'>Go to Home</button></a>
		`
	}
	else{
		// alert("Woah! It's a draw.\nGame Over.")
		// sendNotif("Woah! It's a draw.\nGame Over.")
		q('.main-sheet').innerHTML = 
		`
			<span class='game-over'>Game Over</span> <br><br>Woah! It's a draw..
			<a href='/home'><button class='ghome-btn'>Go to Home</button></a>
		`
	}
})

socket.on('you-out', (score, stat, ballNo) => {
	// alert("You are Out. \nYou have scored "+score)
	sendNotif("You are Out")
	gsap.to('.balls-div', { delay:0.8, duration:0.5, bottom: "-90%", ease:'sine.out'})
	setTimeout(function(){
		q('.balls-div').style.display = "none"
		q('.balls-div').style.opacity = '1'
	}, 1300)
	if(stat == "bat"){
		q('.you-stat').innerHTML = "bowl"
	}
	else if(stat == "bowl"){
		q('.you-stat').innerHTML = "bat"
	}
	q('#heading-all').innerText = "Ball #"+ballNo
	q('.other-stat').innerHTML = stat
	q('.main-sheet').style.display = 'flex'
	q('.main-sheet').innerHTML = "You are Out<br>You have scored "+score+".<br>It is opponent's turn to "+stat+" now."
	setTimeout(function(){ballTime()}, 3200)
})

socket.on("opp-out", (score, stat, ballNo) => {
	// alert("The Opponent is Out. \nTarget is "+(score+1))
	sendNotif("The Opponent is out. Target: "+(score+1))
	gsap.to('.balls-div', { delay:0.7, duration:0.5, bottom: "-90%", ease:'sine.out'})
	setTimeout(function(){
		q('.balls-div').style.display = "none"
		q('.balls-div').style.opacity = '1'
	}, 1200)
	if(stat == "bat"){
		q('.you-stat').innerHTML = "bowl"
	}
	else if(stat == "bowl"){
		q('.you-stat').innerHTML = "bat"
	}
	q('#heading-all').innerText = "Ball #"+ballNo
	q('.other-stat').innerHTML = stat
	q('.main-sheet').style.display = 'flex'
	q('.main-sheet').innerHTML = "The Opponent is Out<br>They have scored "+score+".<br>It is opponent's turn to "+stat+" now."
	setTimeout(function(){ballTime()}, 3000)
})

socket.on("error-opp-left", () => {
	// alert("Seems your opponent has left..")
	sendNotif("Seems The Opponent has left.", "forever")
	q(".whatsapp-link").style.display = 'block'
	q('.share-btn').style.display = 'flex'
	q('.you-stat').innerText = "Toss"
	q('.other-stat').innerText = "Toss"
	q('.you-num').innerHTML = "<i class='fas fa-cog fa-spin'></i>"
	q('.other-num').innerHTML = "<i class='fas fa-cog fa-spin'></i>"
	id("player-score").innerText = "0"
	id("opponent-score").innerText = "0"
	initialState()
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

socket.on("chose-pot", (stat,opp) => {
	// alert("You have to "+stat+' first\nAnd Opponent have to '+opp+' first..')
	sendNotif(`You have to ${stat} first`)
	status = stat
	q('.scores').style.display = 'block'
	gsap.to('.c1', {top: '-50px', duration:0.4, delay:0.1, ease:'sine.out'})
	gsap.to('.c2', {bottom: '-50px', duration:0.4, delay:0.1, ease:'sine.out'})
	setTimeout(function(){
		q('.main-sheet').style.display = 'flex'
		q('.main-sheet').innerHTML = `
			<table>
				<tr>
					<td>Your status: </td>
					<td>${stat}ing</td>
				</tr>
				<tr>
					<td>Opp status: </td>
					<td>${opp}ing</td>
				</tr>
			</table>
		`
	},500)

	setTimeout(function(){
		q('.main-sheet').style.display = "none"
		q('.main-sheet').style.opacity = '1'
		q('.c1').style.display = 'none'
		q('.c2').style.display = 'none'
	}, 2000)

	setTimeout(function(){
		ballTime()
		id('heading-all').innerText = "Ball #"+1
		q('.you-num').innerHTML = "<i class = 'fas fa-cog fa-spin'></i>"
		q('.other-num').innerHTML = "<i class = 'fas fa-cog fa-spin'></i>"
		q('.you-stat').innerText = stat
		q('.other-stat').innerText = opp
	}, 1800)
	
})

/*
socket.on("other-choosing", () => {
	q('.other-num').innerHTML = '<i class = "fas fa-cog fa-spin"></i>'
	// alert('Let the opponent choose.')
})
*/

socket.on("choose-fast", () => {
	// alert("Choose Fast.\nOpponent has already chosen.")
	// sendNotif("The Opponent has chosen. Choose fast")
})

socket.on("toss-won", () => {
	// alert("You won the toss.\nChoose what you want.")
	sendNotif('You won the toss.')
	tossWin = true
	initialState()
	q('.main-sheet').style.display = 'flex'
	q('.main-sheet').innerHTML = "You have won the toss.<br>Choose bat or bowl"
	id('heading-all').innerText = "Bat or Bowl"
	gsap.to(".rect1", {transform: 'scaleY(1)', duration: 0.8, delay: 2, ease:'sine.out'})
	gsap.to(".rect2", {transform: 'scaleY(1)', duration: 0.8, delay: 2.3, ease:'sine.out'})
	gsap.to(".rect3", {transform: 'scaleY(1)', duration: 0.8, delay: 2.6, ease:'sine.out'})
	gsap.to('.three-rect', {opacity:'0', delay:3.4, duration:0.6, ease:'sine.out'})
	gsap.to('.three-rect', {display:'none', delay:4.0})
	gsap.to('.c1', {delay:1.2, display:'flex', duration: 0.8, ease:'sine.out', top:'37.5%', transform:'skew(20deg) translateX(-50%) translateY(-50%)'}) 
	setTimeout(function(){
		q('.c1').setAttribute('onclick', "chooseOpt('bat')")
		q('.c2').setAttribute('onclick', "chooseOpt('bowl')")
	},2400)
	gsap.to('.c2', {delay:1.2, display:'flex', duration: 0.8, ease:'sine.out', bottom:'32.5%', transform:'skew(20deg) translateX(-50%) translateY(-50%)'})
	gsap.to('.main-sheet', {duration: 0.8, delay: 2, opacity:'0'})
	setTimeout(function(){
		q('.main-sheet').style.display = 'none'
		q('.main-sheet').style.opacity = '1'
	}, 2800)
})
socket.on("toss-lose", () => {
	sendNotif("You lost the toss")
	initialState()
	q('.main-sheet').style.display = 'flex'
	q('.main-sheet').innerHTML = "The Opponent won the toss.<br>They are choosing Bat or Bowl.<br><i class = 'fa fa-circle-o-notch fa-spin'></i>"
	id('heading-all').innerText = "Bat or Bowl"
	tossWin = false
})

socket.on("both-choose-ok", (you,opp, x, youScore, oppScore) => {
	waitChoose = false
	q('.you-num').innerHTML = you
	q('.other-num').innerHTML = opp
	if(x != 'no'){
		id('player-score').innerText = youScore
		id('opponent-score').innerText = oppScore
		q('#heading-all').innerText = "Ball #"+x
	}
	setTimeout(function(){
		if(!waitChoose && x != 'no' && !gameOver){
			q('.you-num').innerHTML = '<i class = "fas fa-cog fa-spin"></i>'
			q('.other-num').innerHTML = '<i class = "fas fa-cog fa-spin"></i>'
			q('#heading-all').innerText = "Ball #"+(x+1)
		}
	}, 3000)
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
socket.on("success-pass", (psd) => {
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
	var link = window.location.protocol+"//"+window.location.hostname+"/match/"+roomId+"?pwd="+psd
	var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
	if(isMobile){
		q('.whatsapp-link').href = 'whatsapp://send?text='+encodeURIComponent("Come join me, let's play *Hand Cricket* online. "+link)
		q('.share-btn').style.display='flex'
		q('.share-btn').addEventListener('click', async () => {
			try {
	   			await navigator.share({title:'Hand-Cricket', text:'Come join me, let\'s play *Hand Cricket* online. ', url:link})
	    		console.log('MDN shared successfully')
	  		} catch(err) {
	    		console.log("Share Error: "+err)
	  		}
		})
	}
	else{
		q('.whatsapp-link').href = 'https://web.whatsapp.com/send?text='+encodeURIComponent("Come join me, let's play *Hand Cricket* online. "+link)
	}
})

socket.on("disconnected", () => {
	// alert("Something went wrong.. \nRefresh the page.")
	sendNotif("Something went wrong", "forever")
})


socket.on("match-join-s", () => {
	// alert("Successfully entered a match")
})

socket.on("waiting-out", () => {
	alert("Sorry. Match was already filled")
})

socket.on("wait-opp", () => {
	q('.main-sheet').innerHTML = `
			Waiting for an opponent <i id="wait-load" class="fas fa-circle-notch fa-spin"></i>
		`
})

socket.on("opp-left", () => {
	gsap.to('.main-sheet',
	{
		transform: 'scaleY(1)',
		duration: '0.2',
		ease: 'sine.out'
	})
	q('.main-sheet').style.display = 'flex'
	q('.main-sheet').innerHTML = "The Opponent has left.<br> Try sending Link to them..<br><br>Or Let's just wait until they reconnect."
	q('.whatsapp-link').style.display = 'block'
	q('.share-btn').style.display = 'flex'
})

socket.on("found-opp", () => {
	sendNotif("Opponent Found")
	q('.whatsapp-link').style.display = 'none'
	q('.share-btn').style.display = 'none'
	q('.main-sheet').innerHTML = `
			Opponent found. <i class = "fas fa-check-circle"></i>
	`
	gsap.to('.main-sheet',
	{
		duration:'1.5',
		opacity:'0',
		ease:'sine.out'
	})
	gsap.to('.main-sheet',{ opacity:'1', delay:1.5})
})

socket.on("room-404", () => {
	sendNotif("Oops! We cant find any room with id "+roomId, "forever")
})

function shareFn(img, text, link){
	if(navigator.share){
   		navigator.share({
   			title: text,
   			url: link
   		}).then(() => {
      		console.log('Success!');
    	}).catch(console.error);
 	}
}

function ballTime(){
	gsap.to('.balls-div',
	{
		delay:0.6,
		duration:0.8,
		bottom:'0%',
		ease:'sine.out',
		display:'flex'
	})
	q('.balls-div').style.opacity = '1'
	q('#heading-all').innerText = "Choose a number"
}

socket.on("msg-toss-me", sel => {
	// alert("You have chosen "+sel+"\nChoose a number.")
	q('.main-sheet').style.display = 'flex'
	q('.main-sheet').innerHTML = "You have Chosen "+sel+"<br>Choose a number"
	setTimeout(function(){
		ballTime()
	},1200)
	gsap.to('.t1', {duration:0.2, top:'-50px',ease:'sine.out'})
	gsap.to('.t2', {duration:0.2, bottom:'-50px',ease:'sine.out'})
	setTimeout(function(){
		q('.t1').style.display = 'none'
		q('.t2').style.display = 'none'
		q('.main-sheet').style.display = 'none'
	}, 1200)
})
socket.on("invalid-input", () => {
	alert("That's an invalid input\nKindly, dont change the frontend code for better experience.")
})
socket.on("msg-toss-u", sel => {
	// alert("The Opponent has chosen "+sel+"\nChoose a number.")
	q('.main-sheet').style.display = 'flex'
	q('.main-sheet').innerHTML = "The Opponent has Chosen "+sel+"<br>Choose a number"
	gsap.to('.t1', {duration:0.2, top:'-50px',ease:'sine.out'})
	gsap.to('.t2', {duration:0.2, bottom:'-50px',ease:'sine.out'})
	setTimeout(function(){ballTime()},1200)
})
socket.on("redirecting", destination => {
	console.log("redirect")
	window.location.href = destination;
})
socket.on("no-auth", () => {
	sendNotif("We could not Authorize you", "forever")
})
socket.on("bad-req", () => {
	sendNotif("Bad Request: 404", "forever")
})
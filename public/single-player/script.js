function id(x){
	return document.getElementById(x)
}
function q(x){
	return document.querySelector(x)
}

var notifCreated = false;
var notifs = "enabled";
var stat = null;
var matchStarted = false;
var timeout;
var innings = 1;
var scores = [0,0];

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
function gameOver(){
	sendNotif("Game Over.")
	var statement;
	scores[0] > scores[1]? statement = 'WON': scores[0] < scores[1]? statement = 'LOST': statement = 'DRAW'
	statement == 'DRAW'? setTimeout(function(){sendNotif("It was a DRAW.", 'forever')}, 2000): setTimeout(function(){sendNotif("You "+statement+" the match.","forever")}, 2000)
	matchStarted = false
	q('.main-sheet').innerHTML = `
		<span class='game-over'>Game Over. </span>
		<a href='/home'><button class='ghome-btn'>Go to Homepage</button></a>
		<a href='/single-player'><button class='rematch'>Play Again</button></a>

	`
	makeEmGrey()
	gsap.to(".main-sheet", 
	{
		bottom:0,
		delay:3.0,
		duration:1.2,
		ease:'sine.out'
	})
}
function ball(x){
	clearTimeout(timeout)
	if(matchStarted){
		var numbers = [1,2,3,4,5,6]
		var compChoice = numbers[Math.floor(Math.random() * numbers.length)];
		q(".you-num").innerText = x
		q('.other-num').innerText = compChoice
		if(x == compChoice){
			stat == 'bat'? sendNotif("The Computer is OUT."): sendNotif("You are OUT.")
			console.table({'computer choice': stat})
			if(innings == 1){
				makeEmGrey()
				var currStat = stat
				setTimeout(function(){ 
					sendNotif('You have to '+currStat+' now')
				}, 2000)
				innings = 2
				stat == 'bat'? stat = 'bowl': stat = 'bat'
				console.table({"computer now": stat})
				setTimeout(start, 4000)
			}
			else{
				gameOver()
			}
		}
		else{
			stat == 'bat'? scores[1] += compChoice: scores[0] += x
			q("#player-score").innerText = scores[0]
			q("#opponent-score").innerText = scores[1]
			if(innings == 2){
				if((stat == 'bat' && scores[1] > scores[0]) || (stat == 'bowl' && scores[0] > scores[1])){
					gameOver()
				}
			}
		}
		ripple(event.clientX, event.clientY, x)
	}
	timeout = setTimeout(function(){
		q('.you-num').innerHTML = "<i class = 'fas fa-cog fa-spin'></i>"
		q('.other-num').innerHTML = "<i class = 'fas fa-cog fa-spin'></i>"
	}, 2500)
}

stat = ['bat', 'bowl'][Math.floor(Math.random() * 2)];
sendNotif(`Match Began.`)
makeEmGrey()
setTimeout(function(){
	sendNotif(`Computer chose to ${stat}.`)
}, 2000)
function start(){
	matchStarted = true
	q(".you-stat").style.backgroundColor = '#74ffd9'
	stat == 'bat'? q('.you-stat').innerText = 'bowl': q(".you-stat").innerText = 'bat'
	q(".other-stat").style.backgroundColor = '#ff7c8c'
	q(".comp-block").style.backgroundColor = '#8300ff'
	q('.other-stat').innerText = stat
	document.querySelectorAll('.ball-btn').forEach(el => {
		el.style.borderColor = '#8000ff'
	})
}
function makeEmGrey(){
	q(".you-stat").style.backgroundColor = '#aaa'
	q(".other-stat").style.backgroundColor = '#aaa'
	q(".comp-block").style.backgroundColor = '#aaa'
	document.querySelectorAll('.stat-block').forEach(el => {el.innerText = ''})
	document.querySelectorAll(".ball-btn").forEach(el => {el.style.borderColor = '#aaa'})
	matchStarted = false
}
setTimeout(start, 4000)
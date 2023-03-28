function q(x){
	return document.querySelector(x)
}

if(teams.length < 1){
	q('.rooms').style.display = 'flex'
	q('.rooms').style.justifyContent = 'center'
	q('.rooms').style.alignItems = 'center'
	q('.rooms').innerText = 'There are no rooms currently open. \nRefresh the page after sometime.'
}

teams.forEach(team => {
	var div = document.createElement("div")
	div.className = 'room-div'
	div.innerHTML = 
	`
		<p class='rm-id'>Room ID: <span>#${team.room}</span></p>
		<p class='player-len'><u>Players:</u> ${team.len}/10 (waiting)</p>
		<p class='creator'><u>Creator:</u> ${team.creator}</p>
		<a class='join-btn' href='/teams/${team.room}'>Join</a>
	`
	q(".rooms").appendChild(div)
})
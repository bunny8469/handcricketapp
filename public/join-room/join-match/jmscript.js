function q(x){
	return document.querySelector(x)
}

if(matches.length < 1){
	q('.rooms').style.display = 'flex'
	q('.rooms').style.justifyContent = 'center'
	q('.rooms').style.alignItems = 'center'
	q('.rooms').innerText = 'There are no rooms currently open. \nRefresh the page after sometime.'
}

matches.forEach(match => {
	var div = document.createElement("div")
	div.className = 'room-div'
	div.innerHTML = 
	`
		<p class='rm-id'>Match ID: <span>#${match.room}</span></p>
		<p class='player-len'><u>Players:</u> ${match.len}/2 (waiting)</p>
		<p class='creator'><u>Creator:</u> ${match.creator}</p>
		<a class='join-btn' href='/match/${match.room}'>Join</a>
	`
	q(".rooms").appendChild(div)
})
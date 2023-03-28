var socket = io()

socket.emit("room-id", roomId)
addMsg("Welcome to Chatroom", "CHAT BOT")


document.getElementById("message-field").value = ""
document.getElementById("message-field").focus()

function enter(){
	if(event.keyCode == 13){
		sendMsg()
	}
}

var name = prompt("Enter you name: ")
socket.emit("username", name)   //temporary name
while(name == "" || name == null){
	name = prompt("Enter you name: ")
}

function sendMsg(){
	var msg = document.getElementById("message-field").value
	socket.emit("message", msg,name)
}
function addMsg(value, name){
	if (value == "" || value == null){
		alert("Message cannot be empty.")
	}
	else{
		var p = document.createElement("div")
		p.className = "msg-box"
		p.innerHTML = `
			<span class = "username">${name}</span>
			${value}
					  `
		var div = document.getElementById("chat-box")
		div.appendChild(p)
	}
	document.getElementById("message-field").value = ""
	document.getElementById("message-field").focus()	
}

socket.on("addMsg", (msg,name) => {
	addMsg(msg,name)
})
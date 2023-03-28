function id(x){
	return document.getElementById(x)
}

// Password Viewer
function showhidePassword(){
	if(id("password-field").type == "password"){
		id("password-field").type = "text"
		id("fa-eye-slash").style.visibility = "visible"
		id("fa-eye").style.visibility = "hidden"
	}  
	else if(id("password-field").type == "text"){
		id("password-field").type = "password"
		id("fa-eye-slash").style.visibility = "hidden"
		id("fa-eye").style.visibility = "visible"
	}
}


let password = document.getElementById("password");
let eyeopen = document.getElementById("eye-open");
let eyeclose = document.getElementById("eye-close");
let submit =  document.getElementById("submit");
let error = document.getElementById("email_error");
let email = document.getElementById("email");
eyeclose.onclick = () => {
    if(password.type === "password"){
        password.type  = "text";
        document.getElementById("eye-open").style.display = "block";
        document.getElementById("eye-close").style.display = "none";
       
    }
};
eyeopen.onclick = () => {
    if(password.type === "text"){
        password.type = "password";
        document.getElementById("eye-close").style.display = "block";
        document.getElementById("eye-open").style.display = "none";
    }
};
fetch('/login',{
    method : 'POST',
    headers : {
        'Content-Type' : 'application/json'
    },
    body : JSON.stringify({email: email.value})
})
.then(response => response.json())
.then(data => {
    if(data.success){
        error.style.display = "block";
    }
})

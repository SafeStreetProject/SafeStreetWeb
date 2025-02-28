let password1 = document.getElementById("password1");
let password2 = document.getElementById("password2");
let eyeopen2 = document.getElementById("eye-open2");
let eyeclose2 = document.getElementById("eye-close2");
let eyeopen1 = document.getElementById("eye-open1");
let eyeclose1 = document.getElementById("eye-close1");
let submit2 =  document.getElementById("submit2");

eyeclose1.onclick = () => {
    if(password1.type === "password"){
        password1.type  = "text";
        document.getElementById("eye-open1").style.display = "block";
        document.getElementById("eye-close1").style.display = "none";
        

    }
};
eyeopen1.onclick = () => {
    if(password1.type === "text"){
        password1.type = "password";
        document.getElementById("eye-close1").style.display = "block";
        document.getElementById("eye-open1").style.display = "none";
        
    }
};

eyeclose2.onclick = () => {
    if(password2.type === "password"){
        password2.type  = "text";
        document.getElementById("eye-open2").style.display = "block";
        document.getElementById("eye-close2").style.display = "none";
        eyeopen2 = eyeclose2;

    }
};
eyeopen2.onclick = () => {
    if(password2.type === "text"){
        password2.type = "password";
        document.getElementById("eye-close2").style.display = "block";
        document.getElementById("eye-open2").style.display = "none";
        eyeclose2 = eyeopen2;
    }
};


submit2.addEventListener("click", () => {
if(password1.value !== password2.value){
   
    document.getElementById("message2").innerText = "Password not matched";
    document.getElementById("message2").style.color = "red";
    submit2.type = "button";
}else{
    document.getElementById("message2").innerText = " ";
    submit2.type = "submit";
}
});
fetch('/signup', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: userEmail })
})
.then(response => response.json())
.then(data => {
    if (data.emailExists) {
        document.getElementById('email_exists').style.display = "block";
    }
});

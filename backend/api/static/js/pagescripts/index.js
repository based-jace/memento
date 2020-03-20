let emailInput = document.querySelector("#username");
let passwordInput = document.querySelector("#password");
let loginput = document.querySelector(".loginput");

window.scrollTo(0,0);

finishLoad = loadVue;

setTimeout(()=>{
    finishLoad();
    setTimeout(()=>{
        try{
            document.getElementsByClassName("noverflow")[0].classList.remove("noverflow");
        }
        catch{/* Do Nothing */}
    }, 500)
}, 500);

loginput.addEventListener("submit", (event)=>{
    event.preventDefault();

    let email = emailInput.value;
    let password = passwordInput.value;

    return login(email, password);
}, false);
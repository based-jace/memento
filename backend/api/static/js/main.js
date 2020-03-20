let langElems = document.getElementsByClassName("translate");
let langIds = [];

let langKeys = {};

let vueDone = false;

let logoutButton = document.getElementById("adminlogout");

const langList = document.getElementsByClassName("dropdown-content")[0];

var vue = new Vue({
    el: ".container",
    delimiters: ["[[", "]]"],
    data:{
        errorMessage: "",
        infoMessage: "",
        successMessage: "",
        search: "",
        user: thisUser,
        userAttributes: userAttributes,
        documents: documents,
        users: [
            {
                user_url: "",
                first_name: "",
                last_name: "",
                vid: ""
            }
        ],
        user_main_url: user_main_url,
        langText: {},
        sortBy: "timestamp",
    },
    computed:{
        /**
         * Loads users onto admin page
         */
        completeUsers: function(){
            vusers = this.users;
            if(!raw_users[0]){
                return vusers;
            }
            for(u in vusers){
                vusers[u]["user_url"] = user_main_url + raw_users[u].id;
            }
            return vusers;
        },
        /**
         * Filters users on admin page
         */
        filteredUsers: function(){
            return this.completeUsers.filter((u)=>{
                if(!u.vid){
                    return true;
                }
                
                return(
                    (u.first_name + " " + u.last_name).toString().toLowerCase().includes(this.search.toLowerCase())||
                    (u.vid).toString().includes(this.search)
                )
            })
        },
        /**
         * Filters user documents
         */
        filteredDocuments: function(){
            return this.documents.filter((doc)=>{
                return(
                    doc.name.toLowerCase().includes(this.search.toLowerCase())||
                    doc.timestamp.toString().toLowerCase().includes(this.search.toLowerCase())
                )
            })
        },
        /**
         * Sorts user documents
         */
        sortedDocuments: function(){
            let sortBy = this.sortBy;
            
            if(!sortBy){
                sortBy = "timestamp";
            }
            function compare(a, b){
                a = a[sortBy];
                b = b[sortBy];
                if(sortBy.toLowerCase() == "timestamp"){
                    a = new Date(a);
                    b = new Date(b);
                }
                else{
                    a = a.toLowerCase();
                    b = b.toLowerCase();
                }
                if(a < b){
                    return -1;
                }
                else if(a > b){
                    return 1;
                }
                else{
                    return 0;
                }
            }
            return this.filteredDocuments.sort(compare);
        },
    },
    methods:{
        /**
         * Allows user/admin to download all selected documents
         */
        downloadAll: function(){
            let selectedNodes = document.querySelectorAll(".documentitem[data-selected]");
            let selectedDocs = [];
            
            for(node of selectedNodes){
                for(child of node.childNodes){
                    try{
                        if(child.classList.contains("documentname")){
                            selectedDocs.push(child.innerText);
                            break;
                        }
                    }
                    catch{
                        //Do Nothing
                    }
                }
                node.removeAttribute("data-selected");
            }
            downloadDocuments(selectedDocs);
        },
        /**
         * Allows user/admin to download the selected document via its
         * individual download button
         * 
         * @param {Event} event The click event generated by clicking on an element's
         * download button
         */
        downloadThis: function(event){
            let thisNode = event.currentTarget;
            let docName;
            for(node of thisNode.parentNode.childNodes){
                try{
                    if(node.classList.contains("documentname")){
                        docName = node.innerText;
                        downloadDocuments([docName]);
                        break;
                    }
                }
                catch{ /* Do Nothing */ }
            }
            setTimeout(()=>{ // Keeps the element from actually being selected
                thisNode.parentNode.removeAttribute("data-selected");
            }, 0);
            
        },
        /**
         * Toggles the selection of the document 
         * 
         * @param {Event} event Click event created when clicking on a document
         */
        toggleSelected: function(event){
            let thisDoc = event.currentTarget;
            if(thisDoc.getAttribute("data-selected")){
                thisDoc.removeAttribute("data-selected");
            } else{
                thisDoc.setAttribute("data-selected", "data-selected");
            }
        },
        /**
         * Deletes all selected documents
         */
        deleteAll: function(){
            let selectedNodes = document.querySelectorAll(".documentitem[data-selected]");
            let selectedDocs = [];
            
            for(node of selectedNodes){
                for(child of node.childNodes){
                    try{
                        if(child.classList.contains("documentname")){
                            selectedDocs.push(child.innerText);
                            break;
                        }
                    }
                    catch{
                        //Do Nothing
                    }
                }
                node.removeAttribute("data-selected");
            }
            deleteDocuments(selectedDocs);
        }
    }
})

/**
 * Gets page text based on language preference from a
 * pre-translated JSON file
 */
function GetText(){
    return new Promise((success, error)=>{
        success(
            $.getJSON(language_url, (response)=>{
                langKeys = response;
            })
        )
    });
}

/**
 * Gets the user's preferred language from the browser
 */
function GetBrowserLanguage(){
    let clientLang = navigator.language.substring(0, 2);
    if(langKeys.hasOwnProperty(clientLang)){
       return clientLang;
    }
    return "en"; // Default to English
}

/**
 * Actually sets the text using the pre-translated JSON file
 * and the user's preferred language
 * 
 * @param {Boolean} initial First load
 */
function SetText(initial = true){
    // If initial (language file not loaded) and user variables are not yet loaded
    if(!userAtt_raw && initial){
        userAttributes.preferred_language = GetBrowserLanguage();
    }
    vue.langText = langKeys[userAttributes.preferred_language];
}

/**
 * Sets all vue variables and hides the splash screen
 */
function loadVue(){
    vue.documents = documents;
    vue.user = thisUser;
    vue.userAttributes = userAttributes;
    vue.langText = langKeys[userAttributes.preferred_language];
    vue.users = users;
    vue.user_main_url = user_main_url + vue.user.uid;
    hideSplash();
}

/**
 * Hides the splash screen
 */
function hideSplash(){
    let splash = document.querySelector(".splash");
    setTimeout(()=>{
        splash.classList += " invisible";
    }, 250);
    setTimeout(()=>{
        splash.classList += " hidden";
        document.querySelector(".noverflow").classList.remove("noverflow");
    }, 500);
}

/**
 * 
 * @param {string} message JSON key representing a message set in the json file
 * @param {string} alertType One of three types of message representing the severity
 * of it: success, info, error
 */
function showAlert(message, alertType="error"){
    let alertMessage = null;
    if(alertType == "error"){
        alertMessage = document.getElementsByClassName("error-message")[0];
    }
    else if(alertType == "info"){
        alertMessage = document.getElementsByClassName("info-message")[0];
    }
    else if(alertType == "success"){
        alertMessage = document.getElementsByClassName("success-message")[0];
    }

    if(alertMessage != null){
        alertMessage.firstElementChild.innerHTML = message;
        alertMessage.classList.remove("m-closed");
    }
}

// Grabs all available languages from the page's language dropdown
for(langId of langElems){
    langIds.push(langId.id);
}

// If there is a logout button on the page
if(logoutButton){
    // Set a click event to log the user out
    document.getElementById("adminlogout").addEventListener("click", ()=>{
        logout();
    });
}

// Helps update the user's language
document.addEventListener("click", (elem)=>{
    let newLang = elem.target.id;
    // If language available on the page
    if(langIds.includes(newLang)){
        // If the user is registered
        if(userAtt_raw){
            db.collection(userType).doc(userAtt_raw.id).update({
                preferred_language: newLang
            })
        }
        userAttributes.preferred_language = newLang;
        document.querySelector(".dropdown-content").classList.add("langs-hidden");
        SetText(false);
    }
});

// Allows closing of alerts by clicking on the x in the top right corner
for(x of document.getElementsByClassName("close-message")){
    x.addEventListener("click", event=>{
        event.target.parentNode.classList.add("m-closed");
    })
}

let loadText = GetText().then(SetText);

// Allows toggling of the language dropdown
document.getElementsByClassName("dropBtn")[0].addEventListener("click", event=>{
    document.querySelector(".dropdown-content").classList.toggle("langs-hidden");
})

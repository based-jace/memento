let loc = window.location.pathname;
let user_page_id = loc.substring(loc.search(/.user/)+6, loc.length-1);

let storage;
let storageRef;

// Invisible File Download button
const downloadButton = document.getElementById("actual-file-download");

/**
 * Toggles file action spinner
 */
function toggleSpinner(){
    document.getElementsByClassName("spinner-cont")[0].classList.toggle("hidden");
}

/**
 * Gets list of documents from user's cloud storage bucket, and lists them onscreen
 */
function listDocuments(){
    return firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
        return $.ajax({
            type: "POST",
            url: documents_url,
            headers:{
                'Authorization': 'Bearer ' + idToken
            },
            data:{
                "user": user_page_id
            },
            success: function(response){
                documents = response;
                vue.documents = response;
            },
            error: function(error){
                console.log(error);
            }
        })
    }).catch(function(error) {
        console.log(error);
    });
}

/**
 * Uploads given files to the server
 * 
 * @param {File[]} docs A list of files to be uploaded
 */
function uploadDocuments(docs){
    // Ensures files are selected
    if(docs.length > 0){
        toggleSpinner();
        firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
            data = new FormData();
    
            for(doc in docs){
                // Formats each file so they're counted individually
                data.append(`file${Number(doc)+Number(1)}`, docs[doc]);
            }
            data.append("userInfo", JSON.stringify(userAttributes));
            data.append("user", user_page_id);
    
            $.ajax({
                type: "PUT",
                url: window.location.href,
                headers:{
                    'Authorization': 'Bearer ' + idToken
                },
                data: data,
                processData: false,
                contentType: false,
                success: function (response) {
                    listDocuments();
                    showAlert(vue.langText[response.message], response.messageType);
                    toggleSpinner();
                },
                error: function(error){
                    console.log(error);
                    toggleSpinner();
                }
            });
        }).catch(function(error) {
            console.log(error);
            toggleSpinner();
        });
    }
    else{
        console.log("Something went wrong");
    }
}

/**
 * Downloads selected documents
 * 
 * @param {String[]} docs List of names of files to download
 */
function downloadDocuments(docs){
    // Ensures files are selected
    if(docs.length > 0){
        toggleSpinner();
        firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
            docs = JSON.stringify(docs);
            $.ajax({
                type: "POST",
                url: window.location.href,
                headers:{
                    'Authorization': 'Bearer ' + idToken
                },
                data:{
                    "docs": docs,
                    "user": user_page_id
                },
                success: function(response){
                    downloadButton.href = response["download_path"];
                    downloadButton.click(); // Clicks invisible download button
                    toggleSpinner();
                },
                error: function(error){
                    console.log(error);
                    toggleSpinner();
                }
            })
        }).catch(function(error) {
            console.log(error);
            toggleSpinner();
        });
    }
    else{ /* No docs selected */ }
}

/**
 * Deletes selected files
 * 
 * @param {String[]} docs List of files to be deleted
 */
function deleteDocuments(docs){
    // Ensures files are selected
    if(docs.length > 0){
        toggleSpinner();
        firebase.auth().currentUser.getIdToken(/* forceRefresh */ true)
        .then(function(idToken) {
            docs = JSON.stringify(docs);
            $.ajax({
                type: "DELETE",
                url: window.location.href,
                headers:{
                    'Authorization': 'Bearer ' + idToken
                },
                data:{
                    "docs": docs,
                    "user": user_page_id
                },
                success: function(response){
                    showAlert(vue.langText[response.message], response.messageType);
                    listDocuments();
                    toggleSpinner();
                },
                error: function(error){
                    console.log(error);
                    toggleSpinner();
                }
            })
        }).catch(function(error) {
            console.log(error);
            toggleSpinner();
        });
    }
    else{
        showAlert(vue.langText["noFilesSelected"], "info");
    }
}

/**
 * Ensures the user is allowed to be on the current page
 * 
 * The user may only be on the current page if their id matches the url 
 * or they are an admin
 */
function checkUser(){
    if(user_page_id != thisUser.uid && !userAttributes.is_admin){
        window.location.replace("/user" + full_redirect_url);
    }
    else if (userAttributes.is_admin && user_page_id == thisUser.uid){
        window.location.replace(admin_url);
    }
}

document.querySelector("[name=uploadDoc]").addEventListener("change", (event)=>{
    uploadDocuments(event.target.files);
});

const docButtons = document.getElementsByClassName("uploadDocButton");

for(btn of docButtons){
    btn.addEventListener("click", ()=>{
        document.querySelector("[name=uploadDoc]").click();
    })
}

const filterButtons = document.querySelectorAll("#filter-container button");
const filterDropdown = document.getElementsByClassName("filter-dropdown-content")[0];

for(child of filterButtons){
    child.addEventListener("click", event=>{
        filterDropdown.classList.toggle("filter-closed");
    });
}

for(node of document.querySelectorAll(".filter-dropdown-content > button")){
    node.addEventListener("click", event=>{
        vue.sortBy = event.currentTarget.getAttribute("data-sort").toLowerCase();
    });
}

finishLoad = function(){
    checkUser();
    listDocuments().then(loadVue);
}


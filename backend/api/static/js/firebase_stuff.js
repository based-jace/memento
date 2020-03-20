// Initialize Firebase
var firebaseConfig = { /* Your firebase config object */ };

firebase.initializeApp(firebaseConfig);
let db = firebase.firestore();

// Change when putting app into production
let userType = "demo-user";
let documentType = "demo-documents";

// When things are loaded
let full_redirect_url;

let adminPage = false;
let waitUser;
let waitAttributes;
let allLoaded;

// User Variable Declaration
let thisUser = {};
let userAtt_raw; // Directly from firestore
let userAttributes = {
    preferred_language: "en" // Default language to English
};
let raw_users = [];
let users = [];
let documents = []

/**
 * Logs the user in with the given email and password
 * 
 * @param {String} email 
 * @param {String} password 
 */
function login(email, password){
    firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(()=>{
        showAlert(vue.langText.incorrectPassword, "error");
    })
}

/**
 * Logs out the current user
 */
function logout(){
    firebase.auth().signOut();
}

let userLoaded = false;
let ifUser = false; // Set ifUser to true if testing for user instead of against it
firebase.auth().onAuthStateChanged((user)=>{
    full_redirect_url = user_redirect_url;
    if(user){
        full_redirect_url += user.uid;
    }

    if(!user && !ifUser || user && ifUser){
        window.location.replace(full_redirect_url);
    }
    else if(user){
        thisUser = user;
        userLoaded = true;
        getAttributes().then(finishLoad);
    }

    try{
        if(noAuthRequired){
            finishLoad();
        }
    }
    catch{}
})

/**
 * Pulls data from attributes pulled from firestore
 */
function getData(){
    return new Promise((resolve, reject)=>{
        getAttributes = db.collection(userType).doc(thisUser.uid);
        getAttributes.get().then((atts)=>{
            userAtt_raw = atts;
            userAttributes = atts.data();
            resolve(userAttributes);
        });
    });
}

/**
 * Gets user attributes from firestore
 * 
 * Also redirects from admin page if the current user isn't an admin,
 * and sets up the admin page if they are
 */
function getAttributes(){
    return getData().then((atts)=>{
        if(adminPage && !userAttributes.is_admin){
            full_redirect_url = vue.user_main_url + thisUser.uid;
            window.location.replace(full_redirect_url);
        }
        else{
            if(userAttributes.is_admin){ 
                let getUsers = db.collection(userType).where("is_admin", "==", false);
                getUsers.get().then((us)=>{
                    us.forEach((u)=>{
                        raw_users.push(u);
                        users.push(u.data());
                    });
                    return us;
                });
            }
        }
    })
}

/**
 *  Placeholder function
 * 
 * Each page script should update this to load the screen
 */
function finishLoad(){}

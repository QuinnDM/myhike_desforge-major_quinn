var currentUser;

// Retrieve the name of the user from the Firestore
function getNameFromAuth() {
    firebase.auth().onAuthStateChanged(user => {
        // Check if a user is signed in:
        if (user) {
            // Do something for the currently logged-in user here: 
            console.log(user.uid); //print the uid in the browser console
            console.log(user.displayName);  //print the user name in the browser console
            userName = user.displayName;
            document.getElementById("name-goes-here").innerText = userName;
        } else {
            // No user is signed in.
            console.log("No user is logged in");
        }
    });
}

// Function to read the quote of the day from the Firestore "quotes" collection
function readQuote(day) {
    db.collection("quotes").doc(day) //name of the collection and documents should matach excatly with what you have in Firestore
        .onSnapshot(dayDoc => {                                                         //arrow notation
            console.log("current document data: " + dayDoc.data());                     //.data() returns data object
            document.getElementById("quote-goes-here").innerHTML = dayDoc.data().quote; //using javascript to display the data on the right place
        }, (error) => {
            console.log("Error calling onSnapshot", error);
        });
}

function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("hikeCardTemplate"); // Retrieve the HTML element with the ID "hikeCardTemplate" and store it in the cardTemplate variable.

    db.collection(collection).get() //the collection called "hikes"
        .then(allHikes => {
            allHikes.forEach(doc => { //iterate through each doc
                let title = doc.data().name;        // get value of the "name" key
                let details = doc.data().details;   // get value of the "details" key
                let hikeCode = doc.data().code;     //get unique ID to each hike to be used for fetching right image
                let docID = doc.id;
                let newcard = cardTemplate.content.cloneNode(true);

                //update title and text and image
                newcard.querySelector('i').id = 'save-' + docID;   //guaranteed to be unique
                newcard.querySelector('i').onclick = () => saveBookmark(docID);
                newcard.querySelector('.card-title').innerHTML = title;
                newcard.querySelector('.card-length').innerHTML =
                    "Length: " + doc.data().length + " km <br>" +
                    "Duration: " + doc.data().hike_time + "min <br>" +
                    "Last updated: " + doc.data().last_updated.toDate().toLocaleDateString();
                newcard.querySelector('.card-text').innerHTML = details;
                newcard.querySelector('.card-image').src = `./images/${hikeCode}.jpg`; //Example: NV01.jpg
                newcard.querySelector('a').href = "eachHike.html?docID=" + docID;
                currentUser.get().then(userDoc => {
                    //get the user name
                    let bookmarks = userDoc.data().bookmarks;
                    if (bookmarks.includes(docID)) {
                        document.getElementById('save-' + docID).innerText = 'bookmark';
                        document.getElementById('save-' + docID).onclick = () => unsaveBookmark(docID);
                    } else {
                        document.getElementById('save-' + docID).innerText = 'bookmark_border';
                        document.getElementById('save-' + docID).onclick = () => saveBookmark(docID);
                    }
                })
                //attach to gallery, Example: "hikes-go-here"
                document.getElementById(collection + "-go-here").appendChild(newcard);
            })
        })
}

// These functions are called whenever the user clicks on the "bookmark" icon.
function saveBookmark(hikeDocID) {
    currentUser.update({
        bookmarks: firebase.firestore.FieldValue.arrayUnion(hikeDocID)
    })
        .then(function () {
            console.log("bookmark has been saved for" + hikeDocID);
            let iconID = 'save-' + hikeDocID;
            document.getElementById(iconID).innerText = 'bookmark';
            document.getElementById(iconID).onclick = () => unsaveBookmark(hikeDocID);
        });
}

function unsaveBookmark(hikeDocID) {
    currentUser.update({
        bookmarks: firebase.firestore.FieldValue.arrayRemove(hikeDocID)
    })
        .then(function () {
            console.log("bookmark has been unsaved for" + hikeDocID);
            let iconID = 'save-' + hikeDocID;
            document.getElementById(iconID).innerText = 'bookmark_border';
            document.getElementById(iconID).onclick = () => saveBookmark(hikeDocID);
        });
}

// Setup the page
function doAll() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            currentUser = db.collection("users").doc(user.uid); //global
            console.log(currentUser);

            // figure out what day of the week it is today
            const weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            const d = new Date();
            let day = weekday[d.getDay()];

            // the following functions are always called when someone is logged in
            readQuote(day);
            getNameFromAuth();
        } else {
            // No user is signed in.
            console.log("No user is signed in");
            window.location.href = "login.html";
        }
    });
    displayCardsDynamically("hikes");
}
doAll();
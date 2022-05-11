/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */


 function htmlToElement(html){
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

/** namespace. */
var rhit = rhit || {};
rhit.fbAuthManager = null;
rhit.majorSelectionManager = null;
rhit.FB_COLLECTION_MAJORS = "Majors";

rhit.MajorSelectionManager = class {
	constructor() {
		this.majorNumber = 2;
		this._documentSnapshot = {};
	 	this._unsubscribe = null;
	  	this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_MAJORS);
	}

	beginListening(changeListener) { 
		this._unsubscribe = this._ref.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			if (changeListener){
				changeListener();
			}
		});
	}

	stopListening() { 
		this._unsubscribe();
	}   
	
	set majorNumber(value) {
		this._majorNumber = value;
	}

	get majorNumber() {
		return this._majorNumber;
	}

	get majors() {
		return this._documentSnapshots;
	}
}


rhit.MajorSelectionController = class{
	constructor(){
		rhit.majorSelectionManager.beginListening(this.updateMajors.bind(this));
		this.initButtons();
	}

	

	initButtons() {
		document.getElementById("addMajor").addEventListener("click", function () {
			rhit.majorSelectionManager.majorNumber++;
			const html = `<form>
		<div class="form-group">
		  <label id="majorSelectLabel" for="majorSelect${rhit.majorSelectionManager.majorNumber}">Major ${rhit.majorSelectionManager.majorNumber}</label>
		  <br>
		  <select class="form-control" name="majorSelect${rhit.majorSelectionManager.majorNumber}" id="major${rhit.majorSelectionManager.majorNumber}Select">
		  </select>
		</div>
	  </form>`;
		const element = htmlToElement(html);
		document.getElementById("addMajorContainer").appendChild(element);
		this.updateMajors();
		}.bind(this));
	}

	updateMajors() {
		for (let i = 1; i <= rhit.majorSelectionManager.majorNumber; i++) {
			while (document.getElementById(`major${i}Select`).firstChild) {
				document.getElementById(`major${i}Select`).removeChild(document.getElementById(`major${i}Select`).firstChild);
			}
			for (let j = 0; j < rhit.majorSelectionManager.majors.length; j++) {
				const html = `<option>${rhit.majorSelectionManager.majors[j].id}</option>`;
				const element = htmlToElement(html);
				document.getElementById(`major${i}Select`).appendChild(element);
			}
		}
	}
	

}

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		};
	}
}

rhit.FbAuthManager = class {
	constructor() {
	  this._user = null;
	}
	
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged( (user) => {
			this._user = user;
			changeListener();
		});
	}
	signIn() {
		Rosefire.signIn("c99f9b94-a084-435c-ad83-1b26a6d50bc8", (err, rfUser) => {
			if (err) {
			  console.log("Rosefire error!", err);
			  return;
			}
			console.log("Rosefire success!", rfUser);
			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
				  alert('The token you provided is not valid.');
				} else {
				  console.error(error);
				}
			});
		});
		
	}
	signOut() {
		firebase.auth().signOut().catch(function(error){
			// An error happened.
			console.log("Sign Out Error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	// rhit.fbAuthManager = new rhit.FbAuthManager();
	// rhit.fbAuthManager.beginListening(() => {
	// 	if (document.querySelector("#loginPage")){
	// 		console.log("you are on login page");
	// 		new rhit.LoginPageController();
	// 	}
	// 	if (document.querySelector("#majorSelectionPage")){
	// 		console.log("you are on major selection page");
	// 		new rhit.majorSelectionController();
	// 	}
	// 	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
	// 		window.location.href = "/majorSelection.html";
	// 	}
	// });
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		document.querySelector("#rosefireButton").onclick = (event) => { //delete me
			window.location.href = "/majorSelection.html";
		};
			}
	
	if (document.querySelector("#majorSelectionPage")){
		console.log("you are on major selection page");
		rhit.majorSelectionManager = new rhit.MajorSelectionManager();
		console.log(rhit.majorSelectionManager.majors);
		new rhit.MajorSelectionController();
	}

};

rhit.main();

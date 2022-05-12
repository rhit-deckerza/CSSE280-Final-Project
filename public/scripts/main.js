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
rhit.FB_COLLECTION_USER = "User";

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

	initButtons(){
		document.getElementById("addMajor").addEventListener("click", function () {
			rhit.majorSelectionManager.majorNumber++;
			const html = `<form>
		<div id="major${rhit.majorSelectionManager.majorNumber}"majorclass="form-group">
		  <label id="majorSelectLabel" for="majorSelect${rhit.majorSelectionManager.majorNumber}">Major ${rhit.majorSelectionManager.majorNumber}</label>
		  <br>
		  <select class="form-control" name="majorSelect${rhit.majorSelectionManager.majorNumber}" id="major${rhit.majorSelectionManager.majorNumber}Select">
		  </select>
		  <button type="button" class="btn" id="delete${rhit.majorSelectionManager.majorNumber}">Delete</button>
		</div>
	</form>
	`;
		const element = htmlToElement(html);
		document.getElementById("addMajorContainer").appendChild(element);
		document.getElementById(`delete${rhit.majorSelectionManager.majorNumber}`).addEventListener("click", function () {
			document.getElementById(`major${rhit.majorSelectionManager.majorNumber}`).remove();
			rhit.majorSelectionManager.majorNumber--;
		});
		this.updateMajors();
		}.bind(this));
		document.getElementById("signOut").addEventListener("click", function () {
			rhit.fbAuthManager.signOut();
		});
		document.getElementById("majorSelectContinue").addEventListener("click", function () {
			let majors = [];
			let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index);
			for (let i = 1; i <= rhit.majorSelectionManager.majorNumber; i++) {
				majors.push(document.getElementById(`major${i}Select`).value);
			}
			if (findDuplicates(majors).length == 0){
				firebase.firestore().collection(rhit.FB_COLLECTION_USER).doc(rhit.fbAuthManager.uid).update({
					majors: majors
				}).catch(function(error) {
					console.log("Error writing document: ", error);
				});
				window.location.href = "/coursePlanning.html";
			}else{
				alert("You cannot select the same major twice");
			}
		});
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
	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USER);
	}
	
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged( (user) => {
			console.log("here");
			this._user = user;
			if (this._user){
				const userRef = this._ref.doc(this._user.uid);
				const plan = 
					{Y1: {
						Fall:[],
						Spring:[],
						Summer:[],
						Winter:[]
					},
					Y2: {
						Fall:[],
						Spring:[],
						Summer:[],
						Winter:[]
					},
					Y3: {
						Fall:[],
						Spring:[],
						Summer:[],
						Winter:[]
					},
					Y4: {
						Fall:[],
						Spring:[],
						Summer:[],
						Winter:[]
					},
					Y5: {
						Fall:[],
						Spring:[],
						Summer:[],
						Winter:[]
					}};
				const majors = [];
				userRef.get().then((doc) => {
					if (!doc.exists) {
						this._ref.doc(this._user.uid).set({
							uid: this._user.uid,
							plan: plan,
							majors: majors
						});
					}
			});
			}
			rhit.checkForRedirects();
			changeListener();
		});
	}
	signIn() {
		Rosefire.signIn("2bfeaf22-1062-4869-8862-dde0713337cd", (err, rfUser) => {
			if (err) {
			  console.log("Rosefire error!", err);
			  return;
			}
			console.log("Rosefire success!", rfUser);
			firebase.auth().signInWithCustomToken(rfUser.token).then(
				(user) => {
					rhit.checkForRedirects();
				}
			).catch((error) => {
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

rhit.CoursePlanningController = class {
	constructor() {
		document.getElementById("signOut").addEventListener("click", function () {
			rhit.fbAuthManager.signOut();
		});
		this._userRef = firebase.firestore().collection(rhit.FB_COLLECTION_USER).doc(rhit.fbAuthManager.uid);
		this._majorRef = firebase.firestore().collection(rhit.FB_COLLECTION_MAJORS);
		this.populateRequired();
	}

	populateRequired(){
		this._userRef.get().then((doc) => {
			if (doc.exists) {
				this.getMajorData(doc.data().majors);
			}
		}).catch((error) => {
			console.log("Error getting document:", error);
		}
		);
	}

	getMajorData(majors){
		let allClasses = [];
		let allPrereqs = [];
		for (let i = 0; i < majors.length; i++) {
			let major = majors[i];
			this._majorRef.doc(major).get().then((doc) => {
				if (doc.exists) {
					allClasses = allClasses.concat(doc.data().Classes);
					allPrereqs.push(doc.data().Prerequisites);
				}
				if (i === majors.length - 1) {
					this.placeReqCards(noDuplicates(allClasses), allPrereqs);
				}
			}).catch((error) => {
				console.log("Error getting document:", error);
			});
		}
	}

	placeReqCards(allClasses, allPrereqs){
		while (document.getElementById("dw-s1").firstChild) {
			document.getElementById("dw-s1").removeChild(document.getElementById("dw-s1").firstChild);
		}
		for (let i = 0; i < allClasses.length; i++) {
			let className = allClasses[i];
			let prereqs = allPrereqs[0][className] || allPrereqs[1][className] || "none";
			let prereqsString = "";
			if (prereqs !== "none") {
				for (let j = 0; j < prereqs.length; j++) {
					if (j === prereqs.length - 1) {
						prereqsString += prereqs[j];
					} else {
						prereqsString += prereqs[j] + ", ";
					}
				}
			}
			let html = `<div id="${className}" class="card">
			<div class="card-body">
			  <h5 class="card-title">${className}</h5>
			  <h6 class="card-subtitle mb-2 text-muted">${prereqsString}</h6>
			</div>
		  </div>`
			let element = htmlToElement(html);
			document.getElementById("dw-s1").appendChild(element);
		}
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		if (document.querySelector("#loginPage")){
			console.log("you are on login page");
			new rhit.LoginPageController();
		}
		if (document.querySelector("#majorSelectionPage")){
			console.log("you are on major selection page");
			rhit.majorSelectionManager = new rhit.MajorSelectionManager();
			new rhit.MajorSelectionController();
		}
		if (document.querySelector("#coursePlanningPage")){
			new rhit.CoursePlanningController();
		}
		rhit.checkForRedirects();
	});
};

rhit.checkForRedirects = function() {
	
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		console.log("Here");
		firebase.firestore().collection(rhit.FB_COLLECTION_USER).doc(rhit.fbAuthManager.uid).get().then((doc) => {
			if (doc.exists) {
				const data = doc.data();
				if (data.majors.length > 0) {
					window.location.href = "./coursePlanning.html";
				}else{
					window.location.href = "./majorSelection.html";
				}
			}else{
				window.location.href = "./majorSelection.html";
			}
		}).catch((error) => {
			console.log("Error getting document:", error);
		});
	}

	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}

};

function noDuplicates(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

rhit.main();

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
		<div id="major${rhit.majorSelectionManager.majorNumber}" class="form-group bmd-form-group is-filled">
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
				}).then( () => {
					window.location.href = "/coursePlanning.html";
				}).catch(function(error) {
					console.log("Error writing document: ", error);
				});
				
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
				const requiredCourses = [];
				const majors = [];
				userRef.get().then((doc) => {
					if (!doc.exists) {
						this._ref.doc(this._user.uid).set({
							uid: this._user.uid,
							plan: plan,
							majors: majors,
							requiredCourses: requiredCourses
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
		this.populateYears("Y1");
		this.selectChangeListen();
	}

	selectChangeListen(){
		document.querySelector("#yearSelect").addEventListener("change", function () {
			this.populateYears(document.querySelector("#yearSelect").value);
		}.bind(this));
	}

	populateYears(currYear){
		this._userRef.get().then((doc) => {
			if (doc.exists){
				while (document.getElementById("fallContainer").firstChild) {
					document.getElementById("fallContainer").removeChild(document.getElementById("fallContainer").firstChild);
				}
				while (document.getElementById("winterContainer").firstChild) {
					document.getElementById("winterContainer").removeChild(document.getElementById("winterContainer").firstChild);
				}
				while (document.getElementById("springContainer").firstChild) {
					document.getElementById("springContainer").removeChild(document.getElementById("springContainer").firstChild);
				}
				while (document.getElementById("summerContainer").firstChild) {
					document.getElementById("summerContainer").removeChild(document.getElementById("summerContainer").firstChild);
				}
				doc.data().plan[currYear].Fall.forEach(function(course){
					let html = `<div id="${course}" class="card">
					<div class="card-body">
					<h5 class="card-title">${course}</h5>
					<button id="${course}Remove"class="btn btn-danger d-none">Remove</button>
					</div>
				</div>`
					let element = htmlToElement(html);
					document.getElementById("fallContainer").appendChild(element);
					document.getElementById(course).addEventListener("mouseover", function () {
						document.getElementById(course).querySelector(".btn").classList.remove("d-none");
					}.bind(this));
					document.getElementById(course).addEventListener("mouseout", function () {
						document.getElementById(course).querySelector(".btn").classList.add("d-none");
					}.bind(this));
					document.getElementById(course + "Remove").addEventListener("click", function () {
						this._userRef.get().then(function (doc) {
							if (doc.exists){
								const planPart = doc.data().plan;
								const currRequiredCourses = doc.data().requiredCourses;
								currRequiredCourses.unshift(course);
								for (let i = 0; i < planPart[currYear].Fall.length; i++){
									if (planPart[currYear].Fall[i] === course){
										planPart[currYear].Fall.splice(i, 1);
										break;
									}
								}
								this._userRef.update({
									plan: planPart,
									requiredCourses: currRequiredCourses
								}).then(function() {
									this.populateRequired();
									this.populateYears(currYear);
								}.bind(this));
							}
						}.bind(this));
					}.bind(this));
				}.bind(this));
				doc.data().plan[currYear].Winter.forEach(function(course){
					let html = `<div id="${course}" class="card">
					<div class="card-body">
					<h5 class="card-title">${course}</h5>
					<button id="${course}Remove"class="btn btn-danger d-none">Remove</button>
					</div>
				</div>`
					let element = htmlToElement(html);
					document.getElementById("winterContainer").appendChild(element);
					document.getElementById(course).addEventListener("mouseover", function () {
						document.getElementById(course).querySelector(".btn").classList.remove("d-none");
					}.bind(this));
					document.getElementById(course).addEventListener("mouseout", function () {
						document.getElementById(course).querySelector(".btn").classList.add("d-none");
					}.bind(this));
					document.getElementById(course + "Remove").addEventListener("click", function () {
						this._userRef.get().then(function (doc) {
							if (doc.exists){
								const planPart = doc.data().plan;
								const currRequiredCourses = doc.data().requiredCourses;
								currRequiredCourses.unshift(course);
								for (let i = 0; i < planPart[currYear].Winter.length; i++){
									if (planPart[currYear].Winter[i] === course){
										planPart[currYear].Winter.splice(i, 1);
										break;
									}
								}
								this._userRef.update({
									plan: planPart,
									requiredCourses: currRequiredCourses
								}).then(function() {
									this.populateRequired();
									this.populateYears(currYear);
								}.bind(this));
							}
						}.bind(this));
					}.bind(this));
				}.bind(this));
				doc.data().plan[currYear].Spring.forEach(function(course){
					let html = `<div id="${course}" class="card">
					<div class="card-body">
					<h5 class="card-title">${course}</h5>
					<button id="${course}Remove"class="btn btn-danger d-none">Remove</button>
					</div>
				</div>`
					let element = htmlToElement(html);
					document.getElementById("springContainer").appendChild(element);
					document.getElementById(course).addEventListener("mouseover", function () {
						document.getElementById(course).querySelector(".btn").classList.remove("d-none");
					});
					document.getElementById(course).addEventListener("mouseout", function () {
						document.getElementById(course).querySelector(".btn").classList.add("d-none");
					});
					document.getElementById(course + "Remove").addEventListener("click", function () {
						this._userRef.get().then(function (doc) {
							if (doc.exists){
								const planPart = doc.data().plan;
								const currRequiredCourses = doc.data().requiredCourses;
								currRequiredCourses.unshift(course);
								for (let i = 0; i < planPart[currYear].Spring.length; i++){
									if (planPart[currYear].Spring[i] === course){
										planPart[currYear].Spring.splice(i, 1);
										break;
									}
								}
								this._userRef.update({
									plan: planPart,
									requiredCourses: currRequiredCourses
								}).then(function() {
									this.populateRequired();
									this.populateYears(currYear);
								}.bind(this));
							}
						}.bind(this));
					}.bind(this));
				}.bind(this));
				doc.data().plan[currYear].Summer.forEach(function(course){
					let html = `<div id="${course}" class="card">
					<div class="card-body">
					<h5 class="card-title">${course}</h5>
					<button id="${course}Remove"class="btn btn-danger d-none">Remove</button>
					</div>
				</div>`
					let element = htmlToElement(html);
					document.getElementById("summerContainer").appendChild(element);
					document.getElementById(course).addEventListener("mouseover", function () {
						document.getElementById(course).querySelector(".btn").classList.remove("d-none");
					}.bind(this));
					document.getElementById(course).addEventListener("mouseout", function () {
						document.getElementById(course).querySelector(".btn").classList.add("d-none");
					}.bind(this));
					document.getElementById(course + "Remove").addEventListener("click", function () {
						this._userRef.get().then(function (doc) {
							if (doc.exists){
								const planPart = doc.data().plan;
								const currRequiredCourses = doc.data().requiredCourses;
								currRequiredCourses.unshift(course);
								for (let i = 0; i < planPart[currYear].Summer.length; i++){
									if (planPart[currYear].Summer[i] === course){
										planPart[currYear].Summer.splice(i, 1);
										break;
									}
								}
								this._userRef.update({
									plan: planPart,
									requiredCourses: currRequiredCourses
								}).then(function() {
									this.populateRequired();
									this.populateYears(currYear);
								}.bind(this));
							}
						}.bind(this));
					}.bind(this));
				}.bind(this));
			}
		}).catch((error) => {
			console.log("Error getting document:", error);
		});
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
		for (let i = 0; i < majors.length; i++) {
			let major = majors[i];
			this._majorRef.doc(major).get().then((doc) => {
				if (doc.exists) {
					allClasses = allClasses.concat(doc.data().Classes);
				}
				if (i === majors.length - 1) {
					let allClassesNoDups = noDuplicates(allClasses);
					this._userRef.get().then((doc) => {
						if (doc.exists) {
							if (doc.data().requiredCourses.length === 0) {
								this._userRef.update({
									requiredCourses: allClassesNoDups
								});
								this.placeReqCards(allClassesNoDups);
							}else{
								this.placeReqCards(doc.data().requiredCourses);
							}
						}
					});
				}
			}).catch((error) => {
				console.log("Error getting document:", error);
			});
		}
	}

	placeReqCards(allClasses){
		while (document.getElementById("dw-s1").firstChild) {
			document.getElementById("dw-s1").removeChild(document.getElementById("dw-s1").firstChild);
		}
		for (let i = 0; i < allClasses.length; i++) {
			let className = allClasses[i];
			let html = `<div id="${className}" class="card">
			<div class="card-body">
			  <h5 class="card-title">${className}</h5>
			</div>
		  </div>`
			let element = htmlToElement(html);
			document.getElementById("dw-s1").appendChild(element);
			document.getElementById(className).addEventListener("click", function () {
				document.querySelectorAll(".selected").forEach(function (card) {
					console.log("Here");
					card.classList.remove("selected");
				});
				document.getElementById(className).classList.add("selected");
				document.getElementById("fallContainer").classList.add("selected");
				document.getElementById("springContainer").classList.add("selected");
				document.getElementById("summerContainer").classList.add("selected");
				document.getElementById("winterContainer").classList.add("selected");
				this.activatePlace();
			}.bind(this));
		}
	}

	activatePlace(){
		console.log("LOl");
		document.getElementById("fallContainer").addEventListener("click", function () {
			this._userRef.get().then((doc) => {
				if (doc.exists) {
					let currPlan = doc.data().plan;
					let currRequiredCourses = doc.data().requiredCourses;
					let currYear = document.getElementById("yearSelect").value;
					let selectedClass = document.querySelector(".selected.card").id;
					switch (currYear) {
						case "Y1":
							currPlan.Y1.Fall.push(selectedClass);
							break;
						case "Y2":
							currPlan.Y2.Fall.push(selectedClass);
							break;
						case "Y3":
							currPlan.Y3.Fall.push(selectedClass);
							break;
						case "Y4":
							currPlan.Y4.Fall.push(selectedClass);
							break;
						case "Y5":
							currPlan.Y5.Fall.push(selectedClass);
							break;
					}
					for( var i = 0; i < currRequiredCourses.length; i++){ 
						if ( currRequiredCourses[i] === selectedClass) { 
							currRequiredCourses.splice(i, 1); 
						}
					}
					this._userRef.update({
						plan: currPlan,
						requiredCourses: currRequiredCourses
					}).then(() => {
						document.querySelectorAll(".selected").forEach(function (card) {
							card.classList.remove("selected");
						});
						this.populateYears(currYear);
						this.populateRequired();
					});
				}
			});
		}.bind(this));
		document.getElementById("summerContainer").addEventListener("click", function () {
			this._userRef.get().then((doc) => {
				if (doc.exists) {
					let currPlan = doc.data().plan;
					let currRequiredCourses = doc.data().requiredCourses;
					let currYear = document.getElementById("yearSelect").value;
					let selectedClass = document.querySelector(".selected.card").id;
					switch (currYear) {
						case "Y1":
							currPlan.Y1.Summer.push(selectedClass);
							break;
						case "Y2":
							currPlan.Y2.Summer.push(selectedClass);
							break;
						case "Y3":
							currPlan.Y3.Summer.push(selectedClass);
							break;
						case "Y4":
							currPlan.Y4.Summer.push(selectedClass);
							break;
						case "Y5":
							currPlan.Y5.Summer.push(selectedClass);
							break;
					}
					for( var i = 0; i < currRequiredCourses.length; i++){ 
    
						if ( currRequiredCourses[i] === selectedClass) { 
							currRequiredCourses.splice(i, 1); 
						}
					
					}
					this._userRef.update({
						plan: currPlan,
						requiredCourses: currRequiredCourses
					}).then(() => {
						document.querySelectorAll(".selected").forEach(function (card) {
							card.classList.remove("selected");
						});
						this.populateYears(currYear);
						this.populateYears(currYear);
						this.populateRequired();
					});
				}
					
			});
		}.bind(this));
		document.getElementById("springContainer").addEventListener("click", function () {
			this._userRef.get().then((doc) => {
				if (doc.exists) {
					let currPlan = doc.data().plan;
					let currRequiredCourses = doc.data().requiredCourses;
					let currYear = document.getElementById("yearSelect").value;
					let selectedClass = document.querySelector(".selected.card").id;
					switch (currYear) {
						case "Y1":
							currPlan.Y1.Spring.push(selectedClass);
							break;
						case "Y2":
							currPlan.Y2.Spring.push(selectedClass);
							break;
						case "Y3":
							currPlan.Y3.Spring.push(selectedClass);
							break;
						case "Y4":
							currPlan.Y4.Spring.push(selectedClass);
							break;
						case "Y5":
							currPlan.Y5.Spring.push(selectedClass);
							break;
					}
					for( var i = 0; i < currRequiredCourses.length; i++){ 
    
						if ( currRequiredCourses[i] === selectedClass) { 
							currRequiredCourses.splice(i, 1); 
						}
					
					}
					this._userRef.update({
						plan: currPlan,
						requiredCourses: currRequiredCourses
					}).then(() => {
						document.querySelectorAll(".selected").forEach(function (card) {
							card.classList.remove("selected");
						});
						this.populateYears(currYear);
						this.populateRequired();
					});
				}
					
			});
		}.bind(this));
		document.getElementById("winterContainer").addEventListener("click", function () {
			this._userRef.get().then((doc) => {
				if (doc.exists) {
					let currPlan = doc.data().plan;
					let currRequiredCourses = doc.data().requiredCourses;
					let currYear = document.getElementById("yearSelect").value;
					let selectedClass = document.querySelector(".selected.card").id;
					switch (currYear) {
						case "Y1":
							currPlan.Y1.Winter.push(selectedClass);
							break;
						case "Y2":
							currPlan.Y2.Winter.push(selectedClass);
							break;
						case "Y3":
							currPlan.Y3.Winter.push(selectedClass);
							break;
						case "Y4":
							currPlan.Y4.Winter.push(selectedClass);
							break;
						case "Y5":
							currPlan.Y5.Winter.push(selectedClass);
							break;
					}
					for( var i = 0; i < currRequiredCourses.length; i++){ 
    
						if ( currRequiredCourses[i] === selectedClass) { 
							currRequiredCourses.splice(i, 1); 
						}
					
					}
					this._userRef.update({
						plan: currPlan,
						requiredCourses: currRequiredCourses
					}).then(() => {
						document.querySelectorAll(".selected").forEach(function (card) {
							card.classList.remove("selected");
						});
						this.populateYears(currYear);
						this.populateRequired();
					});
				}
					
			});
		}.bind(this));
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

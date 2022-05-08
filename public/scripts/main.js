/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

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
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		if (document.querySelector("#loginPage")){
			console.log("you are on login page");
			new rhit.LoginPageController();
		}
		if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
			window.location.href = "/majorSelection.html";
		}
	});
};

rhit.main();

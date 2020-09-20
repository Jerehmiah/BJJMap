/*JS to handle Firebase logins.  Requires that the page sets a bjjInit() function to be called once the user is logged in */

initApp = function() {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        // var displayName = user.displayName;
        // var email = user.email;
        // var emailVerified = user.emailVerified;
        // var photoURL = user.photoURL;
        // var uid = user.uid;
        // var phoneNumber = user.phoneNumber;
        // var providerData = user.providerData;
        user.getIdToken().then(function(accessToken) {
          window.bjjInit(user);
        });
      } else {
        // FirebaseUI config.
        var uiConfig = {
            signInSuccessUrl: window.location,
            signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            firebase.auth.EmailAuthProvider.PROVIDER_ID,
            ],
            // tosUrl and privacyPolicyUrl accept either url string or a callback
            // function.
            // Terms of service url/callback.
            tosUrl: '/tos.html',
            // Privacy policy url/callback.
            privacyPolicyUrl: '/privacy.html'
        };

        // Initialize the FirebaseUI Widget using Firebase.
        var ui = new firebaseui.auth.AuthUI(firebase.auth());
        // The start method will wait until the DOM is loaded.
        ui.start('#firebaseui-auth-container', uiConfig);
      }
    }, function(error) {
      console.log(error);
    });
  };
  window.bjjSignout = (andThen)=>{
    firebase.auth().signOut().then(andThen()).catch(function(error) {
        console.log(error);
      });
  }
  window.addEventListener('load', function() {
    initApp();
  });
      

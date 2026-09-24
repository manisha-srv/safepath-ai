// ============================================================
// SafePath AI — shared auth (Firebase Authentication, email/password)
//
// Ties hazard reports, flags, and repair confirmations to an actual
// account instead of just a browser — per the pitch deck's Trust &
// Safety slide ("Firebase Authentication ties reports to accounts").
// Email/password only (no phone/SMS), so it needs no extra setup
// beyond enabling the sign-in method in the Firebase console, and
// stays on the free Spark plan.
//
// Exposes window.currentUser (null when signed out) and fires a
// "safepath-auth-changed" event on `document` whenever it changes,
// so app.js / dashboard.js can react without depending on this file's
// internals.
// ============================================================

window.currentUser = null;

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSignInBtn = document.getElementById("authSignInBtn");
const authSignUpBtn = document.getElementById("authSignUpBtn");
const authSignOutBtn = document.getElementById("authSignOutBtn");
const authStatus = document.getElementById("authStatus");
const authSignedOutView = document.getElementById("authSignedOutView");
const authSignedInView = document.getElementById("authSignedInView");
const authUserEmail = document.getElementById("authUserEmail");

function notifyAuthChanged() {
  document.dispatchEvent(new CustomEvent("safepath-auth-changed", { detail: { user: window.currentUser } }));
}

function friendlyAuthError(e) {
  // Firebase's default messages are fine for a hackathon demo, but a
  // couple of the common ones read better simplified.
  if (e.code === "auth/email-already-in-use") return "That email already has an account — try Log In instead.";
  if (e.code === "auth/weak-password") return "Password should be at least 6 characters.";
  if (e.code === "auth/invalid-email") return "That doesn't look like a valid email address.";
  if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") return "Wrong email or password.";
  if (e.code === "auth/user-not-found") return "No account with that email — try Sign Up instead.";
  return e.message;
}

if (typeof firebase !== "undefined" && firebase.auth) {
  firebase.auth().onAuthStateChanged((user) => {
    window.currentUser = user;
    if (user) {
      authSignedOutView.style.display = "none";
      authSignedInView.style.display = "flex";
      authUserEmail.textContent = user.email;
    } else {
      authSignedOutView.style.display = "flex";
      authSignedInView.style.display = "none";
    }
    authStatus.textContent = "";
    notifyAuthChanged();
  });

  authSignUpBtn.addEventListener("click", async () => {
    authStatus.textContent = "";
    try {
      await firebase.auth().createUserWithEmailAndPassword(authEmail.value.trim(), authPassword.value);
    } catch (e) {
      authStatus.textContent = friendlyAuthError(e);
    }
  });

  authSignInBtn.addEventListener("click", async () => {
    authStatus.textContent = "";
    try {
      await firebase.auth().signInWithEmailAndPassword(authEmail.value.trim(), authPassword.value);
    } catch (e) {
      authStatus.textContent = friendlyAuthError(e);
    }
  });

  authSignOutBtn.addEventListener("click", () => firebase.auth().signOut());
} else {
  authStatus.textContent = "Firebase Auth isn't configured yet — see README.md.";
}

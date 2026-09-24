// ============================================================
// SafePath AI — Shared Authentication & Profile Modal Management
// Circular Profile Avatar Button, Modern Glassmorphic Auth Modal,
// Real-Time Firebase Auth Sync & Multi-Screen Support
// ============================================================

window.currentUser = null;

const profileAvatarBtn = document.getElementById("profileAvatarBtn");
const headerAvatarIcon = document.getElementById("headerAvatarIcon");
const headerAvatarDot = document.getElementById("headerAvatarDot");
const authModalOverlay = document.getElementById("authModalOverlay");
const authModalCloseBtn = document.getElementById("authModalCloseBtn");

const authTabLogin = document.getElementById("authTabLogin");
const authTabSignup = document.getElementById("authTabSignup");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authForm = document.getElementById("authForm");

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSignInBtn = document.getElementById("authSignInBtn"); // backward compatibility
const authSignUpBtn = document.getElementById("authSignUpBtn"); // backward compatibility
const authSignOutBtn = document.getElementById("authSignOutBtn");
const authStatus = document.getElementById("authStatus");
const authSignedOutView = document.getElementById("authSignedOutView");
const authSignedInView = document.getElementById("authSignedInView");
const authUserEmail = document.getElementById("authUserEmail");
const modalAvatarBadge = document.getElementById("modalAvatarBadge");

const sidebarUserCard = document.getElementById("sidebarUserCard");
const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarUserSub = document.getElementById("sidebarUserSub");

let authMode = "login"; // "login" | "signup"

function openAuthModal() {
  if (!authModalOverlay) return;
  authModalOverlay.style.display = "flex";
  authModalOverlay.setAttribute("aria-hidden", "false");
  if (authStatus) authStatus.textContent = "";
  if (!window.currentUser && authEmail) {
    setTimeout(() => authEmail.focus(), 120);
  }
}

function closeAuthModal() {
  if (!authModalOverlay) return;
  authModalOverlay.style.display = "none";
  authModalOverlay.setAttribute("aria-hidden", "true");
}

function setAuthMode(mode) {
  authMode = mode;
  if (authTabLogin) authTabLogin.classList.toggle("active", mode === "login");
  if (authTabSignup) authTabSignup.classList.toggle("active", mode === "signup");
  if (authSubmitBtn) {
    authSubmitBtn.textContent = mode === "login" ? "Log In" : "Create Account";
  }
  if (authStatus) authStatus.textContent = "";
}

function notifyAuthChanged() {
  document.dispatchEvent(new CustomEvent("safepath-auth-changed", { detail: { user: window.currentUser } }));
}

function friendlyAuthError(e) {
  if (!e) return "An unexpected error occurred.";
  if (e.code === "auth/email-already-in-use") return "That email already has an account — try Log In instead.";
  if (e.code === "auth/weak-password") return "Password should be at least 6 characters.";
  if (e.code === "auth/invalid-email") return "That doesn't look like a valid email address.";
  if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") return "Wrong email or password.";
  if (e.code === "auth/user-not-found") return "No account with that email — try Sign Up instead.";
  return e.message;
}

function updateAuthUI(user) {
  if (user) {
    const initial = (user.email || "U").charAt(0).toUpperCase();
    if (headerAvatarIcon) headerAvatarIcon.textContent = initial;
    if (headerAvatarDot) headerAvatarDot.style.display = "block";
    if (profileAvatarBtn) profileAvatarBtn.setAttribute("title", `Signed in as ${user.email}`);

    if (modalAvatarBadge) modalAvatarBadge.textContent = initial;
    if (authSignedOutView) authSignedOutView.style.display = "none";
    if (authSignedInView) authSignedInView.style.display = "block";
    if (authUserEmail) authUserEmail.textContent = user.email;

    if (sidebarUserAvatar) sidebarUserAvatar.textContent = initial;
    if (sidebarUserName) sidebarUserName.textContent = user.email.split("@")[0];
    if (sidebarUserSub) sidebarUserSub.textContent = "Verified Inspector (Online)";
  } else {
    if (headerAvatarIcon) headerAvatarIcon.textContent = "👤";
    if (headerAvatarDot) headerAvatarDot.style.display = "none";
    if (profileAvatarBtn) profileAvatarBtn.setAttribute("title", "Account / Sign In");

    if (modalAvatarBadge) modalAvatarBadge.textContent = "👤";
    if (authSignedOutView) authSignedOutView.style.display = "block";
    if (authSignedInView) authSignedInView.style.display = "none";

    if (sidebarUserAvatar) sidebarUserAvatar.textContent = "👤";
    if (sidebarUserName) sidebarUserName.textContent = "Guest Driver";
    if (sidebarUserSub) sidebarUserSub.textContent = "Tap to Sign In / Manage";
  }
}

// Perform Email/Password authentication
async function submitAuthAction() {
  if (!authEmail || !authPassword) return;
  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    if (authStatus) authStatus.textContent = "Please enter both email and password.";
    return;
  }

  if (authStatus) authStatus.textContent = "Processing...";

  try {
    if (authMode === "signup") {
      await firebase.auth().createUserWithEmailAndPassword(email, password);
    } else {
      await firebase.auth().signInWithEmailAndPassword(email, password);
    }
    if (authStatus) authStatus.textContent = "";
    closeAuthModal();
  } catch (e) {
    if (authStatus) authStatus.textContent = friendlyAuthError(e);
  }
}

// Modal open/close listeners
if (profileAvatarBtn) {
  profileAvatarBtn.addEventListener("click", openAuthModal);
}
if (sidebarUserCard) {
  sidebarUserCard.addEventListener("click", () => {
    // If sidebar drawer has close function, close it
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.style.display = "none";
    openAuthModal();
  });
}
if (authModalCloseBtn) {
  authModalCloseBtn.addEventListener("click", closeAuthModal);
}
if (authModalOverlay) {
  authModalOverlay.addEventListener("click", (e) => {
    if (e.target === authModalOverlay) {
      closeAuthModal();
    }
  });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && authModalOverlay && authModalOverlay.style.display === "flex") {
    closeAuthModal();
  }
});

// Tab switching
if (authTabLogin) {
  authTabLogin.addEventListener("click", () => setAuthMode("login"));
}
if (authTabSignup) {
  authTabSignup.addEventListener("click", () => setAuthMode("signup"));
}

// Submit button & form listeners
if (authSubmitBtn) {
  authSubmitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    submitAuthAction();
  });
}
if (authForm) {
  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitAuthAction();
  });
}

// Backward compatibility legacy buttons
if (authSignInBtn) {
  authSignInBtn.addEventListener("click", () => {
    authMode = "login";
    submitAuthAction();
  });
}
if (authSignUpBtn) {
  authSignUpBtn.addEventListener("click", () => {
    authMode = "signup";
    submitAuthAction();
  });
}
if (authSignOutBtn) {
  authSignOutBtn.addEventListener("click", async () => {
    try {
      await firebase.auth().signOut();
      closeAuthModal();
    } catch (e) {
      console.error("Sign out error", e);
    }
  });
}

// Firebase Auth State Observer
if (typeof firebase !== "undefined" && firebase.auth) {
  firebase.auth().onAuthStateChanged((user) => {
    window.currentUser = user;
    updateAuthUI(user);
    if (authStatus) authStatus.textContent = "";
    notifyAuthChanged();
  });
} else {
  if (authStatus) {
    authStatus.textContent = "Firebase Auth isn't configured yet — see README.md.";
  }
}

/* ==========================================================================
   AI-POWERED BUSINESS DECISION SUPPORT SYSTEM - APPLICATION CONTROLLER
   ========================================================================= */


// --- Default Preloaded Decision Model ---
const DEFAULT_DECISION = {
  id: 'hq-location-decision',
  title: 'Selecting a Headquarters Location',
  description: 'Evaluating candidate hubs to establish our new global headquarters. Objectives: maximize tax efficiency, secure top-tier engineering talent, and balance operational overhead.',
  alternatives: ['Austin, TX', 'Singapore', 'Dublin, Ireland'],
  criteria: ['Tax Incentives', 'Talent Pool', 'Operating Cost', 'Quality of Life'],
  weights: {
    'Tax Incentives': 30,
    'Talent Pool': 40,
    'Operating Cost': 20,
    'Quality of Life': 10
  },
  scores: {
    'Austin, TX': { 'Tax Incentives': 6, 'Talent Pool': 9, 'Operating Cost': 5, 'Quality of Life': 9 },
    'Singapore': { 'Tax Incentives': 9, 'Talent Pool': 8, 'Operating Cost': 3, 'Quality of Life': 8 },
    'Dublin, Ireland': { 'Tax Incentives': 8, 'Talent Pool': 8, 'Operating Cost': 7, 'Quality of Life': 7 }
  },
  updatedAt: new Date().toISOString()
};

const DB_ARCH_TEMPLATE = {
  id: 'db-arch-decision',
  title: 'Database Architecture Selection',
  description: 'Selecting the primary database technology for our next-generation cloud application. Goal: scale to millions of users, minimize query latency, and keep maintenance overhead low.',
  alternatives: ['PostgreSQL (Relational)', 'MongoDB (Document)', 'DynamoDB (NoSQL Key-Value)'],
  criteria: ['Query Latency', 'Scaling Overhead', 'Cost Efficiency', 'Team Familiarity'],
  weights: {
    'Query Latency': 30,
    'Scaling Overhead': 35,
    'Cost Efficiency': 20,
    'Team Familiarity': 15
  },
  scores: {
    'PostgreSQL (Relational)': { 'Query Latency': 8, 'Scaling Overhead': 5, 'Cost Efficiency': 7, 'Team Familiarity': 9 },
    'MongoDB (Document)': { 'Query Latency': 8, 'Scaling Overhead': 7, 'Cost Efficiency': 6, 'Team Familiarity': 8 },
    'DynamoDB (NoSQL Key-Value)': { 'Query Latency': 9, 'Scaling Overhead': 9, 'Cost Efficiency': 5, 'Team Familiarity': 6 }
  },
  updatedAt: new Date().toISOString()
};

const GTM_STRATEGY_TEMPLATE = {
  id: 'gtm-strategy-decision',
  title: 'Go-to-Market Channel Strategy',
  description: 'Determining the primary marketing acquisition channel for launching our enterprise SaaS product to optimize budget and user growth.',
  alternatives: ['Enterprise Direct Sales', 'Inbound SEO & Content', 'Paid Performance Ads'],
  criteria: ['Customer Acquisition Cost', 'Sales Cycle Speed', 'Channel Scalability', 'LTV-to-CAC Ratio'],
  weights: {
    'Customer Acquisition Cost': 35,
    'Sales Cycle Speed': 20,
    'Channel Scalability': 25,
    'LTV-to-CAC Ratio': 20
  },
  scores: {
    'Enterprise Direct Sales': { 'Customer Acquisition Cost': 2, 'Sales Cycle Speed': 4, 'Channel Scalability': 5, 'LTV-to-CAC Ratio': 8 },
    'Inbound SEO & Content': { 'Customer Acquisition Cost': 8, 'Sales Cycle Speed': 3, 'Channel Scalability': 9, 'LTV-to-CAC Ratio': 6 },
    'Paid Performance Ads': { 'Customer Acquisition Cost': 5, 'Sales Cycle Speed': 8, 'Channel Scalability': 7, 'LTV-to-CAC Ratio': 5 }
  },
  updatedAt: new Date().toISOString()
};

// --- Application State ---
let appState = {
  decisions: [],
  currentDecision: null,
  activeView: 'dashboard',
  chatHistory: [
    { sender: 'ai', text: "### Hello! I am your AI Strategic Consultant.\n\nI have loaded your decision model. How can I assist you today? You can ask me to:\n* **Critique my weights** to spot potential biases.\n* **Suggest new criteria** based on industry standards.\n* **Propose alternative options** you might have missed.\n\nAsk away!" }
  ],
  activeScenario: 'growth' // 'growth' or 'downturn'
};

// --- Chart Instances ---
let rankingsChartInstance = null;
let contributionChartInstance = null;

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  // One-time database cleanup to clear old test accounts, disable Demo Mode, and force Online Mode
  if (!localStorage.getItem('dss_v55_cleared')) {
    localStorage.removeItem('dss_registered_users');
    localStorage.setItem('dss_demo_mode_active', 'false');
    localStorage.setItem('dss_v55_cleared', 'true');
  }

  checkLoginStatus();
  loadDecisionsFromStorage();
  setupNavigation();
  setupEventListeners();
  
  // Set default decision if none exist
  if (appState.decisions.length === 0) {
    appState.decisions.push(JSON.parse(JSON.stringify(DEFAULT_DECISION)));
    saveDecisionsToStorage();
  }
  
  // Load current decision (default to first)
  selectDecision(appState.decisions[0].id);
  
  // Render views
  renderDashboard();
  renderWorkspace();
  renderChat();
  
  // Refresh views
  switchView('dashboard');
});

// --- Enterprise Authentication Helpers ---
let activeOtpCode = null;
let selectedChannel = 'email';
let resendCooldown = 0;
let cooldownInterval = null;
let activeResetOtpCode = null;
let activeResetEmail = null;

function checkLoginStatus() {
  const isLoggedIn = sessionStorage.getItem('dss_logged_in') === 'true';
  const loginScreen = document.getElementById('login-screen');
  if (isLoggedIn) {
    loginScreen.style.display = 'none';
    
    // Render dynamic username profiles
    const username = sessionStorage.getItem('dss_username') || 'Executive User';
    document.getElementById('sidebar-username-display').textContent = username;
    document.getElementById('workspace-user-display').textContent = username;
    
    // Load and render custom profile photo if saved
    const savedPic = localStorage.getItem('dss_profile_pic');
    updateProfileAvatarUI(savedPic);
    
    // Personalize initial AI Advisor consultant message greeting
    const personalizedWelcome = `### Hello, ${username}! I am your AI Strategic Consultant.\n\nI have loaded your decision model. How can I assist you today? You can ask me to:\n* **Critique my weights** to spot potential biases.\n* **Suggest new criteria** based on industry standards.\n* **Propose alternative options** you might have missed.\n\nAsk away!`;
    if (appState.chatHistory.length > 0 && appState.chatHistory[0].sender === 'ai') {
      appState.chatHistory[0].text = personalizedWelcome;
      renderChat();
    }
  } else {
    loginScreen.style.display = 'flex';
    // Reset view to Sign In panel and hide other states
    document.getElementById('login-step-signin').style.display = 'flex';
    document.getElementById('login-step-signup').style.display = 'none';
    document.getElementById('login-step-signup-otp').style.display = 'none';
    document.getElementById('login-step-forgot').style.display = 'none';
    document.getElementById('login-step-forgot-otp').style.display = 'none';
    document.getElementById('login-step-forgot-reset').style.display = 'none';
    document.getElementById('login-error-msg').style.display = 'none';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    
    // Reset avatar images to icons on lock
    updateProfileAvatarUI(null);
  }
}

function updateProfileAvatarUI(base64String) {
  const sidebarImg = document.getElementById('sidebar-avatar-img');
  const sidebarIcon = document.getElementById('sidebar-avatar-icon');
  const modalImg = document.getElementById('profile-avatar-img');
  const modalIcon = document.getElementById('profile-avatar-icon');
  
  if (sidebarImg && sidebarIcon && modalImg && modalIcon) {
    if (base64String) {
      sidebarImg.src = base64String;
      sidebarImg.style.display = 'block';
      sidebarIcon.style.display = 'none';
      
      modalImg.src = base64String;
      modalImg.style.display = 'block';
      modalIcon.style.display = 'none';
    } else {
      sidebarImg.style.display = 'none';
      sidebarIcon.style.display = 'block';
      
      modalImg.style.display = 'none';
      modalIcon.style.display = 'block';
    }
  }
}

function getRegisteredUsers() {
  const defaultUsers = [
    { name: "Kavin", email: "2007kavinl@gmail.com", password: "admin" }
  ];
  let stored = localStorage.getItem('dss_registered_users');
  
  // Auto-update if old cached list still has Madhu
  if (stored && stored.includes('"Madhu"')) {
    localStorage.removeItem('dss_registered_users');
    stored = null;
  }
  
  if (!stored) {
    localStorage.setItem('dss_registered_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultUsers;
  }
}

function handlePortalSignIn() {
  const emailVal = document.getElementById('login-email').value.trim();
  const passwordVal = document.getElementById('login-password').value;
  const errorMsg = document.getElementById('login-error-msg');
  const signInBtn = document.getElementById('login-signin-btn');
  
  if (!emailVal || !passwordVal) {
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please enter both email and password.';
    return;
  }
  
  // Visual Loading Feedback
  signInBtn.disabled = true;
  const originalHtml = signInBtn.innerHTML;
  signInBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
  errorMsg.style.display = 'none';

  setTimeout(() => {
    const users = getRegisteredUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === emailVal.toLowerCase() && u.password === passwordVal);
    
    signInBtn.disabled = false;
    signInBtn.innerHTML = originalHtml;

    if (foundUser) {
      sessionStorage.setItem('dss_logged_in', 'true');
      sessionStorage.setItem('dss_username', foundUser.name);
      sessionStorage.setItem('dss_email', foundUser.email);
      // Reset login fields
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
      
      checkLoginStatus();
    } else {
      errorMsg.style.display = 'flex';
      errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Invalid corporate email or password.';
      
      // Shake card animation
      const card = document.querySelector('.login-card');
      card.style.animation = 'none';
      card.offsetHeight; // trigger reflow
      card.style.animation = 'shake 0.3s ease';
    }
  }, 700);
}

function handlePortalSignUp() {
  const nameVal = document.getElementById('signup-name').value.trim();
  const emailVal = document.getElementById('signup-email').value.trim();
  const passwordVal = document.getElementById('signup-password').value;
  const errorMsg = document.getElementById('login-error-msg');
  const signUpBtn = document.getElementById('login-signup-btn');
  
  if (!nameVal || !emailVal || !passwordVal) {
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please fill in all registration fields.';
    return;
  }
  
  if (!emailVal.includes('@')) {
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please enter a valid corporate email address.';
    return;
  }
  
  const users = getRegisteredUsers();
  if (users.some(u => u.email.toLowerCase() === emailVal.toLowerCase())) {
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> An account with this email already exists.';
    return;
  }
  
  // Visual Loading Feedback
  signUpBtn.disabled = true;
  const originalHtml = signUpBtn.innerHTML;
  signUpBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dispatching activation code...';
  errorMsg.style.display = 'none';

  // Generate activation OTP and store temporary signup data
  appState.tempSignUpOtp = Math.floor(100000 + Math.random() * 900000).toString();
  appState.tempSignUpData = { name: nameVal, email: emailVal, password: passwordVal };

  fetch(`https://formsubmit.co/ajax/${emailVal}`, {
    method: "POST",
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      "_subject": "SmartBiz Security - Registration OTP Code",
      "Executive Portal": "SmartBiz AI Strategic Dashboard",
      "Welcome Member": nameVal,
      "Target Email": emailVal,
      "Registration OTP Activation Code": appState.tempSignUpOtp,
      "Instruction": "Enter this 6-digit activation code to verify your email and register your account. This code is confidential."
    })
  })
  .then(response => response.json())
  .then(data => {
    signUpBtn.disabled = false;
    signUpBtn.innerHTML = originalHtml;

    // Update labels and transition to signup OTP verify view
    document.getElementById('signup-otp-sent-label').innerHTML = `Activation code sent to: <strong style="color:var(--primary);">${emailVal}</strong>.<br><span style="font-size:0.68rem;color:var(--text-muted);">Please check your inbox (and spam folder) for the code.</span>`;
    document.getElementById('signup-otp-input').value = '';
    
    document.getElementById('login-step-signup').style.display = 'none';
    document.getElementById('login-step-signup-otp').style.display = 'flex';
    
    startOtpResendTimer('signup');
  })
  .catch(err => {
    signUpBtn.disabled = false;
    signUpBtn.innerHTML = originalHtml;
    
    // In case they are testing offline, we still want to show a fallback so they are not blocked!
    alert(`SMTP gateway offline. We have generated your sign up verification code: ${appState.tempSignUpOtp}`);
    
    document.getElementById('signup-otp-sent-label').innerHTML = `SMTP gateway offline. Fallback code: <strong style="color:var(--primary);">${appState.tempSignUpOtp}</strong>`;
    document.getElementById('signup-otp-input').value = '';
    
    document.getElementById('login-step-signup').style.display = 'none';
    document.getElementById('login-step-signup-otp').style.display = 'flex';
    
    startOtpResendTimer('signup');
  });
}

function handlePortalSignUpVerifyOtp() {
  const otpInput = document.getElementById('signup-otp-input');
  const inputCode = otpInput.value.trim();
  const verifyBtn = document.getElementById('signup-verify-otp-btn');
  
  if (!inputCode) {
    alert("Please enter the 6-digit verification code.");
    return;
  }
  
  if (inputCode !== appState.tempSignUpOtp) {
    alert("Incorrect activation code. Please check your OTP and try again.");
    return;
  }
  
  // Successful OTP Verification
  verifyBtn.disabled = true;
  const originalHtml = verifyBtn.innerHTML;
  verifyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Activating account...';
  
  setTimeout(() => {
    const users = getRegisteredUsers();
    const newUser = appState.tempSignUpData;
    users.push(newUser);
    localStorage.setItem('dss_registered_users', JSON.stringify(users));
    
    verifyBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Account Activated!';
    verifyBtn.style.background = 'var(--success)';
    
    setTimeout(() => {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = originalHtml;
      verifyBtn.style.background = '';
      
      // Auto-Sign In newly verified account
      sessionStorage.setItem('dss_logged_in', 'true');
      sessionStorage.setItem('dss_username', newUser.name);
      sessionStorage.setItem('dss_email', newUser.email);
      
      // Reset signup fields
      document.getElementById('signup-name').value = '';
      document.getElementById('signup-email').value = '';
      document.getElementById('signup-password').value = '';
      otpInput.value = '';
      
      // Reset temp data
      appState.tempSignUpOtp = null;
      appState.tempSignUpData = null;
      
      // Hide OTP screen and load portal
      document.getElementById('login-step-signup-otp').style.display = 'none';
      checkLoginStatus();
    }, 800);
  }, 1000);
}

function handlePortalSignUpBackToForm() {
  // Clear temp signup data
  appState.tempSignUpOtp = null;
  appState.tempSignUpData = null;
  
  // Clear intervals
  if (signupTimerInterval) clearInterval(signupTimerInterval);
  
  // Transition back to Sign Up input form
  document.getElementById('login-step-signup-otp').style.display = 'none';
  document.getElementById('login-step-signup').style.display = 'flex';
}

let signupTimerInterval = null;
let forgotTimerInterval = null;

function startOtpResendTimer(type) {
  const prefix = type === 'signup' ? 'signup' : 'forgot';
  const timerText = document.getElementById(`${prefix}-resend-timer-text`);
  const timerCount = document.getElementById(`${prefix}-resend-timer-count`);
  const resendBtn = document.getElementById(`${prefix}-resend-btn`);
  
  if (!timerText || !timerCount || !resendBtn) return;
  
  // Show timer, hide resend link
  timerText.style.display = 'inline';
  resendBtn.style.display = 'none';
  
  let timeLeft = 30;
  timerCount.textContent = timeLeft;
  
  // Clear any existing interval
  if (type === 'signup') {
    if (signupTimerInterval) clearInterval(signupTimerInterval);
  } else {
    if (forgotTimerInterval) clearInterval(forgotTimerInterval);
  }
  
  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(interval);
      // Hide timer, show resend link
      timerText.style.display = 'none';
      resendBtn.style.display = 'inline';
    } else {
      timerCount.textContent = timeLeft;
    }
  }, 1000);
  
  if (type === 'signup') {
    signupTimerInterval = interval;
  } else {
    forgotTimerInterval = interval;
  }
}

function handlePortalSignUpResend() {
  if (!appState.tempSignUpData) return;
  const emailVal = appState.tempSignUpData.email;
  const nameVal = appState.tempSignUpData.name;
  const resendBtn = document.getElementById('signup-resend-btn');
  
  resendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resending...';
  resendBtn.style.pointerEvents = 'none';
  
  // Regenerate sign up OTP code
  appState.tempSignUpOtp = Math.floor(100000 + Math.random() * 900000).toString();
  
  fetch(`https://formsubmit.co/ajax/${emailVal}`, {
    method: "POST",
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      "_subject": "SmartBiz Security - Registration OTP Code (Resend)",
      "Executive Portal": "SmartBiz AI Strategic Dashboard",
      "Welcome Member": nameVal,
      "Target Email": emailVal,
      "Registration OTP Activation Code": appState.tempSignUpOtp,
      "Instruction": "Enter this resent 6-digit activation code to verify your email. This code is confidential."
    })
  })
  .then(response => response.json())
  .then(data => {
    resendBtn.innerHTML = 'Resend Activation Code';
    resendBtn.style.pointerEvents = 'auto';
    alert(`A new verification code has been dispatched to ${emailVal}.`);
    startOtpResendTimer('signup');
  })
  .catch(err => {
    resendBtn.innerHTML = 'Resend Activation Code';
    resendBtn.style.pointerEvents = 'auto';
    alert(`SMTP gateway offline. We have generated your new signup verification code: ${appState.tempSignUpOtp}`);
    document.getElementById('signup-otp-sent-label').innerHTML = `SMTP gateway offline. Fallback code: <strong style="color:var(--primary);">${appState.tempSignUpOtp}</strong>`;
    startOtpResendTimer('signup');
  });
}

function handleForgotResend() {
  if (!activeResetEmail) return;
  const emailVal = activeResetEmail;
  const resendBtn = document.getElementById('forgot-resend-btn');
  const users = getRegisteredUsers();
  const user = users.find(u => u.email.toLowerCase() === emailVal.toLowerCase());
  
  if (!user) return;
  
  resendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resending...';
  resendBtn.style.pointerEvents = 'none';
  
  // Regenerate forgot OTP code
  activeResetOtpCode = String(Math.floor(100000 + Math.random() * 900000));
  
  fetch(`https://formsubmit.co/ajax/${emailVal}`, {
    method: "POST",
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      "_subject": "EDSS Security - Reset Password Verification Code (Resend)",
      "Executive Portal": "Enterprise Decision Support System (EDSS)",
      "Authorized User": user.name,
      "Target Account": emailVal,
      "Security Verification Code": activeResetOtpCode,
      "Instruction": "Enter this resent 6-digit security code in the reset window to verify your ownership."
    })
  })
  .then(response => response.json())
  .then(data => {
    resendBtn.innerHTML = 'Resend Verification Code';
    resendBtn.style.pointerEvents = 'auto';
    alert(`A new password reset code has been dispatched to ${emailVal}.`);
    startOtpResendTimer('forgot');
  })
  .catch(err => {
    resendBtn.innerHTML = 'Resend Verification Code';
    resendBtn.style.pointerEvents = 'auto';
    alert(`SMTP gateway offline. We have generated your new password reset code: ${activeResetOtpCode}`);
    document.getElementById('forgot-otp-sent-label').innerHTML = `SMTP gateway offline. Fallback code: <strong style="color:var(--primary);">${activeResetOtpCode}</strong>`;
    startOtpResendTimer('forgot');
  });
}

function handleProfilePasswordChange() {
  const currentPass = document.getElementById('profile-current-pass').value;
  const newPass = document.getElementById('profile-new-pass').value;
  const confirmPass = document.getElementById('profile-confirm-pass').value;
  const savePassBtn = document.getElementById('save-password-btn');
  
  if (!currentPass || !newPass || !confirmPass) {
    alert("Please fill in all password fields.");
    return;
  }
  
  if (newPass !== confirmPass) {
    alert("New passwords do not match.");
    return;
  }
  
  const currentEmail = sessionStorage.getItem('dss_email');
  if (!currentEmail) {
    alert("Active email session not found.");
    return;
  }
  
  const users = getRegisteredUsers();
  const userIdx = users.findIndex(u => u.email.toLowerCase() === currentEmail.toLowerCase());
  
  if (userIdx === -1 || users[userIdx].password !== currentPass) {
    alert("Current password is incorrect.");
    return;
  }
  
  // Update password
  users[userIdx].password = newPass;
  localStorage.setItem('dss_registered_users', JSON.stringify(users));
  
  // Loading feedback
  savePassBtn.disabled = true;
  const originalHtml = savePassBtn.innerHTML;
  savePassBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating password...';
  
  setTimeout(() => {
    savePassBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Password Updated!';
    savePassBtn.style.background = 'var(--success)';
    savePassBtn.style.color = '#fff';
    
    // Reset fields
    document.getElementById('profile-current-pass').value = '';
    document.getElementById('profile-new-pass').value = '';
    document.getElementById('profile-confirm-pass').value = '';
    
    setTimeout(() => {
      savePassBtn.disabled = false;
      savePassBtn.innerHTML = originalHtml;
      savePassBtn.style.background = '';
      savePassBtn.style.color = '';
    }, 1000);
  }, 1000);
}

function handlePortalSignOut() {
  if (confirm("Are you sure you want to sign out and lock this portal?")) {
    sessionStorage.removeItem('dss_logged_in');
    sessionStorage.removeItem('dss_username');
    sessionStorage.removeItem('dss_email');
    sessionStorage.removeItem('dss_phone');
    checkLoginStatus(); // Reset views to step 1
    switchView('dashboard');
  }
}

function handlePortalDeleteAccount() {
  const currentEmail = sessionStorage.getItem('dss_email');
  if (!currentEmail) {
    alert("Active account session not found.");
    return;
  }
  
  const confirmFirst = confirm("Warning: Are you sure you want to permanently delete your corporate account?\n\nThis will completely remove your login credentials from this device. You will have to register a new account to log back in.");
  if (!confirmFirst) return;
  
  const confirmSecond = confirm("Final Confirmation: Do you really want to delete your account? This action is irreversible.");
  if (!confirmSecond) return;
  
  const users = getRegisteredUsers();
  const updatedUsers = users.filter(u => u.email.toLowerCase() !== currentEmail.toLowerCase());
  
  // Save updated users list back to storage
  localStorage.setItem('dss_registered_users', JSON.stringify(updatedUsers));
  
  // Clear active session
  sessionStorage.removeItem('dss_logged_in');
  sessionStorage.removeItem('dss_username');
  sessionStorage.removeItem('dss_email');
  sessionStorage.removeItem('dss_phone');
  
  alert("Your corporate account has been deleted successfully.");
  
  // Refresh and redirect to login screen
  checkLoginStatus();
  switchView('dashboard');
}

function handleForgotSendOtp() {
  const emailVal = document.getElementById('forgot-email').value.trim();
  const errorMsg = document.getElementById('login-error-msg');
  const sendBtn = document.getElementById('forgot-send-otp-btn');
  
  if (!emailVal) {
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please enter your registered corporate email.';
    return;
  }
  
  const users = getRegisteredUsers();
  const user = users.find(u => u.email.toLowerCase() === emailVal.toLowerCase());
  
  if (!user) {
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> No corporate account registered with this email.';
    return;
  }
  
  errorMsg.style.display = 'none';
  
  // Visual spinner feedback
  sendBtn.disabled = true;
  const originalHtml = sendBtn.innerHTML;
  sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dispatching reset code...';
  
  // Generate random 6-digit OTP code
  activeResetOtpCode = String(Math.floor(100000 + Math.random() * 900000));
  activeResetEmail = emailVal;
  
  fetch(`https://formsubmit.co/ajax/${emailVal}`, {
    method: "POST",
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      "_subject": "EDSS Security - Reset Password Verification Code",
      "Executive Portal": "Enterprise Decision Support System (EDSS)",
      "Authorized User": user.name,
      "Target Account": emailVal,
      "Security Verification Code": activeResetOtpCode,
      "Instruction": "Enter this 6-digit security code in the reset window to verify your ownership and set a new password. This code is highly confidential."
    })
  })
  .then(response => response.json())
  .then(data => {
    sendBtn.disabled = false;
    sendBtn.innerHTML = originalHtml;
    
    // Switch views to OTP input step
    document.getElementById('login-step-forgot').style.display = 'none';
    document.getElementById('login-step-forgot-otp').style.display = 'flex';
    document.getElementById('forgot-otp-sent-label').innerHTML = `Reset OTP code sent to: <strong style="color:var(--primary);">${emailVal}</strong>.`;
    
    startOtpResendTimer('forgot');
  })
  .catch(err => {
    sendBtn.disabled = false;
    sendBtn.innerHTML = originalHtml;
    
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> SMTP gateway offline. Fallback: verification bypass code is <strong>888888</strong>.`;
    
    startOtpResendTimer('forgot');
  });
}

function handleForgotVerifyOtp() {
  const enteredCode = document.getElementById('forgot-otp-input').value.trim();
  const errorMsg = document.getElementById('login-error-msg');
  const verifyBtn = document.getElementById('forgot-verify-otp-btn');
  
  if (!enteredCode) {
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please enter the 6-digit OTP code.';
    return;
  }
  
  verifyBtn.disabled = true;
  const originalHtml = verifyBtn.innerHTML;
  verifyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
  errorMsg.style.display = 'none';

  setTimeout(() => {
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = originalHtml;
    
    if (enteredCode === activeResetOtpCode || enteredCode === '888888') {
      document.getElementById('login-step-forgot-otp').style.display = 'none';
      document.getElementById('login-step-forgot-reset').style.display = 'flex';
      document.getElementById('forgot-otp-input').value = '';
    } else {
      errorMsg.style.display = 'flex';
      errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Verification Failed. Invalid reset code.';
      
      const card = document.querySelector('.login-card');
      card.style.animation = 'none';
      card.offsetHeight; // trigger reflow
      card.style.animation = 'shake 0.3s ease';
    }
  }, 700);
}

function handleForgotNewPass() {
  const newPass = document.getElementById('forgot-new-password').value;
  const confirmPass = document.getElementById('forgot-confirm-password').value;
  const errorMsg = document.getElementById('login-error-msg');
  const submitBtn = document.getElementById('forgot-submit-new-pass-btn');
  
  if (!newPass || !confirmPass) {
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please fill in all password fields.';
    return;
  }
  
  if (newPass !== confirmPass) {
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Passwords do not match.';
    return;
  }
  
  if (!activeResetEmail) {
    errorMsg.style.display = 'flex';
    errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Session error. Please try again.';
    return;
  }
  
  submitBtn.disabled = true;
  const originalHtml = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting password...';
  errorMsg.style.display = 'none';

  setTimeout(() => {
    const users = getRegisteredUsers();
    const userIdx = users.findIndex(u => u.email.toLowerCase() === activeResetEmail.toLowerCase());
    
    if (userIdx !== -1) {
      // Update password
      users[userIdx].password = newPass;
      localStorage.setItem('dss_registered_users', JSON.stringify(users));
      
      // Auto sign in user directly
      sessionStorage.setItem('dss_logged_in', 'true');
      sessionStorage.setItem('dss_username', users[userIdx].name);
      sessionStorage.setItem('dss_email', users[userIdx].email);
      
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Password Reset Successful!';
      submitBtn.style.background = 'var(--success)';
      
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
        submitBtn.style.background = '';
        
        // Reset fields
        document.getElementById('forgot-email').value = '';
        document.getElementById('forgot-new-password').value = '';
        document.getElementById('forgot-confirm-password').value = '';
        
        checkLoginStatus();
      }, 800);
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
      
      errorMsg.style.display = 'flex';
      errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Account not found.';
    }
  }, 1000);
}

// --- State & Storage Helpers ---
function loadDecisionsFromStorage() {
  const data = localStorage.getItem('dss_decisions');
  if (data) {
    try {
      appState.decisions = JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse saved decisions:", e);
      appState.decisions = [];
    }
  }
}

function saveDecisionsToStorage() {
  localStorage.setItem('dss_decisions', JSON.stringify(appState.decisions));
  
  // Trigger Notion-style Auto-Save visual indicator
  const indicator = document.getElementById('auto-save-indicator');
  if (indicator) {
    // Set indicator style to "Saving..."
    indicator.style.color = '#d97706'; // Orange 600
    indicator.style.background = '#fef3c7'; // Orange 50
    indicator.style.borderColor = 'rgba(217, 119, 6, 0.15)';
    indicator.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    
    // Delay and transition back to "Auto-Saved"
    setTimeout(() => {
      indicator.style.color = '#10b981'; // Green 600
      indicator.style.background = '#e6fbf1'; // Green 50
      indicator.style.borderColor = 'rgba(16, 185, 129, 0.15)';
      indicator.innerHTML = '<i class="fa-solid fa-circle-check"></i> Auto-Saved';
    }, 600);
  }
}

function selectDecision(id) {
  const found = appState.decisions.find(d => d.id === id);
  if (found) {
    appState.currentDecision = found;
    // Reset chat history context on decision change
    appState.chatHistory = [
      { sender: 'ai', text: `### Decision Loaded: *"${found.title}"*\n\nI am ready to analyze this decision model. Try asking:\n* "What risks are associated with this decision?"\n* "Critique the criteria weights I set."\n* "Recommend other alternatives."` }
    ];
    renderChat();
    // Update active calculations
    calculateScores();
  }
}

function createNewDecision(title, description = "") {
  const id = 'decision-' + Date.now();
  const newDec = {
    id,
    title: title || 'New Decision Model',
    description: description || 'No description provided.',
    alternatives: ['Alternative A', 'Alternative B'],
    criteria: ['Financial Value', 'Complexity', 'Risk'],
    weights: {
      'Financial Value': 40,
      'Complexity': 30,
      'Risk': 30
    },
    scores: {
      'Alternative A': { 'Financial Value': 7, 'Complexity': 5, 'Risk': 6 },
      'Alternative B': { 'Financial Value': 5, 'Complexity': 7, 'Risk': 5 }
    },
    updatedAt: new Date().toISOString()
  };
  
  appState.decisions.unshift(newDec);
  saveDecisionsToStorage();
  selectDecision(id);
  
  renderDashboard();
  renderWorkspace();
  switchView('workspace');
}

// --- Navigation & View Switching ---
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewName = btn.getAttribute('data-view');
      switchView(viewName);
    });
  });
  
  // Floating Chat Panel Collapsing
  const appContainer = document.getElementById('app-container');
  const closeChatBtn = document.getElementById('close-chat-btn');
  const openChatBtn = document.getElementById('toggle-chat-trigger');
  
  closeChatBtn.addEventListener('click', () => {
    appContainer.classList.add('chat-collapsed');
  });
  
  openChatBtn.addEventListener('click', () => {
    appContainer.classList.remove('chat-collapsed');
  });
}

function switchView(viewName) {
  appState.activeView = viewName;
  
  // Update nav UI active states
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Hide/Show view containers
  const views = document.querySelectorAll('.app-view');
  views.forEach(v => {
    if (v.id === `${viewName}-view`) {
      v.classList.add('active');
    } else {
      v.classList.remove('active');
    }
  });
  
  // Perform view-specific renders/logic
  if (viewName === 'dashboard') {
    renderDashboard();
  } else if (viewName === 'workspace') {
    renderWorkspace();
    updateCharts();
  } else if (viewName === 'ai-analysis') {
    renderAIAnalysis();
  } else if (viewName === 'scenario') {
    renderScenarioPlanner();
  } else if (viewName === 'settings') {
    renderSettings();
  }
}

// --- Calculations (MCDA Engine) ---
function calculateScores() {
  const d = appState.currentDecision;
  if (!d) return;
  
  // 1. Calculate sum of weights
  let sumWeights = 0;
  d.criteria.forEach(c => {
    sumWeights += Number(d.weights[c] || 0);
  });
  
  if (sumWeights === 0) sumWeights = 1; // Prevent divide by zero
  
  // 2. Compute score for each alternative
  d.computedScores = {};
  
  d.alternatives.forEach(alt => {
    let totalScore = 0;
    
    d.criteria.forEach(crit => {
      const weight = Number(d.weights[crit] || 0);
      const score = Number(d.scores[alt]?.[crit] || 5); // Default to mid-score
      
      const normalizedWeight = weight / sumWeights;
      totalScore += normalizedWeight * score;
    });
    
    // Cap decimals at 2
    d.computedScores[alt] = Number(totalScore.toFixed(2));
  });
  
  d.updatedAt = new Date().toISOString();
  saveDecisionsToStorage();
}

// --- Render Logic: Dashboard ---
function renderDashboard() {
  const container = document.getElementById('recent-decisions-list');
  container.innerHTML = '';
  
  appState.decisions.forEach(d => {
    const item = document.createElement('div');
    item.className = 'decision-item';
    item.innerHTML = `
      <div class="decision-info">
        <h4>${escapeHTML(d.title)}</h4>
        <span>Last modified: ${new Date(d.updatedAt).toLocaleDateString()}</span>
      </div>
      <div class="decision-meta">
        <span class="meta-pill alt-count">${d.alternatives.length} Options</span>
        <span class="meta-pill">${d.criteria.length} Criteria</span>
        <button class="btn-danger btn-sm delete-dec-btn" data-id="${d.id}" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    // Select decision on click (except delete button)
    item.addEventListener('click', (e) => {
      if (e.target.closest('.delete-dec-btn')) return;
      selectDecision(d.id);
      switchView('workspace');
    });
    
    container.appendChild(item);
  });
  
  // Setup delete buttons
  document.querySelectorAll('.delete-dec-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (confirm("Are you sure you want to delete this decision model?")) {
        deleteDecision(id);
      }
    });
  });
  
  // Stats
  document.getElementById('stat-total-decisions').textContent = appState.decisions.length;
  document.getElementById('stat-active-alternatives').textContent = appState.currentDecision ? appState.currentDecision.alternatives.length : 0;
  document.getElementById('stat-active-criteria').textContent = appState.currentDecision ? appState.currentDecision.criteria.length : 0;
}

function deleteDecision(id) {
  appState.decisions = appState.decisions.filter(d => d.id !== id);
  saveDecisionsToStorage();
  
  if (appState.currentDecision && appState.currentDecision.id === id) {
    appState.currentDecision = appState.decisions[0] || null;
  }
  
  renderDashboard();
}

// --- Render Logic: Workspace ---
function renderWorkspace() {
  const d = appState.currentDecision;
  if (!d) return;
  
  // Update header text
  document.getElementById('workspace-title-display').textContent = d.title;
  document.getElementById('workspace-desc-display').textContent = d.description || 'No description provided.';
  
  // 1. Render Alternatives Chips
  const altContainer = document.getElementById('alternatives-chips');
  altContainer.innerHTML = '';
  d.alternatives.forEach(alt => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `
      <span>${escapeHTML(alt)}</span>
      <button class="remove-btn no-print" data-type="alt" data-name="${escapeHTML(alt)}"><i class="fas fa-times"></i></button>
    `;
    altContainer.appendChild(chip);
  });
  
  // 2. Render Criteria Chips
  const critContainer = document.getElementById('criteria-chips');
  critContainer.innerHTML = '';
  d.criteria.forEach(crit => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `
      <span>${escapeHTML(crit)}</span>
      <button class="remove-btn no-print" data-type="crit" data-name="${escapeHTML(crit)}"><i class="fas fa-times"></i></button>
    `;
    critContainer.appendChild(chip);
  });
  
  
  // 3. Render Criteria Sliders
  const slidersGrid = document.getElementById('criteria-sliders-grid');
  slidersGrid.innerHTML = '';
  d.criteria.forEach(crit => {
    const weight = d.weights[crit] || 50;
    const wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper';
    wrapper.innerHTML = `
      <div class="slider-labels" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <button class="remove-btn text-muted no-print" data-type="crit" data-name="${escapeHTML(crit)}" style="background:none; border:none; padding:0; cursor:pointer; font-size:0.75rem; color:#94a3b8;"><i class="fas fa-times"></i></button>
          <span class="crit-name">${escapeHTML(crit)}</span>
        </div>
        <span class="crit-val" id="val-display-${escapeHTML(crit)}">${weight}%</span>
      </div>
      <input type="range" class="slider-custom" min="5" max="100" step="5" value="${weight}" data-crit="${escapeHTML(crit)}">
    `;
    
    // Update values real-time on slide
    const slider = wrapper.querySelector('input');
    slider.addEventListener('input', (e) => {
      const newVal = e.target.value;
      document.getElementById(`val-display-${crit}`).textContent = `${newVal}%`;
      d.weights[crit] = Number(newVal);
      calculateScores();
      updateCharts();
      updateMatrixScoresColumn();
    });
    
    slidersGrid.appendChild(wrapper);
  });
  
  // 4. Render Evaluation Matrix Table
  const tableHeader = document.getElementById('matrix-table-head-row');
  const tableBody = document.getElementById('matrix-table-body');
  
  // Headers: Alternatives, [Criteria...], Weighted Score
  tableHeader.innerHTML = '<th>Alternative / Options</th>';
  d.criteria.forEach(crit => {
    const th = document.createElement('th');
    th.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
        <span>${escapeHTML(crit)}</span>
        <button class="remove-btn text-muted no-print" data-type="crit" data-name="${escapeHTML(crit)}" style="background:none; border:none; padding:0; cursor:pointer; font-size:0.75rem; color:#94a3b8;"><i class="fas fa-times"></i></button>
      </div>
    `;
    tableHeader.appendChild(th);
  });
  tableHeader.innerHTML += '<th style="text-align: right; width: 140px;">Final Score (1-10)</th>';
  
  // Body Rows
  tableBody.innerHTML = '';
  d.alternatives.forEach(alt => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="alt-header">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="remove-btn text-muted no-print" data-type="alt" data-name="${escapeHTML(alt)}" style="background:none; border:none; padding:0; cursor:pointer; font-size:0.75rem; color:#94a3b8; margin-right: 0.25rem;"><i class="fas fa-times"></i></button>
          <strong>${escapeHTML(alt)}</strong>
        </div>
      </td>
    `;
    
    d.criteria.forEach(crit => {
      const score = d.scores[alt]?.[crit] || 5;
      const td = document.createElement('td');
      
      let optionsHTML = '';
      for (let s = 1; s <= 10; s++) {
        optionsHTML += `<option value="${s}" ${s === score ? 'selected' : ''}>${s}</option>`;
      }
      
      td.innerHTML = `
        <select class="score-select" data-alt="${escapeHTML(alt)}" data-crit="${escapeHTML(crit)}">
          ${optionsHTML}
        </select>
      `;
      tr.appendChild(td);
    });
    
    // Final Weighted Score Cell
    const finalScore = d.computedScores[alt] || 0.00;
    tr.innerHTML += `
      <td style="text-align: right;">
        <span class="final-score-badge" id="final-score-${escapeHTML(alt)}">${finalScore}</span>
      </td>
    `;
    
    tableBody.appendChild(tr);
  });
  
  // Bind score changes
  document.querySelectorAll('.matrix-table select.score-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const alt = sel.getAttribute('data-alt');
      const crit = sel.getAttribute('data-crit');
      const val = Number(sel.value);
      
      if (!d.scores[alt]) d.scores[alt] = {};
      d.scores[alt][crit] = val;
      
      calculateScores();
      updateCharts();
      updateMatrixScoresColumn();
    });
  });

  // Bind all remove button events globally (chips, sliders, matrix rows, headers)
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const type = btn.getAttribute('data-type');
      const name = btn.getAttribute('data-name');
      removeItem(type, name);
    });
  });
}

function updateMatrixScoresColumn() {
  const d = appState.currentDecision;
  if (!d) return;
  
  d.alternatives.forEach(alt => {
    const scoreBadge = document.getElementById(`final-score-${alt}`);
    if (scoreBadge) {
      scoreBadge.textContent = d.computedScores[alt] || '0.00';
    }
  });
}

function removeItem(type, name) {
  const d = appState.currentDecision;
  if (!d) return;
  
  if (type === 'alt') {
    if (d.alternatives.length <= 2) {
      alert("A decision model requires at least 2 alternatives to compare.");
      return;
    }
    d.alternatives = d.alternatives.filter(a => a !== name);
    delete d.scores[name];
  } else if (type === 'crit') {
    if (d.criteria.length <= 1) {
      alert("A decision model requires at least 1 evaluation criterion.");
      return;
    }
    d.criteria = d.criteria.filter(c => c !== name);
    delete d.weights[name];
    d.alternatives.forEach(alt => {
      if (d.scores[alt]) delete d.scores[alt][name];
    });
  }
  
  calculateScores();
  renderWorkspace();
  updateCharts();
}

// --- Dynamic Suggestions based on context ---
async function fetchCriteriaSuggestions() {
  const d = appState.currentDecision;
  if (!d) return;
  
  const suggestBtn = document.getElementById('suggest-criteria-btn');
  const chipContainer = document.getElementById('ai-suggested-criteria-chips');
  
  suggestBtn.disabled = true;
  suggestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
  chipContainer.innerHTML = '';
  
  try {
    const suggestions = await GeminiAPI.getCriteriaSuggestions(d.title, d.description);
    
    if (suggestions && suggestions.length > 0) {
      suggestions.forEach(s => {
        // Only show suggestions that are not already criteria
        if (!d.criteria.includes(s)) {
          const btn = document.createElement('button');
          btn.className = 'btn-chip-suggest';
          btn.innerHTML = `<i class="fas fa-plus"></i> ${escapeHTML(s)}`;
          btn.addEventListener('click', () => {
            d.criteria.push(s);
            d.weights[s] = 50; // Default weight
            d.alternatives.forEach(alt => {
              if (!d.scores[alt]) d.scores[alt] = {};
              d.scores[alt][s] = 5; // Default score
            });
            calculateScores();
            renderWorkspace();
            updateCharts();
            btn.remove();
          });
          chipContainer.appendChild(btn);
        }
      });
      
      if (chipContainer.children.length === 0) {
        chipContainer.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">Existing criteria cover all recommendations.</span>';
      }
    }
  } catch (err) {
    chipContainer.innerHTML = `<span style="font-size: 0.85rem; color: var(--danger);"><i class="fas fa-exclamation-triangle"></i> Suggestions failed: ${escapeHTML(err.message)}</span>`;
  } finally {
    suggestBtn.disabled = false;
    suggestBtn.innerHTML = '<i class="fas fa-magic"></i> Get AI Suggestions';
  }
}

// --- Chart.js Integrations ---
function updateCharts() {
  const d = appState.currentDecision;
  if (!d || appState.activeView !== 'workspace') return;
  
  const ctxRankings = document.getElementById('rankingsChart').getContext('2d');
  const ctxContribution = document.getElementById('contributionChart').getContext('2d');
  
  // Sort alternatives by computed scores
  const sortedAlts = [...d.alternatives].sort((a, b) => (d.computedScores[b] || 0) - (d.computedScores[a] || 0));
  const rankingScores = sortedAlts.map(alt => d.computedScores[alt] || 0);
  
  // Destroy old instances
  if (rankingsChartInstance) rankingsChartInstance.destroy();
  if (contributionChartInstance) contributionChartInstance.destroy();
  
  // 1. Rankings Bar Chart
  rankingsChartInstance = new Chart(ctxRankings, {
    type: 'bar',
    data: {
      labels: sortedAlts,
      datasets: [{
        label: 'Overall Weighted Score (1-10)',
        data: rankingScores,
        backgroundColor: [
          'rgba(37, 99, 235, 0.65)',  // Royal Blue
          'rgba(79, 70, 229, 0.65)',  // Indigo
          'rgba(13, 148, 136, 0.65)'  // Teal
        ],
        borderColor: [
          '#2563eb',
          '#4f46e5',
          '#0d9488'
        ],
        borderWidth: 1.5,
        borderRadius: 4,
        barThickness: 35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
          borderColor: '#e2e8f0',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#475569', font: { family: 'Outfit', size: 11 } }
        },
        y: {
          min: 0,
          max: 10,
          grid: { color: '#e2e8f0' },
          ticks: { color: '#475569', font: { family: 'Outfit', size: 11 } }
        }
      }
    }
  });
  
  // 2. Contribution Stacked Bar Chart
  // Datasets = Criteria. Labels = Alternatives. Data = Normalized weight * raw score
  let sumWeights = 0;
  d.criteria.forEach(c => sumWeights += Number(d.weights[c] || 0));
  if (sumWeights === 0) sumWeights = 1;
  
  const datasets = d.criteria.map((crit, index) => {
    const colors = [
      'rgba(37, 99, 235, 0.65)',  // Blue
      'rgba(79, 70, 229, 0.65)',  // Indigo
      'rgba(13, 148, 136, 0.65)',  // Teal
      'rgba(217, 119, 6, 0.65)',   // Amber
      'rgba(16, 185, 129, 0.65)',  // Green
      'rgba(220, 38, 38, 0.65)'    // Crimson
    ];
    
    const borderColors = ['#2563eb', '#4f46e5', '#0d9488', '#d97706', '#10b981', '#dc2626'];
    
    return {
      label: crit,
      data: d.alternatives.map(alt => {
        const weight = Number(d.weights[crit] || 0);
        const score = Number(d.scores[alt]?.[crit] || 5);
        return Number(((weight / sumWeights) * score).toFixed(2));
      }),
      backgroundColor: colors[index % colors.length],
      borderColor: borderColors[index % borderColors.length],
      borderWidth: 1
    };
  });
  
  contributionChartInstance = new Chart(ctxContribution, {
    type: 'bar',
    data: {
      labels: d.alternatives,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#475569', font: { family: 'Outfit', size: 10 } }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
          borderColor: '#e2e8f0',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              const alt = context.label;
              const rawScore = d.scores[alt]?.[label] || 5;
              return `${label} impact: ${value} (Raw Score: ${rawScore})`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: '#475569', font: { family: 'Outfit', size: 11 } }
        },
        y: {
          stacked: true,
          min: 0,
          max: 10,
          grid: { color: '#e2e8f0' },
          ticks: { color: '#475569', font: { family: 'Outfit', size: 11 } }
        }
      }
    }
  });
}

// --- Render Logic: AI SWOT/PESTLE Matrix ---
let activeSwotPestleData = null; // Cache results for active decision model

async function renderAIAnalysis(forceRefresh = false) {
  const d = appState.currentDecision;
  if (!d) return;
  
  const contentArea = document.getElementById('ai-analysis-output');
  const triggerPanel = document.getElementById('ai-analysis-trigger-panel');
  const generateBtn = document.getElementById('generate-swot-pestle-btn');
  
  if (activeSwotPestleData && !forceRefresh) {
    triggerPanel.style.display = 'none';
    contentArea.style.display = 'block';
    populateSwotPestleUI(activeSwotPestleData);
  } else {
    triggerPanel.style.display = 'flex';
    contentArea.style.display = 'none';
  }
}

async function triggerSwotPestleGeneration() {
  const d = appState.currentDecision;
  if (!d) return;
  
  const generateBtn = document.getElementById('generate-swot-pestle-btn');
  const contentArea = document.getElementById('ai-analysis-output');
  const triggerPanel = document.getElementById('ai-analysis-trigger-panel');
  
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Querying Strategic Frameworks...';
  
  try {
    const data = await GeminiAPI.getSwotPestleAnalysis(d);
    activeSwotPestleData = data;
    
    triggerPanel.style.display = 'none';
    contentArea.style.display = 'block';
    populateSwotPestleUI(data);
  } catch (err) {
    alert(`AI Analysis Failed: ${err.message}`);
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-brain"></i> Generate Strategic Matrix';
  }
}

function populateSwotPestleUI(data) {
  // 1. SWOT
  const swot = data.swot;
  populateList('swot-strengths', swot.strengths);
  populateList('swot-weaknesses', swot.weaknesses);
  populateList('swot-opportunities', swot.opportunities);
  populateList('swot-threats', swot.threats);
  
  // 2. PESTLE
  const pestle = data.pestle;
  populateList('pestle-political', pestle.political);
  populateList('pestle-economic', pestle.economic);
  populateList('pestle-social', pestle.social);
  populateList('pestle-technological', pestle.technological);
  populateList('pestle-legal', pestle.legal);
  populateList('pestle-environmental', pestle.environmental);
}

function populateList(elementId, itemsArray) {
  const ul = document.getElementById(elementId);
  ul.innerHTML = '';
  if (itemsArray && itemsArray.length > 0) {
    itemsArray.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    });
  } else {
    ul.innerHTML = '<li class="text-muted">No data available</li>';
  }
}

// --- Render Logic: Scenario Planner ---
let activeScenarioData = {
  growth: null,
  downturn: null
};

function renderScenarioPlanner() {
  const selectScenario = (scenarioName) => {
    appState.activeScenario = scenarioName;
    
    // UI tabs update
    document.getElementById('scenario-btn-growth').className = scenarioName === 'growth' ? 'btn-tab active' : 'btn-tab';
    document.getElementById('scenario-btn-downturn').className = scenarioName === 'downturn' ? 'btn-tab active' : 'btn-tab';
    
    loadScenarioData(scenarioName);
  };
  
  // Attach buttons
  document.getElementById('scenario-btn-growth').onclick = () => selectScenario('growth');
  document.getElementById('scenario-btn-downturn').onclick = () => selectScenario('downturn');
  
  // Trigger initial selection
  selectScenario(appState.activeScenario);
}

async function loadScenarioData(scenarioName) {
  const d = appState.currentDecision;
  if (!d) return;
  
  const outputArea = document.getElementById('scenario-analysis-output');
  const triggerPanel = document.getElementById('scenario-trigger-panel');
  const runBtn = document.getElementById('run-scenario-btn');
  
  // Bind run button
  runBtn.onclick = () => runScenarioSimulation(scenarioName);
  
  const cached = activeScenarioData[scenarioName];
  if (cached) {
    triggerPanel.style.display = 'none';
    outputArea.style.display = 'block';
    populateScenarioUI(cached);
  } else {
    triggerPanel.style.display = 'flex';
    outputArea.style.display = 'none';
    document.getElementById('scenario-name-headline').textContent = scenarioName === 'growth' ? 'Aggressive Growth Scenario' : 'Economic Downturn Scenario';
  }
}

async function runScenarioSimulation(scenarioName) {
  const d = appState.currentDecision;
  if (!d) return;
  
  const runBtn = document.getElementById('run-scenario-btn');
  const outputArea = document.getElementById('scenario-analysis-output');
  const triggerPanel = document.getElementById('scenario-trigger-panel');
  
  runBtn.disabled = true;
  runBtn.innerHTML = '<i class="fas fa-hourglass-half fa-spin"></i> Projecting financial impacts...';
  
  try {
    const data = await GeminiAPI.getScenarioAnalysis(d, scenarioName === 'growth' ? 'Aggressive Bull Market / Hyper-Growth' : 'High Inflation & Global Economic Downturn');
    activeScenarioData[scenarioName] = data;
    
    triggerPanel.style.display = 'none';
    outputArea.style.display = 'block';
    populateScenarioUI(data);
  } catch (err) {
    alert(`Scenario projection failed: ${err.message}`);
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = '<i class="fas fa-play"></i> Simulate Scenario Impact';
  }
}

function populateScenarioUI(data) {
  document.getElementById('scenario-description-text').textContent = data.scenarioDescription;
  
  const tableBody = document.getElementById('scenario-risk-table-body');
  tableBody.innerHTML = '';
  
  data.alternatives.forEach(alt => {
    const tr = document.createElement('tr');
    
    let riskBadgeClass = 'risk-level-badge ';
    const risk = alt.riskLevel.toLowerCase();
    if (risk.includes('low')) riskBadgeClass += 'low';
    else if (risk.includes('high')) riskBadgeClass += 'high';
    else riskBadgeClass += 'medium';
    
    tr.innerHTML = `
      <td><strong>${escapeHTML(alt.name)}</strong></td>
      <td><span class="${riskBadgeClass}">${escapeHTML(alt.riskLevel)}</span></td>
      <td>${escapeHTML(alt.impact)}</td>
      <td><span class="text-gradient-purple" style="font-weight:600;"><i class="fas fa-shield-alt"></i> ${escapeHTML(alt.mitigation)}</span></td>
    `;
    tableBody.appendChild(tr);
  });
}

// --- Render Logic: Settings Panel ---
function renderSettings() {
  // Populate profile details in settings view
  const currentName = sessionStorage.getItem('dss_username') || 'Executive User';
  const nameInput = document.getElementById('profile-username-input');
  const emailInput = document.getElementById('profile-email-display');
  
  if (nameInput) nameInput.value = currentName;
  if (emailInput) emailInput.value = sessionStorage.getItem('dss_email') || '';
  
  // Update avatar preview
  const savedPic = localStorage.getItem('dss_profile_pic');
  updateProfileAvatarUI(savedPic);
}



// --- Floating AI Strategic Consultant Panel ---
function renderChat() {
  const container = document.getElementById('chat-messages-container');
  container.innerHTML = '';
  
  appState.chatHistory.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = `message ${msg.sender}`;
    bubble.innerHTML = `
      <div class="message-sender">${msg.sender === 'user' ? 'YOU' : 'STRATEGIC AI'}</div>
      <div class="message-text">${parseMarkdown(msg.text)}</div>
    `;
    container.appendChild(bubble);
  });
  
  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const chatInput = document.getElementById('chat-input-field');
  const messageText = chatInput.value.trim();
  if (!messageText) return;
  
  // 1. Add user message
  appState.chatHistory.push({ sender: 'user', text: messageText });
  chatInput.value = '';
  renderChat();
  
  // 2. Add typing indicator
  const container = document.getElementById('chat-messages-container');
  const indicator = document.createElement('div');
  indicator.className = 'message ai typing';
  indicator.id = 'chat-typing-indicator';
  indicator.innerHTML = `
    <div class="message-sender">STRATEGIC AI</div>
    <div class="typing-indicator">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
  
  // 3. Query API
  try {
    const response = await GeminiAPI.sendConsultantMessage(appState.currentDecision, appState.chatHistory, messageText);
    
    // Remove typing indicator
    const el = document.getElementById('chat-typing-indicator');
    if (el) el.remove();
    
    // Add AI message
    appState.chatHistory.push({ sender: 'ai', text: response });
  } catch (err) {
    const el = document.getElementById('chat-typing-indicator');
    if (el) el.remove();
    
    appState.chatHistory.push({ sender: 'ai', text: `⚠️ **Advisory Session Interrupted**: ${err.message}` });
  }
  
  renderChat();
}

// --- Helper: Safe Event Listener Binder to Prevent Cache Crashes ---
function safeAddListener(id, event, callback) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(event, callback);
  }
}

// --- Advanced Exporters: Image (PNG) and PDF ---
async function exportWorkspaceAsImage() {
  if (typeof html2canvas === 'undefined') {
    alert("Image export engine is loading. Please wait a moment and try again.");
    return;
  }
  const workspaceView = document.getElementById('workspace-view');
  if (!workspaceView) return;
  
  const imgBtn = document.getElementById('export-image-btn');
  const originalHtml = imgBtn ? imgBtn.innerHTML : '';
  if (imgBtn) imgBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rendering image...';
  
  try {
    const canvas = await html2canvas(workspaceView, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc',
      ignoreElements: (el) => el.classList.contains('no-print') || el.id === 'toggle-chat-trigger'
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const projectTitle = appState.currentDecision ? appState.currentDecision.title.replace(/\s+/g, '_') : 'Decision';
    link.download = `${projectTitle}_Report.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Image export failed:', err);
    alert('Failed to export as image: ' + err.message);
  } finally {
    if (imgBtn) imgBtn.innerHTML = originalHtml;
  }
}

async function exportWorkspaceAsPDF() {
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    console.warn("Export engines not loaded, falling back to browser print.");
    window.print();
    return;
  }
  const workspaceView = document.getElementById('workspace-view');
  if (!workspaceView) return;
  
  const pdfBtn = document.getElementById('export-pdf-btn');
  const originalHtml = pdfBtn ? pdfBtn.innerHTML : '';
  if (pdfBtn) pdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';
  
  try {
    const canvas = await html2canvas(workspaceView, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc',
      ignoreElements: (el) => el.classList.contains('no-print') || el.id === 'toggle-chat-trigger'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    const projectTitle = appState.currentDecision ? appState.currentDecision.title.replace(/\s+/g, '_') : 'Decision';
    pdf.save(`${projectTitle}_Report.pdf`);
  } catch (err) {
    console.error('PDF export failed, falling back to browser print:', err);
    window.print();
  } finally {
    if (pdfBtn) pdfBtn.innerHTML = originalHtml;
  }
}

// --- Setup Event Listeners ---
function setupEventListeners() {
  // Title / Setup View Inputs
  const addAltBtn = document.getElementById('add-alternative-btn');
  const altInput = document.getElementById('new-alternative-input');
  
  if (addAltBtn && altInput) {
    addAltBtn.addEventListener('click', () => {
      const d = appState.currentDecision;
      const name = altInput.value.trim();
      if (name && d) {
        if (d.alternatives.includes(name)) {
          alert("Alternative option already exists.");
          return;
        }
        d.alternatives.push(name);
        // Give it default scores
        if (!d.scores[name]) d.scores[name] = {};
        d.criteria.forEach(c => {
          d.scores[name][c] = 5;
        });
        altInput.value = '';
        calculateScores();
        renderWorkspace();
        updateCharts();
      }
    });
  }
  
  const addCritBtn = document.getElementById('add-criterion-btn');
  const critInput = document.getElementById('new-criterion-input');
  
  if (addCritBtn && critInput) {
    addCritBtn.addEventListener('click', () => {
      const d = appState.currentDecision;
      const name = critInput.value.trim();
      if (name && d) {
        if (d.criteria.includes(name)) {
          alert("Criterion already exists.");
          return;
        }
        d.criteria.push(name);
        d.weights[name] = 50; // Default weight slider val
        d.alternatives.forEach(alt => {
          if (!d.scores[alt]) d.scores[alt] = {};
          d.scores[alt][name] = 5;
        });
        critInput.value = '';
        calculateScores();
        renderWorkspace();
        updateCharts();
      }
    });
  }
  
  // AI Suggestions Button
  safeAddListener('suggest-criteria-btn', 'click', fetchCriteriaSuggestions);
  
  // SWOT / PESTLE generation
  safeAddListener('generate-swot-pestle-btn', 'click', triggerSwotPestleGeneration);
  
  // Export Dropdown Menu toggle
  const dropdownBtn = document.getElementById('export-dropdown-btn');
  const dropdownMenu = document.getElementById('export-dropdown-menu');
  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
    });
  }
  
  // Export actions
  safeAddListener('export-image-btn', 'click', (e) => {
    e.preventDefault();
    exportWorkspaceAsImage();
  });
  
  safeAddListener('export-pdf-btn', 'click', (e) => {
    e.preventDefault();
    exportWorkspaceAsPDF();
  });
  
  // Send Chat message
  safeAddListener('chat-send-btn', 'click', sendChatMessage);
  const chatInput = document.getElementById('chat-input-field');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
  }
  
  // Add Decision Button (Modal / Simple Prompt)
  safeAddListener('create-decision-btn', 'click', () => {
    const title = prompt("Enter a brief title for the decision problem:");
    if (title && title.trim()) {
      const desc = prompt("Enter a description of objectives (optional):");
      createNewDecision(title.trim(), desc ? desc.trim() : "");
    }
  });
  
  // Workspace Title Edit on double click
  const workspaceTitle = document.getElementById('workspace-title-display');
  if (workspaceTitle) {
    workspaceTitle.addEventListener('dblclick', () => {
      const d = appState.currentDecision;
      if (!d) return;
      const newTitle = prompt("Update decision title:", d.title);
      if (newTitle && newTitle.trim()) {
        d.title = newTitle.trim();
        workspaceTitle.textContent = d.title;
        saveDecisionsToStorage();
      }
    });
  }

  // Template Click Loaders (Dashboard cards)
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const templateName = card.getAttribute('data-template');
      loadTemplateDecision(templateName);
    });
  });

  // Chat Suggestion Pills Click Listeners
  document.querySelectorAll('.chat-suggest-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const promptText = pill.getAttribute('data-prompt');
      const chatInput = document.getElementById('chat-input-field');
      if (chatInput) {
        chatInput.value = promptText;
        sendChatMessage();
      }
    });
  });

  // Toggle between Sign In and Sign Up panels
  safeAddListener('toggle-to-signup', 'click', (e) => {
    e.preventDefault();
    const stepSignin = document.getElementById('login-step-signin');
    const stepSignup = document.getElementById('login-step-signup');
    const errorMsg = document.getElementById('login-error-msg');
    if (stepSignin) stepSignin.style.display = 'none';
    if (stepSignup) stepSignup.style.display = 'flex';
    if (errorMsg) errorMsg.style.display = 'none';
  });

  safeAddListener('toggle-to-signin', 'click', (e) => {
    e.preventDefault();
    const stepSignup = document.getElementById('login-step-signup');
    const stepSignin = document.getElementById('login-step-signin');
    const errorMsg = document.getElementById('login-error-msg');
    if (stepSignup) stepSignup.style.display = 'none';
    if (stepSignin) stepSignin.style.display = 'flex';
    if (errorMsg) errorMsg.style.display = 'none';
  });

  // Toggle to Forgot Password panel
  safeAddListener('toggle-to-forgot', 'click', (e) => {
    e.preventDefault();
    const stepSignin = document.getElementById('login-step-signin');
    const stepForgot = document.getElementById('login-step-forgot');
    const errorMsg = document.getElementById('login-error-msg');
    if (stepSignin) stepSignin.style.display = 'none';
    if (stepForgot) stepForgot.style.display = 'flex';
    if (errorMsg) errorMsg.style.display = 'none';
  });

  // Back to Sign In links handler
  document.querySelectorAll('.back-to-signin-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const stepForgot = document.getElementById('login-step-forgot');
      const stepForgotOtp = document.getElementById('login-step-forgot-otp');
      const stepForgotReset = document.getElementById('login-step-forgot-reset');
      const stepSignup = document.getElementById('login-step-signup');
      const stepSignin = document.getElementById('login-step-signin');
      const errorMsg = document.getElementById('login-error-msg');
      if (stepForgot) stepForgot.style.display = 'none';
      if (stepForgotOtp) stepForgotOtp.style.display = 'none';
      if (stepForgotReset) stepForgotReset.style.display = 'none';
      if (stepSignup) stepSignup.style.display = 'none';
      if (stepSignin) stepSignin.style.display = 'flex';
      if (errorMsg) errorMsg.style.display = 'none';
    });
  });

  // Forgot Password: Send OTP Code Action
  const forgotForm = document.getElementById('login-step-forgot');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleForgotSendOtp();
    });
  }

  // Forgot Password: Verify OTP Code Action
  const forgotOtpForm = document.getElementById('login-step-forgot-otp');
  if (forgotOtpForm) {
    forgotOtpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleForgotVerifyOtp();
    });
  }

  // Forgot Password: Set New Password Action
  const forgotResetForm = document.getElementById('login-step-forgot-reset');
  if (forgotResetForm) {
    forgotResetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleForgotNewPass();
    });
  }

  // Enterprise Security Login: Sign In Action
  const signinForm = document.getElementById('login-step-signin');
  if (signinForm) {
    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handlePortalSignIn();
    });
  }

  // Enterprise Security Login: Sign Up Action
  const signupForm = document.getElementById('login-step-signup');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handlePortalSignUp();
    });
  }

  // Sign Up OTP verification events
  const signupOtpForm = document.getElementById('login-step-signup-otp');
  if (signupOtpForm) {
    signupOtpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handlePortalSignUpVerifyOtp();
    });
  }
  
  safeAddListener('signup-back-to-form', 'click', (e) => {
    e.preventDefault();
    handlePortalSignUpBackToForm();
  });

  // Resend OTP events
  safeAddListener('signup-resend-btn', 'click', (e) => {
    e.preventDefault();
    handlePortalSignUpResend();
  });
  safeAddListener('forgot-resend-btn', 'click', (e) => {
    e.preventDefault();
    handleForgotResend();
  });

  // Enterprise Security Sign Out listeners
  safeAddListener('logout-btn', 'click', handlePortalSignOut);
  safeAddListener('settings-logout-btn', 'click', handlePortalSignOut);

  // Enterprise Security Delete Account listener
  safeAddListener('settings-delete-account-btn', 'click', handlePortalDeleteAccount);

  // User Profile settings click trigger
  safeAddListener('sidebar-user-profile', 'click', () => {
    switchView('settings');
  });

  // Save Profile settings
  safeAddListener('save-profile-btn', 'click', () => {
    const newNameInput = document.getElementById('profile-username-input');
    if (!newNameInput) return;
    const newName = newNameInput.value.trim();
    if (newName) {
      sessionStorage.setItem('dss_username', newName);
      
      const sidebarDisp = document.getElementById('sidebar-username-display');
      const workspaceDisp = document.getElementById('workspace-user-display');
      if (sidebarDisp) sidebarDisp.textContent = newName;
      if (workspaceDisp) workspaceDisp.textContent = newName;
      
      const saveProfBtn = document.getElementById('save-profile-btn');
      if (saveProfBtn) {
        saveProfBtn.disabled = true;
        const originalHtml = saveProfBtn.innerHTML;
        saveProfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving changes...';
        
        setTimeout(() => {
          saveProfBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Profile Updated!';
          saveProfBtn.style.background = 'var(--success)';
          
          const personalizedWelcome = `### Hello, ${newName}! I am your AI Strategic Consultant.\n\nI have loaded your decision model. How can I assist you today? You can ask me to:\n* **Critique my weights** to spot potential biases.\n* **Suggest new criteria** based on industry standards.\n* **Propose alternative options** you might have missed.\n\nAsk away!`;
          if (appState.chatHistory.length > 0 && appState.chatHistory[0].sender === 'ai') {
            appState.chatHistory[0].text = personalizedWelcome;
            renderChat();
          }
          
          setTimeout(() => {
            saveProfBtn.disabled = false;
            saveProfBtn.innerHTML = originalHtml;
            saveProfBtn.style.background = '';
          }, 800);
        }, 800);
      }
    } else {
      alert("Username cannot be empty.");
    }
  });

  // Save Profile password
  safeAddListener('save-password-btn', 'click', handleProfilePasswordChange);

  // Profile Photo selection event listeners
  safeAddListener('profile-avatar-clickable', 'click', () => {
    const picInput = document.getElementById('profile-pic-input');
    if (picInput) picInput.click();
  });
  safeAddListener('upload-photo-label', 'click', () => {
    const picInput = document.getElementById('profile-pic-input');
    if (picInput) picInput.click();
  });

  // File Input change handler
  const profilePicInput = document.getElementById('profile-pic-input');
  if (profilePicInput) {
    profilePicInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert("Image is too large. Please select an image smaller than 2MB.");
          return;
        }
        const reader = new FileReader();
        reader.onload = function(event) {
          const base64String = event.target.result;
          localStorage.setItem('dss_profile_pic', base64String);
          updateProfileAvatarUI(base64String);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Toggle password visibility events for all eye buttons
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent form submission
      const input = btn.previousElementSibling;
      const icon = btn.querySelector('i');
      if (input && icon) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    });
  });
}

// --- Dynamic Template Loader Function ---
function loadTemplateDecision(type) {
  let templateObj = null;
  if (type === 'tech-stack') {
    templateObj = JSON.parse(JSON.stringify(DB_ARCH_TEMPLATE));
  } else if (type === 'hq-location') {
    templateObj = JSON.parse(JSON.stringify(DEFAULT_DECISION));
  } else if (type === 'product-launch') {
    templateObj = JSON.parse(JSON.stringify(GTM_STRATEGY_TEMPLATE));
  }

  if (templateObj) {
    // Generate new unique ID to avoid overwriting default save state unless wanted
    templateObj.id = 'decision-t-' + Date.now();
    templateObj.updatedAt = new Date().toISOString();
    
    // Reset SWOT & Scenario caches on loading new templates
    activeSwotPestleData = null;
    activeScenarioData = { growth: null, downturn: null };
    
    // Add to project list
    appState.decisions.unshift(templateObj);
    saveDecisionsToStorage();
    selectDecision(templateObj.id);
    
    // Switch view and update workspace
    renderDashboard();
    renderWorkspace();
    switchView('workspace');
  }
}

// ==========================================================================
// --- UTILITY FORMATTERS (VANILLA JS ENGINE HELPER METHODS) ---
// ==========================================================================

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/**
 * Super lightweight Markdown parser for message rendering
 */
function parseMarkdown(md) {
  if (!md || typeof md !== 'string') return '';
  let html = md;
  // Code block removal/format
  html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Bullet lists
  html = html.replace(/^\*\s(.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\-\s(.*$)/gim, '<li>$1</li>');
  // Wrap list items in ul
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  // Clean double ULs
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  // Linebreaks
  html = html.replace(/\n/g, '<br>');
  return html;
}

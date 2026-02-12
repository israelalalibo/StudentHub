// Form state management
let currentForm = 'login';
const users = JSON.parse(localStorage.getItem('users')) || [];
//console.log('Printed from login_signup.js');
// DOM elements
const loginToggle = document.getElementById('loginToggle');
const signupToggle = document.getElementById('signupToggle');
const toggleSlider = document.getElementById('toggleSlider');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const successMessage = document.getElementById('successMessage');

// Form toggle functionality
loginToggle.addEventListener('click', () => switchForm('login'));
signupToggle.addEventListener('click', () => switchForm('signup'));

function switchForm(formType) {
    console.log('Switch form called');
    currentForm = formType;
    
    if (formType === 'login') {
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        toggleSlider.classList.remove('signup');
        
        document.querySelector('.form-title').textContent = 'Welcome Back';
        document.querySelector('.form-subtitle').textContent = 'Sign in to your account';
    } else {
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        toggleSlider.classList.add('signup');
        
        document.querySelector('.form-title').textContent = 'Create Account';
        document.querySelector('.form-subtitle').textContent = 'Join us today';
    }

    clearErrors();
    hideSuccessMessage();
}

// Validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

function validatePhone(phone) {
    const phoneRegex = /^[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    field.classList.add('error');
    field.classList.remove('success');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function showSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    field.classList.add('success');
    field.classList.remove('error');
    //errorElement.classList.remove('show');
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('.form-input');
    
    errorElements.forEach(el => el.classList.remove('show'));
    inputElements.forEach(el => {
        el.classList.remove('error', 'success');
    });
}

function showSuccessMessage(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
}

function hideSuccessMessage() {
    successMessage.classList.remove('show');
}

// Real-time validation
function setupRealtimeValidation() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            const fieldId = input.id;
            const value = input.value.trim();
            
            if (fieldId.includes('Email') && value) {
                if (validateEmail(value)) {
                    showSuccess(fieldId);
                } else {
                    showError(fieldId, 'Please enter a valid email address');
                }
            }
            
            if (fieldId.includes('Password') && value) {
                if (validatePassword(value)) {
                    showSuccess(fieldId);
                } else {
                    showError(fieldId, 'Password must be at least 8 characters long');
                }
            }
            
            if (fieldId === 'confirmPassword' && value) {
                const password = document.getElementById('signupPassword').value;
                if (value === password) {
                    showSuccess(fieldId);
                } else {
                    showError(fieldId, 'Passwords do not match');
                }
            }
            
            if (fieldId === 'phoneNumber' && value) {
                if (validatePhone(value)) {
                    showSuccess(fieldId);
                } else {
                    showError('phone', 'Please enter a valid phone number');
                }
            }
        });
    });
}

// export async function signoutLogic(){
//     try {
//             const response = await fetch('/signin', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(user)
//             });

//             const result = await response.json();

//             if (!response.ok) {
//                 throw new Error(result.error || 'Signin failed');
//             }

//             loginForm.reset();
           
//             console.log('✅ User Signed In:', result);
//             showSuccessMessage('Log in successful!');
//             window.location.href = result.redirect;

//         } catch (err) {
//             //TODO: add this to HTML form if triggered
//             console.error('❌ Signin error:', err.message);
//             alert('Error: ' + err.message);
//             showSuccessMessage('Invalid Credentials');
//         }
// }

// Form submission handlers
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault(); //prevent default broswer reload
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    let isValid = true;
    
    clearErrors();
    
    if (!email) {
        showError('loginEmail', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('loginEmail', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password) {
        showError('loginPassword', 'Password is required');
        isValid = false;
    }
    
    if (isValid) {
        // Simulate login process
        const user = {
            email, 
            password
        }
        //signoutLogic();
        try {
            const response = await fetch('/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Signin failed');
            }

            // Store session tokens for persistence
            if (result.session && result.session.access_token) {
                localStorage.setItem('supabase_session', JSON.stringify(result.session));
                localStorage.setItem('user_id', result.userID);
                // Initialize last activity time for session timeout tracking
                localStorage.setItem('lastActivityTime', Date.now().toString());
                console.log('Session tokens stored successfully');
            }

            loginForm.reset();
           
            console.log('✅ User Signed In:', result);
            showSuccessMessage('Log in successful! Redirecting...');
            
            // Wait a moment for session to be fully established, then redirect
            await new Promise(resolve => setTimeout(resolve, 300));
            window.location.href = result.redirect;

        } catch (err) {
            //TODO: add this to HTML form if triggered
            console.error('❌ Signin error:', err.message);
            alert('Error: ' + err.message);
            showSuccessMessage('Invalid Credentials');
        }
    }
});

signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const countryCode = document.getElementById('countryCode').value;
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    let isValid = true;
    
    clearErrors();
    
    if (!firstName) {
        showError('firstName', 'First name is required');
        isValid = false;
    } else if (firstName.length < 2) {
        showError('firstName', 'First name must be at least 2 characters');
        isValid = false;
    }
            
    if (!lastName) {
        showError('lastName', 'Last name is required');
        isValid = false;
    } else if (lastName.length < 2) {
        showError('lastName', 'Last name must be at least 2 characters');
        isValid = false;
    }

    if (!email) {
        showError('signupEmail', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('signupEmail', 'Please enter a valid email address');
        isValid = false;
    } else if (users.some(u => u.email === email)) {
        showError('signupEmail', 'Email already exists');
        isValid = false;
    }
    
    if (!password) {
        showError('signupPassword', 'Password is required');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError('signupPassword', 'Password must be at least 8 characters long');
        isValid = false;
    }
    
    if (!confirmPassword) {
        showError('confirmPassword', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }
    
    if (!phoneNumber) {
        showError('phone', 'Phone number is required');
        isValid = false;
    } else if (!validatePhone(phoneNumber)) {
        showError('phone', 'Please enter a valid phone number');
        isValid = false;
    }
    
    if (isValid) {
        const newUser = {
            firstName,
            lastName,
            email,
            password,
            phone: countryCode + phoneNumber,
            createdAt: new Date().toISOString()
        };
        console.log('Printed from login_signup.js inside event listener');
        console.log(newUser);
        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Signup failed');
            }

            showSuccessMessage('Account created successfully! You can now sign in.');
            signupForm.reset();
            //Log right in or Direct to sign up page
            loginToggle.click();
            console.log('✅ User registered:', result);

        } catch (err) {
            console.error('❌ Signup error:', err.message);
            alert('Error: ' + err.message);
        }

        // if (insertError) {
        //     alert("Profile save error: " + insertError.message);
        // } else {
        //     alert("Signup successful! Please check your email to confirm.");
        // }
            
        // users.push(newUser);
        // localStorage.setItem('users', JSON.stringify(users));
        
        // showSuccessMessage('Account created successfully! You can now sign in.');
        // signupForm.reset();
        // console.log('User registered:', { email, phone: countryCode + phoneNumber });
        
        // Switch to login form after successful signup
        //setTimeout(() => switchForm('login'), 2000);
    }
});

// Google Sign In simulation
window.handleGoogleSignIn = function() {
    showSuccessMessage('Google Sign In initiated! (This is a demo - integrate with Google OAuth in production)');
    console.log('Google Sign In clicked');
}

// Forgot password handler
window.handleForgotPassword = handleForgotPassword;
async function handleForgotPassword() {
    const email = document.getElementById('loginEmail').value.trim();

    if (!email) {
        showError('loginEmail', 'Please enter your email address first');
        return;
    }

    if (!validateEmail(email)) {
        showError('loginEmail', 'Please enter a valid email address');
        return;
    }

    // Disable the link while processing
    const forgotLink = document.querySelector('.forgot-password a');
    const originalText = forgotLink.textContent;
    forgotLink.textContent = 'Sending...';
    forgotLink.style.pointerEvents = 'none';

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        showSuccessMessage(data.message || 'If an account with that email exists, a password reset link has been sent.');

    } catch (err) {
        console.error('Forgot password error:', err);
        showSuccessMessage('If an account with that email exists, a password reset link has been sent.');
    } finally {
        forgotLink.textContent = originalText;
        forgotLink.style.pointerEvents = '';
    }
}

// Initialize
setupRealtimeValidation();

// Animations
gsap.from('.container', {
    duration: 0.8,
    y: 50,
    opacity: 0,
    ease: 'power3.out'
});

gsap.from('.form-header', {
    duration: 0.6,
    y: 30,
    opacity: 0,
    delay: 0.2,
    ease: 'power2.out'
});

gsap.from('.form-toggle', {
    duration: 0.6,
    y: 20,
    opacity: 0,
    delay: 0.3,
    ease: 'power2.out'
});

gsap.from('.form-group', {
    duration: 0.5,
    y: 20,
    opacity: 0,
    delay: 0.4,
    stagger: 0.1,
    ease: 'power2.out'
});
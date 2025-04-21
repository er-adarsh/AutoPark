$(document).ready(function() {
    // Login Form Validation
    $("#loginForm").submit(function(event) {
        event.preventDefault(); // Prevent default form submission

        var email = $("#loginForm input[type='email']").val();
        var password = $("#loginForm input[type='password']").val();

        // Basic email validation (you can add more robust checks)
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return false;
        }

        // Basic password validation (you can add more complex checks)
        if (password.length < 8) {
            alert("Password must be at least 8 characters long.");
            return false;
        }

        // If validation passes, submit the form
        $(this).off("submit").submit(); 
    });

    // Signup Form Validation
    $("#signupForm").submit(function(event) {
        event.preventDefault();

        var firstName = $("#firstName").val();
        var lastName = $("#lastName").val();
        var email = $("#signupForm input[type='email']").val();
        var mobile = $("#mobile").val();
        var password = $("#password").val();
        var confirmPassword = $("#confirmPassword").val();

        // Basic input validations (add more as needed)
        if (firstName.trim() === "" || lastName.trim() === "" || 
            email.trim() === "" || mobile.trim() === "" || password.trim() === "") {
            alert("Please fill in all required fields.");
            return false;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return false;
        }

        // Basic email validation (you can add more robust checks)
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return false;
        }

        // If validation passes, submit the form
        $(this).off("submit").submit(); 
    });
});

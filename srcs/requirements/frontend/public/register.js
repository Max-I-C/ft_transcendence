function validateForm()
{
    clearError();
    let valid = true;
    const username = document.getElementById('UserName').value;
    const email = document.getElementById('Email').value;
    const password = document.getElementById('Password').value;
    const passwordBis = document.getElementById('PasswordBis').value;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    if(!emailRegex.test(email)){
        document.getElementById('emailError').innerText = 'Invalid email';
        valid = false;
    }
    if(password !== passwordBis){
        document.getElementById('passwordError').innerText = 'Password are not matching';
        valid = false;
    }
    if(password.length < 8){
        document.getElementById('passwordError').innerText = 'Password too small';        
        valid = false;
    }
    if (valid)
    {
        clearError();
        alert('all good');
        window.location.href = 'success.html';
        return true;
    }
    return false;
}

function clearError()
{
    document.getElementById('usernameError').innerText = '';
    document.getElementById('emailError').innerText = '';
    document.getElementById('passwordError').innerText = '';
}
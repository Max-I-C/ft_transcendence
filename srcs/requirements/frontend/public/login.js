document.getElementById('login-form').addEventListener('submit', async function (e){
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try{
        const response = await fetch('/api/login', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if(response.ok)
        {
            alert('Connexion verifier !');
            window.location.href = '/home.html';
        }
        else    
        {
            const status = response.status;
            if(status === 401)
                document.getElementById('userError').innerText = 'Invalid user';
            else if (status === 402)
                document.getElementById('passError').innerText = 'Invalid password';
            else
                alert('Unknow error');
        }
    }
    catch(err)
    {
        alert('Erreur reseau');
        console.error(err);
    }
});

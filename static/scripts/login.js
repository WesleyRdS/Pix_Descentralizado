document.addEventListener("DOMContentLoaded", 
    function(){
        const login_agency = document.getElementById("agency");
        const login_account = document.getElementById("account");
        const Key = document.getElementById("Key");
        const id = document.getElementById("Identifier")

        const login = document.getElementById("login");

        login.addEventListener("submit", function(event){
            event.preventDefault();
            var forms = {
                ag : login_agency.value,
                acc : login_account.value,
                cpf : id.value,
                keyword : Key.value
            }
            console.log(forms)
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(forms)
            })
            .then(response => response.json())
            .then(NewData => {
                console.log('Resposta da API:', NewData);
                window.location.href = '/perfil';
            })
            .catch(error => {
                console.error('Erro ao logar:', error);
                alert('Ocorreu um erro ao logar')
            })
    });

});
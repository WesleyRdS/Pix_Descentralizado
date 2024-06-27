document.addEventListener('DOMContentLoaded', function() {

    var accsDropdown = document.getElementById('accsDropdown');
    const controller = new AbortController();
    const signal = controller.signal;


    const timeout = 10000; 

    const timeoutId = setTimeout(() => {
        controller.abort(); 
    }, timeout);

    fetch("/PIXprocess", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
        .then(function(response) {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error('Erro na requisição da API');
            }
            return response.json();
        })
        .then(function(data) {
            
            accsDropdown.innerHTML = '<option value="">Selecione a conta</option>';

           
            data.forEach(function(account) {
                var option = document.createElement('option');
                option.value = account.account;  
                option.textContent = account.account; 
                accsDropdown.appendChild(option);
            });
        })
        .catch(function(error) {
            alert('Erro ao carregar contas')
            console.error('Erro ao carregar contas:', error);
        });
});
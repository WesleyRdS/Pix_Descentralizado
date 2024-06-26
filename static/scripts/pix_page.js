document.addEventListener('DOMContentLoaded', function() {
    // Seleciona o elemento select pelo ID
    var accsDropdown = document.getElementById('accsDropdown');

    fetch("/PIXprocess", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
        .then(function(response) {
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
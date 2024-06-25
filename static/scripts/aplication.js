fetch('/perfil_data', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(fetch('/perfil_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('acc').textContent = `${data.agency}-${data.account}`;
        document.getElementById('balance').textContent = data.balance;
    })
    .catch(error => {
        console.error('Erro ao obter dados do perfil:', error);
        document.getElementById('acc').textContent = 'Erro ao carregar os dados do perfil';
        document.getElementById('balance').textContent = 'Erro ao carregar os dados do perfil';
    }))
})
.then(response => response.json())
.then(data => {
    console.log('Resposta da API:', data);
    document.getElementById('acc_field').textContent = data.agency+"-"+data.account;
    document.getElementById('balance_field').textContent = data.balance;
})
.catch(error => {
    console.error('Erro ao obter dato:', error);
    alert('Erro ao obter datdo')
});
document.addEventListener("DOMContentLoaded", 
    function(){
       
        

        document.getElementById('depositForm').addEventListener('submit', function(event) {
            event.preventDefault(); 
        
            const account = document.getElementById('account').value;
            
        
            const depositValue = document.getElementById('value').value;
        
            const formData = {
                account: account,

                deposit: depositValue
            };
        
            fetch('/deposit_process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao processar o depósito');
                }
                return response.json();
            })
            .then(data => {
                console.log('Resposta da API:', data);
                alert(`Depósito de R$${formData.deposit} na conta ${formData.account} realizado com sucesso`);
                window.location.href = '/perfil'; 
            })
            .catch(error => {
                console.error('Falha no depósito', error);
                alert('Ocorreu uma falha ao depositar. Por favor, tente novamente.');
            });
        });
        document.getElementById('btn_back_aplication').addEventListener('click', function(event) {
            event.preventDefault(); 
            window.location.href = '/perfil'; 
        });


    }
);
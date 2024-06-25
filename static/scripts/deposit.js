document.addEventListener("DOMContentLoaded", 
    function(){
        //block to verify a type of account
        var identifier = document.getElementsByName("identifier");
        var CPF = document.getElementById("cpf_field");
        var CNPJ = document.getElementById("cnpj_field");
        

        document.getElementById('depositForm').addEventListener('submit', function(event) {
            event.preventDefault(); 
        
            const account = document.getElementById('account').value;
            const identifierType = document.querySelector('input[name="identifier"]:checked').value;
            let idValue = '';
            
            if (identifierType === 'cpf') {
                idValue = document.getElementById('cpf').value;
            } else if (identifierType === 'cnpj') {
                idValue = document.getElementById('cnpj').value;
            }
        
            const depositValue = document.getElementById('value').value;
        
            const formData = {
                account: account,
                cpf_cnpj: idValue,
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


        //texts fields required change
        function change_required(op, id){
            const inputElement = document.getElementById(id);
            if(op == true){
                inputElement.required = op;
            }else{
                inputElement.required = op;
            }
        }



         //verify field in exibition
        function to_hide_field(){
            if(identifier[0].checked){
                CPF.style.display = 'block';
                CNPJ.style.display = 'none';
                change_required(true, "cpf");
                change_required(false, "cnpj");

            }
            else if(identifier[1].checked){
                CPF.style.display = 'none';
                CNPJ.style.display = 'block';
                change_required(false, "cpf");
                change_required(true, "cnpj");

            }
        }

        for(var itarator = 0; itarator < identifier.length; itarator++){
            identifier[itarator].addEventListener('change', to_hide_field);
        }


        to_hide_field();
    }
);
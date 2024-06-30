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

    var ADD_acc_forms_dynamic = document.getElementById("acc_forms_dynamic");
    
    var remove_acc = document.getElementById("remove_acc");
    var add_acc = document.getElementById("add_acc");
    var acc_index = 1;
    add_acc.addEventListener("click", function(){
        var new_acc_div = document.createElement("div");
        new_acc_div.classList.add("form-group");
    
        var new_select = document.createElement("select");
        new_select.name = "accs" + acc_index;
        new_select.id = "accsDropdown" + acc_index;
    
        var default_option = document.createElement("option");
        default_option.value = "";
        default_option.textContent = "Selecione a conta";
        new_select.appendChild(default_option);
    
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
            data.forEach(function(account) {
                var option = document.createElement('option');
                option.value = account.account;
                option.textContent = account.account;
                new_select.appendChild(option);
            });
        })
        .catch(function(error) {
            alert('Erro ao carregar contas');
            console.error('Erro ao carregar contas:', error);
        });
    
        var line_break = document.createElement("br");
        var new_acc_label = document.createElement("label");
        new_acc_label.textContent = "Destino(" + acc_index + "):";

        var new_select_label = document.createElement("label");
        new_select_label.textContent = "Remetente(" + acc_index + "):";

        var new_value_label = document.createElement("label");
        new_value_label.textContent = "Valor(" + acc_index + "):";
    
        var new_acc_input = document.createElement("input");
        new_acc_input.type = "text";
        new_acc_input.name = "acc" + acc_index;
        new_acc_input.id = "acc" + acc_index;
        new_acc_input.required = true;

        var new_value_input = document.createElement("input");
        new_value_input.type = "text";
        new_value_input.name = "value" + acc_index;
        new_value_input.id = "value" + acc_index;
        new_value_input.required = true;
    
        new_acc_div.appendChild(new_select_label);
        new_acc_div.appendChild(new_select);
        new_acc_div.appendChild(line_break);
        new_acc_div.appendChild(new_acc_label); 
        new_acc_div.appendChild(new_acc_input);
        new_acc_div.appendChild(line_break);
        new_acc_div.appendChild(new_value_label); 
        new_acc_div.appendChild(new_value_input);
    
        ADD_acc_forms_dynamic.appendChild(new_acc_div);
    
        acc_index++;
    });

    remove_acc.addEventListener("click", function(){
        if(acc_index > 1){
            ADD_acc_forms_dynamic.removeChild(ADD_acc_forms_dynamic.lastChild);
            acc_index--;
        } else {
            alert("Não é possível remover mais campos!!!");
        }
    });

    document.getElementById('btn_back_aplication').addEventListener('click', function(event) {
        event.preventDefault(); 
        window.location.href = '/perfil'; 
    });

    document.getElementById("btn_pix").addEventListener("submit", function(event){
        event.preventDefault();
        var pix_array = [];
        for(var i = 1; i < ADD_acc_forms_dynamic.childElementCount; i++){
            var pix = {
                sender : document.getElementById("accsDropdown"+i).value,
                destiny : document.getElementById("acc"+i).value,
                val : document.getElementById("value"+i).value

            }
            pix_array.push(pix);
        }
        var new_pix = {
            sender : document.getElementById("accsDropdown").value,
            destiny : document.getElementById("acc").value,
            val : document.getElementById("value").value
        }
        pix_array.unshift(new_pix);

        var formpix = {
            pixlist : pix_array
        }
        console.log("pixlist")
        fetch('/pix_prepare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formpix) 
        })
        .then(response => {

            if (!response.ok) {
                throw new Error('Falha ao fazer transação: ' + response.statusText);
            }
            return response.json();
        })
        .then(NewData => {
            console.log('Resposta da API:', NewData);
            alert('Tranferencia enviada');
            window.location.href = '/';
        })
        .catch(error => {
            console.error('Erro na transferencia:', error);
            alert('Ocorreu um erro ao transferir')
        })

    });

    
}); 
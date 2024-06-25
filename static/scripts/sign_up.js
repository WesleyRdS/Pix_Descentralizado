

document.addEventListener("DOMContentLoaded", 
    function(){
        //block to verify a type of account
        var identifier = document.getElementsByName("identifier");
        var CPF = document.getElementById("cpf_field");
        var CNPJ = document.getElementById("cnpj_field");

        //joint account blocks 
        var label_type_account = document.getElementById("label_type_account");
        var ADD_cpf_forms_dynamic = document.getElementById("cpf_forms_dynamic");
        var remove_cpf = document.getElementById("remove_cpf");
        var add_cpf = document.getElementById("add_cpf");
        var cpf_index = 1;
        var type_account = document.getElementsByName("type_account");
        var add_cpf_button = document.getElementById("add_cpf_button");

        const sign_up = document.getElementById("sign_up");
        

        sign_up.addEventListener("submit", function(event){
            event.preventDefault();
            var new_acc = [];
            var key = document.getElementById("Key").value;
            const identifier_type = document.querySelector('input[name="identifier"]:checked').value;
            var identifier_value;
            if(identifier_type == "cnpj"){
                identifier_value = document.getElementById("cnpj").value;
                new_acc.push(identifier_value);
                const agency = document.getElementById('agency').value;
                var forms = {
                    type_person : identifier_type,
                    data_person : new_acc,
                    agency : agency,
                    keyword : key
                }
            }else{
                const acc_type = document.querySelector('input[name="type_account"]:checked').value;
                if(acc_type == "CC"){
                    for(var i = 1; i <= ADD_cpf_forms_dynamic.childElementCount; i++){
                        var new_cliente = {
                            client_name : document.getElementById('client'+i).value,
                            acc_value : document.getElementById("cpf"+i).value
                        }
                        new_acc.push(new_cliente);
                    }
                }
                var new_cliente = {
                    client_name : document.getElementById('client').value,
                    acc_value : document.getElementById("cpf").value
                }
                new_acc.unshift(new_cliente);
                const agency = document.getElementById('agency').value;
                var forms = {
                    type_person : identifier_type,
                    data_person : new_acc,
                    agency : agency,
                    keyword : key
                     
                }

            }

            fetch("/add_user", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(forms)
            })
            .then(response => response.json())
            .then(NewData => {
                console.log('Resposta da API:', NewData);
                alert('Cadastro Realizado');
                window.location.href = '/';
            })
            .catch(error => {
                console.error('Erro ao cadastrar:', error);
                alert('Ocorreu um erro ao cadastrar')
            })
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

        //block to add cpf number dynamically
        add_cpf.addEventListener("click", function(){
                var new_cpf_div = document.createElement("div");
                new_cpf_div.classList.add("form-group");

                var new_cpf_label = document.createElement("label");
                new_cpf_label.textContent = "CPF-Joint(" + cpf_index + "):";

                var new_cpf_input = document.createElement("input");
                new_cpf_input.type = "text";
                new_cpf_input.name = "cpf" + cpf_index;
                new_cpf_input.id = "cpf" + cpf_index;
                new_cpf_input.placeholder = "000.000.000-00";
                new_cpf_input.required = true;

                var line_break = document.createElement("br");

                var new_name_div = document.createElement("div");
                new_name_div.classList.add("form-group");

                var new_name_label = document.createElement("label");
                new_name_label.textContent = "Name-Joint(" + cpf_index + "):";

                var new_name_input = document.createElement("input");
                new_name_input.type = "text";
                new_name_input.name = "client" + cpf_index;
                new_name_input.id = "client" + cpf_index;
                new_name_input.placeholder = "Ted Mosby"
                new_name_input.required = true;

                var line_break = document.createElement("br");

                new_cpf_div.appendChild(new_name_label);
                new_cpf_div.appendChild(new_name_input);
                new_cpf_div.appendChild(line_break);
                new_cpf_div.appendChild(new_cpf_label);
                new_cpf_div.appendChild(new_cpf_input);

                ADD_cpf_forms_dynamic.appendChild(new_cpf_div);

                cpf_index++;
            }
        );
      
        remove_cpf.addEventListener("click", function(){
            if(cpf_index > 1){
                ADD_cpf_forms_dynamic.removeChild(ADD_cpf_forms_dynamic.lastChild);
                cpf_index--;
            } else{
                alert("Não é possivel remover mais campos!!!");
            }
        });

        //verify field in exibition
        function to_hide_field(){
            if(identifier[0].checked){
                CPF.style.display = 'block';
                CNPJ.style.display = 'none';
                change_required(true, "cpf");
                change_required(false, "cnpj");
                label_type_account.style.display = 'block';
            }
            else if(identifier[1].checked){
                CPF.style.display = 'none';
                CNPJ.style.display = 'block';
                change_required(false, "cpf");
                change_required(true, "cnpj");
                label_type_account.style.display = 'none';
            }
        }

        function to_hide_botton(){
            if(type_account[0].checked){
                add_cpf_button.style.display = 'none';
                ADD_cpf_forms_dynamic.style.display = 'none';

            }
            else if(type_account[1].checked){
                add_cpf_button.style.display = 'block';
                ADD_cpf_forms_dynamic.style.display = 'block';

            }
        }

        
        for(var itarator = 0; itarator < identifier.length; itarator++){
            identifier[itarator].addEventListener('change', to_hide_field);
            type_account[itarator].addEventListener('change', to_hide_botton);
        }


        to_hide_field();
        to_hide_botton();
    }
);



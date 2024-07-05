require('dotenv').config();

const express = require('express');
const session = require('express-session')
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const { compile } = require('ejs');
const { measureMemory } = require('vm');
const { count, Console } = require('console');
const { captureRejectionSymbol } = require('events');

const app = express();
const IP = process.env.IP || "0.0.0.0"
const porta = process.env.PORT || 9985;
const chave = process.env.API_KEY;
var data_base = []
var queue_transaction = [];
var queue_pix = [];
const data_routes = [
    "127.0.0.1"
];
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true
}));

app.set('views', path.join(__dirname, '../templates'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '../static')));

app.get('/', (req, res) => {
    if(req.session.user){
        res.sendFile(path.join(__dirname, '../templates', 'aplication.html'));     
    }else{
        res.sendFile(path.join(__dirname, '../templates', 'login.html'));
    }
});

app.get('/sign_up', (req, res) =>{
    if(req.session.user){
        res.sendFile(path.join(__dirname, '../templates', 'aplication.html'));     
    }else{
        res.sendFile(path.join(__dirname, '../templates', 'sign_up.html'));
    }
});

app.get('/Confirm', (req, res) =>{
    if(req.session.user){
        res.json({ message: 'Login bem-sucedido!' });
    }else{
    res.sendFile(path.join(__dirname, '../templates', 'login.html'));
    }
});

app.get('/perfil', async(req, res) =>{
    if(req.session.user){
        res.sendFile(path.join(__dirname, '../templates', 'aplication.html'));     
    }else{
        res.sendFile(path.join(__dirname, '../templates', 'login.html'));
    }
});

app.post('/perfil_data', (req, res) => {

    const user = data_base.find(search_user => search_user.account === req.session.user.account && search_user.agency === req.session.user.agency && search_user.id_client === req.session.user.id_client);
    const data = {
        agency : user.agency,
        account : user.account,
        balance : user.real_balance
    }
    res.json(data);
});

app.get('/pix_page', async(req, res) =>{
    if(req.session.user){
        res.sendFile(path.join(__dirname, '../templates', 'pix_page.html'));     
    }else{
        res.sendFile(path.join(__dirname, '../templates', 'login.html'));
    }
})

function return_accs(compare, id){
    const users = [];
    for(var i = 0; i < data_base.length; i++){

        const v_compare = compare.split("@");

        for(var t in v_compare){
            var founduser = users.find(u => u.acc == data_base[i].account);
            if(!founduser){

                if(v_compare[t] === data_base[i].id_client  && v_compare[t] === id){
                    users.push(data_base[i]);
                }else if(compare === data_base[i].id_client){
                    users.push(data_base[i])
                }else{
                    const aux = (data_base[i].id_client).split('@');

                    if(aux.length > 1){
                        for(const v in aux){

                            if(aux[v] === v_compare[t] && v_compare[t] == id){
                                users.push(data_base[i]);
                            }
                        }
                    }
                }

            }
        }
    }
    return users
}

app.post('/PIXprocess', async (req, res) => {
    var data = [];

    try {
        const sendMessagePromises = data_routes.map(ip => sendMessageToOtherAPI("identifier:" + req.session.user.id_client+":"+req.session.user.signin, ip));

        const results = await Promise.all(sendMessagePromises);

        results.forEach(result => {
            if (result.success && result.response.data) {
                data = data.concat(result.response.data);
            }
        });


        console.log("Usuários transferiveis:", data);
        res.json(data);
    } catch (error) {
        console.error('Erro ao processar PIX:', error);
        res.status(500).json({ success: false, error: 'Erro ao processar PIX' });
    }
});



app.post('/add_user', async(req, res) => {
    const { type_person, data_person, agency, keyword  } = req.body;
    if(agency == IP){

        if(data_person && data_person.length > 1){

            var aux_name = data_person[0].client_name;
            var aux_id = data_person[0].acc_value;
            for(var i = 1; i < data_person.length; i++){
                aux_name += "@"+data_person[i].client_name;
                aux_id += "@"+data_person[i].acc_value;
            }
            const user = data_base.find(search_user => search_user.id_client === aux_id);
            if(user){ 


                return res.status(400).json({error: 'Usuario ja cadastrado' });
            }
            else{

                res.json({ received: true });
                const new_cliente = {
                    name_client : aux_name,
                    id_client : aux_id,
                    signin : "",
                    agency : agency,
                    account : make_account_number(agency,data_base.length),
                    password : keyword,
                    state_commit: "Inicial",
                    state_locking: "Livre",
                    real_balance: 0,
                    transaction_balance : 0,
                    atomicity : 0
                }
                data_base.push(new_cliente);

            }
        }else if(data_person){

            const user = data_base.find(search_user => search_user.id_client === data_person[0].acc_value);
            if(user){ 

                return res.status(400).json({error: 'Usuario ja cadastrado' });
            }
            else{
                res.json({ received: true });
                const new_cliente = {
                    name_client : data_person[0].client_name,
                    id_client : data_person[0].acc_value,
                    signin : data_person[0].acc_value,
                    agency : agency,
                    account : make_account_number(agency,data_base.length),
                    password : keyword,
                    state_commit: "Inicial",
                    state_locking: "Livre",
                    real_balance: 0,
                    transaction_balance : 0,
                    atomicity : 0
                }
                data_base.push(new_cliente);
            }
            
        }else{
            res.redirect('/sign_up');
        }
    }else{
        try {
            const response = await axios.post(`http://${agency}:8855/add_user`, {
                type_person: req.body.type_person,
                data_person: req.body.data_person,
                agency: req.body.agency,
                keyword: req.body.keyword
            });
            console.log(response.data)
            res.json({ success: true, response: response.data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.req });
        }
    }

    console.log(data_base);
    

});

app.post('/login', async(req, res) => {
    const { ag, acc, cpf, keyword } = req.body;

    const user = data_base.find(search_user => search_user.account === acc && search_user.agency === ag && search_user.password === keyword);
    const cc = user.id_client.split("@");

    for(var itarator in cc){
        if(cpf === cc[itarator]){
            change_three_phase(user.account, "signin", cpf);
        }
    }
    if(user && user.id_login != ""){
        console.log("Usuario encontrado: "+user.account+ " / O login será realizado");
        req.session.user = user;
        res.redirect('/Confirm');
    }else {

        res.status(404).json({ error: 'Credenciais invalidas' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log("Erro: "+err);
            res.status(404).json({ error: 'Sessão não pode ser encerrada..Tente novamente' });
        } else {
            res.redirect('/');
        }
    });
});

async function sendMessageToOtherAPI(message, ip) {
    try {
        const response = await axios.post(`http://${ip}:${porta}/receive-message`, { message : message});
        return { success: true, response: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

app.post('/pix_prepare', async(req, res) => {
    const pix_array = req.body;

    const data = {
        pix : pix_array
    }

    console.log("Sender:", data.pix);

    const n_operations = Object.keys(data.pix).length;
    var count_response = 0;
    for(var iterator = 0 ; iterator < n_operations; iterator = iterator + 3){
        if(iterator === 0){
            var aux_route;
            aux_route = data.pix["sender"].split("@");
            let message = data.pix["sender"]+"/"+data.pix["destiny"]+"/"+data.pix["value"]
            let response = ""
            try {
                response = await axios.post(`http://${aux_route[0]}:${porta}/pix-execute`, { message : message});

            } catch (error) {
                console.log(`A transação de ${data.pix['sender']} para ${data.pix['destiny']} no valor de R$ ${data.pix['value']} falhou!!`)
            }
            if(response != ""){
                count_response++;
                response = "";
            }
        }else{
            var aux_route;
            aux_route= data.pix["sender"+iterator/3].split("@");
            let message = data.pix["sender"+iterator/3]+"/"+data.pix["destiny"+iterator/3]+"/"+data.pix["value"+iterator/3]
            let response = ""
            try {
                response = await axios.post(`http://${aux_route[0]}:${porta}/pix-execute`, { message : message});

            } catch (error) {
                console.log(`A transação de ${data.pix['sender']} para ${data.pix['destiny']} no valor de R$ ${data.pix['value']} falhou!!`)
            }
            if(response != ""){
                count_response++;
                response = "";
            }
            if(response){
                count_response++;
            }

        }
    }
    if(count_response === n_operations/3){
        res.sendFile(path.join(__dirname, '../templates', 'pix_page.html'));
    }else{
        res.status(404).json({ error: 'Erro na transação' });
    }
});

app.post('/pix-execute', async (req, res) => {
    var { message } = req.body;
    var pix_transaction = message.split("/");
    queue_pix.push(pix_transaction);
    const current_pix = queue_pix[0];
    console.log("Usuario: "+current_pix);
    var aux_route = current_pix[1].split("@")
    var user = data_base.find(search_user => search_user.account === current_pix[0]);
    if(user){
        if(user.state_commit === "Inicial" && user.state_locking === "Livre" && user.real_balance - current_pix[2] >= 0){
            change_three_phase(current_pix[0], "state_commit", "Esperando Resposta");
            change_three_phase(current_pix[0], "state_locking", "Espera");
            sendMessageToOtherAPI("first_verify:"+current_pix[1], aux_route[0])
            .then(response => {
                console.log(`Resposta do servidor: ${response}`);
                if(response.response.data === "Afirmativo"){
                    change_three_phase(current_pix[0], "state_locking", "Preparado");
                    sendMessageToRoute(IP, "pix-pre-commit")
                    .then(result => {
                        console.log('Resposta de /pix-pre-commit:', result); 
                    })
                    .catch(error => {
                        console.error('Erro ao enviar para /pix-pre-commit:', error);
                    });
                }else{
                    var aux = queue_pix.shift();
                    queue_pix.push(aux);
                    console.log("Essa conta esta fazendo uam transação no momento, adicionando a fila");
                }
                
            })
            .catch(error => {
                console.error('Erro:', error);
      
            });
            
        }
        else{
            var aux = queue_pix.shift();
            queue_pix.push(aux);
            console.log("Essa conta esta fazendo uam transação no momento, adicionando a fila");
        }
    }else{
        console.log("Esse usuario não existe!!!!");
        res.sendFile(path.join(__dirname, '../templates', 'pix_page.html'));
    }
    
});

app.post("/pix-pre-commit", async (req, res) => {
    res.status(200).json({ success: 'Transações estão em processamento' });
    const current_pix = queue_pix[0];
    console.log("Usuario: "+current_pix);
    var aux_route = current_pix[1].split("@")
    var user = data_base.find(search_user => search_user.account === current_pix[0]);
    if(user.state_commit === "Esperando Resposta" && user.state_locking === "Preparado"){
        change_three_phase(current_pix[0], "state_commit", "Pre-Compromisso");
        change_three_phase(current_pix[0], "state_locking", "Adquirir_Bloqueio_Leitura");
        if(user.real_balance - parseInt(current_pix[2]) >= 0){
            sendMessageToOtherAPI("second_verify:"+current_pix[1], aux_route[0])
            .then(resposta => {
                console.log('Resposta do servidor:', resposta);
                if(resposta.response.data === "Permitido"){
                    change_three_phase(current_pix[0], "state_commit", "Firmar-Compromisso");
                    change_three_phase(current_pix[0], "state_locking", "Adquirir_Bloqueio_Escrita");
                    const val = user.real_balance - parseInt(current_pix[2]);
                    change_three_phase(current_pix[0], "transaction_balance", val);
                    change_three_phase(current_pix[0], "atomicity", current_pix[2]);
                    console.log("Valor da transferencia:"+ user.transaction_balance);
                    sendMessageToRoute(IP, "pix-commit")
                    .then(result => {
                        console.log('Resposta de /pix-commit:', result); 
                    })
                    .catch(error => {
                        console.error('Erro ao enviar para /pix-commit:', error);

                    });
                }else{
                    change_three_phase(current_pix[0], "state_commit", "Inicial");
                    change_three_phase(current_pix[0], "state_locking", "Livre");
                    console.log("Transação pendente, entrando em fila....")
                    sendMessageToOtherAPI("rollback:"+current_pix[1], aux_route[0])
                    .then(resposta => {
                        if(resposta.response.data === "Feito"){
                            queue_pix.shift()
                            queue_pix.push(current_pix);
               
                        }
                    }).catch(error => {
                        console.error('Erro:', error);
    
                    });
                }
            })
            .catch(error => {
                console.error('Erro:', error);

            });
        }
    }

});

app.post("/pix-commit", async(req, res) => {
    res.status(200).json({ success: 'Transações estão em processamento' });
    const current_pix = queue_pix[0];
    console.log("Usuario: "+current_pix);
    var aux_route = current_pix[1].split("@")
    var user = data_base.find(search_user => search_user.account === current_pix[0]);
    if(user.state_commit === "Firmar-Compromisso" && user.state_locking === "Adquirir_Bloqueio_Escrita"){
        change_three_phase(current_pix[0], "state_commit", "Esperando Resposta Final");
        if(user.real_balance - parseInt(current_pix[2]) >= 0){
            sendMessageToOtherAPI("last_verify:"+current_pix[1]+":"+current_pix[2], aux_route[0])
            .then(resposta => {
                console.log('Resposta do servidor:', resposta);
                if(resposta.response.data === "Valor Recebido"){
                    const val = user.transaction_balance;
                    change_three_phase(current_pix[0], "real_balance", val);
                    change_three_phase(current_pix[0], "state_commit", "Completo");
                    change_three_phase(current_pix[0], "state_locking", "Liberar_Bloqueio");
                    sendMessageToRoute(IP, "pix-complete")
                    .then(result => {
                        console.log('Resposta de /pix-complete:', result); 
                    })
                    .catch(error => {
                        console.error('Erro ao enviar para /pix-complete:', error);
      
                    });
                }
                else{
                    change_three_phase(current_pix[0], "state_commit", "Inicial");
                    change_three_phase(current_pix[0], "state_locking", "Livre");
                    change_three_phase(current_pix[0], "transaction_balance", 0);
                    change_three_phase(current_pix[0], "atomicity", 0);
                    console.log("Transação pendente, entrando em fila....")
                    sendMessageToOtherAPI("rollback:"+current_pix[1], aux_route[0])
                    .then(resposta => {
                        if(resposta.response.data === "Feito"){
                            queue_pix.shift()
                            queue_pix.push(current_pix);
      
                        }
                    }).catch(error => {
                        console.error('Erro:', error);
           
                    });
                }
            })
            .catch(error => {
                console.error('Erro:', error);
         
            });
        } 
    }
});

app.post("/pix-complete", async(req, res) =>{
    res.status(200).json({ success: 'Transações estão em processamento' });
    const current_pix = queue_pix[0];
    console.log("Usuario: "+current_pix);
    var aux_route = current_pix[1].split("@")
    var user = data_base.find(search_user => search_user.account === current_pix[0]);
    if(user.state_commit === "Completo" && user.state_locking === "Liberar_Bloqueio"){
        sendMessageToOtherAPI("complete:"+current_pix[1]+":"+current_pix[2], aux_route[0])
        .then(resposta => {
    
            if(resposta.response.data === "Completo"){
       
                change_three_phase(current_pix[0], "state_locking", "Livre");
                change_three_phase(current_pix[0], "state_commit", "Inicial");
                change_three_phase(current_pix[0], "atomicity", 0);
                queue_pix.shift()
                res.sendFile(path.join(__dirname, '../templates', 'aplication.html'));    
            }
            else{
                change_three_phase(current_pix[0], "state_commit", "Inicial");
                change_three_phase(current_pix[0], "state_locking", "Livre");
                change_three_phase(current_pix[0], "transaction_balance", 0);
                const val = user.real_balance + user.atomicity;
                change_three_phase(current_pix[0], "real_balance", val);
                change_three_phase(current_pix[0], "atomicity", 0);
                console.log("Transação pendente, entrando em fila....")
                sendMessageToOtherAPI("rollback:"+current_pix[1], aux_route[0])
                .then(resposta => {
                    if(resposta.response.data === "Feito"){
                        queue_pix.shift()
                        queue_pix.push(current_pix);
             
                    }
                }).catch(error => {
                    console.error('Erro:', error);

                });
            }
        })
        .catch(error => {
            console.error('Erro:', error);

        });
 
    }
});

function change_three_phase(acc, mode, value){
    for(let n = 0; n < data_base.length; n++){
        if(data_base[n].account === acc){
            data_base[n][mode] = value;
        }
    }
}

app.post('/receive-message', (req, res) => {
    var { message } = req.body;
    const aux = message.split(":");
    var data;

    if(aux[0] === "identifier"){
        data = return_accs(aux[1],aux[2]);
        queue_transaction.push(data);
        res.json({ received: true, data: data });
    }
    else if(aux[0] == "first_verify"){
  
        const user = data_base.find(search_user => search_user.account == aux[1]);
        if(user){

            console.log(user.state_commit+"- commit")
            console.log(user.state_locking+"- locking")
            if(user.state_commit === "Inicial" && user.state_locking === "Livre"){
                change_three_phase(aux[1], "state_commit", "Esperando Resposta");
                change_three_phase(aux[1], "state_locking", "Adquirir_Bloqueio_Leitura");
                const msn = "Afirmativo"
                res.json({ received: true, data: msn });
            }else{
                const msn = "Negado"
                res.json({ received: true, data: msn });
            }
        }else{
            res.status(500).json('Não foi possível achar o usuario para transferencia.');
        }
    }
    else if(aux[0] === "second_verify"){
  
        const user = data_base.find(search_user => search_user.account == aux[1]);
        if(user.state_commit === "Esperando Resposta" && user.state_locking === "Adquirir_Bloqueio_Leitura"){
            change_three_phase(aux[1], "state_commit", "Esperando Resposta Final");
            change_three_phase(aux[1], "state_locking", "Adquirir_Bloqueio_Escrita");
            const msn = "Permitido"
            res.json({ received: true, data: msn });
        }else{
            const msn = "Negado"
            res.json({ received: true, data: msn });
        }
    }
    else if(aux[0] === "last_verify"){
  
        const user = data_base.find(search_user => search_user.account == aux[1]);
        if(user.state_commit === "Esperando Resposta Final" && user.state_locking === "Adquirir_Bloqueio_Escrita"){
            change_three_phase(aux[1], "state_commit", "Completo");
            change_three_phase(aux[1], "state_locking", "Liberar_Bloqueio");
            var val = user.real_balance + parseInt(aux[2]);
            change_three_phase(aux[1], "transaction_balance", val);
            change_three_phase(aux[1], "atomicity", parseInt(aux[2]));
            const msn = "Valor Recebido"
            res.json({ received: true, data: msn });
        }else{
            const msn = "Não Recebido"
            res.json({ received: true, data: msn });
        }
        
    }
    else if(aux[0] === "complete"){

        const user = data_base.find(search_user => search_user.account == aux[1]);
        if(user.state_commit === "Completo" && user.state_locking === "Liberar_Bloqueio"){
            change_three_phase(aux[1], "state_commit", "Inicial");
            change_three_phase(aux[1], "state_locking", "Livre");
            var val = user.transaction_balance;
            change_three_phase(aux[1], "real_balance", val);
            change_three_phase(aux[1], "transaction_balance", 0);
            change_three_phase(aux[1], "atomicity", 0);
            const msn = "Completo"
            res.json({ received: true, data: msn });
        }else{
            const msn = "Falha"
            res.json({ received: true, data: msn });
        }
    }
    else if(aux[0] === "rollback"){
        console.log("Entrei no rollback");
        const user = data_base.find(search_user => search_user.account == aux[1]);
        change_three_phase(aux[1], "state_commit", "Inicial");
        change_three_phase(aux[1], "state_locking", "Livre");

        if(user.real_balance === user.transaction_balance){
            change_three_phase(aux[1], "real_balance", user.transaction_balance - user.atomicity);
        }

        change_three_phase(aux[1], "atomicity", 0);
        change_three_phase(aux[1], "transaction_balance", 0);
        const msn = "Feito"
        res.json({ received: true, data: msn });
    }
    else{
        console.log("Entrou no else");
    }
    console.log(`Mensagem recebida: ${message}`);

});

async function sendMessageToRoute(ip, endpoint) {
    try {
        const response = await axios.post(`http://${ip}:9985/${endpoint}`);
        return { success: true, response: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

app.get('/deposit', (req, res) => {
    if(req.session.user){
        res.sendFile(path.join(__dirname, '../templates', 'deposit.html'));     
    }
    else{
        res.sendFile(path.join(__dirname, '../templates', 'login.html')); 
    }
});

app.post('/deposit_process', (req, res) => {
    const { account, deposit } = req.body;

    const user = data_base.find(search_user => search_user.account === account);

    console.log("usuario: "+ user)
    if (user) {
        const index = data_base.indexOf(user);
   
      
        while (data_base[index].state_locking !== "Adquirir_Bloqueio_Escrita") {
      
            if (data_base[index].state_locking === "Livre" && data_base[index].state_commit === "Inicial") {
                data_base[index].state_locking = "Adquirir_Bloqueio_Leitura";
                data_base[index].state_commit = "Compromisso";
                data_base[index].sudo = req.session.user.id_client;
            } else if (data_base[index].state_locking === "Adquirir_Bloqueio_Leitura" && data_base[index].state_commit === "Compromisso" && "sudo" in data_base[index]) {
                data_base[index].state_locking = "Adquirir_Bloqueio_Escrita";
            } else {
                res.status(500).send('Não foi possível completar o depósito.');
                break;
            }
  
        }

        while (data_base[index].state_locking !== "Livre" && data_base[index].state_commit !== "Inicial" && "sudo" in data_base[index]) {
      
            if (data_base[index].state_locking === "Adquirir_Bloqueio_Escrita" && data_base[index].transaction_balance === 0) {
                data_base[index].transaction_balance = data_base[index].real_balance + Number(deposit);
            } else if (data_base[index].transaction_balance - data_base[index].real_balance === Number(deposit)) {
                data_base[index].real_balance = data_base[index].transaction_balance;
                data_base[index].atomicity = data_base[index].real_balance - data_base[index].transaction_balance;
            } else if (data_base[index].atomicity === 0 && data_base[index].state_locking !== "Liberar_Bloqueio_Escrita" && data_base[index].state_locking !== "Liberar_Bloqueio_Leitura") {
                data_base[index].state_locking = "Liberar_Bloqueio_Escrita";
            } else if (data_base[index].state_locking === "Liberar_Bloqueio_Escrita") {
                data_base[index].state_locking = "Liberar_Bloqueio_Leitura";
                data_base[index].transaction_balance = 0;
            } else if (data_base[index].state_locking === "Liberar_Bloqueio_Leitura" && data_base[index].transaction_balance === 0 && "sudo" in data_base[index]) {
                data_base[index].state_locking = "Livre";
                data_base[index].state_commit = "Inicial";
            } else {
                res.status(500).json('Não foi possível completar o depósito.');
                break;
            }

        }
        if (data_base[index].state_locking === "Livre" && data_base[index].state_commit === "Inicial" && "sudo" in data_base[index]) {
   
            delete data_base[index].sudo;
            const response = {
                status: 'success',
                message: 'Depósito processado com sucesso',

            };
        
            res.status(200).json(response);
        } else {
            res.status(500).json('Não foi possível completar o depósito.');
        }
    } else {
        res.status(404).json({ error: 'Usuário não encontrado' });
    }
});


app.listen(porta, () => {
    console.log(`API está rodando na porta ${porta}`);
});

function make_account_number(ag, lgth){
    aux = ag + "@" + lgth
    return aux;
}

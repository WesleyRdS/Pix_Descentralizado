require('dotenv').config();

const express = require('express');
const session = require('express-session')
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const { compile } = require('ejs');
const { measureMemory } = require('vm');
const { count, Console } = require('console');

const app = express();
const IP = process.env.IP || "127.0.0.1"
const porta = process.env.PORT || 3000;
const chave = process.env.API_KEY;
var data_base = []
var queue_transaction = [];
var queue_pix = [];
const data_routes = ["127.0.0.1"];
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

function return_accs(compare){
    const users = []
    for(var i = 0; i < data_base.length; i++){
        console.log("Usuario comparado"+data_base[i].id_client);
        const person = data_base[i].id_client.split("@");
        for(var j = 0; j < person.length; j++){
            if(person[j] === compare){
                users.push(data_base[i]);
            }
        }
    }
    return users
}

app.post('/PIXprocess', async (req, res) => {
    var data = [];

    try {
        const sendMessagePromises = data_routes.map(ip => sendMessageToOtherAPI("identifier:" + req.session.user.id_client, ip));

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
        console.log("Reconheceu que é o mesmo ip");
        if(data_person && data_person.length > 1){
            console.log("Reconheceu conta conjunta");
            var aux_name = data_person[0].client_name;
            var aux_id = data_person[0].acc_value;
            for(var i = 1; i < data_person.length; i++){
                aux_name += "@"+data_person[i].client_name;
                aux_id += "@"+data_person[i].acc_value;
            }
            const user = data_base.find(search_user => search_user.id_client === aux_id);
            console.log("usuario")
            console.log(user)
            if(user){ 
                console.log("usuario")
                console.log("ihhh");
                return res.status(400).json({error: 'Usuario ja cadastrado' });
            }
            else{
                console.log("Entrou")
                res.json({ received: true });
                const new_cliente = {
                    name_client : aux_name,
                    id_client : aux_id,
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
            console.log("Reconheceu conta");
            const user = data_base.find(search_user => search_user.id_client === data_person[0].acc_value);
            if(user){ 
                console.log("ihhh");
                return res.status(400).json({error: 'Usuario ja cadastrado' });
            }
            else{
                res.json({ received: true });
                const new_cliente = {
                    name_client : data_person[0].client_name,
                    id_client : data_person[0].acc_value,
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
    const { ag, acc, keyword } = req.body;

    const user = data_base.find(search_user => search_user.account === acc && search_user.agency === ag && search_user.password === keyword);
    console.log("Usuario encontrado: "+user.account+ " / O login será realizado");
    if(user){
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

app.post('/pix_prepare', (req, res) => {
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
            for(var i = 0; i < data_routes.length; i++){
                var route_transfer = make_account_number(data_routes[i],i);
                if(route_transfer === data.pix["sender"]){
                    aux_route = data_routes[i];
                }
            }
            const response = sendMessageToOtherAPI("pix_manager:"+data.pix["sender"]+"/"+data.pix["destiny"]+"/"+data.pix["value"], aux_route);
            if(response){
                count_response++;
            }
        }else{
            var aux_route;
            for(var i = 0; i < data_routes.length; i++){
                var route_transfer = make_account_number(data_routes[i],i);
                if(route_transfer === data.pix["sender"]){
                    aux_route = data_routes[i];
                }
            }
            const response = sendMessageToOtherAPI("pix_manager:"+data.pix["sender"+iterator/3]+"/"+data.pix["destiny"+iterator/3]+"/"+data.pix["value"+iterator/3], aux_route);
            if(response){
                count_response++;
            }

        }
    }
    if(count_response === n_operations/3){
        res.status(200).json({ success: 'Transações estão em processamento' });
        console.log("sucesso: "+queue_pix)
    }else{
        res.status(404).json({ error: 'Erro na transação' });
    }
});

app.post('/pix-execute', async (req, res) => {
    res.status(200).json({ success: 'Transações estão em processamento' });
    while(queue_pix.length > 0){
        const current_pix = queue_pix[0];
        console.log("Usuario: "+current_pix)
        var aux_route;
        var response;
        var user = data_base.find(search_user => search_user.account === current_pix[0])
        if(user){
            console.log("achei o user no pix-execute")
            change_three_phase(current_pix[0], "state_commit", "Esperando Resposta");
            change_three_phase(current_pix[0], "state_locking", "Espera");
            for(let i = 0; i < data_base.length; i++){
                var route_transfer = make_account_number(data_base[i].agency,i);
                console.log("conta gerada: "+route_transfer)
                if(route_transfer === current_pix[1]){
                    aux_route = data_base[i].agency;
                    console.log(aux_route)
                }
            }
            console.log("TO TTTO")
            response = await sendMessageToOtherAPI("first_verify:"+current_pix[1], aux_route);
            console.log(response.data)
            if(response.success && response.data){
                if(response.data === "Afirmativo"){
                    change_three_phase(current_pix[0], "state_locking", "Preparado");
                    sendMessageToRoute(IP, "pix-pre-commit")
                    .then(result => {
                        console.log('Resposta de /pix-pre-commit:', result); 
                    })
                    .catch(error => {
                        console.error('Erro ao enviar para /pix-pre-commit:', error);
                    });
                }else{
                    change_three_phase(current_pix[0], "state_commit", "Inicial");
                    change_three_phase(current_pix[0], "state_locking", "Livre");
                    console.log("Transação pendente, entrando em fila....")
                    queue_pix.push(current_pix);
                }
            }
        }

    }
});

app.post("/pix-pre-commit", (req, res) => {
    console.log("Tamo indo bloquear");
});


function change_three_phase(acc, mode, value){
    for(let n = 0; n < data_base.length; n++){
        if(data_base[n].account === acc){
            data_base[n][mode] = value;
        }
    }
}

app.post('/receive-message', (req, res) => {
    const { message } = req.body;
    const aux = message.split(":");
    var data;
    console.log(aux)
    if(aux[0] === "identifier"){
        data = return_accs(aux[1]);
        queue_transaction.push(data);
        res.json({ received: true, data: data });
    }
    else if(aux[0] === "pix_manager"){
        const op_aux = aux[1].split("/");
        console.log("TAMO AQUI NO RECEIVE DO PIX")
        queue_pix.push(op_aux);
        res.json({ received: true, data: queue_pix });

        sendMessageToRoute(IP, "pix-execute")
        .then(result => {
            console.log('Resposta de /pix-execute:', result); 
        })
        .catch(error => {
            console.error('Erro ao enviar para /pix-execute:', error);
        });
    }
    else if(aux[0] == "first_verify"){
        const user = data_base.find(search_user => search_user.account == aux[1]);
        if(user){
            if(user.state_commit === "Inicial" && user.state_locking === "Livre"){
                change_three_phase(aux[1], "state_commit", "Esperando Resposta");
                change_three_phase(aux[1], "state_locking", "Adquirir_Bloqueio_Leitura");
                res.json({ received: true, data: "Afirmativo" });
            }else{
                res.json({ received: true, data: "Negado" });
            }
        }else{
            res.status(500).json('Não foi possível achar o usuario para transferencia.');
        }
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
    const { account, cpf_cnpj, deposit } = req.body;
    const user = data_base.find(search_user => search_user.account === account && search_user.id_client === cpf_cnpj);

    console.log("Conta do usuario: "+user.account)
    if (user) {
        const index = data_base.indexOf(user);
       
        console.log(data_base[index].state_locking )
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
    aux = ag.replace(".", lgth);
    return aux;
}

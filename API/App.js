require('dotenv').config();

const express = require('express');
const session = require('express-session')
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const { compile } = require('ejs');

const app = express();
const IP = process.env.IP || "127.0.0.1"
const porta = process.env.PORT || 3000;
const chave = process.env.API_KEY;
var data_base = []
var queue_transaction = [];
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

app.post('/add_user', async(req, res) => {
    const { type_person, data_person, agency, keyword  } = req.body;
    console.log(`Mensagem recebida: ${JSON.stringify(data_person)}`);
    console.log("senha: "+keyword);
    res.json({ received: true });
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
            for(const if_account of data_base){
                if(aux_id == if_account.id_client){
                    return 0;
                }
            }
            const new_cliente = {
                name_client : aux_name,
                id_client : aux_id,
                agency : data_person.agency,
                account : make_account_number(data_person.agency),
                password : keyword,
                state_commit: "Inicial",
                state_locking: "Livre",
                real_balance: 0,
                transaction_balance : 0,
                atomicity : 0
            }
            data_base.push(new_cliente);
        }else if(data_person){
            console.log("Reconheceu conta");
            for(const if_account of data_base){
                if(data_person[0].acc_value == if_account.id_client){
                    res.status(404).json({ error: 'Usuario ja cadastrado' });
                }
            }
            const new_cliente = {
                name_client : data_person[0].client_name,
                id_client : data_person[0].acc_value,
                agency : agency,
                account : make_account_number(agency),
                password : keyword,
                state_commit: "Inicial",
                state_locking: "Livre",
                real_balance: 0,
                transaction_balance : 0,
                atomicity : 0
            }
            data_base.push(new_cliente);
        }else{
            res.redirect('/sign_up');
        }
    }else{
        try {
            const response = await axios.post(`http://${agency}:${porta}/add_user`, { req });
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

app.post('/send-message', async (req, res) => {
    const { message } = req.query; 
  
    try {
        const response = await axios.post(`http://${IP}:${porta}/receive-message`, { message });
        res.json({ success: true, response: response.data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


app.post('/receive-message', (req, res) => {
    const { message } = req.body;
    console.log(`Mensagem recebida: ${message}`);
    res.json({ received: true });
});


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

function make_account_number(ag){
    aux = ag.replace(".", data_base.length);
    return aux;
}
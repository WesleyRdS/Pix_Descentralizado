require('dotenv').config();

const express = require('express');
const session = require('express-session')
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const IP = process.env.IP || "127.0.0.1"
const porta = process.env.PORT || 3000;
const chave = process.env.API_KEY;
var data_base = []
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
    // Suponha que você tenha um endpoint para obter os dados do perfil
    const data = {
        agency : req.session.user.agency,
        account : req.session.user.account,
        balance : req.session.user.real_balance
    }
    res.json(data);
});

app.post('/add_user', async(req, res) => {
    const { type_person, data_person, agency, keyword  } = req.body;
    console.log(`Mensagem recebida: ${JSON.stringify(data_person)}`);
    console.log("senha: "+keyword)
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
            console.log("Reconheceu conta simples ou empresarial")
            for(const if_account of data_base){
                if(data_person[0].acc_value == if_account.id_client){
                    return 0;
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
            res.redirect('/sign_up')
        }
    }else{
        try {
            const response = await axios.post(`http://${agency}:${porta}/add_user`, { req });
            res.json({ success: true, response: response.data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.req });
        }
    }

    console.log(data_base)
    

});

app.post('/login', async(req, res) => {
    const { ag, acc, keyword } = req.body;
    console.log(ag+"-"+acc+"-"+keyword);
    const user = data_base.find(search_user => search_user.account === acc && search_user.agency === ag && search_user.password === keyword);
    console.log(user)
    if(user){
        req.session.user = user;
        res.redirect('/Confirm')
    }else {
        console.log("Aqui deu merda")
        res.send('Credenciais inválidas. <a href="/">Tente novamente</a>');
    }
});

app.post('/send-message', async (req, res) => {
    const { message } = req.query; // Pegando 'message' da query parameter
  
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


// Inicia o servidor na porta especificada
app.listen(porta, () => {
    console.log(`API 1 está rodando na porta ${porta}`);
});

function make_account_number(ag){
    console.log(ag);
    aux = ag.replace(".", data_base.length);
    return aux;
}
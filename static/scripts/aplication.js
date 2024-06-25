var acc = document.getElementById('acc_field');
var balance = document.getElementById('balance_field');

var data = {
    agency : '<%= req.session.user.agency %>',
    account : '<%= req.session.user.account %>',
    balance : '<%= req.session.user.real_balance %>'
        
}


acc.textContent = data.agency+"-"+data.account;
balance.textContent = data.balance
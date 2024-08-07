# Transações Bancárias Distribuidas

## Introdução

Sistema distribuído para transações financeiras entre bancos pertencentes a um consórcio, semelhante ao sistema Pix, mas sem um banco central para coordenar as transações.
Para isso:
1. As contas bancárias são criadas de forma distribuída, o que significa que cada banco participante do sistema tem seu próprio conjunto de contas para seus clientes.
2. Transações atômicas garantem que uma série de operações seja executada como uma unidade indivisível. Isso significa que, se uma transação envolve mover dinheiro entre várias contas de diferentes bancos, ou mesmo dentro do mesmo banco, ela deve ser executada integralmente ou não ser executada.
3. Os bancos se comunicam para verificar e autorizar transações entre suas contas. Essa comunicação foi feita de modo que apenas transações válidas sejam processadas e que todas as partes envolvidas concordem com o estado final das transações.
4. O sistema garante que as contas não movimentem mais dinhero do que tem disponivel. Ele tambem evita duplo gasto garantindo a impossibilidade de um mesmo dinheiro ser usado mais de uma vez.

## Tecnologias ultilizadas

1. NodeJS
2. Express
3. HTML
4. CSS
5. Docker

## Como executar com o docker

1. docker run -e IP=IP_DA_MAQUINA --network host -it wesleyrds/pix:TAG
2. Use o IP da maquina que esta instanciando o banco
3. A imagem docker esta com os IPs preconfigurandos para os computadores do LARSID então não funcionarão fora da rede de lá
4. O container iniciara na porta 9985

## Como executar na sua maquina sem o docker

1. Baixe o repositorio
2. Mude a lista de rotas no arquivo APP.js para os IPs dos seus computadores
3. Instale o npm
4. Abra o terminal na pasta API
5. Digite IP=IP_DA_MAQUINA node App.js
6. Use o IP da maquina que esta instanciando o banco
7. A aplicação iniciara na porta 9985

## Gerenciamento de contas

### Criação de conta
Para cada banco no consórcio, a criação de contas é gerenciada associando o IP do banco ao número da agência. Isso significa que cada banco é identificado por um IP específico que está ligado diretamente aos números das agências disponíveis.

#### Formato dos Números de Conta

Cada conta de cliente associada a uma agência é identificada pelo seguinte formato:

IP_do_Banco@número_de_contas_cadastradas_no_banco

#### Onde:

1. `IP_do_Banco` é o endereço IP único atribuído ao banco.
2. `número_de_contas_cadastradas_no_banco` é um número que representa a quantidade de contas já cadastradas nesse banco.

#### As informações necessarias para criação da conta são:

1. Nome
2. CPF/CNPj
3. Número da agência-IP
4. Senha

Uma conta só será criada se todos estes campos forem preenchidos e o CPF/CNPj de uma conta pessoal/juridica não pode ser igual ao de outra conta do mesmo tipo ja cadastrada naquele banco. Mas é possivel criar varias contas conjuntas formadas por CPFs que ja estão cadastradas naquele banco.

#### O fluxograma a seguir mostra o funcionamento do cadastro de novos clientes:

![Fluxograma de criação de novas contas](fluxogramas/SINGUP.png)

##### Para contas pessoais:
1. A opção `Fisica` no radio box vem selecionada por padrão.
2. Ela faz o campo de CPF ser exibido. 
3. A opção `Pessoal`no radio box vem selecionada por padrão.
4. Ela mostra apenas um campo de CPF e nome

##### Para contas Conjuntas: 
1. A opção `Fisica` no radio box vem selecionada por padrão.
2. Ela faz o campo de CPF ser exibido.
3. Marque a opção conjunta no radio box.
4. Aparecera dois botões `+` e `x`.
5. Ao clicar no `+`um novo campo para CPF e nome sera exibido.
6. É possivel adicionar quantas pessoas quiser a conta conjunta.
7. Ao clicar no `x` um dos campos sera excluido.
8. O campo padrão não é afetado por essa opção

##### Para contas jurÍdicas:
1. Selecione a opção "Jurídica".
2. Isso fara com que o campo de CNPj seja exibido e o de CPF desabilitado.
3. Tambem fara com que os campos `Pessoal` e `Conjunta` sejam desabilitados.

### Sistema de login/sessão

Embora seja possível criar uma conta em qualquer banco do consórcio a partir de qualquer outro, é fundamental acessar cada banco utilizando a URL correta associada a ele. Isso garante o acesso seguro e direto aos serviços bancários específicos de cada instituição. Assim o login so é permitido se o numero da agencia corresponder ao IP da URL.

#### As informações necessarias para login são:

1. CPF/CNPj
2. Numero da conta
3. Número da agência-IP
4. Senha

Após fornecer as informações necessárias e clicar no botão de login, a API do banco correspondente irá buscar um usuário que corresponda às suas credenciais dentro daquele banco específico. Se um usuário compatível for encontrado, a autenticação será realizada com sucesso.

#### Criação de Sessão

Após a autenticação bem-sucedida, uma sessão será criada para o usuário. Esta sessão permite o acesso às seguintes rotas:

1. Tela Inicial: Oferece uma visão geral das informações da conta e das opções disponíveis.
2. Transações: Permite ao usuário realizar operações financeiras, como transferências e pagamentos.
3. Depósitos: Facilita a realização de depósitos em conta, conforme necessário.

#### O fluxograma a seguir demonstra o funcionamento do sistema de login e autenticação:

![Fluxograma de autenticação de contas](fluxogramas/signin.drawio.png)


### Tela inicial

Esta tela exibe informações detalhadas do cliente, incluindo a agência à qual a conta pertence, o número da conta e o saldo atual. A partir desta tela, também é possível acessar funcionalidades como depósito e transferência de fundos.

#### Funcionalidades Principais:

##### Exibição de Informações:

1. Mostra a agência vinculada à conta do cliente.
2. Apresenta o número da conta do cliente.
3. Exibe o saldo atual disponível na conta.
 
##### Acesso às Telas de Operação:

1. Depósito: Permite ao cliente adicionar fundos à sua conta.
2. Transferência: Facilita a transferência de fundos entre contas.

##### Encerramento de Sessão:

1. Ao clicar no botão x, o usuário pode encerrar a sessão atual.
2. Isso implica na destruição da sessão específica do usuário no banco de dados.


#### O fluxograma a seguir mostra esta pagina:

![Fluxograma da página home](fluxogramas/Home.drawio.png)

## Garantia de atomicidade

Em um sistema distribuído, vários nós precisam trabalhar juntos para concluir várias tarefas. Caso isso não ocorra a risco de perda ou duplicidade de processos que nunca ou já aconteceram.

Two-phase commit é um protocolo que implementa atomicidade de transação em um sistema distribuído. Atomicidade significa que uma transação é totalmente executada ou não é executada, e não haverá execução parcial. Em um sistema distribuído, uma transação pode envolver vários nós, então um mecanismo é necessário para garantir que todos os nós confirmem a transação ou revertam a transação. Essa é a função do protocolo two-phase commit.

Para este projeto existiam duas operações cruciais onde era necessario garantir a atomicidade. São elas:

1. Depósito
2. Transação

### Possivel condição de corrida em depósito

##### Visão Geral
No nosso processo de depósito, existe um risco potencial de transações se sobreporem. Inicialmente, isso pode não parecer problemático, já que estamos apenas adicionando dinheiro a uma conta, sem retirar. No entanto, considere o seguinte cenário:

Você possui uma conta conjunta com sua esposa contendo 400 reais. Ao mesmo tempo, você está depositando 200 reais enquanto sua esposa está transferindo 100 reais. Imagine que no momento em que o seu processo de depósito confirma a adição de 200 reais (fazendo o seu saldo temporariamente 600 reais), a transação de retirada da sua esposa é concluída, retirando 100 reais da conta.

##### Resultado Esperado
O saldo final deveria ser logicamente 500 reais (400 reais de saldo inicial + 200 reais de depósito - 100 reais de retirada). No entanto, devido ao momento das transações, o saldo é erroneamente calculado como 600 reais porque o seu depósito foi processado antes que a transação de retirada da sua esposa fosse concluída.

##### Estratégia de Mitigação
Para lidar com esses cenários, é necessário implementar controles de concorrência ou mecanismos de bloqueio para garantir que as transações não interfiram umas com as outras. Isso assegura que os saldos sejam atualizados com precisão com base na sequência das transações.

Embora essa situação possa parecer específica e improvável, é crucial abordar possíveis condições de corrida para manter a integridade dos saldos das contas e das transações.

### O fluxograma a seguir mostra como o problema foi resolvido:

Para deposita só é necessario informar a conta e o valor a ser depositado. É importante salientar que o depósito só é realizado para contas do mesmo banco da conta que esta logada.

![Fluxograma da página de depósito](fluxogramas/deposit.drawio.png)


Este sistema utiliza duas variáveis de estado, `commit` e `locking`, para garantir que um depósito só seja realizado se a conta destino não estiver em processo de outra operação. A condição para o depósito ocorrer é que ambas as variáveis estejam nos estados `Inicial` e `Livre`, respectivamente.

Além disso, cada usuário possui um atributo `sudo` durante a operação, que é o identificador da pessoa autorizada a realizar alterações na conta específica.

#### Funcionamento do Sistema:

##### Loop de Transição de Estados:
O sistema gerencia a transição de estados passo a passo, verificando se cada etapa anterior foi concluída antes de permitir a sobrescrita.

#####  Controle de Bloqueio:
Um segundo loop é responsável pelo gerenciamento dos bloqueios de leitura e escrita. Apenas quando o bloqueio de escrita está ativo, o usuário com permissão (sudo) pode alterar o valor da conta.
Após a alteração, os bloqueios de leitura e escrita precisam ser desabilitados até que os estados voltem aos seus valores iniciais, liberando assim o usuário para outras operações.


### Possível Condição de Corrida em Transferências Bancárias:

##### Visão Geral
Em nosso sistema de transferências bancárias, existe um risco significativo de condições de corrida. Inicialmente, isso pode não parecer problemático, já que estamos movendo dinheiro entre contas. No entanto, considere o seguinte cenário:

Você possui 500 reais em sua conta e deseja transferir 200 reais para a conta A e 300 reais para a conta B simultaneamente. Sem um controle adequado, é possível que ambas as transações tentem usar os 500 reais como base inicial.

##### Resultado Esperado
O saldo final deveria ser logicamente 0 reais (500 reais iniciais - 200 reais para A - 300 reais para B). No entanto, devido à execução simultânea das transações sem controle de fluxo, pode ocorrer um problema. Por exemplo, 200 reais podem ser deduzidos corretamente para A, mas, devido à falta de atomicidade, os 300 reais podem ser deduzidos novamente do saldo inicial de 500 reais, resultando em um saldo final de 200 reais, ao invés de 0 reais.

##### Estratégia de Mitigação
Para evitar essa situação, é crucial implementar um mecanismo que garanta a atomicidade das transações. Isso significa que cada transferência deve ser tratada como uma operação única e indivisível. Um possível método é utilizar transações bancárias atômicas, onde todas as operações relacionadas (débitos e créditos) ocorrem como uma única unidade. Isso impede que o saldo seja comprometido por operações simultâneas e não coordenadas.

Neste caso, novamente usaremos as variáveis de estado. Porém, em vez de adicionarmos uma variável nova de super usuário a toda transação, como fizemos com o depósito, utilizaremos outra variável que já existe no cliente desde seu cadastro: a variável de atomicidade. Ela ficará responsável por guardar o valor para um possível rollback, já que desta vez estaremos tratando de transações entre diferentes bancos, cada um com sua respectiva API. 

Nos tópicos adiante serão mostrados cada passo que foi tomado para cada uma das etapas de transação

### Obtenção de contas de um mesmo usuário em difentes agências e gerenciamento das informações na pagina:

Um dos requisitos do problema era que fosse possível realizar transferências a partir de uma conta para qualquer outra conta que tivesse o mesmo CPF cadastrado.

Para isso, foi implementado que, assim que a página de transferência fosse carregada, ela enviaria uma requisição vazia para a API da sua agência. A partir disso, uma requisição seria feita para todas as outras agências com os dados daquela conta, buscando em seus próprios bancos de dados contas que possuam o mesmo CPF. A API então envia esses dados para um script no frontend, que exibe todos os números de conta em um dropdown. A partir daí, o usuário precisa apenas escolher na dropdown a conta desejada, que será a conta de origem de onde será retirado o valor a ser transferido. Em seguida, ele deve digitar manualmente a conta de destino, juntamente com o valor a ser transferido.

#### Gerenciamento de concorrência:

É possível adicionar múltiplas transações ao clicar no símbolo `+` ou excluí-las clicando no símbolo `x`. Essas transações múltiplas podem gerar concorrência, por isso foram configuradas para ocorrer sequencialmente. Ou seja, no caso de haver mais de uma transação, a próxima só será iniciada quando a anterior terminar. Isso é gerenciado pela API do banco, que envia as requisições uma por vez e só envia a próxima após receber a resposta de sucesso ou falha da transação anterior.

##### O fluxograma abaixo mostra a pagina de transação e suas requisições:

![Fluxograma da página de transação](fluxogramas/Pix-Process-Prepare.drawio.png)

A partir daí começarão as fases do two-phase-commit/locking onde os estados passarão sequencialmente a cada novo passo da transação bloqueando acesso para os outros usuarios e tornando o remetente em questão o unico que pode sobreescrever e acessar os dados do receptor e dele mesmo. 

### Fase de preparação

1. O remetente assume o papel de coordenador e envia uma mensagem de preparação para todos os participantes envolvidos na transação.
2. Cada participante responde indicando se está pronto para realizar a transação.
3. As duas rotas responsaveis por essa fase são a `/pix-execute` e `/pix-pre-commit`

#### Primeira verificação - Remetente e Receptor estão aptos a iniciar operação?

Essa é a fase que o remetente envia uma mensagem perguntando para o receptor se ele pode ou não se preparar para começar a operação. Você pode ver o processo no fluxograma abaixo:

![Fluxograma first-verify](fluxogramas/pix-execute.drawio.png)


#### Segunda verificação - Receptor permite o inicio do processo?

Nesta fase se a primeira verificação foi bem sucedia significa que o remetente e o receptor estão livres então o remetente pede para o receptor para iniciar uma transação com ele e não aceitar com nenhum outro processo até o final desta. Nesta fase tambem sera ultilizada as variaveis `transaction_balance` e `atomicity` como caches. Guardando respectivamente o valor do saldo alterado e o valor da transação em questão.
A variavel de transação assumirar o valor da variavel de valor real e tera seu valor alterado no lado do remetente garantindo que a variavel do valor real da conta não seja alterado até que os riscos de erro ou falha sejam minimos. 
Você pode ver o processo no fluxograma abaixo:

![Fluxograma second-verify](fluxogramas/pix-pre-commit.drawio.png)


### Fase de commit

Nesta fase, os valores serão devidamente alterados no remetente, e também o saldo a ser adicionado será enviado ao receptor. As variáveis `real_balance`, `transaction_balance` e `atomicity`serão usadas mais ativamente para gerenciar as sobrescritas e garantir que um rollback seja possível em caso de falha.

#### Verificação de envio

Aqui é onde a requisição com o valor será enviada para o receptor. Em caso de sucesso, ele enviará uma resposta confirmando que o valor foi recebido, o que fará com que o remetente atualize seu valor real para ser igual ao valor da transação. Você pode ver o processo no fluxograma abaixo:

![Fluxograma value-verify](fluxogramas/pix-commit.drawio.png)


#### Confirmação de transação completa

Aqui é onde o remetente confirma as alterações com o receptor e começa a liberar seus atributos para que novas alterações possam acontecer. Você pode ver o processo no fluxograma abaixo:

![Fluxograma complete](fluxogramas/pix-complete.drawio.png)

### Gerenciamento de bloqueios e sobrescritas do lado do receptor

O gerenciamento de todas as requisições feitas durante as transações é realizado por meio de uma rota chamada `/receive-message`. Sempre que o remetente faz uma solicitação, ele envia a requisição para esta rota, que contém várias condições para cada possível verificação ou requisição. Uma dessas condições é responsável pela terceira fase da transação, que é a fase de reversão.

#### Fase de reversão

sta fase pode ou não ocorrer. Em caso de falha em qualquer um dos processos das fases anteriores, esta etapa é chamada para reverter os dados ao estado anterior à transação, do lado do receptor. A solicitação deste rollback é responsabilidade do remetente, que após reverter seus dados, envia uma requisição para a rota `/receive-message`. Lá, é verificado se o valor real já foi alterado para desfazê-lo e liberar os bloqueios, além de zerar as variáveis de valor de transação e atomicidade.

#### Fluxograma da rota de gerencimanto de requisições ao receptor: 

![Fluxograma complete](fluxogramas/Receive.drawio.png)


## Possiveis melhorias futuras

1. Quedas durante a transação: Existe um caso em que se alguma requisição falhar e o remetente solicitar rollback e o receptor cair antes de receber essa mensagem de rollback ou simplismente não conseguir enviar a resposta, o receptor em questão ficara bloqueado. É algo que não consegui pensar em uma forma 100% efeitva de solucionar porém o remetente continuara apto a fazer transações.
2. Respostas ao usuario: O front-end carece de notificações, em alguns casos de manuseamento incorreto ele so não faz nada e a resposta so aprece no servidor mas não na pagina em si.









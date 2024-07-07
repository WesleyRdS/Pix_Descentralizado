# Transações Bancárias Distribuidas

## Introdução

Sistema distribuído para transações financeiras entre bancos pertencentes a um consórcio, semelhante ao sistema Pix, mas sem um banco central para coordenar as transações.
Para isso:
1. As contas bancárias são criadas de forma distribuída, o que significa que cada banco participante do sistema tem seu próprio conjunto de contas para seus clientes.
2. Transações atômicas garantem que uma série de operações seja executada como uma unidade indivisível. Isso significa que, se uma transação envolve mover dinheiro entre várias contas de diferentes bancos, ou mesmo dentro do mesmo banco, ela deve ser executada integralmente ou não ser executada.
3. Os bancos se comunicam para verificar e autorizar transações entre suas contas. Essa comunicação foi feita de modo que apenas transações válidas sejam processadas e que todas as partes envolvidas concordem com o estado final das transações.
4. O sistema garante que as contas não movimentem mais dinhero do que tem disponivel. Ele tambem evita duplo gasto garantindo a impossibilidade de um mesmo dinheiro ser usado mais de uma vez.

## Gerenciamento de contas
Para cada banco no consórcio, a criação de contas é gerenciada associando o IP do banco ao número da agência. Isso significa que cada banco é identificado por um IP específico que está ligado diretamente aos números das agências disponíveis.

### Formato dos Números de Conta

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

#### O fluxograma a seguir mostra as telas de cadastro
![Fluxograma de criação de novas contas](fluxogramas/SINGUP.png)




# Precificação, margem e ACoS

Taxas mudam e variam por categoria, faixa de preço e tamanho/peso. **Confirme sempre** na calculadora de receita do Seller Central ou na página de tarifas da categoria. Não use número de memória como se fosse oficial.

## Componentes do custo por unidade

| Componente | Onde achar |
|---|---|
| Comissão por venda (% do preço, às vezes com mínimo por item) | Tabela de tarifas da categoria no Seller Central |
| Tarifa de logística FBA (por tamanho/peso) | Calculadora de receita / tabela FBA |
| Armazenagem FBA (mensal, por volume; mais cara em estoque antigo) | Tabela FBA |
| Frete DBA ou envio próprio | Tabela DBA / contrato de transportadora |
| Taxa fixa por item (se aplicável na faixa de preço) | Tabela de tarifas |
| Imposto sobre a venda | Contador / regime da empresa |
| Custo do produto + embalagem + etiqueta + frete até o CD | Pessoa |
| Mensalidade do plano Profissional | Diluir pelo volume mensal |

## Fórmulas

```
receita_liquida      = preço − comissão − logística − taxa_fixa − imposto
margem_antes_ads     = receita_liquida − custo_total_produto
margem_%             = margem_antes_ads ÷ preço
ACoS_equilibrio      = margem_%                 (acima disso, cada venda por ads dá prejuízo)
ACoS_alvo_lucro      = margem_% − margem_minima_desejada
ACoS_alvo_lancamento = pode ficar perto ou um pouco acima do equilíbrio por tempo limitado, se o objetivo for ranquear
CPC_maximo           = preço × taxa_conversão × ACoS_alvo
```

Exemplo de leitura: preço R$ 100, margem antes de ads R$ 30 → ACoS de equilíbrio 30%. Querendo 10% de lucro líquido, ACoS-alvo = 20%. Com conversão de 10%, CPC máximo = 100 × 0,10 × 0,20 = R$ 2,00.

## Sinais de alerta

- Margem antes de ads < 15%: produto não sustenta campanha. Opções: kit, preço maior, custo menor, trocar FBA↔DBA, outro tamanho de embalagem (faixa de tarifa).
- Preço logo acima de um degrau de tarifa: às vezes R$ 1 a menos muda a faixa e melhora a margem — simule os dois.
- Produto pesado/volumoso: compare FBA x DBA x envio próprio antes de decidir.

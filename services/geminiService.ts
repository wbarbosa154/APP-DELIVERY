
import { GoogleGenAI, Type } from "@google/genai";
import { type Address, type CalculationResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        distancia_km: {
            type: Type.NUMBER,
            description: "Distância total da rota em quilômetros."
        },
        tempo_minutos: {
            type: Type.NUMBER,
            description: "Tempo total estimado da rota em minutos."
        },
        preco_estimado: {
            type: Type.NUMBER,
            description: "Preço final calculado para a entrega."
        },
        rota_mapa_url: {
            type: Type.STRING,
            description: "URL do Google Maps com a rota traçada entre todos os pontos."
        }
    },
    required: ["distancia_km", "tempo_minutos", "preco_estimado", "rota_mapa_url"]
};

export const calculateDelivery = async (
    addresses: Address[],
    includeReturn: boolean,
    organizeRoute: boolean
): Promise<CalculationResult> => {

    const formattedAddresses = addresses.map((addr, index) => `Ponto ${index + 1}: ${addr.value}`).join('\n');

    const prompt = `
    Você é um agente de logística avançado para a FastTrack Delivery. Sua principal função é calcular rotas de entrega com máxima precisão, utilizando dados de mapeamento em tempo real equivalentes ao Google Maps.

    Sua tarefa é calcular o custo de uma entrega com base nos endereços fornecidos e em regras de preço estritas. Primeiro, valide todos os endereços para garantir que são localizações reais e válidas. Em seguida, calcule a rota mais eficiente, a distância total e o tempo de percurso.

    **Endereços Fornecidos:**
    ${formattedAddresses}

    **Opções de Rota:**
    - **Incluir retorno ao Ponto 1:** ${includeReturn ? 'Sim' : 'Não'}
    - **Otimizar rota (menor caminho):** ${organizeRoute ? 'Sim' : 'Não'} (Se 'Sim', reordene os pontos 2 em diante para criar a rota mais curta, sempre começando no Ponto 1 e, se houver retorno, terminando no Ponto 1).

    **Regras de Preço (Aplicar Estritamente):**
    1.  **Custo por KM:** R$ 1,15/km.
    2.  **Taxa por Ponto de Parada:** R$ 2,00 por ponto. Esta taxa se aplica a todos os pontos a partir do 3º ponto (inclusive). O Ponto 1 (coleta) e o Ponto 2 (primeira entrega) não têm taxa.
    3.  **Acréscimo para Retorno:** Adicionar 60% sobre o valor total (calculado a partir da distância e das taxas de parada) se a opção de retorno for solicitada.
    4.  **Valor Mínimo da Corrida:** R$ 6,00. O preço final NUNCA pode ser inferior a R$ 6,00. Se o cálculo resultar em um valor menor, ajuste-o para R$ 6,00.

    **Formato da Resposta:**
    Sua resposta DEVE ser um objeto JSON válido, sem nenhuma formatação ou texto adicional, que corresponda EXATAMENTE ao schema fornecido.

    **Exemplo de Lógica de Cálculo de Preço:**
    - Rota de 3 pontos (A->B->C) com 15km, sem retorno:
        - Distância: 15 km * R$ 1,15 = R$ 17,25
        - Taxa de parada: 1 ponto extra (Ponto 3) * R$ 2,00 = R$ 2,00
        - Total: R$ 19,25
    - Mesma rota com retorno (A->B->C->A) com 25km:
        - Distância: 25 km * R$ 1,15 = R$ 28,75
        - Taxa de parada: 1 ponto extra (Ponto 3) * R$ 2,00 = R$ 2,00
        - Subtotal: R$ 30,75
        - Acréscimo de retorno: R$ 30,75 * 0.60 = R$ 18,45
        - Total: R$ 30,75 + R$ 18,45 = R$ 49,20

    Se algum endereço for inválido ou a rota não puder ser calculada, retorne um erro.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const resultText = response.text.trim();
        const resultJson = JSON.parse(resultText) as CalculationResult;

        // Ensure minimum price is applied
        if (resultJson.preco_estimado < 6.00) {
            resultJson.preco_estimado = 6.00;
        }

        return resultJson;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Não foi possível calcular a rota. Verifique os endereços e tente novamente.");
    }
};

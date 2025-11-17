import { GoogleGenAI, Type } from "@google/genai";
import { type Address, type CalculationResult, type Coordinates } from '../types';

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

const geocodeSchema = {
    type: Type.ARRAY,
    description: "Um array de coordenadas geocodificadas. A ordem deve corresponder aos endereços de entrada. Use null para endereços que não podem ser geocodificados.",
    items: {
        type: Type.OBJECT,
        properties: {
            lat: { type: Type.NUMBER, description: "Latitude do endereço." },
            lng: { type: Type.NUMBER, description: "Longitude do endereço." },
        }
    }
};


export const geocodeAddresses = async (addresses: string[]): Promise<(Coordinates | null)[]> => {
    if (addresses.every(addr => addr.trim() === '')) {
        return addresses.map(() => null);
    }

    const prompt = `
    Você é um serviço de geocodificação de alta precisão. Sua tarefa é converter uma lista de endereços em coordenadas geográficas (latitude e longitude).

    **Endereços para Geocodificar:**
    ${addresses.map((addr, i) => `${i + 1}. ${addr.trim() === '' ? '[VAZIO]' : addr}`).join('\n')}

    **Formato de Saída:**
    Sua resposta DEVE ser um array JSON válido onde CADA elemento corresponde a um endereço na lista fornecida, mantendo a ordem original.
    - Para um endereço válido e geocodificável, retorne um objeto: {"lat": 12.34, "lng": 56.78}.
    - Se um endereço for inválido, não puder ser encontrado ou estiver vazio, o elemento correspondente no array DEVE ser o literal JSON \`null\`.
    
    O array final deve ter exatamente ${addresses.length} elementos.
    `;

    let resultText = '';
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: geocodeSchema,
            },
        });

        resultText = response.text?.trim();

        if (!resultText) {
            console.warn("A API de geocodificação retornou uma resposta vazia. Retornando nulos.");
            return addresses.map(() => null);
        }

        const results = JSON.parse(resultText) as (Coordinates | null)[];

        if (!Array.isArray(results) || results.length !== addresses.length) {
            console.error("A contagem de resultados da geocodificação não corresponde. Retornando nulos.");
            return addresses.map(() => null);
        }
        
        return results;

    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error("Erro de sintaxe ao analisar a resposta JSON de geocodificação:", error, "Resposta recebida:", `"${resultText}"`);
        } else {
            console.error("Erro ao chamar a API Gemini para geocodificação:", error);
        }
        return addresses.map(() => null);
    }
};


export const calculateDelivery = async (
    addresses: Address[],
    orderNumber: string,
    includeReturn: boolean,
    scheduleType: 'now' | 'schedule'
): Promise<CalculationResult> => {

    const formattedAddresses = addresses.map((addr, index) => {
        const coordinateString = addr.coordinates ? ` (Lat: ${addr.coordinates.lat}, Lng: ${addr.coordinates.lng})` : '';
        return `Ponto ${index + 1}: ${addr.value}, ${addr.complement}\n  - Instruções: ${addr.instructions}${coordinateString}`;
    }).join('\n\n');


    const prompt = `
    Você é um agente de logística avançado para a FastTrack Delivery. Sua principal função é calcular rotas de entrega com máxima precisão, utilizando dados de mapeamento em tempo real equivalentes ao Google Maps e coordenadas geográficas quando fornecidas.

    Sua tarefa é calcular o custo de uma entrega com base nos endereços fornecidos e em regras de preço estritas. Primeiro, valide todos os endereços para garantir que são localizações reais e válidas. Em seguida, calcule a rota mais eficiente, a distância total e o tempo de percurso.

    **Número do Pedido/NF:** ${orderNumber || 'Não informado'}
    
    **Tipo de Agendamento:** ${scheduleType === 'now' ? 'Executar agora (Urgente)' : 'Agendado'}

    **Endereços e Tarefas Detalhadas:**
    ${formattedAddresses}

    **Opções de Rota:**
    - **Otimizar rota (menor caminho):** Sim (Sempre reordene os pontos 2 em diante para criar a rota mais curta, começando no Ponto 1).
    - **Incluir retorno ao Ponto 1:** ${includeReturn ? 'Sim' : 'Não'}.

    **Regras de Preço (Aplicar Estritamente):**
    1.  **Custo por KM (Escalonado):**
        - Para distâncias até 10 km, o custo é R$ 1,20 por km.
        - Para distâncias acima de 10 km, o custo é R$ 1,20/km para os primeiros 10 km, mais R$ 1,00 para cada km adicional.
    2.  **Taxa por Ponto de Parada:** R$ 2,00 por ponto. Esta taxa se aplica a todos os pontos a partir do 3º ponto (inclusive). O Ponto 1 (coleta) e o Ponto 2 (primeira entrega) não têm taxa.
    3.  **Taxa de Urgência:** Adicionar uma taxa fixa de R$ 3,00 ao valor total APENAS se o tipo de agendamento for 'Executar agora'. Não aplicar para entregas 'Agendado'.
    4.  **Valor Mínimo da Corrida:** R$ 7,00. O preço final NUNCA pode ser inferior a R$ 7,00. Se o cálculo (incluindo todas as taxas) resultar em um valor menor, ajuste-o para R$ 7,00.

    **Formato da Resposta:**
    Sua resposta DEVE ser um objeto JSON válido, sem nenhuma formatação ou texto adicional, que corresponda EXATAMENTE ao schema fornecido.

    Se algum endereço for inválido ou a rota não puder ser calculada, retorne um erro.
    `;
    
    let resultText = '';
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        resultText = response.text?.trim();
        
        if (!resultText) {
            throw new Error("A API de IA retornou uma resposta vazia, impedindo o cálculo.");
        }
        
        const resultJson = JSON.parse(resultText) as CalculationResult;

        // Ensure minimum price is applied
        if (resultJson.preco_estimado < 7.00) {
            resultJson.preco_estimado = 7.00;
        }

        return resultJson;

    } catch (error) {
         if (error instanceof SyntaxError) {
            console.error("Erro de sintaxe ao analisar a resposta JSON de cálculo:", error, "Resposta recebida:", `"${resultText}"`);
            throw new Error("Não foi possível processar a resposta da IA. Tente novamente.");
        }
        console.error("Erro ao chamar a API Gemini para cálculo:", error);
        throw new Error("Não foi possível calcular a rota. Verifique os endereços e tente novamente.");
    }
};

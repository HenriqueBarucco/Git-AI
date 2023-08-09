import { ChatOpenAI } from "langchain/chat_models/openai";
import { RetrievalQAChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";

import "dotenv/config";
import { redis, redisVectorStore } from "./redis-store";

const openAiChat = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    temperature: 0.3,
});

const prompt = new PromptTemplate({
    template: `
    Você responde perguntas sobre programação. Você é um programador.
    O usuário está adicionando funcionalidades e dando manutenção em um sistema.
    Use o conteúdo abaixo para responder as perguntas do usuário.
    Se a resposta não for encontrada, diga que não sabe.

    Se possivel, inclua exemplos de código.]

    Código:
    {context}

    Pergunta:
    {question}
    `.trim(),
    inputVariables: ["context", "question"],
});

const chain = RetrievalQAChain.fromLLM(
    openAiChat,
    redisVectorStore.asRetriever(),
    {
        prompt,
        returnSourceDocuments: false,
    }
);

async function main() {
    await redis.connect();

    const response = await chain.call({
        query: "Como que eu posso adicionar uma nova tela?",
    });

    console.log(response);

    await redis.disconnect();
}

main();

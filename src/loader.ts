import { GithubRepoLoader } from "langchain/document_loaders/web/github";
import { TokenTextSplitter } from "langchain/text_splitter";
import { RedisVectorStore } from "langchain/vectorstores/redis";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { createClient } from "redis";

import "dotenv/config";

const loader = new GithubRepoLoader(
    "https://github.com/HenriqueBarucco/My-Storage",
    { branch: "main", recursive: true, unknown: "warn" }
);

async function load() {
    const docs = await loader.load();

    const splitter = new TokenTextSplitter({
        encodingName: "cl100k_base",
        chunkSize: 600,
        chunkOverlap: 0,
    });

    const splittedDocuments = await splitter.splitDocuments(docs);

    const redis = createClient({
        url: "redis://localhost:6379",
    });

    await redis.connect();

    await RedisVectorStore.fromDocuments(
        splittedDocuments,
        new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        }),
        {
            indexName: "git-embeddings",
            redisClient: redis,
            keyPrefix: "git:",
        }
    );

    await redis.disconnect();
}

load();

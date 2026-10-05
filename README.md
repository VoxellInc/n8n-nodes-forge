# @voxell/n8n-nodes-forge

An [n8n](https://n8n.io) community node that adds **Voxell Forge** embeddings to your workflows.

[Forge](https://voxell.ai/forge) is Voxell's hosted text-embedding API. It has three tiers:
`turbo` (1024-d), `pro` (2560-d) and `ultra` (4096-d). This package ships an
**Embeddings sub-node** that plugs into n8n's Vector Store and Retriever nodes — anywhere you'd
normally use "Embeddings OpenAI."

## Install

n8n → **Settings → Community Nodes → Install** → `@voxell/n8n-nodes-forge`.

## Use

1. Add a credential: **Forge API** — paste your key (free at [dash.voxell.ai](https://dash.voxell.ai),
   no card). Base URL defaults to `https://api.voxell.ai`.
2. In a Vector Store node (e.g. In-Memory, Qdrant, Pinecone), set the **Embeddings** sub-node to
   **Embeddings Forge**.
3. Pick a **Model** — `turbo` / `pro` / `ultra` — and optionally a **Dimensions (MRL)** value to
   truncate (re-normalized) for smaller vectors. Use the same dimension for documents and queries.

Forge is asymmetric: the node embeds stored documents as `document` and search queries as `query`
automatically, for better retrieval.

## Models

| Model | Dim | Notes |
| ----- | --- | ----- |
| `turbo` | 1024 | fast, low-cost |
| `pro` | 2560 | higher quality; this node's default |
| `ultra` | 4096 | highest quality |

## Measured on public documents

On four public corpora, 7,817 documents and 980,885 passages in total, Voxell's retrieval pipeline
was asked 800 questions (200 per corpus) on 2026-10-05. The first result answers the question for
83% of them, and one of the top three results answers it for 90%. The right document is in the top
ten for 95%. The receipts are published at [voxell.ai/retrieval](https://voxell.ai/retrieval/).

By corpus:

| Corpus | Documents | First result answers the question | One of the top three answers it |
| ------ | --------- | --------------------------------- | ------------------------------- |
| SEC filings | 2,010 | 91% | 95% |
| USPTO patents | 4,008 | 86.5% | 91.5% |
| NASA technical reports | 1,210 | 67% | 78% |
| arXiv technical papers | 589 | 86.5% | 96% |
| All four | 7,817 | 83% | 90% |

Read these for what they are. The questions were written by a model from the documents and judged
against the passage text, which is easier than a test set written by people. The numbers describe
what Voxell's retrieval does on these corpora; they are not a comparison with any other vendor.
They measure the whole retrieval pipeline, not embeddings alone: after embedding, the pipeline
reranks the candidates and routes a question to the documents it names (the receipts page shows
the score after each step on SEC filings). This node gives a workflow the embedding step; the rest
of that pipeline is not part of it. Each receipt shows a sample of the questions with their
results, misses included.

## License

MIT © Voxell, Inc.

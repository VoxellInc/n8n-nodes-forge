import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { Embeddings, type EmbeddingsParams } from '@langchain/core/embeddings';

interface ForgeEmbeddingsParams extends EmbeddingsParams {
	baseUrl: string;
	apiKey: string;
	model: string;
	dim?: number;
}

/**
 * LangChain Embeddings backed by Forge's native /v1/embed endpoint.
 * Asymmetric: documents are embedded with input_type "document", queries with "query".
 */
class ForgeEmbeddings extends Embeddings {
	private baseUrl: string;
	private apiKey: string;
	private model: string;
	private dim?: number;

	constructor(p: ForgeEmbeddingsParams) {
		super(p);
		this.baseUrl = p.baseUrl.replace(/\/$/, '');
		this.apiKey = p.apiKey;
		this.model = p.model;
		this.dim = p.dim;
	}

	private async call(texts: string[], inputType: 'query' | 'document'): Promise<number[][]> {
		const res = await fetch(`${this.baseUrl}/v1/embed`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({
				texts,
				model: this.model,
				dim: this.dim,
				input_type: inputType,
			}),
		});
		if (!res.ok) {
			throw new Error(`Forge ${res.status}: ${await res.text()}`);
		}
		const data = (await res.json()) as {
			embeddings?: number[][];
			data?: Array<{ embedding: number[] }>;
		};
		// Accept native ({embeddings}) or OpenAI-compat ({data:[{embedding}]}) shapes.
		return data.embeddings ?? (data.data ?? []).map((d) => d.embedding);
	}

	async embedDocuments(documents: string[]): Promise<number[][]> {
		return this.call(documents, 'document');
	}

	async embedQuery(query: string): Promise<number[]> {
		return (await this.call([query], 'query'))[0];
	}
}

export class EmbeddingsForge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Embeddings Forge',
		name: 'embeddingsForge',
		icon: { light: 'file:forge.svg', dark: 'file:forge.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generate embeddings with Voxell Forge (turbo / pro / ultra)',
		defaults: { name: 'Embeddings Forge' },
		credentials: [{ name: 'forgeApi', required: true }],
		// Sub-node: no main input; outputs an AiEmbedding for vector-store / retriever nodes.
		inputs: [],
		outputs: [NodeConnectionTypes.AiEmbedding],
		outputNames: ['Embeddings'],
		codex: {
			categories: ['AI'],
			subcategories: { AI: ['Embeddings'] },
			resources: {
				primaryDocumentation: [{ url: 'https://voxell.ai/forge' }],
			},
		},
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				default: 'pro',
				options: [
					{ name: 'Turbo (1024d)', value: 'turbo' },
					{ name: 'Pro (2560d)', value: 'pro' },
					{ name: 'Ultra (4096d)', value: 'ultra' },
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Dimensions (MRL)',
						name: 'dim',
						type: 'number',
						default: 0,
						description:
							'Truncate vectors via Matryoshka (re-normalized). 0 = model default (turbo 1024 / pro 2560 / ultra 4096). Use the same dimension for documents and queries.',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('forgeApi');
		const model = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as { dim?: number };

		const dim = options.dim && options.dim > 0 ? options.dim : undefined;

		try {
			const embeddings = new ForgeEmbeddings({
				baseUrl: credentials.baseUrl as string,
				apiKey: credentials.apiKey as string,
				model,
				dim,
			});
			return { response: embeddings };
		} catch (error) {
			throw new NodeOperationError(
				this.getNode(),
				`Failed to initialize Forge embeddings: ${(error as Error).message}`,
			);
		}
	}
}

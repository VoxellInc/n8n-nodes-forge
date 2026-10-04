import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ForgeApi implements ICredentialType {
	name = 'forgeApi';

	displayName = 'Forge API';

	documentationUrl = 'https://voxell.ai/forge';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Forge API key (free at https://dash.voxell.ai)',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.voxell.ai',
			description: 'Forge API base URL',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: { Authorization: '=Bearer {{$credentials.apiKey}}' },
		},
	};

	// Validate the key with a tiny native embed call.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/embed',
			method: 'POST',
			body: { texts: ['ping'], model: 'turbo' },
		},
	};
}

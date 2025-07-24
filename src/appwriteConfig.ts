import { Client, Account } from 'appwrite';

const client = new Client();

client
    .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT as string) // Your Appwrite Endpoint
    .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID as string); // Your project ID

const account = new Account(client);

export { client, account };

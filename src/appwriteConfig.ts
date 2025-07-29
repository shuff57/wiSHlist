import { Client, Account, Databases } from 'appwrite';

export const client = new Client();

const endpoint = process.env.REACT_APP_APPWRITE_ENDPOINT;
const projectId = process.env.REACT_APP_APPWRITE_PROJECT_ID;

console.log('Appwrite Configuration:');
console.log('Endpoint:', endpoint);
console.log('Project ID:', projectId);

if (!endpoint || !projectId) {
    throw new Error('Missing Appwrite configuration. Please check your .env file and ensure REACT_APP_APPWRITE_ENDPOINT and REACT_APP_APPWRITE_PROJECT_ID are set.');
}

try {
    client
        .setEndpoint(endpoint)
        .setProject(projectId);
    console.log('Appwrite client configured successfully');
} catch (error) {
    console.error('Error configuring Appwrite client:', error);
    throw error;
}

export const account = new Account(client);
export const databases = new Databases(client);

// The new database and collection IDs
export const databaseId = '688189ad000ad6dd9410';
export const wishlistsCollectionId = '6882b76d00291718a514';
export const itemsCollectionId = '6882b8790034f4058a94';
export const usersCollectionId = '6883a8c90016dd267443';
export const invitesCollectionId = '6882c46c002e4d03f317';
export const suggestionsCollectionId = '6882cf3f003528f846bc';
export const feedbackCollectionId = '68895a6c000b4fe3fdc5';

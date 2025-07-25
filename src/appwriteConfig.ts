import { Client, Account, Databases } from 'appwrite';

export const client = new Client();

client
    .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT as string)
    .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID as string);

export const account = new Account(client);
export const databases = new Databases(client);

// The new database and collection IDs
export const databaseId = '688189ad000ad6dd9410';
export const wishlistsCollectionId = '6882b76d00291718a514';
export const itemsCollectionId = '6882b8790034f4058a94';
export const invitesCollectionId = '6882c46c002e4d03f317';
export const suggestionsCollectionId = '6882cf3f003528f846bc';

import { Client, Account, Databases } from 'appwrite';

export const client = new Client();

client
    .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT as string)
    .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID as string);

export const account = new Account(client);
export const databases = new Databases(client);

export const databaseId = '68817565002be84bc837';
export const invitesCollectionId = '688175940034cb25f71c';
export const usersCollectionId = '68818ebb000d555b5a94';

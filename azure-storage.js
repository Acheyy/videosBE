require('dotenv').config();
const { BlobServiceClient } = require('@azure/storage-blob');

const AZURE_STORAGE_CONNECTION_STRING = `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${process.env.AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

module.exports = {
  blobServiceClient,
};

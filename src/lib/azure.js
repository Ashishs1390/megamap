require('./parseEnv.js');

// const azure  = require('azure-storage');
const multer = require('multer')
// const inMemoryStorage = multer.memoryStorage();
// const uploadStrategy = multer({ storage: inMemoryStorage }).single('image');
// const getStream = require('into-stream');
// const ONE_MEGABYTE = 1024 * 1024;
// const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };
// const ONE_MINUTE = 60 * 1000;

const MulterAzureStorage = require('multer-azure-storage')

const storage = multer({
  storage: new MulterAzureStorage({
    azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: 'whiteboards',
    containerSecurity: 'blob'
  })
})

module.exports = storage

const functions = require('firebase-functions')
const app = require('express')()
const cors = require('cors')
const FBauth = require('./utils/fbAuth')

const { getAllEntries, postOneEntry, getEntry } = require('./handlers/entries')
const { signup, login } = require('./handlers/users')
const { getPrimaryFeelings, getFeeling, getAllFeelings } = require('./handlers/feelings')

// Automatically allow cross-origin requests
app.use(cors({ origin: true }))

// Entries routes
app.get('/entries', FBauth, getAllEntries)
app.get('/entry/:entryId', FBauth, getEntry)
app.post('/entry', FBauth, postOneEntry)
// todo: app.post('/entry/image', FBauth, uploadImage)
// todo entry details: app.get('/entry/id/details', FBauth, getEntryDetails)

// Users routes
app.post('/signup', signup)
app.post('/login', login)
// todo: update user first and lastname

// Feelings routes
app.get('/feelings', getAllFeelings)
app.get('/feelings/primary', getPrimaryFeelings)
app.get('/feeling/:feelingId', getFeeling)

exports.api = functions.region('europe-west3').https.onRequest(app)
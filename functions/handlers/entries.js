const { getAllFeelings } = require('./feelings')

const config = require('../utils/config')

const { db, admin } = require('../utils/admin')
const { reduceEntryDetails } = require('../utils/validators')

/**
 * Fetch one entry
 * @param request
 * @param response
 */
exports.getEntry = (request, response) => {
    let entryData = {}
    db.doc(`/entries/${request.params.entryId}`).get()
        .then(doc => {
            // Check if entry exists and it's one of current user's entry
            if (!doc.exists) return response.status(404).json({ error: 'Entry not found' })
            else if (doc.data().userId !== request.user.uid) return response.status(401).json({ error: 'Unauthorized' })

            db.doc(`/feelings/${doc.data().feelingId}`).get()
                .then(doc => {
                    return doc.data()
                })
                .then(feeling => {
                    entryData = doc.data()
                    entryData.feeling = feeling
                    entryData.entryId = doc.id
                    return response.json(entryData)
                })
                .catch(error => {
                    console.error(error)
                    return response.json.status(500).json({ error: error.code })
                })
        })
        .catch(error => {
            console.error(error)
            return response.json.status(500).json({ error: error.code })
        })
}

/**
 * Fetch all entries of the logged user
 *
 * todo refacto de mort
 *
 * @param request
 * @param response
 */
exports.getAllEntries = (request, response) => {
    const entries = []
    const feelings = []

    db.collection('entries')
        .where('userId', '==', request.user.uid)
        .orderBy('entryDate', 'desc')
        .get()
        .then(data => {
            data.forEach(doc => {
                const entryData = {
                    entryId: doc.id,
                    userId: doc.data().userId,
                    feelingId: doc.data().feelingId,
                    entryDate: doc.data().entryDate,
                    createdAt: doc.data().createdAt,
                    note: doc.data().note
                }
                entries.push(entryData)
            })
            return entries
            // return response.json(entries)
        })
        .then(() => {
            return db
                .collection('feelings')
                .get()
        })
        .then(data => {

            data.forEach(doc => {
                feelings.push({
                    feelingId: doc.id,
                    feelingName: doc.data().name
                })
            })

            return feelings
        })
        .then(() => {
            entries.forEach(entry => {
                entry.feeling = feelings.filter(feeling => feeling.feelingId === entry.feelingId)[0]
            })
            return response.json(entries)
        })
        .catch(error => console.error({ error: error }))
}

/**
 * Post one entry
 * If the entry already exists we update it
 * @param request
 * @param response
 */
exports.postOneEntry = (request, response) => {
    if (new Date(request.body.entryDate) > new Date()) return response.status(500).json({ error: 'Something went wrong' })

    const startDate = new Date(new Date(request.body.entryDate).setHours(0, 0, 0, 0))
    const endDate = new Date(new Date(request.body.entryDate).setHours(23, 59, 59, 999))

    db.collection('entries')
        .where('userId', '==', request.user.uid)
        .where('entryDate', '>', startDate.toISOString())
        .where('entryDate', '<', endDate.toISOString())
        .limit(1)
        .get()
        .then(data => {
            if (data.empty) {
                const newEntry = {
                    userId: request.user.uid,
                    feelingId: request.body.feelingId,
                    entryDate: request.body.entryDate,
                    createdAt: new Date().toISOString()
                }
                db.collection('entries').add(newEntry)
                    .then(doc => {
                        return response.json({ message: `Document ${doc.id} created successfully` })
                    })
                    .catch(error => {
                        console.error(error)
                        return response.status(500).json({ error: 'Something went wrong' })
                    })
            } else {
                db.doc(`/entries/${data.docs[0].id}`)
                    .update({
                        feelingId: request.body.feelingId,
                        updatedAt: new Date().toISOString()
                    })
                    .then(() => {
                        return response.json({ message: `Document ${data.docs[0].id} updated successfully` })
                    })
                    .catch(error => {
                        console.error(error)
                        return response.status(500).json({ error: 'Something went wrong' })
                    })
            }
        })
        .catch(error => {
            console.error(error)
            return response.json({ error: error.code })
        })
}

// Add entry details
// todo: pass the id of the entry to update in datatbase
exports.addEntryDetails = (request, response) => {
    db.doc(`/entries/${request.params.entryId}`).get()
        .then(doc => {
            if (!doc.exists) return response.status(404).json({ error: 'Entry not found' })
            else if (doc.data().userId !== request.user.uid) return response.status(401).json({ error: 'Unauthorized' })
        })

    const entryDetails = reduceEntryDetails(request.body)
    const entryId = request.params.entryId

    db.doc(`/entries/${entryId}`).update({
        ...entryDetails,
        updatedAt: new Date().toISOString()
    })
        .then(() => {
            return response.json({ message: 'Details added successfully' })
        })
        .catch(error => {
            console.error(error)
            return response.status(500).json({ error: error.code })
        })
}

// Get entry details
// todo: Get entry details
// exports.getEntryDetails= (request, response) => {}

// Upload an image to the entry
// todo: pass the id of the entry to update in datatbase
// todo: entry exists ?
/*exports.uploadImage = (request, response) => {
    const BusBoy = require('busboy')
    const path = require('path')
    const os = require('os')
    const fs = require('fs')

    const busboy = new BusBoy({ headers: request.headers })

    let imageFilename
    let imageToBeUploaded = {}

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') return response.status(400).json({ error: 'Wrong file type submitted' })

        const imageExtension = filename.split('.')[filename.split('.').length - 1]
        imageFilename = `${Math.round(Math.random() * 10000000)}.${imageExtension}`
        const filepath = path.join(os.tmpdir(), imageFilename)
        imageToBeUploaded = { filepath, mimetype }
        file.pipe(fs.createWriteStream(filepath))
    })
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
          .then(() => {
              const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFilename}?alt=media`
              return db.doc(`/entries/${ /!** entryID *!/}`).update({ imageUrl })
          })
          .then(() => {
              return response.json({ message: 'Image uploaded successfully' })
          })
          .catch(error => {
              console.error(error)
              response.status(500).json({ error: error.code })
          })
    })
    busboy.end(request.rawBody)
}*/


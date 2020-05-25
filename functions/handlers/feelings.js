const { db } = require('../utils/admin')

exports.getAllFeelings = (request, response) => {
    db.collection('feelings')
      .get()
      .then(data => {
          const feelings = []
          data.forEach(doc => {
              feelings.push({
                  feelingId: doc.id,
                  feelingName: doc.data().name
              })
          })
          return response.json(feelings)
      })
      .catch(error => {
          console.error(error)
      })
}

exports.getPrimaryFeelings = (request, response) => {
    db.collection('feelings')
      .where('primary', '==', true)
      .get()
      .then(data => {
          const feelings = []
          data.forEach(doc => {
              feelings.push({
                  feelingId: doc.id,
                  feelingName: doc.data().name
              })
          })
          return response.json(feelings)
      })
      .catch(error => console.error({ error: error.code }))
}

exports.getFeeling = (request, response) => {
    let feelingData = {}
    db.doc(`/feelings/${request.params.feelingId}`).get()
      .then(doc => {
          // Check if entry exists and it's one of current user's entry
          if (!doc.exists) return response.status(404).json({ error: 'Feeling not found' })

          feelingData = doc.data()
          return response.json(feelingData)
      })
      .catch(error => {
          console.error(error)
          return response.json.status(500).json({ error: error.code })
      })
}
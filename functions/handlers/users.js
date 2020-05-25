const { db } = require('../utils/admin')
const firebaseConfig = require('../utils/config')

const firebase = require('firebase')
firebase.initializeApp(firebaseConfig)

const { validateSignupData, validateLoginData } = require('../utils/validators')

/**
 * Signup a user
 * @param request
 * @param response
 * @returns {*}
 */
exports.signup = (request, response) => {
    const newUser = {
        email: request.body.email,
        firstName: request.body.firstName,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword
    }

    // Validate data
    const { valid, errors } = validateSignupData(newUser)
    if (!valid) return response.status(400).json(errors)

    firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
      .then(data => {
          const newUser = {
              firstName: request.body.firstName,
              lastName: '',
              createdAt: new Date().toISOString()
              // userId: data.user.uid
          }
          return db.doc(`/users/${data.user.uid}`).set(newUser)
      })
      .then(() => {
          return response.status(201).json({ message: `User signed up successfully` })
      })
      .catch(error => {
          console.error(error)
          if (error.code === 'auth/email-already-in-use') return response.status(400).json({ email: 'Email already in use' })
          return response.status(500).json({ general: 'Something went wrong' })
      })
}

/**
 * Log a user in
 * @param request
 * @param response
 * @returns {*}
 */
exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    }

    // Validate data
    const { valid, errors } = validateLoginData(user)
    if (!valid) return response.status(400).json(errors)

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
      .then(data => {
          return data.user.getIdToken()
      })
      .then(token => {
          return response.json({ token })
      })
      .catch(error => {
          console.error(error)
          return response.status(403).json({ general: 'Wrong credentials' })
      })
}
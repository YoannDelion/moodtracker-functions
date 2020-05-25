const isEmpty = string => {
    return string.trim() === ''
}

const isEmail = email => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return email.match(regex)
}

exports.validateSignupData = data => {
    const errors = {}
    if (isEmpty(data.email)) errors.email = 'Must not be empty'
    else if (!isEmail(data.email)) errors.email = 'Must be a valid email address'
    if (isEmpty(data.password)) errors.password = 'Must not be empty'
    if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords must match'
    if (isEmpty(data.firstName)) errors.firstName = 'Must not be empty'

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}

exports.validateLoginData = data => {
    const errors = {}

    if (isEmpty(data.email)) errors.email = 'Must not be empty'
    if (isEmpty(data.password)) errors.password = 'Must not be empty'

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}

exports.reduceEntryDetails = data => {
    const entryDetails = {}

    if(!isEmpty(data.note.trim())) entryDetails.note = data.note
    // todo: check each details property

    return entryDetails
}
const isEmpty = string => {
    return string.trim() === '';
};

const isEmail = email => {
    const regExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return !!email.match(regExp);
};

exports.validateAddContactData = data => {
    let errors = {};
    if (isEmpty(data.contactEmail)) {
        errors.contactEmail = 'Must no be empty'
    } else if (!isEmail(data.contactEmail)) {
        errors.contactEmail = 'Must be a valid email address'
    }
    if (isEmpty(data.contactName)) errors.contactName = 'Must no be empty';
    if (isEmpty(data.contactNo)) errors.contactNo = 'Must no be empty';
    if (isEmpty(data.password)) errors.password = 'Must no be empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
};

exports.validateLoginContact = data => {
    let errors = {};
    if (isEmpty(data.email)) errors.email = 'Must not be empty';
    if (isEmpty(data.password)) errors.password = 'Must not be empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
};

exports.reduceContactDetails = data => {
    let contactDetails = {};

    if (!isEmpty(data.contactInfo.trim())) contactDetails.contactInfo = data.contactInfo;
    if (!isEmpty(data.contactNo.trim())) contactDetails.contactNo = data.contactNo;
    if (!isEmpty(data.website.trim())) {
        if (data.website.trim().substring(0, 4) !== 'http') {
            contactDetails.website = `http://${data.website.trim()}`
        } else contactDetails.website = data.website
    }
    if (!isEmpty(data.location.trim())) contactDetails.location = data.location;
    return contactDetails;
};

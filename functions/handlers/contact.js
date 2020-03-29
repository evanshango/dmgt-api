const {admin, database} = require('../util/admin');
const config = require('../util/config');
const firebase = require('firebase');
firebase.initializeApp(config);
const {validateAddContactData, validateLoginContact, reduceContactDetails} = require('../util/validators');

exports.getContact = (req, res) => {
    let contactData = {};
    database.doc(`/contacts/${req.user.uid}`).get().then(doc => {
        if (!doc.exists){
            return res.status(404).json({error: 'Contact not found'})
        }
        contactData.credentials = doc.data();
        return res.json(contactData);
    })
};

exports.getContacts = (req, res) => {
    database.collection('contacts').get().then(data => {
        let contacts = [];
        data.forEach(doc => {
            contacts.push({
                id: doc.data().contactId,
                email: doc.data().contactEmail
            });
        });
        return res.json(contacts);
    }).catch(err => {
        console.error(err);
        return res.status(500).json({message: 'Unable to fetch contacts'})
    })
};

exports.addContact = (req, res) => {
    const newContact = {
        contactEmail: req.body.contactEmail,
        contactName: req.body.contactName,
        contactNo: req.body.contactNo,
        password: req.body.password
    };

    const {valid, errors} = validateAddContactData(newContact);
    if (!valid) return res.status(400).json(errors);
    const noImg = 'avatar.png';
    let accessToken, contactId;
    database.doc(`/contacts/${newContact.contactName}`).get().then(doc => {
        if (doc.exists) {
            return res.status(400).json({contactName: 'is already taken'})
        } else {
            return firebase.auth().createUserWithEmailAndPassword(newContact.contactEmail, newContact.password);
        }
    }).then(data => {
        contactId = data.user.uid;
        return data.user.getIdToken();
    }).then(token => {
        accessToken = token;
        const contactDetails = {
            contactId: contactId,
            contactEmail: newContact.contactEmail,
            contactName: newContact.contactName,
            contactNo: newContact.contactNo,
            contactInfo: "Our organization is dedicated to serve everyone without considering ones status in the " +
                "society, therefore, we are here to assist anywhere we can",
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
            regDate: new Date().toISOString(),
        };
        return database.doc(`/contacts/${contactId}`).set(contactDetails);
    }).then(() => {
        return res.status(201).json({token: accessToken});
    }).catch(err => {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
            return res.status(400).json({email: 'Already in use'})
        } else {
            return res.status(500).json({error: err.code})
        }
    })
};

exports.loginContact = (req, res) => {
    const contact = {
        email: req.body.email,
        password: req.body.password
    };
    const {valid, errors} = validateLoginContact(contact);
    if (!valid) return res.status(400).json(errors);

    let contactId;
    firebase.auth().signInWithEmailAndPassword(contact.email, contact.password).then(data => {
        contactId = data.user.uid;
        return data.user.getIdToken();
    }).then(token => {
        let contact = {};
        contact.contactId = contactId;
        contact.token = token;
        return res.json(contact);
    }).catch(err => {
        console.log(err);
        if (err.code === 'auth/wrong-password') {
            return res.status(403).json({general: 'Wrong credentials. Please try again'})
        } else if (err.code === 'auth/user-not-found') {
            return res.status(403).json({email: 'User no found'})
        } else return res.status(500).json({error: err.code})
    })
};

exports.addContactDetails = (req, res) => {
    let contactDetails = reduceContactDetails(req.body);
    database.doc(`/contacts/${req.user.uid}`).update(contactDetails).then(() => {
        return res.json({message: 'Contact details updated successfully'})
    }).catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code})
    })
};

exports.contactImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({headers: req.headers});
    let imageFilename;
    let imageToBeUploaded = {};
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({error: 'Wrong file type submitted'});
        }
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFilename = `${Math.round(Math.random() * 100000000000)}.${imageExtension}`;
        const filePath = path.join(os.tmpdir(), imageFilename);
        imageToBeUploaded = {filePath, mimetype};
        file.pipe(fs.createWriteStream(filePath));
    });
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filePath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        }).then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFilename}?alt=media`;
            return database.doc(`/contacts/${req.user.uid}`).update({imageUrl});
        }).then(() => {
            return res.json({message: 'Image uploaded successfully'})
        }).catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        })
    });
    busboy.end(req.rawBody);
};

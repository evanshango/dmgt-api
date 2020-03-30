const {admin, database} = require('../util/admin');
const config = require('../util/config');
const firebase = require('firebase');
firebase.initializeApp(config);
const {validateAddContactData, validateLoginContact, reduceContactDetails} = require('../util/validators');

exports.getContact = (req, res) => {
    let contactData = {};
    database.doc(`/contacts/${req.user.uid}`).get().then(doc => {
        if (!doc.exists) {
            return res.status(404).json({error: 'Contact not found'})
        }
        contactData.credentials = doc.data();
        return res.json(contactData);
    })
};

exports.getAdmin = (req, res) => {
    let adminData = {};
    database.doc(`/admins/${req.user.uid}`).get().then(doc => {
        if (!doc.exists) {
            return res.status(404).json({error: 'Contact not found'})
        }
        adminData.adminId = doc.data().adminId;
        adminData.name = doc.data().adminName;
        adminData.email = doc.data().adminEmail;
        adminData.regDate = doc.data().regDate;
        adminData.admin = true;
        return res.json({credentials: adminData});
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
    let contactDetails = {};
    database.doc(`/contacts/${newContact.contactEmail}`).get().then(doc => {
        if (doc.exists) {
            return res.status(400).json({contactEmail: 'is already taken'})
        } else {
            return firebase.auth().createUserWithEmailAndPassword(newContact.contactEmail, newContact.password);
        }
    }).then(data => {
        contactDetails.contactId = data.user.uid;
        contactDetails.contactEmail = newContact.contactEmail;
        contactDetails.contactName = newContact.contactName;
        contactDetails.contactNo = newContact.contactNo;
        contactDetails.contactInfo = "Our organization is dedicated to serve everyone without considering ones status" +
            " in the " + "society, therefore, we are here to assist anywhere we can";
        contactDetails.imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`;
        contactDetails.regDate = new Date().toISOString();
        return database.doc(`/contacts/${data.user.uid}`).set(contactDetails);
    }).then(() => {
        return res.status(201).json(contactDetails);
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

exports.addAdmin = (req, res) => {
    const newAdmin = {
        adminEmail: req.body.adminEmail,
        adminName: req.body.adminName,
        password: req.body.password
    };
    const isEmpty = string => {
        return string.trim() === '';
    };
    if (isEmpty(newAdmin.adminEmail) || isEmpty(newAdmin.adminName) || isEmpty(newAdmin.password)) {
        return res.status(500).json({general: 'All fields are required'})
    } else {
        database.doc(`/admins/${newAdmin.adminEmail}`).get().then(doc => {
            if (doc.exists) {
                return res.status(400).json({adminEmail: 'is already taken'})
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newAdmin.adminEmail, newAdmin.password);
            }
        }).then(data => {
            const adminDetails = {
                adminId: data.user.uid,
                adminEmail: newAdmin.adminEmail,
                adminName: newAdmin.adminName,
                regDate: new Date().toISOString(),
            };
            return database.doc(`/admins/${data.user.uid}`).set(adminDetails);
        }).then(() => {
            return res.status(201).json({message: 'Admin added successfully'});
        }).catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({email: 'Already in use'})
            } else {
                return res.status(500).json({error: err.code})
            }
        })
    }
};

exports.loginAdmin = (req, res) => {
    const admin = {
        email: req.body.email,
        password: req.body.password
    };
    const {valid, errors} = validateLoginContact(admin);
    if (!valid) return res.status(400).json(errors);

    let adminId;
    firebase.auth().signInWithEmailAndPassword(admin.email, admin.password).then(data => {
        adminId = data.user.uid;
        return data.user.getIdToken();
    }).then(token => {
        let admin = {};
        admin.adminId = adminId;
        admin.token = token;
        return res.json(admin);
    }).catch(err => {
        console.log(err);
        if (err.code === 'auth/wrong-password') {
            return res.status(403).json({general: 'Wrong credentials. Please try again'})
        } else if (err.code === 'auth/user-not-found') {
            return res.status(403).json({email: 'User no found'})
        } else return res.status(500).json({error: err.code})
    })
};

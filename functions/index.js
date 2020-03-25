const functions = require('firebase-functions');
const app = require('express')();
const firebaseAuth = require('./util/fbAuth');
const {database} = require('./util/admin');
const cors = require('cors');
app.use(cors());

const {getAllIncidents, unresolved, getIncident} = require('./handlers/incident');
const {getAllUsers} = require('./handlers/user');
const {addContact, loginContact, contactImage, addContactDetails, getContact} = require('./handlers/contact');
const {dispatchHelp} = require('./handlers/dispatchHelp');

//Incidents routes
app.get('/incidents', getAllIncidents);
app.get('/unresolved', firebaseAuth, unresolved);
app.get('/incident/:incidentId', firebaseAuth, getIncident);
//Fetch all Users
app.get('/users', getAllUsers);
//Dispatch Assistance
app.get('/incident/:incidentId/dispatch/help', firebaseAuth, dispatchHelp);
//Contact routes
app.post('/new/contact', addContact);
app.post('/login', loginContact);
app.post('/contact/image', firebaseAuth, contactImage);
app.post('/contact/details', firebaseAuth, addContactDetails);
app.get('/contact/:contactId', getContact);

exports.api = functions.https.onRequest(app);

exports.incidentAdded = functions.region('us-central1').firestore.document('incidents/{incidentId}').onCreate(
    snapshot => {
        let notifications = [];
        database.collection('users').get().then(usersDoc => {
            database.doc(`/users/${snapshot.data().userId}`).get().then(doc => {
                if (doc.exists) {
                    usersDoc.forEach(userDoc => {
                        notifications.push({
                            createdAt: new Date().toISOString(),
                            sender: doc.data().username,
                            receiver: userDoc.data().userId,
                            read: false,
                            incidentId: doc.id
                        });
                    });
                    let notification = {};
                    notifications.forEach(doc => {
                        notification = doc;
                        return database.doc(`/notifications/${doc.receiver}`).set(notification)
                    })
                } else {
                    console.log('does not exist')
                }
            })
        }).catch(err => {
            console.log(err)
        }).then(() => {
            console.log('finished')
        }).catch(err => {
            console.error(err);
        });
    });

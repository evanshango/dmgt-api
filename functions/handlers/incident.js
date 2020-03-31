const {database} = require('../util/admin');

exports.getAllIncidents = (req, res) => {
    database.collection("incidents").orderBy('time', 'desc').get().then(data => {
        loopThroughData(res, data)
    }).catch(error => console.error(error))
};

exports.unresolved = (req, res) => {
    const incidentDoc = database.collection('incidents').where('resolved', '==', false);
    incidentDoc.orderBy('time', 'desc').get().then(data => {
        loopThroughData(res, data)
    }).catch(error => console.error(error))
};

exports.getIncident = (req, res) => {
    let incident = {};
    database.doc(`/incidents/${req.params.incidentId}`).get().then(doc => {
        if (!doc.exists){
            return res.status(404).json({error: 'Incident not found'})
        }
        incident = {
            incidentId: doc.data().incidentId,
            category: doc.data().category,
            description: doc.data().description,
            geoPoint: doc.data().geoPoint,
            imageUrl: doc.data().imageUrl,
            date: doc.data().date,
            time: doc.data().time,
            userId: doc.data().userId
        };
        return res.json(incident)
    }).catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code})
    })
};

exports.markNotificationsRead = (req, res) => {

};

const loopThroughData = (res, data) => {
    let incidents = [];
    data.forEach(doc => {
        incidents.push({
            incidentId: doc.data().incidentId,
            category: doc.data().category,
            description: doc.data().description,
            geoPoint: doc.data().geoPoint,
            imageUrl: doc.data().imageUrl,
            date: doc.data().date,
            resolved: doc.data().resolved,
            time: doc.data().time,
            userId: doc.data().userId
        });
    });
    return res.json(incidents);
};

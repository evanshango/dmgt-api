const {database} = require('../util/admin');

exports.dispatchHelp = (req, res) => {
    const incident = database.doc(`/incidents/${req.params.incidentId}`);
    let incidentData;
    incident.get().then(doc => {
        if (doc.exists){
            incidentData = doc.data();
        } else {
            return res.status(404).json({error: 'Incident not found'})
        }
    }).then(() => {
        if (incidentData.resolved){
            return res.status(500).json({message: 'Incident is being resolved'})
        } else {
            let resolveData = {};
            resolveData.incidentId = incidentData.incidentId;
            resolveData.incidentCategory = incidentData.category;
            resolveData.contactName = req.user.contactName;
            resolveData.geoPoint = incidentData.geoPoint;
            resolveData.resolveDate = new Date().toISOString();
            return database.collection('resolved').add(resolveData).then(() => {
                return incident.update({resolved: true})
            }).then(() => {
                return res.json({message: 'Help dispatched'})
            }).catch(err => {
                console.error(err);
                return res.status(500).json({error: err.code})
            })
        }
    })
};

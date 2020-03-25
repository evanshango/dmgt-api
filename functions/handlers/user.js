const {database} = require('../util/admin');

exports.getAllUsers = (req, res) => {
    database.collection("userLocation").orderBy('timestamp', 'desc').get().then(data => {
        let userLocations = [];
        data.forEach(doc => {
            let timestamp = doc.data().timestamp;
            let seconds = timestamp._seconds;
            let nanoseconds = timestamp._nanoseconds;
            let formattedDate = new Date((seconds * 1000) + (nanoseconds / 1000000));
            userLocations.push({
                geoPoint: doc.data().geoPoint,
                timestamp: formattedDate,
                user: doc.data().user
            });
        });
        return res.json(userLocations);
    }).catch(error => console.error(error))
};

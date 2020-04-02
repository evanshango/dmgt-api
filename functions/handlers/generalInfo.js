const {database} = require('../util/admin');
const {disasterBody, educationBody, medicalInfo, firstAidBody} = require('../util/validators');

exports.fetchGeneralInfo = (req, res) => {
    database.collection('generalInfo').get().then(data => {
        let generalInfo = [];
        data.forEach(doc => {
            generalInfo.push({
                infoId: doc.data().infoId,
                infoType: doc.data().infoType
            })
        });
        return res.json(generalInfo)
    }).catch(err => console.log(err))
};

exports.addGeneralInfo = (req, res) => {
    if (req.body.name !== ''){
        let disasterInfo = disasterBody(req.body);
        let medicalInfoBody = medicalInfo(req.body);
        let educationInfo = educationBody(req.body);
        let firstAidInfo = firstAidBody(req.body);
        database.doc(`/generalInfo/${req.params.infoId}`).get().then(doc => {
            let infoId = req.params.infoId;
            if (doc.data().infoType === 'Disasters') {
                addDisaster(disasterInfo, res, req, infoId)
            } else if (doc.data().infoType === 'Medical Service') {
                addMedicalInfo(medicalInfoBody, res, req, infoId)
            } else if (doc.data().infoType === 'Educational') {
                addEducationalInfo(educationInfo, res, req, infoId)
            } else if (doc.data().infoType === 'First Aid') {
                addFirstAidInfo(firstAidInfo, res, req, infoId)
            } else {
                return res.status(404).json({general: 'Not found'})
            }
        }).catch(err => console.log(err));
    } else {
        return res.status(500).json({name: 'Cannot be empty'})
    }
};

exports.getSpecificInfoData = (req, res) => {
    database.doc(`/generalInfo/${req.params.infoId}`).get().then(doc => {
        let infoId = req.params.infoId;
        if (doc.data().infoType === 'Disasters') {
            getDisasters(infoId, res)
        } else if (doc.data().infoType === 'Medical Service') {
            getMedicalInfo(infoId, res)
        } else if (doc.data().infoType === 'Educational') {
            getEducationalInfo(infoId, res)
        } else if (doc.data().infoType === 'First Aid') {
            getFirstAidInfo(infoId, res)
        } else {
            return res.status(404).json({general: 'Not found'})
        }
    }).catch(err => console.log(err));
};

function addFirstAidInfo(firstAidInfo, res, req, infoId) {
    let firstAidData = {};
    let aidId = database.collection('firstAid').doc().id;
    firstAidData.id = aidId;
    firstAidData.name = firstAidInfo.name;
    firstAidData.aidInfo = req.body.aidInfo;
    database.doc(`/generalInfo/${infoId}/firstAid/${aidId}`).set(firstAidData).then(() => {
        return res.json(firstAidData)
    })
}

function addMedicalInfo(medicalInfoBody, res, req, infoId) {
    let medicalData = {};
    let medicalId = database.collection('medicalServices').doc().id;
    database.collection('generalInfo').doc(infoId).collection('medicalServices')
        .where('name', '==', medicalInfoBody.name).limit(1).get().then(doc => {
        if (!doc.empty) {
            res.status(500).json({general: 'Already added'})
        } else {
            medicalData.id = medicalId;
            medicalData.name = medicalInfoBody.name;
            medicalData.hotline = req.body.hotline;
            database.doc(`/generalInfo/${infoId}/medicalServices/${medicalId}`).set(medicalData).then(() => {
                return res.json(medicalData)
            })
        }
    }).catch(err => {
        return res.json({error: err})
    })
}

function addEducationalInfo(educationInfo, res, req, infoId) {
    let educationData = {};
    let generalId = database.collection('education').doc().id;
    educationData.id = generalId;
    educationData.name = educationInfo.name;
    educationData.extraInfo = req.body.extraInfo;
    database.doc(`/generalInfo/${infoId}/education/${generalId}`).set(educationData).then(() => {
        return res.json(educationData)
    })
}

function addDisaster(disasterInfo, res, req, infoId) {
    let disasterData = {};
    let disasterId = database.collection('disasters').doc().id;
    database.collection('generalInfo').doc(infoId).collection('disasters')
        .where('name', '==', disasterInfo.name).limit(1).get().then(doc => {
        if (!doc.empty) {
            res.status(500).json({general: 'Already added'})
        } else {
            disasterData.id = disasterId;
            disasterData.name = disasterInfo.name;
            disasterData.category = req.body.category;
            database.doc(`/generalInfo/${infoId}/disasters/${disasterId}`).set(disasterData).then(() => {
                return res.json(disasterData)
            })
        }
    });
}

function getDisasters(infoId, res) {
    let disasters = [];
    database.doc(`/generalInfo/${infoId}`).collection('disasters').get().then(data => {
        data.forEach(doc => {
            disasters.push({
                disasterId: doc.data().id,
                disasterName: doc.data().name,
                category: doc.data().category
            })
        });
        return res.status(200).json({items: disasters})
    })
}

function getEducationalInfo(infoId, res) {
    let educationalInfo = [];
    database.doc(`/generalInfo/${infoId}`).collection('education').get().then(data => {
        data.forEach(doc => {
            educationalInfo.push({
                infoId: doc.data().id,
                infoName: doc.data().name,
                extraInfo: doc.data().extraInfo
            })
        });
        return res.status(200).json({items: educationalInfo})
    })
}

function getMedicalInfo(infoId, res) {
    let medicalInfo = [];
    database.doc(`/generalInfo/${infoId}`).collection('medicalServices').get().then(data => {
        data.forEach(doc => {
            medicalInfo.push({
                id: doc.data().id,
                name: doc.data().name,
                hotline: doc.data().hotline
            })
        });
        return res.status(200).json({items: medicalInfo})
    })
}

function getFirstAidInfo(infoId, res) {
    let firstAidInfo = [];
    database.doc(`/generalInfo/${infoId}`).collection('firstAid').get().then(data => {
        data.forEach(doc => {
            firstAidInfo.push({
                infoId: doc.data().id,
                infoName: doc.data().name,
                aidInfo: doc.data().aidInfo
            })
        });
        return res.status(200).json({items: firstAidInfo})
    })
}


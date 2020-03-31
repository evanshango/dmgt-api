const {database} = require('../util/admin');
const {disasterBody, educationBody, medicalInfo, firstAidBody} = require('../util/validators');
let response = {};
/**@namespace req.params.infoId **/
exports.fetchGeneralInfo = (req, res) => {
    database.collection('generalInfo').get().then(data => {
        let generalInfo = [];
        data.forEach(doc => {
            generalInfo.push(doc.data())
        });
        return res.json(generalInfo)
    }).catch(err => console.log(err))
};

exports.addGeneralInfo = (req, res) => {
    let disasterInfo = disasterBody(req.body);
    let medicalInfoBody = medicalInfo(req.body);
    let educationInfo = educationBody(req.body);
    let firstAidInfo = firstAidBody(req.body);
    checkInfoIds(req.params.infoId).then(() => {
        if (response.type === 'disaster') {
            addDisaster(disasterInfo, res, req)
        } else if (response.type === 'medical') {
            addMedicalInfo(medicalInfoBody, res, req)
        } else if (response.type === 'educational') {
            addEducationalInfo(educationInfo, res, req)
        } else if (response.type === 'aid') {
            addFirstAidInfo(firstAidInfo, res, req)
        } else {
            console.log("Nothing to add")
        }
    })
};

function addFirstAidInfo(educationInfo, res, req) {
    let firstAidData = {};
    let aidId = database.collection('firstAid').doc().id;
    firstAidData.id = aidId;
    firstAidData.name = educationInfo.name;
    firstAidData.aidInfo = req.body.aidInfo;
    database.doc(`/firstAid/${aidId}`).set(firstAidData).then(() => {
        return res.json(firstAidData)
    })
}

function addMedicalInfo(medicalInfoBody, res, req) {
    let medicalData = {};
    let medicalId = database.collection('medicalServices').doc().id;
    database.collection('medicalServices').where('name', '==', medicalInfoBody.name).limit(1).get().then(doc => {
        if (!doc.empty) {
            res.status(500).json({general: 'Already added'})
        } else {
            medicalData.id = medicalId;
            medicalData.name = medicalInfoBody.name;
            medicalData.hotline = req.body.hotline;
            database.doc(`/medicalServices/${medicalId}`).set(medicalData).then(() => {
                return res.json(medicalData)
            })
        }
    }).catch(err => {
        return res.json({error: err})
    })
}

function addEducationalInfo(educationInfo, res, req) {
    let educationData = {};
    let generalId = database.collection('education').doc().id;
    educationData.id = generalId;
    educationData.name = educationInfo.name;
    educationData.extraInfo = req.body.extraInfo;
    database.doc(`/education/${generalId}`).set(educationData).then(() => {
        return res.json(educationData)
    })
}

function addDisaster(disasterInfo, res, req) {
    let disasterData = {};
    let disasterId = database.collection('disasters').doc().id;
    database.collection('disasters').where('name', '==', disasterInfo.name).limit(1).get().then(doc => {
        if (!doc.empty) {
            res.status(500).json({general: 'Already added'})
        } else {
            disasterData.id = disasterId;
            disasterData.name = disasterBody.name;
            disasterData.category = req.body.category;
            database.doc(`/disasters/${disasterId}`).set(disasterData).then(() => {
                return res.json(disasterData)
            })
        }
    });
}

const checkInfoIds = infoId => {
    return database.doc(`/generalInfo/${infoId}`).get().then(doc => {
        if (doc.data().infoType === 'Disasters') {
            response.type = 'disaster';
        } else if (doc.data().infoType === 'Medical Service') {
            response.type = 'medical'
        } else if (doc.data().infoType === 'Educational') {
            response.type = 'educational'
        } else if (doc.data().infoType === 'First Aid') {
            response.type = 'aid'
        }
    }).catch(err => console.log(err));
};

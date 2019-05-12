exports.handler = async(event) => {

//     console.info(event);

    let resourses = {};

    let responseBody = {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Resources": resourses
    };

    let ltv = event['LaunchTemplateVersions'];

    if (ltv) {

        let len = ltv.length;
        for (let i = 0; i < len; i++) {
            launchTemplateVersions(resourses, ltv[i]);
        }
    }

    let responseCode = 200;

    let response = {
        statusCode: responseCode,

        //        body: JSON.stringify(responseBody)
        body: responseBody
    };
//     console.log("response: " + JSON.stringify(response))
    return response;
};

function safeName(name) {

    let tmpName = name
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1));

    return tmpName;
}

function b64Value(b64) {

    let buff = new Buffer(b64, 'base64');
    let text = buff.toString('ascii');

    let joinObj = {
        "Fn::Join": ["\n", text.split('\n')]
    };

    let obj = { "Fn::Base64": joinObj };

    return obj;
}

function launchTemplateVersions(resources, ltv) {

    if (ltv.DefaultVersion) {

        let item = {};
        item.Type = "AWS::EC2::LaunchTemplate";
        item.Properties = {};
        item.Properties.LaunchTemplateName = ltv.LaunchTemplateName;

        item.Properties.LaunchTemplateData = ltv.LaunchTemplateData;
        item.Properties.LaunchTemplateData.UserData = b64Value(ltv.LaunchTemplateData.UserData);

        resources['LaunchTemplate' + safeName(ltv.LaunchTemplateName)] = item;
    }
}

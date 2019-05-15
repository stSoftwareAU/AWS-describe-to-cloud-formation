exports.handler = async(event) => {

    console.info(event);

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
    let lsg=event['SecurityGroups'];
    if( lsg)
    {
        let len = lsg.length;
        for (let i = 0; i < len; i++) {
            securityGroup(resourses, lsg[i]);
        }
    }

    let responseCode = 200;

    let response = {
        statusCode: responseCode,

        //        body: JSON.stringify(responseBody)
        body: responseBody
    };
    console.log("response: " + JSON.stringify(response))
    return response;
};

function safeName(name) {

    let tmpName = name.replace(/[^a-zA-Z0-9]/g, " ");
    tmpName=tmpName
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join('');

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
let sgCount=0;
function securityGroup(resources, sg) {

    let sgName="sg" + sgCount++;
    
    let item = {};
    item.Type = "AWS::EC2::SecurityGroup";
    item.Properties = {};

    if( sg.GroupName)
    {
        sgName=sg.GroupName;
        item.Properties.GroupName=sg.GroupName;
    }
    if( sg.Description)
    {
        item.Properties.GroupDescription=sg.Description;
    }

    item.Properties.VpcId=sg.VpcId;    
    if( sg.IpPermissions)
    {
        let len = sg.IpPermissions.length;
        let arr=[];
        item.Properties.SecurityGroupIngress=arr;
        for( let i=0;i<len; i++)
        {
            let ipPermission=sg.IpPermissions[i];
            
            let rangeCount=ipPermission.IpRanges.length;
            
            for( let r=0;r < rangeCount;r++)
            {
                let ipRange=ipPermission.IpRanges[r];
                
                let item={};
                item.IpProtocol=ipPermission.IpProtocol;
                item.FromPort=ipPermission.FromPort;
                item.ToPort=ipPermission.ToPort;
                item.CidrIp=ipRange.CidrIp;
                item.Description=ipRange.Description;
                arr.push(item);
            }
        }
        
    }
    
    if( sg.IpPermissionsEgress)
    {
        let len = sg.IpPermissionsEgress.length;
        let arr=[];
        item.Properties.SecurityGroupEgress=arr;
        for( let i=0;i<len; i++)
        {
            let ipPermission=sg.IpPermissionsEgress[i];
            
            let rangeCount=ipPermission.IpRanges.length;
            
            for( let r=0;r < rangeCount;r++)
            {
                let ipRange=ipPermission.IpRanges[r];
                
                let tmp={};
                tmp.IpProtocol=ipPermission.IpProtocol;
                tmp.FromPort=ipPermission.FromPort;
                tmp.ToPort=ipPermission.ToPort;
                tmp.CidrIp=ipRange.CidrIp;
                tmp.Description=ipRange.Description;
                arr.push(tmp);
            }
        }
    }

    copyTags( sg, item.Properties);
    
    resources['securityGroup' + safeName(sgName)] = item;
}

function copyTags( from, to)
{
    if( from.Tags)
    {
        to.Tags=from.Tags.filter( item => !item.Key.startsWith( "aws:cloudformation:"));
    }
    
}
exports.handler = async (event) => {

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
  let lsg = event['SecurityGroups'];
  if (lsg) {
    let len = lsg.length;
    for (let i = 0; i < len; i++) {
      securityGroup(resourses, lsg[i]);
    }
  }

  let las = event['AutoScalingGroups'];
  if (las) {
    let len = las.length;
    for (let i = 0; i < len; i++) {
      autoScaleGroup(resourses, las[i]);
    }
  }


  let vpcs = event['Vpcs'];
  if (vpcs) {
    let len = vpcs.length;
    for (let i = 0; i < len; i++) {
      virtualPrivateCloud(resourses, vpcs[i]);
    }
  }

  let subnets = event['Subnets'];
  if (subnets) {
    subnets.forEach( e => subnet(resourses, e));
  }


  let listeners = event['Listeners'];
  if (listeners) {
    listeners.forEach( e => listener(resourses, e));
  }
    
  let targetGroups = event['TargetGroups'];
  if (targetGroups) {
    targetGroups.forEach( e => targetGroup(resourses, e));
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
  tmpName = tmpName
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

  let obj = {
    "Fn::Base64": joinObj
  };

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

let sgCount = 0;

function securityGroup(resources, sg) {

  let sgName = "sg" + sgCount++;

  let item = {};
  item.Type = "AWS::EC2::SecurityGroup";
  item.Properties = {};

  if (sg.GroupName) {
    sgName = sg.GroupName;
    item.Properties.GroupName = sg.GroupName;
  }
  if (sg.Description) {
    item.Properties.GroupDescription = sg.Description;
  }

  item.Properties.VpcId = sg.VpcId;
  if (sg.IpPermissions) {
    let len = sg.IpPermissions.length;
    let arr = [];
    item.Properties.SecurityGroupIngress = arr;
    for (let i = 0; i < len; i++) {
      let ipPermission = sg.IpPermissions[i];

      let rangeCount = ipPermission.IpRanges.length;

      for (let r = 0; r < rangeCount; r++) {
        let ipRange = ipPermission.IpRanges[r];

        let item = {};
        item.IpProtocol = ipPermission.IpProtocol;
        item.FromPort = ipPermission.FromPort;
        item.ToPort = ipPermission.ToPort;
        item.CidrIp = ipRange.CidrIp;
        item.Description = ipRange.Description;
        arr.push(item);
      }

      let userCount = ipPermission.UserIdGroupPairs.length;

      for (let u = 0; u < userCount; u++) {
        let userIdGroupPair = ipPermission.UserIdGroupPairs[u];

        let item = {};
        item.IpProtocol = ipPermission.IpProtocol;
        item.FromPort = ipPermission.FromPort;
        item.ToPort = ipPermission.ToPort;
        item.SourceSecurityGroupId = userIdGroupPair.GroupId;
        item.Description = userIdGroupPair.Description;
        arr.push(item);
      }
    }

  }

  if (sg.IpPermissionsEgress) {
    let len = sg.IpPermissionsEgress.length;
    let arr = [];
    item.Properties.SecurityGroupEgress = arr;
    for (let i = 0; i < len; i++) {
      let ipPermission = sg.IpPermissionsEgress[i];

      let rangeCount = ipPermission.IpRanges.length;

      for (let r = 0; r < rangeCount; r++) {
        let ipRange = ipPermission.IpRanges[r];

        let tmp = {};
        tmp.IpProtocol = ipPermission.IpProtocol;
        tmp.FromPort = ipPermission.FromPort;
        tmp.ToPort = ipPermission.ToPort;
        tmp.CidrIp = ipRange.CidrIp;
        tmp.Description = ipRange.Description;
        arr.push(tmp);
      }

      let userCount = ipPermission.UserIdGroupPairs.length;

      for (let u = 0; u < userCount; u++) {
        let userIdGroupPair = ipPermission.UserIdGroupPairs[u];

        let item = {};
        item.IpProtocol = ipPermission.IpProtocol;
        item.FromPort = ipPermission.FromPort;
        item.ToPort = ipPermission.ToPort;
        item.SourceSecurityGroupId = userIdGroupPair.GroupId;
        item.Description = userIdGroupPair.Description;
        arr.push(item);
      }
    }
  }

  copyTags(sg, item.Properties);

  resources['securityGroup' + safeName(sgName)] = item;
}

function copyTags(from, to) {
  if (from.Tags) {
    to.Tags = from.Tags.filter(item => !item.Key.startsWith("aws:cloudformation:"));
  }

}


function autoScaleGroup(resources, e) {

  let resource = {};
  resource.Type = "AWS::AutoScaling::AutoScalingGroup";
  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;

  p.MixedInstancesPolicy.InstancesDistribution=p.InstancesDistribution;
  //delete p['InstancesDistribution'];

  const removeItems = ["Tags", "AutoScalingGroupARN", "TargetGroupARNs", "SuspendedProcesses", "EnabledMetrics", "DefaultCooldown", "Instances", "CreatedTime", "NewInstancesProtectedFromScaleIn"];
  removeItems.forEach(key => delete p[key]);

  p.Cooldown = e.DefaultCooldown;

  copyTags(e, p);

  resources['autoScalingGroup' + safeName(e.AutoScalingGroupName)] = resource;
}

function makeNameFromTags(e, defaultName) {
  let name = "";
  if (e.Tags) {
    let len = e.Tags.length;
    for (let i = 0; i < len; i++) {
      let tag = e.Tags[i];

      if (tag.Key == "Name") {
        name = tag.Value;
        break;
      }
    }
  }

  if (!name) {
    name = defaultName;
  }
  return name;
}

let vpcCount = 0;

function virtualPrivateCloud(resources, e) {

  vpcCount++;
  let name = makeNameFromTags(e, "" + vpcCount);

  let resource = {};
  resource.Type = "AWS::EC2::VPC";
  let p = {};
  resource.Properties = p;

  p.CidrBlock = e.CidrBlock;
  p.InstanceTenancy = e.InstanceTenancy;
  copyTags(e, p);

  resources['vpc' + safeName(name)] = resource;
}

let subnetCount = 0;

function subnet(resources, e) {
  subnetCount++;
  let name = makeNameFromTags(e, "" + subnetCount);
  let resource = {};
  resource.Type = "AWS::EC2::Subnet";

  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;

  const removeItems = [
    "Tags",
    "AvailabilityZoneId",
    "AvailableIpAddressCount",
    "DefaultForAz",
    "State",
    "SubnetId",
    "OwnerId",
    "Ipv6CidrBlockAssociationSet",
    "SubnetArn"
  ];
  removeItems.forEach(key => delete p[key]);

  copyTags(e, p);

  resources['subnet' + safeName(name)] = resource;
}

function listener(resources, e) {
  let resource = {};
  resource.Type = "AWS::ElasticLoadBalancingV2::Listener";

  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;

  const removeItems = [
    "ListenerArn"
  ];
  removeItems.forEach(key => delete p[key]);
  
  let match = e.LoadBalancerArn.match( /.*\/([a-zA-Z0-9]+)\/[a-z0-9A-Z]+/);
  let name=match[1] + e.Port;
  resources['listener' + safeName(name)] = resource;
}



function targetGroup(resources, e) {
  let resource = {};
  resource.Type = "AWS::ElasticLoadBalancingV2::TargetGroup";

  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;
  p.Name=e.TargetGroupName;
  
  const removeItems = [
    "ListenerArn",
    "TargetGroupName",
    
  ];
  removeItems.forEach(key => delete p[key]);
  
  copyTags(e, p);
  
  resources['targetGroup' + safeName(p.Name)] = resource;
}
